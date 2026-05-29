#!/usr/bin/env python3
"""Cardano Delegation Observatory — daily snapshot ETL.

Pulls active DRep state from the Koios API, writes one daily snapshot row
per active DRep into SQLite, and emits the JSON exports consumed by the
static frontend.

Methodology source of truth: ../METHODOLOGY.md
Schema source of truth:      ./schema.sql

Usage:
    python3 etl/snapshot.py --db data/observatory.db --out data/snapshots
    python3 etl/snapshot.py --probe        # connectivity check, no DB writes
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sqlite3
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Iterable
import urllib.error
import urllib.parse
import urllib.request


# ── Constants ────────────────────────────────────────────────────────────────

KOIOS_BASE = "https://api.koios.rest/api/v1"
USER_AGENT = "cardano-delegation-observatory/0.1 (+https://observatory.asy.life)"
REQUEST_TIMEOUT_SEC = 30
MAX_RETRIES = 2
RETRY_BASE_DELAY_SEC = 2
DELEGATOR_COUNT_TOP_N = 60  # fetch counts for top-60 candidates to cover top-30 plus headroom

# Default-delegation targets — not individual DReps; never appear in the top-N.
# See METHODOLOGY §5 / §7.
SPECIAL_DREP_IDS = frozenset({
    "drep_always_abstain",
    "drep_always_no_confidence",
})

TOP_N = 30
DELTA_LOOKBACKS_DAYS = (7, 30)

LOVELACE_PER_ADA = 1_000_000

ETL_VERSION = "0.7.0"
METHODOLOGY_VERSION = "0.7"
SCHEMA_VERSION = 1

log = logging.getLogger("snapshot")


# ── HTTP layer ───────────────────────────────────────────────────────────────

def koios_request(
    path: str,
    *,
    method: str = "GET",
    body: dict | None = None,
    params: dict | None = None,
    count_exact: bool = False,
) -> tuple[object, int | None]:
    """One Koios API call with retry + timeout.

    Returns (parsed_json, content_range_total).
    Raises on persistent failure or non-retryable HTTP error.
    """
    url = f"{KOIOS_BASE}{path}"
    if params:
        url = url + "?" + urllib.parse.urlencode(params)

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }
    if count_exact:
        headers["Prefer"] = "count=exact"

    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SEC) as resp:
                payload = resp.read()
                total = _parse_content_range_total(resp.headers.get("Content-Range"))
                parsed = json.loads(payload) if payload else None
                return parsed, total
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < MAX_RETRIES:
                delay = RETRY_BASE_DELAY_SEC * (2 ** attempt)
                log.warning("koios %s -> HTTP %d; retry %d/%d in %ds",
                            path, e.code, attempt + 1, MAX_RETRIES, delay)
                last_err = e
                time.sleep(delay)
                continue
            raise
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < MAX_RETRIES:
                delay = RETRY_BASE_DELAY_SEC * (2 ** attempt)
                log.warning("koios %s -> network error; retry %d/%d in %ds: %s",
                            path, attempt + 1, MAX_RETRIES, delay, e)
                last_err = e
                time.sleep(delay)
                continue
            raise

    raise last_err if last_err else RuntimeError("koios_request fell through")


def _parse_content_range_total(header: str | None) -> int | None:
    if not header or "/" not in header:
        return None
    tail = header.rsplit("/", 1)[1]
    try:
        return int(tail)
    except ValueError:
        return None


def koios_paged(path: str, *, params: dict | None = None, page_size: int = 1000) -> Iterable[dict]:
    """Iterate pages until an under-full page is returned."""
    offset = 0
    while True:
        p = dict(params or {})
        p["limit"] = page_size
        p["offset"] = offset
        rows, _ = koios_request(path, params=p)
        if not rows:
            return
        for row in rows:
            yield row
        if len(rows) < page_size:
            return
        offset += page_size


# ── Koios fetchers ───────────────────────────────────────────────────────────

def get_tip() -> dict:
    rows, _ = koios_request("/tip")
    if not rows:
        raise RuntimeError("/tip returned empty")
    return rows[0]


def fetch_active_dreps() -> list[dict]:
    """Return drep_info rows where active=True, excluding special drep_always_* IDs.

    Pulls full drep_list, then drep_info in chunks, then filters in-memory.
    """
    all_ids = [row["drep_id"] for row in koios_paged("/drep_list")]
    log.info("drep_list: %d total", len(all_ids))

    active: list[dict] = []
    chunk_size = 50  # Koios POST body limit observed at ~6KB; 50 IDs ≈ 3KB with margin
    for i in range(0, len(all_ids), chunk_size):
        chunk = all_ids[i:i + chunk_size]
        rows, _ = koios_request("/drep_info", method="POST",
                                body={"_drep_ids": chunk})
        if not rows:
            continue
        for row in rows:
            if row.get("active") and row["drep_id"] not in SPECIAL_DREP_IDS:
                active.append(row)

    log.info("drep_info: %d active (excluding specials)", len(active))
    return active


def fetch_delegator_count(drep_id: str) -> int:
    _, total = koios_request(
        "/drep_delegators",
        params={"_drep_id": drep_id, "limit": 1},
        count_exact=True,
    )
    return total or 0


def fetch_epoch_info(epoch_no: int) -> dict | None:
    """Single-epoch lookup via Koios /epoch_info?_epoch_no=N. Returns None on miss."""
    rows, _ = koios_request("/epoch_info", params={"_epoch_no": epoch_no})
    if not rows:
        return None
    return rows[0]


def fetch_governance_actions() -> list[dict]:
    """All governance actions (proposals), paginated."""
    return list(koios_paged("/proposal_list"))


def fetch_drep_votes() -> list[dict]:
    """All votes cast by DReps across all proposals, paginated.

    Koios returns votes from all voter_roles (DRep, SPO, CC). We keep only
    voter_role == 'DRep' rows. Vote values come back as 'Yes' / 'No' / 'Abstain'
    and are normalized to lowercase before insert.
    """
    rows = []
    for row in koios_paged("/vote_list"):
        if row.get("voter_role") == "DRep":
            rows.append(row)
    return rows


def fetch_metadata_bulk(drep_ids: list[str]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    if not drep_ids:
        return out
    chunk_size = 50  # Koios POST body limit observed at ~6KB; 50 IDs ≈ 3KB with margin
    for i in range(0, len(drep_ids), chunk_size):
        chunk = drep_ids[i:i + chunk_size]
        rows, _ = koios_request("/drep_metadata", method="POST",
                                body={"_drep_ids": chunk})
        for row in rows or []:
            out[row["drep_id"]] = row
    return out


# ── Metadata interpretation ──────────────────────────────────────────────────

def extract_given_name(meta_row: dict | None) -> str | None:
    """Pull a sanitized `givenName` out of a Koios drep_metadata row.

    Returns None if metadata is missing, invalid, or has no usable name field.
    Never raises.
    """
    if not meta_row:
        return None
    if meta_row.get("is_valid") is False:
        return None
    body = meta_row.get("meta_json")
    if not body:
        return None

    candidates: list = []
    if isinstance(body, dict):
        if "givenName" in body:
            candidates.append(body["givenName"])
        inner = body.get("body")
        if isinstance(inner, dict) and "givenName" in inner:
            candidates.append(inner["givenName"])

    flat: list[str] = []
    for c in candidates:
        if isinstance(c, str):
            flat.append(c)
        elif isinstance(c, dict) and isinstance(c.get("@value"), str):
            flat.append(c["@value"])

    for raw in flat:
        clean = "".join(ch for ch in raw if ord(ch) >= 32 or ch == "\t").strip()
        if clean:
            return clean[:200]
    return None


# ── SQLite layer ─────────────────────────────────────────────────────────────

def open_db(db_path: Path, schema_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(db_path))
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode = WAL")
    db.execute("PRAGMA foreign_keys = ON")
    schema_sql = schema_path.read_text(encoding="utf-8")
    db.executescript(schema_sql)
    # Forward-only migrations for DBs created before a column was added.
    # ALTER TABLE ADD COLUMN is idempotent only via PRAGMA inspection.
    vote_cols = {row[1] for row in db.execute("PRAGMA table_info(votes)").fetchall()}
    if "vote_block_time" not in vote_cols:
        db.execute("ALTER TABLE votes ADD COLUMN vote_block_time INTEGER")
    db.execute("CREATE INDEX IF NOT EXISTS idx_votes_block_time ON votes (vote_block_time DESC)")
    # FLOW-2 v0.5 migration: governance_actions gains submission and state-transition columns.
    ga_cols = {row[1] for row in db.execute("PRAGMA table_info(governance_actions)").fetchall()}
    for col, ctype in (
        ("submission_block_time", "INTEGER"),
        ("expired_epoch", "INTEGER"),
        ("ratified_epoch", "INTEGER"),
        ("enacted_epoch", "INTEGER"),
        ("dropped_epoch", "INTEGER"),
    ):
        if col not in ga_cols:
            db.execute(f"ALTER TABLE governance_actions ADD COLUMN {col} {ctype}")
    db.commit()
    return db


def begin_etl_run(db: sqlite3.Connection) -> int:
    cur = db.execute(
        "INSERT INTO etl_runs (run_started_at, source, success) VALUES (?, ?, 0)",
        (datetime.now(timezone.utc).isoformat(timespec="seconds"), "koios"),
    )
    db.commit()
    return cur.lastrowid


def complete_etl_run(db: sqlite3.Connection, run_rowid: int, *,
                     success: bool, block_height: int | None,
                     n_dreps_seen: int | None, notes: str | None = None) -> None:
    db.execute(
        """UPDATE etl_runs
              SET run_completed_at = ?, block_height = ?, n_dreps_seen = ?,
                  success = ?, notes = ?
            WHERE rowid = ?""",
        (datetime.now(timezone.utc).isoformat(timespec="seconds"),
         block_height, n_dreps_seen, 1 if success else 0, notes, run_rowid),
    )
    db.commit()


def upsert_drep(db: sqlite3.Connection, drep_info_row: dict,
                meta_row: dict | None, current_epoch: int) -> None:
    name = extract_given_name(meta_row)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds") if meta_row else None
    db.execute(
        """INSERT INTO dreps (drep_id, registered_epoch, metadata_url, metadata_hash,
                              metadata_name, metadata_fetched_at, last_seen_epoch)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(drep_id) DO UPDATE SET
               metadata_url = excluded.metadata_url,
               metadata_hash = excluded.metadata_hash,
               metadata_name = excluded.metadata_name,
               metadata_fetched_at = excluded.metadata_fetched_at,
               last_seen_epoch = excluded.last_seen_epoch""",
        (
            drep_info_row["drep_id"],
            # registered_epoch: not in drep_info; left null and populated lazily
            None,
            drep_info_row.get("meta_url"),
            drep_info_row.get("meta_hash"),
            name,
            fetched_at,
            current_epoch,
        ),
    )


def upsert_epoch_info(db: sqlite3.Connection, row: dict) -> None:
    """Insert or replace an epoch_info row. Idempotent."""
    start = int(row["start_time"])
    end = int(row["end_time"])
    start_date = datetime.fromtimestamp(start, tz=timezone.utc).strftime("%Y-%m-%d")
    db.execute(
        """INSERT INTO epoch_info (epoch_no, start_time_unix, end_time_unix, start_date)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(epoch_no) DO UPDATE SET
               start_time_unix = excluded.start_time_unix,
               end_time_unix = excluded.end_time_unix,
               start_date = excluded.start_date""",
        (int(row["epoch_no"]), start, end, start_date),
    )


def ensure_epoch_info(db: sqlite3.Connection, epoch_no: int) -> str | None:
    """Return the UTC start_date for `epoch_no`, fetching from Koios if missing.

    Returns None if Koios has no record (e.g., future epoch). Idempotent.
    """
    row = db.execute(
        "SELECT start_date FROM epoch_info WHERE epoch_no = ?",
        (epoch_no,),
    ).fetchone()
    if row:
        return row["start_date"]
    fetched = fetch_epoch_info(epoch_no)
    if not fetched:
        return None
    upsert_epoch_info(db, fetched)
    return datetime.fromtimestamp(int(fetched["start_time"]), tz=timezone.utc).strftime("%Y-%m-%d")


def upsert_governance_action(db: sqlite3.Connection, row: dict) -> None:
    """Insert or replace a governance action row.

    Outcome is derived from the first non-null epoch among:
    enacted_epoch → 'enacted', ratified_epoch → 'ratified',
    dropped_epoch → 'dropped', expired_epoch → 'expired',
    otherwise → 'active'.
    """
    if row.get("enacted_epoch") is not None:
        outcome = "enacted"
    elif row.get("ratified_epoch") is not None:
        outcome = "ratified"
    elif row.get("dropped_epoch") is not None:
        outcome = "dropped"
    elif row.get("expired_epoch") is not None:
        outcome = "expired"
    else:
        outcome = "active"

    # Title pulled from proposal metadata if present.
    title = None
    meta_json = row.get("meta_json")
    if isinstance(meta_json, dict):
        body = meta_json.get("body")
        if isinstance(body, dict):
            t = body.get("title")
            if isinstance(t, str) and t.strip():
                title = t.strip()[:300]

    # `block_time` on proposal_list is the submission tx block_time (unix).
    db.execute(
        """INSERT INTO governance_actions
               (action_id, action_type, title, submitted_epoch, submission_block_time,
                expires_epoch, expired_epoch, ratified_epoch, enacted_epoch, dropped_epoch,
                outcome)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(action_id) DO UPDATE SET
               action_type = excluded.action_type,
               title = excluded.title,
               submission_block_time = excluded.submission_block_time,
               expires_epoch = excluded.expires_epoch,
               expired_epoch = excluded.expired_epoch,
               ratified_epoch = excluded.ratified_epoch,
               enacted_epoch = excluded.enacted_epoch,
               dropped_epoch = excluded.dropped_epoch,
               outcome = excluded.outcome""",
        (
            row["proposal_id"],
            row.get("proposal_type"),
            title,
            None,
            int(row["block_time"]) if row.get("block_time") is not None else None,
            row.get("expiration"),
            row.get("expired_epoch"),
            row.get("ratified_epoch"),
            row.get("enacted_epoch"),
            row.get("dropped_epoch"),
            outcome,
        ),
    )


def upsert_vote(db: sqlite3.Connection, row: dict) -> None:
    """Insert or replace a DRep vote row."""
    raw_vote = (row.get("vote") or "").strip().lower()
    if raw_vote not in {"yes", "no", "abstain"}:
        # Defensive: if Koios introduces a new vote value, skip rather
        # than violate the schema CHECK constraint.
        log.warning("skipping vote with unknown value %r for drep %s on %s",
                    row.get("vote"), row.get("voter_id"), row.get("proposal_id"))
        return
    block_time = row.get("block_time")
    db.execute(
        """INSERT INTO votes (action_id, drep_id, vote, vote_epoch, vote_block_time)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(action_id, drep_id) DO UPDATE SET
               vote = excluded.vote,
               vote_epoch = excluded.vote_epoch,
               vote_block_time = excluded.vote_block_time""",
        (
            row["proposal_id"],
            row["voter_id"],
            raw_vote,
            int(row["epoch_no"]),
            int(block_time) if block_time is not None else None,
        ),
    )


def write_snapshot_row(db: sqlite3.Connection, *, snapshot_date: str, epoch: int,
                       drep_id: str, voting_weight_lovelace: int,
                       delegator_count: int) -> None:
    # PK on (snapshot_date, drep_id) makes re-runs idempotent within a day.
    db.execute(
        """INSERT OR REPLACE INTO snapshots
               (snapshot_date, epoch, drep_id, voting_weight_lovelace, delegator_count)
           VALUES (?, ?, ?, ?, ?)""",
        (snapshot_date, epoch, drep_id, voting_weight_lovelace, delegator_count),
    )


def query_deltas(db: sqlite3.Connection, drep_id: str, snapshot_date: str,
                 lookback_days: int) -> int | None:
    """Voting weight today minus voting weight `lookback_days` ago, in lovelace.

    Returns None if no prior snapshot exists at or before the target date.
    See METHODOLOGY §18.2 for the precise definition.
    """
    delta, _ref_date = query_flow(db, drep_id, snapshot_date, lookback_days)
    return delta


def query_flow(db: sqlite3.Connection, drep_id: str, snapshot_date: str,
               lookback_days: int) -> tuple[int | None, str | None]:
    """Net voting-weight delta + the reference snapshot_date used to compute it.

    Per METHODOLOGY §18.2 and §18.5: returns (delta_lovelace, reference_date).
    Either field may be None if data is missing (§18.6).
    """
    ref = db.execute(
        """SELECT snapshot_date, voting_weight_lovelace
             FROM snapshots
            WHERE drep_id = ?
              AND snapshot_date <= date(?, ?)
            ORDER BY snapshot_date DESC
            LIMIT 1""",
        (drep_id, snapshot_date, f"-{lookback_days} day"),
    ).fetchone()
    if not ref:
        return None, None
    today_row = db.execute(
        "SELECT voting_weight_lovelace FROM snapshots WHERE drep_id = ? AND snapshot_date = ?",
        (drep_id, snapshot_date),
    ).fetchone()
    if not today_row:
        return None, None
    return int(today_row["voting_weight_lovelace"]) - int(ref["voting_weight_lovelace"]), ref["snapshot_date"]


def query_delegator_count_delta(db: sqlite3.Connection, drep_id: str,
                                snapshot_date: str, lookback_days: int
                                ) -> tuple[int | None, str | None]:
    """Net delegator-count delta + the reference snapshot_date.

    Per METHODOLOGY §18.1 / §18.2: tracked independently of voting weight.
    """
    ref = db.execute(
        """SELECT snapshot_date, delegator_count
             FROM snapshots
            WHERE drep_id = ?
              AND snapshot_date <= date(?, ?)
            ORDER BY snapshot_date DESC
            LIMIT 1""",
        (drep_id, snapshot_date, f"-{lookback_days} day"),
    ).fetchone()
    if not ref:
        return None, None
    today_row = db.execute(
        "SELECT delegator_count FROM snapshots WHERE drep_id = ? AND snapshot_date = ?",
        (drep_id, snapshot_date),
    ).fetchone()
    if not today_row:
        return None, None
    return int(today_row["delegator_count"]) - int(ref["delegator_count"]), ref["snapshot_date"]


def compute_recent_net_change(db: sqlite3.Connection, drep_id: str,
                              snapshot_date: str) -> dict:
    """Build the per-DRep "Recent net change" payload for the standalone page.

    Returns three intervals (1d, 7d, 30d), each with voting-weight delta,
    delegator-count delta, and explicit reference date. Per METHODOLOGY §18.5.
    """
    out: dict = {}
    for n in (1, 7, 30):
        vw_delta, vw_ref = query_flow(db, drep_id, snapshot_date, n)
        dc_delta, _dc_ref = query_delegator_count_delta(db, drep_id, snapshot_date, n)
        out[f"d{n}d"] = {
            "voting_weight_delta_lovelace": vw_delta,
            "delegator_count_delta": dc_delta,
            "reference_date": vw_ref,
        }
    return out


def daily_flow_series(db: sqlite3.Connection, drep_id: str,
                      days: int = 90) -> list[dict]:
    """Day-over-day net deltas for the last `days` snapshots.

    For each snapshot date with a prior snapshot, emits a row with the
    voting-weight delta and delegator-count delta from the immediately
    preceding snapshot for this DRep. Missing reference snapshots are
    omitted from the series (never interpolated).
    """
    rows = db.execute(
        """SELECT snapshot_date, voting_weight_lovelace, delegator_count
             FROM snapshots
            WHERE drep_id = ?
            ORDER BY snapshot_date DESC
            LIMIT ?""",
        (drep_id, days),
    ).fetchall()
    rows = list(reversed(rows))  # ascending chronological
    out: list[dict] = []
    for i in range(1, len(rows)):
        prev, curr = rows[i - 1], rows[i]
        out.append({
            "date": curr["snapshot_date"],
            "ref_date": prev["snapshot_date"],
            "voting_weight_delta_lovelace": int(curr["voting_weight_lovelace"]) - int(prev["voting_weight_lovelace"]),
            "delegator_count_delta": int(curr["delegator_count"]) - int(prev["delegator_count"]),
        })
    return out


def voting_weight_series(db: sqlite3.Connection, drep_id: str,
                         days: int = 90) -> list[dict]:
    rows = db.execute(
        """SELECT snapshot_date, voting_weight_lovelace
             FROM snapshots
            WHERE drep_id = ?
            ORDER BY snapshot_date DESC
            LIMIT ?""",
        (drep_id, days),
    ).fetchall()
    return [{"date": r[0], "lovelace": int(r[1])} for r in reversed(rows)]


# ── Export layer ─────────────────────────────────────────────────────────────

def atomic_write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    text = json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=False)
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def write_archive(out_dir: Path, snapshot_date: str, relative_path: str,
                  payload: object) -> None:
    """Per METHODOLOGY §21.3 / §21.7: dual-write to by-date/{date}/relative_path.

    Refuses to overwrite an existing past-date file (immutability rule).
    Today's date is allowed to overwrite for ETL re-run idempotency.
    """
    target = out_dir / "by-date" / snapshot_date / relative_path
    today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if target.exists() and snapshot_date != today_utc:
        log.warning("archive write refused (past-date immutability): %s", target)
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(target.suffix + ".tmp")
    text = json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=False)
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, target)


def write_archive_csv(out_dir: Path, snapshot_date: str, relative_path: str,
                      source_path: Path) -> None:
    """Copy a CSV (or any byte-equal) artifact into the dated archive.
    Same immutability rule as write_archive.
    """
    target = out_dir / "by-date" / snapshot_date / relative_path
    today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if target.exists() and snapshot_date != today_utc:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source_path.read_bytes())


def write_archive_sha256(out_dir: Path, snapshot_date: str) -> None:
    """Per METHODOLOGY §21.13: write by-date/{date}/sha256.json listing
    SHA-256 of every other file in that archive. Always rewritten (sha256.json
    is derived from the archive it describes — not subject to past-date
    immutability)."""
    import hashlib
    archive_root = out_dir / "by-date" / snapshot_date
    if not archive_root.is_dir():
        return
    files: dict[str, str] = {}
    for path in sorted(archive_root.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(archive_root).as_posix()
        if rel == "sha256.json":
            continue
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        files[rel] = h.hexdigest()
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "snapshot_date": snapshot_date,
        "algorithm": "sha256",
        "files": files,
    }
    target = archive_root / "sha256.json"
    tmp = target.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, target)


def write_archive_index(out_dir: Path) -> None:
    """Per METHODOLOGY §21.4 / §21.8: index.json lists all available snapshot
    dates under by-date/. Generated fresh each run."""
    archive_root = out_dir / "by-date"
    archive_root.mkdir(parents=True, exist_ok=True)
    dates = sorted(
        d.name for d in archive_root.iterdir()
        if d.is_dir() and len(d.name) == 10 and d.name[4] == "-" and d.name[7] == "-"
    )
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "first_snapshot_date": dates[0] if dates else None,
        "latest_snapshot_date": dates[-1] if dates else None,
        "total_archived_days": len(dates),
        "available_dates": dates,
    }
    target = archive_root / "index.json"
    tmp = target.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, target)


def export_top30(db: sqlite3.Connection, snapshot_date: str, out_dir: Path) -> dict:
    rows = db.execute(
        """SELECT s.drep_id, s.epoch, s.voting_weight_lovelace, s.delegator_count,
                  d.metadata_name
             FROM snapshots s
        LEFT JOIN dreps d ON d.drep_id = s.drep_id
            WHERE s.snapshot_date = ?
              AND s.drep_id NOT IN ('drep_always_abstain', 'drep_always_no_confidence')
            ORDER BY s.voting_weight_lovelace DESC, s.drep_id ASC
            LIMIT ?""",
        (snapshot_date, TOP_N),
    ).fetchall()

    entries = []
    for rank, row in enumerate(rows, start=1):
        drep_id = row["drep_id"]
        # Per §18: compute voting-weight + delegator-count net deltas alongside
        # explicit reference dates for reproducibility.
        flow_fields: dict = {}
        for d in DELTA_LOOKBACKS_DAYS:
            vw_delta, vw_ref = query_flow(db, drep_id, snapshot_date, d)
            dc_delta, _dc_ref = query_delegator_count_delta(db, drep_id, snapshot_date, d)
            flow_fields[f"d{d}d_lovelace"] = vw_delta
            flow_fields[f"delegator_count_d{d}d"] = dc_delta
            flow_fields[f"flow_reference_date_d{d}d"] = vw_ref
        last_vote = db.execute(
            "SELECT MAX(vote_epoch) FROM votes WHERE drep_id = ?",
            (drep_id,),
        ).fetchone()[0]
        entries.append({
            "rank": rank,
            "drep_id": drep_id,
            "name": row["metadata_name"],
            "voting_weight_lovelace": int(row["voting_weight_lovelace"]),
            "voting_weight_ada": int(row["voting_weight_lovelace"]) // LOVELACE_PER_ADA,
            "delegator_count": int(row["delegator_count"]),
            "last_vote_epoch": last_vote,
            **flow_fields,
        })

    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "snapshot_date": snapshot_date,
        "epoch": rows[0]["epoch"] if rows else None,
        "top_n": TOP_N,
        "entries": entries,
    }
    atomic_write_json(out_dir / "top30.json", payload)
    write_archive(out_dir, snapshot_date, "top30.json", payload)
    return payload


def build_overlay_events(db: sqlite3.Connection, window_start_date: str,
                         window_end_date: str) -> list[dict]:
    """Per METHODOLOGY §19.5: all governance actions whose any event date falls
    within (window_start_date, window_end_date) inclusive.

    No pre-filter by DRep participation. Returns a list of overlay events
    (one per state-transition epoch and one per submission).
    """
    rows = db.execute(
        """SELECT action_id, action_type, title,
                  submission_block_time,
                  expires_epoch, expired_epoch, ratified_epoch,
                  enacted_epoch, dropped_epoch
             FROM governance_actions"""
    ).fetchall()
    events: list[dict] = []
    for r in rows:
        action_id = r["action_id"]
        action_type = r["action_type"]
        # Submission (date derived directly from block_time, no epoch lookup needed).
        bt = r["submission_block_time"]
        if bt is not None:
            sub_date = datetime.fromtimestamp(int(bt), tz=timezone.utc).strftime("%Y-%m-%d")
            if window_start_date <= sub_date <= window_end_date:
                events.append({
                    "action_id": action_id,
                    "action_type": action_type,
                    "event": "submission",
                    "date": sub_date,
                })
        # State transitions — look up epoch_info for each non-null epoch field.
        # Per §19.1: ratification, enactment, expiration, drop.
        candidates: list[tuple[str, int | None]] = [
            ("ratification", r["ratified_epoch"]),
            ("enactment",    r["enacted_epoch"]),
            ("expiration",   r["expired_epoch"]),
            ("drop",         r["dropped_epoch"]),
        ]
        for event_name, epoch_no in candidates:
            if epoch_no is None:
                continue
            ei = db.execute(
                "SELECT start_date FROM epoch_info WHERE epoch_no = ?",
                (epoch_no,),
            ).fetchone()
            if not ei:
                continue
            date = ei["start_date"]
            if not (window_start_date <= date <= window_end_date):
                continue
            events.append({
                "action_id": action_id,
                "action_type": action_type,
                "event": event_name,
                "date": date,
            })
    events.sort(key=lambda e: (e["date"], e["action_id"], e["event"]))
    return events


def export_action_detail(db: sqlite3.Connection, action_id: str,
                         out_dir: Path) -> None:
    """Per-action JSON for FLOW-3. Written to actions/{action_id}.json.

    Joins governance_actions, votes, and dreps (for names when available).
    Per METHODOLOGY §20.6 / §20.10 / §20.11.
    """
    a = db.execute(
        """SELECT action_id, action_type, title,
                  submission_block_time, submitted_epoch,
                  expires_epoch, expired_epoch, ratified_epoch,
                  enacted_epoch, dropped_epoch, outcome
             FROM governance_actions
            WHERE action_id = ?""",
        (action_id,),
    ).fetchone()
    if not a:
        return  # Action not in our records; skip silently.

    sub_date = None
    if a["submission_block_time"] is not None:
        sub_date = datetime.fromtimestamp(int(a["submission_block_time"]), tz=timezone.utc).strftime("%Y-%m-%d")

    def transition(epoch_no):
        if epoch_no is None:
            return None
        ei = db.execute(
            "SELECT start_date FROM epoch_info WHERE epoch_no = ?",
            (int(epoch_no),),
        ).fetchone()
        return {"epoch": int(epoch_no), "date": ei["start_date"] if ei else None}

    state_transitions = {
        "expires":  transition(a["expires_epoch"]),
        "expired":  transition(a["expired_epoch"]),
        "ratified": transition(a["ratified_epoch"]),
        "enacted":  transition(a["enacted_epoch"]),
        "dropped":  transition(a["dropped_epoch"]),
    }

    vote_rows = db.execute(
        """SELECT v.drep_id, v.vote, v.vote_epoch, v.vote_block_time,
                  d.metadata_name AS drep_name
             FROM votes v
        LEFT JOIN dreps d ON d.drep_id = v.drep_id
            WHERE v.action_id = ?
            ORDER BY v.vote_block_time DESC NULLS LAST, v.vote_epoch DESC, v.drep_id ASC""",
        (action_id,),
    ).fetchall()
    votes = [
        {
            "drep_id": r["drep_id"],
            "drep_name": r["drep_name"],
            "vote": r["vote"],
            "vote_epoch": r["vote_epoch"],
            "vote_block_time": r["vote_block_time"],
        }
        for r in vote_rows
    ]
    tally = {"yes": 0, "no": 0, "abstain": 0}
    for v in votes:
        if v["vote"] in tally:
            tally[v["vote"]] += 1

    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "action_id": a["action_id"],
        "action_type": a["action_type"],
        "title": a["title"],
        "submission_block_time": a["submission_block_time"],
        "submission_date": sub_date,
        "submitted_epoch": a["submitted_epoch"],
        "state_transitions": state_transitions,
        "outcome": a["outcome"],
        "vote_tally": tally,
        "votes": votes,
    }
    atomic_write_json(out_dir / "actions" / f"{action_id}.json", payload)
    # Use today's UTC date for archival; per-action JSON is generated by the
    # daily ETL and shares the snapshot_date with top30/etc.
    snapshot_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    write_archive(out_dir, snapshot_date, f"actions/{action_id}.json", payload)


def export_epoch_info(db: sqlite3.Connection, out_dir: Path) -> None:
    """Export the epoch_info mapping. CC0. Per METHODOLOGY §19.2 / §19.8."""
    rows = db.execute(
        "SELECT epoch_no, start_time_unix, end_time_unix, start_date FROM epoch_info ORDER BY epoch_no"
    ).fetchall()
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "n_epochs": len(rows),
        "epochs": [
            {
                "epoch_no": r["epoch_no"],
                "start_time_unix": r["start_time_unix"],
                "end_time_unix": r["end_time_unix"],
                "start_date": r["start_date"],
            }
            for r in rows
        ],
    }
    atomic_write_json(out_dir / "epoch_info.json", payload)
    snapshot_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    write_archive(out_dir, snapshot_date, "epoch_info.json", payload)


def export_drep_history(db: sqlite3.Connection, drep_id: str, snapshot_date: str,
                        out_dir: Path) -> None:
    """Write per-DRep history JSON: 90-day voting weight series + recent votes.

    Output: out_dir/dreps/{drep_id}.json
    """
    name_row = db.execute(
        "SELECT metadata_name, metadata_url FROM dreps WHERE drep_id = ?",
        (drep_id,),
    ).fetchone()
    series = voting_weight_series(db, drep_id, days=90)
    vote_rows = db.execute(
        """SELECT v.action_id, v.vote, v.vote_epoch,
                  g.action_type, g.title, g.outcome
             FROM votes v
        LEFT JOIN governance_actions g ON g.action_id = v.action_id
            WHERE v.drep_id = ?
            ORDER BY v.vote_epoch DESC, v.action_id ASC""",
        (drep_id,),
    ).fetchall()
    recent_net_change = compute_recent_net_change(db, drep_id, snapshot_date)
    daily_flow = daily_flow_series(db, drep_id, days=90)
    # FLOW-2: overlay events within the 90-day chart window.
    window_end = snapshot_date
    window_start = (datetime.strptime(snapshot_date, "%Y-%m-%d")
                    - timedelta(days=89)).strftime("%Y-%m-%d")
    overlay_events = build_overlay_events(db, window_start, window_end)
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "drep_id": drep_id,
        "name": name_row["metadata_name"] if name_row else None,
        "metadata_url": name_row["metadata_url"] if name_row else None,
        "snapshot_date": snapshot_date,
        "recent_net_change": recent_net_change,
        "daily_flow": daily_flow,
        "overlay_events": overlay_events,
        "voting_weight_series": series,
        "vote_history": [
            {
                "action_id": r["action_id"],
                "vote": r["vote"],
                "vote_epoch": r["vote_epoch"],
                "action_type": r["action_type"],
                "title": r["title"],
                "outcome": r["outcome"],
            }
            for r in vote_rows
        ],
    }
    atomic_write_json(out_dir / "dreps" / f"{drep_id}.json", payload)
    write_archive(out_dir, snapshot_date, f"dreps/{drep_id}.json", payload)


def export_top30_csv(top30_payload: dict, out_dir: Path) -> None:
    """Write a CSV mirror of top30.json for easy spreadsheet import.

    Fields match the JSON entry shape; lovelace columns retained alongside
    ADA so the file is verifiable against the on-chain source.
    """
    import csv
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "top30.csv"
    tmp = path.with_suffix(".csv.tmp")
    with open(tmp, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "snapshot_date", "epoch", "rank", "drep_id", "name",
            "voting_weight_ada", "voting_weight_lovelace",
            "delegator_count", "last_vote_epoch",
            "d7d_lovelace", "d30d_lovelace",
        ])
        date = top30_payload.get("snapshot_date", "")
        epoch = top30_payload.get("epoch", "")
        for e in top30_payload["entries"]:
            writer.writerow([
                date, epoch, e["rank"], e["drep_id"], e.get("name") or "",
                e["voting_weight_ada"], e["voting_weight_lovelace"],
                e["delegator_count"],
                e["last_vote_epoch"] if e["last_vote_epoch"] is not None else "",
                e["d7d_lovelace"] if e["d7d_lovelace"] is not None else "",
                e["d30d_lovelace"] if e["d30d_lovelace"] is not None else "",
            ])
    os.replace(tmp, path)
    # CSV is also archived per §21.2 (top30.csv listed among canonical files).
    snapshot_date_today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    write_archive_csv(out_dir, snapshot_date_today, "top30.csv", path)


def export_governance_actions(db: sqlite3.Connection, snapshot_date: str,
                              out_dir: Path) -> None:
    """Write actions.json — every governance action the observatory has indexed.

    No editorial fields. Outcome is the deterministic label derived in
    upsert_governance_action(); see METHODOLOGY §6 for the vote semantics.
    """
    rows = db.execute(
        """SELECT g.action_id, g.action_type, g.title,
                  g.submitted_epoch, g.expires_epoch, g.outcome,
                  COALESCE(v.yes_n, 0)     AS yes_count,
                  COALESCE(v.no_n, 0)      AS no_count,
                  COALESCE(v.abstain_n, 0) AS abstain_count
             FROM governance_actions g
        LEFT JOIN (
              SELECT action_id,
                     SUM(CASE WHEN vote='yes'     THEN 1 ELSE 0 END) AS yes_n,
                     SUM(CASE WHEN vote='no'      THEN 1 ELSE 0 END) AS no_n,
                     SUM(CASE WHEN vote='abstain' THEN 1 ELSE 0 END) AS abstain_n
                FROM votes
            GROUP BY action_id
        ) v ON v.action_id = g.action_id
            ORDER BY COALESCE(g.expires_epoch, 0) DESC,
                     g.action_id ASC"""
    ).fetchall()
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "snapshot_date": snapshot_date,
        "n_actions": len(rows),
        "actions": [
            {
                "action_id": r["action_id"],
                "action_type": r["action_type"],
                "title": r["title"],
                "submitted_epoch": r["submitted_epoch"],
                "expires_epoch": r["expires_epoch"],
                "outcome": r["outcome"],
                "drep_yes_count": int(r["yes_count"]),
                "drep_no_count": int(r["no_count"]),
                "drep_abstain_count": int(r["abstain_count"]),
            }
            for r in rows
        ],
    }
    atomic_write_json(out_dir / "actions.json", payload)
    write_archive(out_dir, snapshot_date, "actions.json", payload)


def export_meta(db: sqlite3.Connection, snapshot_date: str, out_dir: Path,
                tip: dict, drep_seen: int) -> None:
    last_run = db.execute(
        """SELECT run_started_at, run_completed_at, success, block_height, n_dreps_seen, notes
             FROM etl_runs
            ORDER BY run_started_at DESC
            LIMIT 1"""
    ).fetchone()
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "etl_version": ETL_VERSION,
        "data_through": snapshot_date,
        "tip_epoch": tip.get("epoch_no"),
        "tip_block": tip.get("block_no"),
        "tip_block_time_unix": tip.get("block_time"),
        "last_run": dict(last_run) if last_run else None,
        "n_dreps_seen": drep_seen,
        "source": "koios",
        "methodology_url": "https://observatory.asy.life/methodology",
    }
    atomic_write_json(out_dir / "meta.json", payload)
    write_archive(out_dir, snapshot_date, "meta.json", payload)


# ── Main flow ────────────────────────────────────────────────────────────────

def run(args: argparse.Namespace) -> int:
    tip = get_tip()
    current_epoch = int(tip["epoch_no"])
    log.info("tip: epoch=%d block=%s", current_epoch, tip.get("block_no"))

    if args.probe:
        # Connectivity check only.
        active = fetch_active_dreps()
        log.info("probe ok: %d active dreps", len(active))
        sample = sorted(active, key=lambda r: int(r["amount"]), reverse=True)[:5]
        for s in sample:
            log.info("  %s  amount=%s lovelace  meta=%s",
                     s["drep_id"], s["amount"], s.get("meta_url"))
        return 0

    db = open_db(Path(args.db), Path(__file__).parent / "schema.sql")
    run_rowid = begin_etl_run(db)
    snapshot_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    log.info("snapshot_date=%s", snapshot_date)

    try:
        active = fetch_active_dreps()
        active.sort(key=lambda r: int(r.get("amount") or 0), reverse=True)
        candidates = active[:DELEGATOR_COUNT_TOP_N]
        candidate_ids = [r["drep_id"] for r in candidates]

        log.info("fetching delegator counts for top %d candidates", len(candidates))
        counts: dict[str, int] = {}
        for drep_id in candidate_ids:
            counts[drep_id] = fetch_delegator_count(drep_id)

        log.info("fetching metadata for top candidates")
        metas = fetch_metadata_bulk(candidate_ids)

        # Governance actions and DRep votes are ingested in full each run.
        # Volume is small (sub-30k votes, sub-200 actions); idempotent via PKs.
        log.info("fetching governance actions")
        actions = fetch_governance_actions()
        for a in actions:
            upsert_governance_action(db, a)
        log.info("upserted %d governance actions", len(actions))

        # FLOW-2 §19: ensure epoch_info coverage for every epoch referenced by
        # any action's state-transition fields. Idempotent — only fetches missing epochs.
        needed_epochs: set[int] = set()
        for a in actions:
            for k in ("expiration", "expired_epoch", "ratified_epoch",
                      "enacted_epoch", "dropped_epoch"):
                v = a.get(k)
                if v is not None:
                    needed_epochs.add(int(v))
        # Also cover current and nearby epochs for chart-window completeness.
        needed_epochs.add(current_epoch)
        existing = {r[0] for r in db.execute("SELECT epoch_no FROM epoch_info").fetchall()}
        to_fetch = sorted(needed_epochs - existing)
        if to_fetch:
            log.info("fetching epoch_info for %d epochs", len(to_fetch))
            for ep in to_fetch:
                ensure_epoch_info(db, ep)
        db.commit()

        log.info("fetching DRep votes")
        votes = fetch_drep_votes()
        # Sort by block_time ascending so that when a DRep revoted on a
        # proposal, the chronologically latest vote wins the INSERT OR REPLACE.
        votes.sort(key=lambda v: int(v.get("block_time") or 0))
        for v in votes:
            upsert_vote(db, v)
        log.info("upserted %d DRep votes (deduplicated by latest per action+drep)", len(votes))

        # Write snapshot + drep registry rows for top candidates only.
        # The wider active set is acknowledged but not yet snapshotted in v0.1.
        for row in candidates:
            upsert_drep(db, row, metas.get(row["drep_id"]), current_epoch)
            write_snapshot_row(
                db,
                snapshot_date=snapshot_date,
                epoch=current_epoch,
                drep_id=row["drep_id"],
                voting_weight_lovelace=int(row["amount"]),
                delegator_count=counts.get(row["drep_id"], 0),
            )
        db.commit()

        top30 = export_top30(db, snapshot_date, Path(args.out))

        # Per-DRep history files for every entry in the current top-30.
        for entry in top30["entries"]:
            export_drep_history(db, entry["drep_id"], snapshot_date, Path(args.out))
        log.info("wrote %d per-DRep history files", len(top30["entries"]))

        export_governance_actions(db, snapshot_date, Path(args.out))
        log.info("wrote actions.json")

        export_epoch_info(db, Path(args.out))
        log.info("wrote epoch_info.json")

        # FLOW-3: per-action detail JSON files. One per action_id in the DB.
        action_ids = [r[0] for r in db.execute(
            "SELECT action_id FROM governance_actions"
        ).fetchall()]
        for aid in action_ids:
            export_action_detail(db, aid, Path(args.out))
        log.info("wrote %d per-action detail files", len(action_ids))

        export_top30_csv(top30, Path(args.out))
        log.info("wrote top30.csv")

        # FLOW-4 §21: archive index + integrity hashes. Written LAST so the
        # hash table covers every other file already placed in the archive.
        write_archive_index(Path(args.out))
        write_archive_sha256(Path(args.out), snapshot_date)
        log.info("wrote archive index + sha256 (FLOW-4)")

        # Mark the run successful *before* writing meta.json so that the
        # latest-run record visible to consumers reflects the completed run,
        # not an in-progress one. If meta.json write fails, the prior
        # meta.json remains in place and the DB still records success.
        complete_etl_run(db, run_rowid, success=True,
                         block_height=int(tip.get("block_no") or 0),
                         n_dreps_seen=len(active))

        export_meta(db, snapshot_date, Path(args.out), tip, len(active))
        log.info("etl run complete: %d candidates snapshotted", len(candidates))
        return 0

    except Exception as e:
        complete_etl_run(db, run_rowid, success=False,
                         block_height=int(tip.get("block_no") or 0) if tip else None,
                         n_dreps_seen=None, notes=repr(e))
        db.commit()
        log.error("etl run failed: %r", e)
        raise


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Daily Cardano Delegation Observatory snapshot.")
    p.add_argument("--db", default="data/observatory.db",
                   help="Path to SQLite database (default: data/observatory.db)")
    p.add_argument("--out", default="data/snapshots",
                   help="Output directory for JSON snapshots (default: data/snapshots)")
    p.add_argument("--probe", action="store_true",
                   help="Connectivity check only; no DB writes, no JSON exports")
    p.add_argument("--verbose", "-v", action="store_true")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    try:
        return run(args)
    except KeyboardInterrupt:
        log.warning("interrupted")
        return 130


if __name__ == "__main__":
    sys.exit(main())

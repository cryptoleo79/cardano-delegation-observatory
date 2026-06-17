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
METHODOLOGY_VERSION = "0.8"
SCHEMA_VERSION = 2

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


def fetch_totals() -> list[dict]:
    """FLOW-5: per-epoch treasury / reserves / supply state.

    Koios /totals returns the full epoch series in a single response (currently
    ~426 rows; ~250 KB). Per METHODOLOGY §22.2 this is the canonical source for
    on-chain treasury balance at each epoch boundary.
    """
    rows, _ = koios_request("/totals")
    return rows or []


def fetch_treasury_withdrawal_actions() -> list[dict]:
    """FLOW-5: governance actions of type TreasuryWithdrawals, with attached
    withdrawal arrays. Per METHODOLOGY §22.2: the canonical (and only) source
    for governance-driven treasury payouts. Explicitly NOT /treasury_withdrawals,
    which returns stake-credential reward withdrawals with no governance linkage.
    """
    return list(koios_paged("/proposal_list",
                            params={"proposal_type": "eq.TreasuryWithdrawals"}))


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


def upsert_treasury_snapshot(db: sqlite3.Connection, row: dict) -> None:
    """FLOW-5: idempotent insert of one /totals row keyed by epoch_no.

    Per METHODOLOGY §22.3 the table is append-only across normal runs; in-place
    update is allowed because Koios may revise a published value (§22.8).
    """
    def _int(v):
        return int(v) if v is not None else None
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    db.execute(
        """INSERT INTO treasury_snapshot
               (epoch_no, circulation_lovelace, treasury_lovelace, reward_lovelace,
                supply_lovelace, reserves_lovelace, fees_lovelace,
                deposits_stake, deposits_drep, deposits_proposal,
                treasury_donation, treasury_withdrawal_epoch_total,
                reserves_withdrawal_epoch_total, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(epoch_no) DO UPDATE SET
               circulation_lovelace = excluded.circulation_lovelace,
               treasury_lovelace = excluded.treasury_lovelace,
               reward_lovelace = excluded.reward_lovelace,
               supply_lovelace = excluded.supply_lovelace,
               reserves_lovelace = excluded.reserves_lovelace,
               fees_lovelace = excluded.fees_lovelace,
               deposits_stake = excluded.deposits_stake,
               deposits_drep = excluded.deposits_drep,
               deposits_proposal = excluded.deposits_proposal,
               treasury_donation = excluded.treasury_donation,
               treasury_withdrawal_epoch_total = excluded.treasury_withdrawal_epoch_total,
               reserves_withdrawal_epoch_total = excluded.reserves_withdrawal_epoch_total,
               fetched_at = excluded.fetched_at""",
        (
            int(row["epoch_no"]),
            _int(row.get("circulation")),
            _int(row.get("treasury")),
            _int(row.get("reward")),
            _int(row.get("supply")),
            _int(row.get("reserves")),
            _int(row.get("fees")),
            _int(row.get("deposits_stake")),
            _int(row.get("deposits_drep")),
            _int(row.get("deposits_proposal")),
            _int(row.get("treasury_donation")),
            _int(row.get("treasury_withdrawal")),
            _int(row.get("reserves_withdrawal")),
            fetched_at,
        ),
    )


def upsert_treasury_withdrawals(db: sqlite3.Connection, action_id: str,
                                withdrawal_array: list, enacted_epoch: int | None) -> int:
    """FLOW-5: replace the full set of withdrawal rows for one action.

    Delete-then-insert (rather than per-row upsert) because the source array
    is the canonical truth — if Koios revises the array, our stored rows must
    exactly mirror it, and a partial upsert could leave stale rows.

    Returns the number of withdrawal rows inserted for this action.
    """
    db.execute("DELETE FROM treasury_withdrawals WHERE action_id = ?", (action_id,))
    if not withdrawal_array:
        return 0
    n = 0
    for i, w in enumerate(withdrawal_array):
        amount = w.get("amount")
        recipient = w.get("stake_address")
        if amount is None or recipient is None:
            log.warning("skipping malformed withdrawal[%d] on %s: %r", i, action_id, w)
            continue
        try:
            amount_int = int(amount)
        except (TypeError, ValueError):
            log.warning("skipping non-integer amount on %s[%d]: %r", action_id, i, amount)
            continue
        if amount_int <= 0:
            log.warning("skipping non-positive amount on %s[%d]: %d", action_id, i, amount_int)
            continue
        db.execute(
            """INSERT INTO treasury_withdrawals
                   (action_id, withdrawal_index, recipient_stake_address,
                    amount_lovelace, enacted_epoch)
               VALUES (?, ?, ?, ?, ?)""",
            (action_id, i, recipient, amount_int, enacted_epoch),
        )
        n += 1
    return n


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


# Change-feed windows. (1d/7d/30d/90d.) Deltas use the nearest snapshot at or
# before (date - N days); a window with no old-enough snapshot reports null/empty
# and available=false — never a fabricated zero.
CHANGE_WINDOWS = ((1, "1d"), (7, "7d"), (30, "30d"), (90, "90d"))
CHANGE_TOP_LIMIT = 10      # rows per gainers/losers/growth/decline list
CHANGE_RECENT_LIMIT = 40   # rows in the "what changed today" live feed
_PSEUDO_DREPS = ("drep_always_abstain", "drep_always_no_confidence")


def _top30_ids_back(db: sqlite3.Connection, snapshot_date: str, days: int):
    """The top-30 drep_id set as of the nearest snapshot <= (snapshot_date - days).
    Returns (reference_date|None, set_of_ids). Empty set when no old-enough snapshot."""
    row = db.execute(
        "SELECT MAX(snapshot_date) AS d FROM snapshots WHERE snapshot_date <= date(?, ?)",
        (snapshot_date, f"-{days} day"),
    ).fetchone()
    if not row or not row["d"]:
        return None, set()
    d = row["d"]
    ids = [r["drep_id"] for r in db.execute(
        f"""SELECT drep_id FROM snapshots
             WHERE snapshot_date = ? AND drep_id NOT IN ({','.join('?' * len(_PSEUDO_DREPS))})
             ORDER BY voting_weight_lovelace DESC LIMIT ?""",
        (d, *_PSEUDO_DREPS, TOP_N),
    ).fetchall()]
    return d, set(ids)


def export_changes(db: sqlite3.Connection, snapshot_date: str, out_dir: Path) -> dict:
    """DRep change feed — 'what changed', movement only, no inference.

    For each window (1d/7d/30d/90d) over the CURRENT top-30: net voting-weight and
    delegator-count deltas, ranked into gainers/losers and delegator growth/decline,
    plus who ENTERED or EXITED the top-30 vs that window ago. Also a 'recent' feed
    (the latest day's movements). Writes changes.json + top_gainers.json +
    top_losers.json + top_delegator_growth.json. Every figure is a measured
    difference between two snapshots — we never explain or speculate."""
    # Current top-30 (ranked by weight on the snapshot date), with names.
    cur_rows = db.execute(
        f"""SELECT s.drep_id, s.voting_weight_lovelace, s.delegator_count, d.metadata_name
              FROM snapshots s LEFT JOIN dreps d ON d.drep_id = s.drep_id
             WHERE s.snapshot_date = ? AND s.drep_id NOT IN ({','.join('?' * len(_PSEUDO_DREPS))})
             ORDER BY s.voting_weight_lovelace DESC LIMIT ?""",
        (snapshot_date, *_PSEUDO_DREPS, TOP_N),
    ).fetchall()
    epoch_row = db.execute(
        "SELECT epoch FROM snapshots WHERE snapshot_date = ? LIMIT 1", (snapshot_date,)
    ).fetchone()

    name_cache: dict[str, str | None] = {}
    for r in cur_rows:
        name_cache[r["drep_id"]] = r["metadata_name"]

    def name_of(did: str):
        if did in name_cache:
            return name_cache[did]
        row = db.execute("SELECT metadata_name FROM dreps WHERE drep_id = ?", (did,)).fetchone()
        name_cache[did] = row["metadata_name"] if row else None
        return name_cache[did]

    current_ids = [r["drep_id"] for r in cur_rows]
    cur_by_id = {r["drep_id"]: r for r in cur_rows}

    def row_for(did: str, days: int):
        wdelta, wref = query_flow(db, did, snapshot_date, days)
        ddelta, dref = query_delegator_count_delta(db, did, snapshot_date, days)
        cur = cur_by_id.get(did)
        return {
            "drep_id": did,
            "name": name_of(did),
            "weight_delta_lovelace": wdelta,
            "weight_delta_ada": (int(wdelta) // LOVELACE_PER_ADA) if wdelta is not None else None,
            "delegator_delta": ddelta,
            "current_weight_ada": (int(cur["voting_weight_lovelace"]) // LOVELACE_PER_ADA) if cur else None,
            "current_delegators": int(cur["delegator_count"]) if cur else None,
            "reference_date": wref or dref,
        }

    windows: dict = {}
    for days, key in CHANGE_WINDOWS:
        rows = [row_for(did, days) for did in current_ids]
        have_w = [r for r in rows if r["weight_delta_lovelace"] is not None]
        have_d = [r for r in rows if r["delegator_delta"] is not None]
        gainers = sorted((r for r in have_w if r["weight_delta_lovelace"] > 0),
                         key=lambda r: -r["weight_delta_lovelace"])[:CHANGE_TOP_LIMIT]
        losers = sorted((r for r in have_w if r["weight_delta_lovelace"] < 0),
                        key=lambda r: r["weight_delta_lovelace"])[:CHANGE_TOP_LIMIT]
        growth = sorted((r for r in have_d if r["delegator_delta"] > 0),
                        key=lambda r: -r["delegator_delta"])[:CHANGE_TOP_LIMIT]
        decline = sorted((r for r in have_d if r["delegator_delta"] < 0),
                         key=lambda r: r["delegator_delta"])[:CHANGE_TOP_LIMIT]
        ref_date, past_ids = _top30_ids_back(db, snapshot_date, days)
        entrants, exits = [], []
        if past_ids:
            cur_set = set(current_ids)
            entrants = [{"drep_id": did, "name": name_of(did),
                         "current_weight_ada": (int(cur_by_id[did]["voting_weight_lovelace"]) // LOVELACE_PER_ADA)}
                        for did in current_ids if did not in past_ids]
            exits = [{"drep_id": did, "name": name_of(did)} for did in past_ids if did not in cur_set]
        windows[key] = {
            "lookback_days": days,
            "available": bool(have_w) or bool(past_ids),
            "reference_date": ref_date,
            "gainers": gainers,
            "losers": losers,
            "delegator_growth": growth,
            "delegator_decline": decline,
            "entrants": entrants,
            "exits": exits,
        }

    # "What changed today" live feed: the 1d movements, largest absolute first.
    recent = [r for r in (row_for(did, 1) for did in current_ids)
              if r["weight_delta_lovelace"] not in (None, 0) or r["delegator_delta"] not in (None, 0)]
    recent.sort(key=lambda r: -abs(r["weight_delta_lovelace"] or 0))
    recent = [{"date": snapshot_date, "drep_id": r["drep_id"], "name": r["name"],
               "weight_delta_ada": r["weight_delta_ada"], "delegator_delta": r["delegator_delta"],
               "reference_date": r["reference_date"]}
              for r in recent[:CHANGE_RECENT_LIMIT]]

    base = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "snapshot_date": snapshot_date,
        "epoch": epoch_row["epoch"] if epoch_row else None,
        "top_n": TOP_N,
        "note": ("Movement only — measured differences between daily snapshots. "
                 "No inference of cause or intent. A window is empty/'available:false' "
                 "until a snapshot at least that many days old exists."),
    }
    changes = {**base, "windows": windows, "recent": recent}
    gainers_doc = {**base, "windows": {k: windows[k]["gainers"] for k in windows}}
    losers_doc = {**base, "windows": {k: windows[k]["losers"] for k in windows}}
    deleg_doc = {**base, "windows": {k: {"growth": windows[k]["delegator_growth"],
                                         "decline": windows[k]["delegator_decline"]} for k in windows}}

    for fname, doc in (("changes.json", changes), ("top_gainers.json", gainers_doc),
                       ("top_losers.json", losers_doc), ("top_delegator_growth.json", deleg_doc)):
        atomic_write_json(out_dir / fname, doc)
        write_archive(out_dir, snapshot_date, fname, doc)
    return changes


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
                         snapshot_date: str, out_dir: Path) -> None:
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

    # FLOW-5 §22.9: TreasuryWithdrawals actions inherit the standard action payload
    # and ADD a `withdrawal` array of {index, recipient_stake_address, amount_lovelace}.
    # Other action types do not receive the field at all — no empty arrays, no nulls,
    # so the absence is unambiguous (§22.7).
    if a["action_type"] == "TreasuryWithdrawals":
        wrows = db.execute(
            """SELECT withdrawal_index, recipient_stake_address, amount_lovelace
                 FROM treasury_withdrawals
                WHERE action_id = ?
                ORDER BY withdrawal_index""",
            (action_id,),
        ).fetchall()
        payload["withdrawal"] = [
            {
                "index": int(w["withdrawal_index"]),
                "recipient_stake_address": w["recipient_stake_address"],
                "amount_lovelace": int(w["amount_lovelace"]),
            }
            for w in wrows
        ]

    atomic_write_json(out_dir / "actions" / f"{action_id}.json", payload)
    write_archive(out_dir, snapshot_date, f"actions/{action_id}.json", payload)


def export_epoch_info(db: sqlite3.Connection, snapshot_date: str,
                      out_dir: Path) -> None:
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
    write_archive(out_dir, snapshot_date, "epoch_info.json", payload)


def export_treasury_snapshot(db: sqlite3.Connection, snapshot_date: str,
                             out_dir: Path) -> int:
    """FLOW-5 §22.10: export full treasury_snapshot table as JSON.

    One entry per Cardano epoch. Returns the number of epochs exported.
    """
    rows = db.execute(
        """SELECT epoch_no, circulation_lovelace, treasury_lovelace, reward_lovelace,
                  supply_lovelace, reserves_lovelace, fees_lovelace,
                  deposits_stake, deposits_drep, deposits_proposal,
                  treasury_donation, treasury_withdrawal_epoch_total,
                  reserves_withdrawal_epoch_total
             FROM treasury_snapshot
            ORDER BY epoch_no"""
    ).fetchall()
    entries = [
        {
            "epoch_no": int(r["epoch_no"]),
            "circulation_lovelace": int(r["circulation_lovelace"]),
            "treasury_lovelace": int(r["treasury_lovelace"]),
            "reward_lovelace": int(r["reward_lovelace"]),
            "supply_lovelace": int(r["supply_lovelace"]),
            "reserves_lovelace": int(r["reserves_lovelace"]),
            "fees_lovelace": int(r["fees_lovelace"]),
            "deposits_stake": int(r["deposits_stake"]),
            "deposits_drep": int(r["deposits_drep"]),
            "deposits_proposal": int(r["deposits_proposal"]),
            "treasury_donation": int(r["treasury_donation"]) if r["treasury_donation"] is not None else None,
            "treasury_withdrawal_epoch_total": int(r["treasury_withdrawal_epoch_total"]) if r["treasury_withdrawal_epoch_total"] is not None else None,
            "reserves_withdrawal_epoch_total": int(r["reserves_withdrawal_epoch_total"]) if r["reserves_withdrawal_epoch_total"] is not None else None,
        }
        for r in rows
    ]
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "snapshot_date": snapshot_date,
        "n_epochs": len(entries),
        "epochs": entries,
    }
    atomic_write_json(out_dir / "treasury_snapshot.json", payload)
    write_archive(out_dir, snapshot_date, "treasury_snapshot.json", payload)
    return len(entries)


def export_treasury_withdrawals(db: sqlite3.Connection, snapshot_date: str,
                                out_dir: Path) -> int:
    """FLOW-5 §22.10: export full treasury_withdrawals table as JSON.

    One entry per (action_id, withdrawal_index). The action's outcome is joined
    in for reader convenience; the canonical outcome remains on governance_actions.
    Returns the number of withdrawal rows exported.
    """
    rows = db.execute(
        """SELECT tw.action_id, tw.withdrawal_index, tw.recipient_stake_address,
                  tw.amount_lovelace, tw.enacted_epoch, ga.outcome
             FROM treasury_withdrawals tw
             JOIN governance_actions ga ON ga.action_id = tw.action_id
            ORDER BY tw.action_id, tw.withdrawal_index"""
    ).fetchall()
    entries = [
        {
            "action_id": r["action_id"],
            "withdrawal_index": int(r["withdrawal_index"]),
            "recipient_stake_address": r["recipient_stake_address"],
            "amount_lovelace": int(r["amount_lovelace"]),
            "enacted_epoch": int(r["enacted_epoch"]) if r["enacted_epoch"] is not None else None,
            "outcome": r["outcome"],
        }
        for r in rows
    ]
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "daily",
        "snapshot_date": snapshot_date,
        "n_withdrawals": len(entries),
        "withdrawals": entries,
    }
    atomic_write_json(out_dir / "treasury_withdrawals.json", payload)
    write_archive(out_dir, snapshot_date, "treasury_withdrawals.json", payload)
    return len(entries)


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


def export_top30_csv(top30_payload: dict, snapshot_date: str,
                     out_dir: Path) -> None:
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
    write_archive_csv(out_dir, snapshot_date, "top30.csv", path)


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
    # Per METHODOLOGY §21: snapshot_date is the sole authority for archive
    # placement. ETL wall-clock UTC has no bearing on by-date/{date}/ paths.
    # --snapshot-date overrides for backfill, repair, and reproducibility tests.
    if args.snapshot_date:
        snapshot_date = args.snapshot_date
    else:
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

        # FLOW-5 §22.2: fetch per-epoch treasury state from /totals (canonical
        # source for treasury balance) and treasury withdrawal recipients from
        # /proposal_list filtered to TreasuryWithdrawals (canonical source for
        # governance-driven treasury payouts; /treasury_withdrawals is explicitly
        # NOT used — see §22.1).
        log.info("fetching /totals (per-epoch treasury state)")
        totals_rows = fetch_totals()
        for r in totals_rows:
            upsert_treasury_snapshot(db, r)
        log.info("upserted %d treasury_snapshot epochs", len(totals_rows))

        log.info("fetching TreasuryWithdrawals actions")
        tw_actions = fetch_treasury_withdrawal_actions()
        tw_recipient_count = 0
        for a in tw_actions:
            # Action row was already upserted above by upsert_governance_action;
            # we just need to replace the withdrawal recipient set for this action.
            n = upsert_treasury_withdrawals(
                db, a["proposal_id"], a.get("withdrawal") or [],
                a.get("enacted_epoch"),
            )
            tw_recipient_count += n
        log.info("upserted %d treasury_withdrawals rows across %d actions",
                 tw_recipient_count, len(tw_actions))
        db.commit()

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

        export_epoch_info(db, snapshot_date, Path(args.out))
        log.info("wrote epoch_info.json")

        # FLOW-3: per-action detail JSON files. One per action_id in the DB.
        action_ids = [r[0] for r in db.execute(
            "SELECT action_id FROM governance_actions"
        ).fetchall()]
        for aid in action_ids:
            export_action_detail(db, aid, snapshot_date, Path(args.out))
        log.info("wrote %d per-action detail files", len(action_ids))

        export_top30_csv(top30, snapshot_date, Path(args.out))
        log.info("wrote top30.csv")

        # DREP change feed — what changed (movement only, no inference).
        changes = export_changes(db, snapshot_date, Path(args.out))
        log.info("wrote changes.json + top_gainers/losers/delegator_growth (recent=%d)",
                 len(changes.get("recent", [])))

        # FLOW-5 §22.10: treasury exports
        n_ep = export_treasury_snapshot(db, snapshot_date, Path(args.out))
        log.info("wrote treasury_snapshot.json (%d epochs)", n_ep)
        n_wd = export_treasury_withdrawals(db, snapshot_date, Path(args.out))
        log.info("wrote treasury_withdrawals.json (%d withdrawal rows)", n_wd)

        # Mark the run successful *before* writing meta.json so that the
        # latest-run record visible to consumers reflects the completed run,
        # not an in-progress one. If meta.json write fails, the prior
        # meta.json remains in place and the DB still records success.
        complete_etl_run(db, run_rowid, success=True,
                         block_height=int(tip.get("block_no") or 0),
                         n_dreps_seen=len(active))

        export_meta(db, snapshot_date, Path(args.out), tip, len(active))
        log.info("wrote meta.json")

        # FLOW-4 §21: archive index + integrity hashes. Written LAST so the
        # hash table covers every other file already placed in the archive,
        # including meta.json. Reordered so sha256.json honors §21.13's
        # "every other file in that archive" promise.
        write_archive_index(Path(args.out))
        write_archive_sha256(Path(args.out), snapshot_date)
        log.info("wrote archive index + sha256 (FLOW-4)")

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
    p.add_argument("--snapshot-date", default=None,
                   help="Override snapshot_date (YYYY-MM-DD). Default: today's UTC date. "
                        "Used for backfill, archive repair, and reproducibility tests.")
    p.add_argument("--verbose", "-v", action="store_true")
    args = p.parse_args()
    if args.snapshot_date is not None:
        # Validate the override is a real YYYY-MM-DD; refuse silent garbage.
        try:
            datetime.strptime(args.snapshot_date, "%Y-%m-%d")
        except ValueError as e:
            p.error(f"--snapshot-date must be YYYY-MM-DD: {e}")
    return args


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

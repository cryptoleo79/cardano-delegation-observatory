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
from datetime import datetime, timezone
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

ETL_VERSION = "0.1.0"

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
    """
    row = db.execute(
        """SELECT voting_weight_lovelace
             FROM snapshots
            WHERE drep_id = ?
              AND snapshot_date <= date(?, ?)
            ORDER BY snapshot_date DESC
            LIMIT 1""",
        (drep_id, snapshot_date, f"-{lookback_days} day"),
    ).fetchone()
    if not row:
        return None
    today_row = db.execute(
        "SELECT voting_weight_lovelace FROM snapshots WHERE drep_id = ? AND snapshot_date = ?",
        (drep_id, snapshot_date),
    ).fetchone()
    if not today_row:
        return None
    return int(today_row[0]) - int(row[0])


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
        deltas = {f"d{d}d_lovelace": query_deltas(db, drep_id, snapshot_date, d)
                  for d in DELTA_LOOKBACKS_DAYS}
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
            **deltas,
        })

    payload = {
        "snapshot_date": snapshot_date,
        "epoch": rows[0]["epoch"] if rows else None,
        "top_n": TOP_N,
        "entries": entries,
    }
    atomic_write_json(out_dir / "top30.json", payload)
    return payload


def export_meta(db: sqlite3.Connection, snapshot_date: str, out_dir: Path,
                tip: dict, drep_seen: int) -> None:
    last_run = db.execute(
        """SELECT run_started_at, run_completed_at, success, block_height, n_dreps_seen, notes
             FROM etl_runs
            ORDER BY run_started_at DESC
            LIMIT 1"""
    ).fetchone()
    payload = {
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

        export_top30(db, snapshot_date, Path(args.out))

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

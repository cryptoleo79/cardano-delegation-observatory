#!/usr/bin/env python3
"""Cardano Delegation Observatory — live telemetry layer.

Runs every 10 minutes via cron. Fetches incremental tip + new DRep votes;
periodically refreshes governance actions. Writes supplemental JSON to
data/snapshots/live/. Daily layer (snapshot.py) remains canonical and
unaffected.

Methodology source of truth: ../METHODOLOGY.md §14–§17

Usage:
    python3 etl/live.py --db data/observatory.db --out data/snapshots
    python3 etl/live.py --probe   # connectivity check, no writes
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

# Reuse helpers from snapshot.py — same package, same file directory.
_THIS_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(_THIS_DIR))
from snapshot import (  # noqa: E402
    koios_request,
    koios_paged,
    get_tip,
    upsert_vote,
    upsert_governance_action,
    fetch_governance_actions,
    atomic_write_json,
    open_db,
    METHODOLOGY_VERSION,
    SCHEMA_VERSION,
)


LIVE_VERSION = "0.1"
CADENCE_MINUTES = 10
RECENT_VOTES_WINDOW_HOURS = 24
RECENT_VOTES_LIMIT = 20
ACTION_REFRESH_EVERY_RUNS = 6  # full /proposal_list refresh every Nth run (≈ hourly)

log = logging.getLogger("live")


# ── live_state helpers ────────────────────────────────────────────────

def live_state_get(db: sqlite3.Connection, key: str) -> str | None:
    row = db.execute("SELECT value FROM live_state WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else None


def live_state_set(db: sqlite3.Connection, key: str, value: str) -> None:
    db.execute(
        """INSERT INTO live_state (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
               value = excluded.value,
               updated_at = excluded.updated_at""",
        (key, value, datetime.now(timezone.utc).isoformat(timespec="seconds")),
    )


# ── incremental fetch ────────────────────────────────────────────────

def fetch_drep_votes_since_block(min_block_height: int) -> list[dict]:
    """Yield DRep votes recorded at block heights > min_block_height.

    Koios /vote_list supports the PostgREST `gt.` operator on block_height.
    Pagination via limit/offset same as koios_paged.
    """
    rows: list[dict] = []
    params = {"block_height": f"gt.{min_block_height}"}
    for row in koios_paged("/vote_list", params=params):
        if row.get("voter_role") == "DRep":
            rows.append(row)
    return rows


# ── exports ──────────────────────────────────────────────────────────

def export_live_tip(tip: dict, fetched_at: str, out_dir: Path) -> None:
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "live",
        "epoch": tip.get("epoch_no"),
        "block_height": tip.get("block_no"),
        "block_time_unix": tip.get("block_time"),
        "fetched_at": fetched_at,
    }
    atomic_write_json(out_dir / "live" / "tip.json", payload)


def export_live_recent_votes(db: sqlite3.Connection, fetched_at: str,
                             out_dir: Path) -> None:
    """Most recent DRep votes within the past 24h, joined with DRep + action."""
    now_unix = int(datetime.now(timezone.utc).timestamp())
    window_start = now_unix - RECENT_VOTES_WINDOW_HOURS * 3600
    rows = db.execute(
        """SELECT v.vote, v.vote_epoch, v.vote_block_time,
                  v.action_id, v.drep_id,
                  d.metadata_name AS drep_name,
                  g.title AS action_title,
                  g.action_type
             FROM votes v
        LEFT JOIN dreps d ON d.drep_id = v.drep_id
        LEFT JOIN governance_actions g ON g.action_id = v.action_id
            WHERE v.vote_block_time IS NOT NULL
              AND v.vote_block_time >= ?
            ORDER BY v.vote_block_time DESC
            LIMIT ?""",
        (window_start, RECENT_VOTES_LIMIT),
    ).fetchall()
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "live",
        "fetched_at": fetched_at,
        "window_hours": RECENT_VOTES_WINDOW_HOURS,
        "n_votes": len(rows),
        "votes": [
            {
                "vote_epoch": r["vote_epoch"],
                "vote_block_time": r["vote_block_time"],
                "drep_id": r["drep_id"],
                "drep_name": r["drep_name"],
                "vote": r["vote"],
                "action_id": r["action_id"],
                "action_title": r["action_title"],
                "action_type": r["action_type"],
            }
            for r in rows
        ],
    }
    atomic_write_json(out_dir / "live" / "recent_votes.json", payload)


def export_live_meta(fetched_at: str, run_start: str, run_end: str,
                     success: bool, n_new_votes: int, tip: dict,
                     out_dir: Path) -> None:
    payload = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "layer": "live",
        "live_version": LIVE_VERSION,
        "cadence_minutes": CADENCE_MINUTES,
        "last_run_started_at": run_start,
        "last_run_completed_at": run_end,
        "last_run_success": success,
        "fetched_at": fetched_at,
        "n_new_votes_this_run": n_new_votes,
        "tip_epoch": tip.get("epoch_no"),
        "tip_block": tip.get("block_no"),
    }
    atomic_write_json(out_dir / "live" / "meta.json", payload)


# ── main ─────────────────────────────────────────────────────────────

def run(args: argparse.Namespace) -> int:
    out_dir = Path(args.out)
    run_start = datetime.now(timezone.utc).isoformat(timespec="seconds")

    if args.probe:
        tip = get_tip()
        log.info("probe ok: epoch=%s block=%s", tip.get("epoch_no"), tip.get("block_no"))
        return 0

    db = open_db(Path(args.db), Path(__file__).parent / "schema.sql")

    # Record run start in the shared etl_runs table with source='koios-live'
    cur = db.execute(
        "INSERT INTO etl_runs (run_started_at, source, success) VALUES (?, ?, 0)",
        (run_start, "koios-live"),
    )
    run_rowid = cur.lastrowid
    db.commit()

    try:
        tip = get_tip()
        current_block = int(tip["block_no"])

        last_seen_str = live_state_get(db, "last_seen_block_height") or "0"
        last_seen = int(last_seen_str)
        if last_seen >= current_block:
            log.info("no new blocks since last run (last_seen=%d, tip=%d)",
                     last_seen, current_block)
            new_votes: list[dict] = []
        else:
            log.info("fetching votes from block > %d (tip=%d)", last_seen, current_block)
            new_votes = fetch_drep_votes_since_block(last_seen)

        # Sort and upsert (revote ordering rule preserved)
        new_votes.sort(key=lambda v: int(v.get("block_time") or 0))
        for v in new_votes:
            upsert_vote(db, v)

        # Conditionally refresh governance actions (every Nth run)
        run_counter = int(live_state_get(db, "run_counter") or "0") + 1
        if run_counter % ACTION_REFRESH_EVERY_RUNS == 0:
            log.info("hourly governance action refresh")
            actions = fetch_governance_actions()
            for a in actions:
                upsert_governance_action(db, a)
            log.info("refreshed %d actions", len(actions))

        live_state_set(db, "last_seen_block_height", str(current_block))
        live_state_set(db, "run_counter", str(run_counter))
        db.commit()

        # Exports
        fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
        export_live_tip(tip, fetched_at, out_dir)
        export_live_recent_votes(db, fetched_at, out_dir)

        run_end = datetime.now(timezone.utc).isoformat(timespec="seconds")

        # Complete run record before writing meta.json so meta reflects success.
        db.execute(
            """UPDATE etl_runs SET run_completed_at = ?, block_height = ?,
                                   n_dreps_seen = ?, success = 1
                WHERE rowid = ?""",
            (run_end, current_block, None, run_rowid),
        )
        db.commit()

        export_live_meta(fetched_at, run_start, run_end, True,
                         len(new_votes), tip, out_dir)

        log.info("live run complete: %d new votes (run %d)", len(new_votes), run_counter)
        return 0

    except Exception as e:
        run_end = datetime.now(timezone.utc).isoformat(timespec="seconds")
        db.execute(
            """UPDATE etl_runs SET run_completed_at = ?, success = 0, notes = ?
                WHERE rowid = ?""",
            (run_end, repr(e), run_rowid),
        )
        db.commit()
        log.error("live run failed: %r", e)
        # Don't write meta.json on failure; prior meta.json (if any) stays in
        # place so the UI freshness indicator continues to reflect the last
        # successful run.
        return 1


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Cardano Delegation Observatory — live telemetry.")
    p.add_argument("--db", default="data/observatory.db")
    p.add_argument("--out", default="data/snapshots")
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

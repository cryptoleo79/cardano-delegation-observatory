#!/usr/bin/env python3
"""Recompute the DRep change-feed exports from the (now backfilled) DB.

Runs only the export path — no network ETL — so changes.json / top_gainers.json /
top_losers.json / top_delegator_growth.json / top30.json recompute their
24h/7d/30d/90d windows over the richer epoch-boundary history added by
backfill_history.py, and changes.json gains its new `coverage` array.

The snapshot_date used is the latest snapshot present in the DB (the most recent
real daily snapshot), matching what the live ETL would target.
"""

from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import snapshot as snap  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/observatory.db")
    ap.add_argument("--out", default="data/snapshots")
    args = ap.parse_args()

    db = sqlite3.connect(args.db)
    db.row_factory = sqlite3.Row

    # Latest real daily snapshot date (the change feed's "today").
    row = db.execute("SELECT MAX(snapshot_date) AS d FROM snapshots").fetchone()
    snapshot_date = row["d"]
    print("regenerating change feed for snapshot_date =", snapshot_date)

    snap.export_top30(db, snapshot_date, Path(args.out))
    changes = snap.export_changes(db, snapshot_date, Path(args.out))

    print("windows:")
    for k, w in changes["windows"].items():
        print(f"  {k}: available={w['available']} ref={w['reference_date']} "
              f"gainers={len(w['gainers'])} losers={len(w['losers'])} "
              f"entrants={len(w['entrants'])} exits={len(w['exits'])}")
    print("coverage:")
    for c in changes["coverage"]:
        print(f"  {c['window']}: status={c['status']} ref={c['reference_date']} "
              f"actual_lookback_days={c['actual_lookback_days']}")
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

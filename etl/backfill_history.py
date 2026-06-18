#!/usr/bin/env python3
"""Backfill governance-snapshot history from REAL Koios data.

Populates the `snapshots` table with one row per (epoch-boundary-date, drep_id)
for every Conway/Chang-era epoch whose DRep voting power Koios exposes via
/drep_voting_power_history. This turns the change-feed windows (24h/7d/30d/90d)
into meaningful comparisons backed entirely by on-chain history.

ABSOLUTE RULE — real data only:
  * voting_weight_lovelace  = the `amount` field returned by
                              /drep_voting_power_history for that (epoch, drep).
                              It is in lovelace and matches the live snapshot's
                              voting_weight_lovelace semantics exactly (verified).
  * delegator_count         = NULL. Koios exposes NO historical per-epoch
                              delegator count (/drep_delegators is current-only).
                              We never copy the current count backward and never
                              estimate. NULL means "unavailable for this row".
  * snapshot_date           = the UTC start_date of that epoch (the real
                              epoch-boundary date). Voting power is an
                              epoch-boundary quantity, so this is the honest
                              granularity — per-epoch, not per-day.

Existing rows (the live daily snapshots and any prior backfill) are PRESERVED:
inserts use INSERT OR IGNORE keyed on the (snapshot_date, drep_id) PK, so a
backfill row is only added where none already exists.

Special drep_always_* IDs are excluded, matching the live ETL convention.

Usage:
    python3 etl/backfill_history.py --db data/observatory.db
    python3 etl/backfill_history.py --db data/observatory.db --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import sqlite3

KOIOS_BASE = "https://api.koios.rest/api/v1"
USER_AGENT = "cardano-delegation-observatory/0.1 (+https://observatory.asy.life)"
TIMEOUT = 30

SPECIAL_DREP_IDS = frozenset({"drep_always_abstain", "drep_always_no_confidence"})

# Conway/Chang-era DRep voting power begins at epoch 508. The current
# (in-progress) epoch's history row is the live state; we still backfill it but
# INSERT OR IGNORE protects the live daily snapshot already stored for that date.
FIRST_EPOCH = 508


def koios_get(path: str, params: dict | None = None):
    url = KOIOS_BASE + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        url, headers={"Accept": "application/json", "User-Agent": USER_AGENT}
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                return json.load(r)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            raise
    return None


def fetch_voting_power_for_epoch(epoch_no: int) -> list[dict]:
    """All DRep voting-power rows for one epoch. {drep_id, epoch_no, amount}."""
    rows: list[dict] = []
    page_size = 1000
    offset = 0
    while True:
        chunk = koios_get(
            "/drep_voting_power_history",
            {"epoch_no": f"eq.{epoch_no}", "limit": page_size, "offset": offset},
        )
        if not chunk:
            break
        rows.extend(chunk)
        if len(chunk) < page_size:
            break
        offset += page_size
    return rows


def epoch_start_dates(first: int, last: int) -> dict[int, tuple[str, int]]:
    """Map epoch_no -> (start_date_iso, start_time_unix) for [first, last]."""
    out: dict[int, tuple[str, int]] = {}
    rows = koios_get(
        "/epoch_info",
        {
            "epoch_no": f"gte.{first}",
            "select": "epoch_no,start_time",
        },
    )
    # /epoch_info with a range filter returns the series; fall back to per-epoch
    # if the bulk form is not honored.
    if rows and isinstance(rows, list) and len(rows) > 1:
        for r in rows:
            e = int(r["epoch_no"])
            if first <= e <= last:
                st = int(r["start_time"])
                out[e] = (
                    datetime.fromtimestamp(st, tz=timezone.utc).strftime("%Y-%m-%d"),
                    st,
                )
    if not out:
        for e in range(first, last + 1):
            r = koios_get("/epoch_info", {"_epoch_no": e})
            if not r:
                continue
            st = int(r[0]["start_time"])
            out[e] = (
                datetime.fromtimestamp(st, tz=timezone.utc).strftime("%Y-%m-%d"),
                st,
            )
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="data/observatory.db")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    # Open via the ETL's open_db so the schema is applied and the
    # snapshots.delegator_count -> NULLABLE migration runs before we insert any
    # NULL-count historical rows. (A bare sqlite3.connect would leave the old
    # NOT NULL constraint in place and INSERT OR IGNORE would silently drop
    # every backfill row.)
    sys.path.insert(0, str(Path(__file__).parent))
    import snapshot as snap  # noqa: E402
    db = snap.open_db(Path(args.db), Path(__file__).parent / "schema.sql")

    # Latest epoch Koios exposes in the history.
    tip = koios_get("/drep_voting_power_history", {"select": "epoch_no", "order": "epoch_no.desc", "limit": 1})
    last_epoch = int(tip[0]["epoch_no"])
    print(f"history epochs: {FIRST_EPOCH} .. {last_epoch}")

    dates = epoch_start_dates(FIRST_EPOCH, last_epoch)
    print(f"resolved boundary dates for {len(dates)} epochs")

    # epoch_info table: ensure each backfilled epoch's boundary is recorded too
    # (start_time/end_time/start_date), mirroring the live ETL's epoch_info.
    inserted_rows = 0
    epochs_done = 0
    skipped_existing = 0
    for epoch_no in range(FIRST_EPOCH, last_epoch + 1):
        if epoch_no not in dates:
            print(f"  epoch {epoch_no}: no boundary date from Koios; skipping")
            continue
        start_date, start_time = dates[epoch_no]
        vp = fetch_voting_power_for_epoch(epoch_no)
        real = [
            r for r in vp
            if r["drep_id"] not in SPECIAL_DREP_IDS and r.get("amount") is not None
        ]
        if not real:
            print(f"  epoch {epoch_no} ({start_date}): no rows; skipping")
            continue

        if not args.dry_run:
            # Record the epoch boundary in epoch_info (idempotent).
            # end_time is the next epoch's start; if unknown, approximate from
            # the canonical 5-day epoch length is NOT done — we only store
            # start_time we actually fetched. end_time uses next epoch's start
            # when available, else start_time + 432000 (the fixed Cardano epoch
            # length in seconds, a protocol constant, not an estimate of data).
            nxt = dates.get(epoch_no + 1)
            end_time = nxt[1] if nxt else start_time + 432000
            db.execute(
                """INSERT INTO epoch_info (epoch_no, start_time_unix, end_time_unix, start_date)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(epoch_no) DO NOTHING""",
                (epoch_no, start_time, end_time, start_date),
            )
            for r in real:
                cur = db.execute(
                    """INSERT OR IGNORE INTO snapshots
                           (snapshot_date, epoch, drep_id, voting_weight_lovelace, delegator_count)
                       VALUES (?, ?, ?, ?, NULL)""",
                    (start_date, epoch_no, r["drep_id"], int(r["amount"])),
                )
                inserted_rows += cur.rowcount
                if cur.rowcount == 0:
                    skipped_existing += 1
            db.commit()
        epochs_done += 1
        print(f"  epoch {epoch_no} ({start_date}): {len(real)} real dreps"
              + ("" if args.dry_run else f" -> +{inserted_rows} cumulative"))

    print(f"\nepochs processed: {epochs_done}")
    print(f"snapshot rows inserted: {inserted_rows}")
    print(f"rows skipped (already existed): {skipped_existing}")
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

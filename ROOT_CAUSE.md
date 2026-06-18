# ROOT CAUSE — Governance ETL freshness stall

**Incident:** Governance snapshots stopped advancing after **2026-06-01**; the
site (DRep table, treasury, home metrics, change feed) served data dated
2026-06-01 while the chain moved on (epoch 634 → 637).

## Why it stopped
**There was no scheduler for the governance ETL.** The daily snapshot job
(`etl/snapshot.py`) was never installed as a cron entry or a systemd timer on the
host. The only scheduled job in the user crontab is the market-data poller
(`cardano-data-layer/.../ohlcv-poller.js`, every 5 min). The governance ETL had
been run **ad hoc / manually**, which is consistent with its irregular run times
in the `etl_runs` table (e.g. 2026-05-30 07:40 and 08:20; 2026-06-01 08:41 and
10:10). When the manual runs stopped, nothing took over.

This was **not** a failure:
- `etl_runs` shows every run through 2026-06-01 with `success = 1`. There is **no
  first failed run** — there is simply no run after 2026-06-01T10:11:39Z.
- **Koios is healthy** (probe 2026-06-18: tip epoch 637, block 13,563,488, 387
  active DReps, voting weights returned normally). No API outage, no schema drift.
- **Disk is fine** (/ at 23%, 93 GB free). **Permissions/ownership fine**
  (`data/observatory.db`, `data/snapshots/` owned by `midnight:midnight`, writable).
- No deploy around 2026-06-01 touched the ETL scheduler (the commits in that window
  were Project Memory + JA i18n work, none of which install or remove a cron/timer).

**Conclusion:** a missing heartbeat, not a broken one. The pipeline works; nothing
was calling it.

## When it stopped
Last successful snapshot run: **2026-06-01T10:11:39Z** (block 13,493,108, 368
DReps). First missing day: 2026-06-02. Gap at detection: **17 days** (≈3 epochs).

## What data is affected
Stale-but-correct (frozen at 2026-06-01), now refreshed by the recovery run:
- DRep snapshots / Top-30 table (`top30.json`) and per-DRep history.
- Governance actions snapshot, `meta.json`, `epoch_info.json`.
- Treasury snapshot (`treasury_snapshot.json`) and withdrawals.
- Derived: home governance metrics, flows/concentration, and the new change feed
  (which is why its windows were thin — only 3 historical snapshot days existed).

No data was lost or corrupted — snapshots are immutable and append-only; the
archive simply has a 2026-06-02 → 2026-06-17 gap (failed/absent runs are never
interpolated, per methodology §21).

## Fix
1. **Recovery run:** execute a fresh snapshot now — `cd ~/observatory && python3
   etl/snapshot.py` — regenerating the DB + all snapshot exports (top30, actions,
   treasury, change feed) at the current epoch.
2. **Install the heartbeat:** add a daily user-cron entry so the snapshot runs
   automatically (the cadence the methodology documents — "computed daily").

## Prevention
- **Scheduler is now installed and version-controlled** as `etl/deploy/etl.crontab`
  so it can never silently go missing again (mirrors the poller's pattern).
- **Self-monitoring already exists and should be surfaced:** `meta.json` carries
  `last_run` and the site shows a "Last update stale" badge when `data_through` is
  older than 36 h. That badge was the early-warning signal; the fix makes it green.
- **Recommended next:** a lightweight liveness check (cron success/age of
  `data_through`) that alerts if a run is missed, so a future stall is caught in
  hours, not weeks.

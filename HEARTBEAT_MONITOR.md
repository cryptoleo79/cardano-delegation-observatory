# HEARTBEAT_MONITOR.md — pipeline freshness monitoring

Purpose: never again discover a silently-dead pipeline weeks later (see
`ROOT_CAUSE.md` for the 2026-06-01 governance-ETL stall this prevents).

Live dashboard: **`heartbeat.html`** (linked from the home footer and the Status
page). It auto-refreshes every 60 s and classifies each pipeline **Fresh /
Warning / Stale**.

## What is monitored

| Pipeline | What it does | Freshness signal | Cadence |
|---|---|---|---|
| **Governance ETL** | Daily DRep / governance / treasury snapshot | `data/snapshots/meta.json` → `last_run.run_completed_at`, `last_run.success`, `data_through`, `tip_epoch` | twice daily (cron) |
| **Market poller** | GeckoTerminal market data + OHLCV price ticks | Data Layer `GET /health` → `freshness.token_market_as_of`, `freshness.ohlcv_latest` | every ~5 min (cron) |
| **Data Layer API** | Read-only API serving everything | `GET /health` responds with `ok:true` | always-on (user-systemd) |

All three signals are public and require no credentials, so the dashboard (and any
external monitor) can read them directly.

## Thresholds

**Governance ETL (daily cadence)** — age = now − `last_run.run_completed_at`:
- 🟢 **Fresh** — < 24 h.
- 🟠 **Warning** — ≥ 24 h (a daily run was missed). **Escalation point at 36 h.**
- 🔴 **Stale** — ≥ 48 h (two or more runs missed — the pipeline is likely down).
- A `last_run.success ≠ 1` knocks the status down one level regardless of age.

**Market poller (~5-min cadence)** — age = now − newest of `token_market_as_of` / `ohlcv_latest`:
- 🟢 **Fresh** < 30 m · 🟠 **Warning** ≥ 30 m · 🔴 **Stale** ≥ 2 h.

**Data Layer API**: 🟢 **Fresh** while `/health` returns `ok:true`; 🔴 **Stale** if unreachable.

**Overall status** = the worst of the three (an unreachable source is treated as Warning/Stale, since "can't tell" is itself a problem).

## Alert conditions (governance ETL)

| Age of last successful run | Status | Meaning / action |
|---|---|---|
| **≥ 24 h** | Warning | One daily run missed. Check the cron ran; usually self-heals on the next run. |
| **≥ 36 h** | Warning (escalated) | Investigate now — confirm cron is firing and Koios is reachable. |
| **≥ 48 h** | Stale | Pipeline down. Run the **recovery procedure** below. |

## Recovery procedure (governance ETL)

1. **Confirm the schedule exists:** `crontab -l | grep snapshot.py`
   — must show the line from `etl/deploy/etl.crontab`. If missing, reinstall:
   `( crontab -l 2>/dev/null; grep -v '^#' etl/deploy/etl.crontab | grep . ) | crontab -`
2. **Confirm cron is running:** `pgrep -x cron` (the 5-min market poller firing is also proof).
3. **Check the ETL log:** `tail -n 50 data/etl.log` — look for the first failed run / error.
4. **Test upstream:** `python3 etl/snapshot.py --probe` — verifies Koios connectivity with no writes.
5. **Check disk / permissions:** `df -h /` and `ls -la data/observatory.db data/snapshots`.
6. **Run a recovery snapshot:** `cd ~/observatory && python3 etl/snapshot.py`
   — regenerates the DB + all exports (top30, actions, treasury, change feed).
7. **Refresh the API view:** `systemctl --user restart cardano-data-layer`
   (so it re-reads the snapshot files).
8. **Verify:** reload `heartbeat.html` (all 🟢) and confirm `meta.json.data_through`
   advanced and `/dreps` `as_of` is today.

## Recovery procedure (market poller)
1. Inspect: `tail -n 50 ~/cardano-data-layer/service/data/poller.log`.
2. Manual run: `cd ~/cardano-data-layer/service && node --disable-warning=ExperimentalWarning src/jobs/ohlcv-poller.js --once`.
3. Confirm cron line present (`crontab -l | grep ohlcv-poller`). GeckoTerminal 429s on the
   long tail are expected and skipped; only a total absence of writes is a fault.

## Prevention
- Both schedulers are **version-controlled** (`etl/deploy/etl.crontab`,
  `cardano-data-layer/service/deploy/poller.crontab`) so they can't silently go missing.
- `heartbeat.html` makes a stall **visible** at a glance; the home page also shows a
  "Last update stale" badge past 36 h.
- **Recommended follow-up:** a tiny external cron (or uptime service) that GETs
  `/health` and `meta.json` and pings on Warning/Stale — turning the dashboard's
  passive signal into an active alert. Thresholds above are the contract for it.

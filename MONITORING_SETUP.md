# MONITORING_SETUP.md — active heartbeat alerting

Goal: **if the governance ETL dies tonight, we know tomorrow morning — not two
weeks later.** This is the active layer on top of the passive dashboard
(`heartbeat.html`) and runbook (`HEARTBEAT_MONITOR.md`).

## How it works
`monitor/heartbeat-check.mjs` (zero-dependency Node) runs every **10 minutes**
via cron. It reads the three public freshness signals, classifies each
ok/warning/critical, and on a **state change** sends one alert to the configured
destination (transition-based, so a sustained outage pings once — and again when
it recovers). Every check is logged to `monitor/heartbeat-monitor.log`.

## What is monitored

| Check | Source (monitor URL) | Fail (warning) | Critical |
|---|---|---|---|
| **Data Layer API** | `GET https://api.asy.life/health` | — | non-200, timeout, or unreachable |
| **Governance ETL** | `https://observatory.asy.life/data/snapshots/meta.json` → `data_through` | older than **36 h** | older than **48 h** (or `last_run.success ≠ 1`) |
| **Market poller** | `/health` → `freshness.token_market_as_of` | older than **30 min** | older than **2 h** |

Exit code: `0` ok · `1` warning · `2` critical (usable by external uptime checks too).

## Alert path (pick one — one line in `monitor/alert.env`)
`monitor/alert.env` is **gitignored** (never commit secrets). Copy the template
and fill exactly one:
```
cp monitor/alert.env.example monitor/alert.env
```
- **Discord (simplest, recommended):** Server Settings → Integrations → Webhooks →
  *New Webhook* → Copy URL → paste as `DISCORD_WEBHOOK_URL=`. No bot, no SMTP.
- **Telegram:** create a bot with @BotFather (token), get your id from @userinfobot,
  set `TELEGRAM_BOT_TOKEN=` and `TELEGRAM_CHAT_ID=`.
- **Generic / Slack:** any endpoint accepting `POST {"text":...}` → `ALERT_WEBHOOK_URL=`.

With none set, alerts are written to the log + `monitor/last-alert.txt` only (still
useful; add a destination any time — no code change, no restart).

## Test procedure
1. **Delivery path:** `node monitor/heartbeat-check.mjs --test`
   → sends a **TEST ALERT** then a **TEST CLEARED** to your destination. Confirm
   both arrive. (Proves alerts fire *and* recover.)
2. **Detection path:** `node monitor/heartbeat-check.mjs --simulate=critical`
   → forces the governance check critical; you should receive one CRITICAL alert.
   Then run `node monitor/heartbeat-check.mjs` once normally → you receive the
   matching **RECOVERED** alert. (Proves real transitions alert and clear.)
3. **Steady state:** `node monitor/heartbeat-check.mjs` with everything healthy
   logs "no state change — no alert" and exits 0 (no spam).

## Cron
Version-controlled in `monitor/deploy/monitor.crontab`; installed line:
```
*/10 * * * * cd /home/midnight/observatory && /usr/bin/node monitor/heartbeat-check.mjs >/dev/null 2>>/home/midnight/observatory/monitor/cron.err
```
Reinstall: `( crontab -l 2>/dev/null; grep -v '^#' monitor/deploy/monitor.crontab | grep . ) | crontab -`

## Option A — Uptime Kuma (alternative / addition)
For a hosted dashboard + multi-channel notifications, Uptime Kuma can run the
**API up/down** check natively (HTTP(s) monitor on `https://api.asy.life/health`,
keyword `"ok":true`, 5-min interval, with Discord/Telegram/email notifications).
For the **freshness** checks use Kuma's *HTTP(s) - JSON query* monitor:
- Governance: monitor `…/data/snapshots/meta.json`, but note Kuma compares values,
  not derived ages — the robust age-vs-threshold logic lives in this script, so the
  script remains the source of truth for freshness alerting. Kuma is best for the
  liveness/up-down layer; keep `heartbeat-check.mjs` for the time-based thresholds.

## Files
- `monitor/heartbeat-check.mjs` — the monitor (zero-dep).
- `monitor/alert.env.example` — destination template (copy to `alert.env`).
- `monitor/deploy/monitor.crontab` — the schedule.
- `monitor/heartbeat-monitor.log` — every check (gitignored).
- `monitor/last-alert.txt` — most recent alert payload (gitignored).
- Related: `heartbeat.html` (dashboard), `HEARTBEAT_MONITOR.md` (thresholds + recovery), `ROOT_CAUSE.md` (the incident this prevents).

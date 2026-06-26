# Operations — Cardano Observatory, Era II

*The engineering foundation is complete (see `COMPLETION_REPORT.md`). Era II is not
about building — it is about operating, preserving, and earning trust over years. This
is the standing operating doctrine: the cadence, what runs automatically, what is an
owner action, and the gates that govern any future build.*

**Mission:** become the permanent public memory of Cardano — through accuracy,
durability, and trust, not volume or marketing. Each year the Observatory grows more
valuable simply because another year of history has been preserved.

---

## Automation map — what runs without a human

| When | Job | Covers | Cron |
|------|-----|--------|------|
| every 5 min | `ohlcv-poller.js` | market data freshness | `*/5 * * * *` |
| every 10 min | `monitor/heartbeat-check.mjs` | API health · governance ETL freshness (warn 36h/crit 48h) · poller freshness — alerts on state change | `*/10 * * * *` |
| 2×/day 08:10,20:10 | `etl/snapshot.py` | record DRep/treasury/governance snapshot rows (append-only) | `10 8,20 * * *` |
| daily 21:30 | `scripts/backup-memory.sh` | WAL-safe, integrity-checked, rotated backups of both DBs | `30 21 * * *` |
| daily 21:35 | `scripts/backup-status.sh` | backup health report → `STATUS.md` | `35 21 * * *` |
| weekly Sun 21:40 | `scripts/backup-selftest.sh` | prove backups restore (18 checks) | `40 21 * * 0` |
| weekly Sun 03:00 | poller.log truncate | bound log growth | `0 3 * * 0` |

**Preservation (Loop 2) is structural, not a job:** `pm_event` is append-only and
hash-chained; claims are superseded, never overwritten; unknowns stay `null`. Nothing
here can rewrite history by design.

---

## Cadence — what a human does

### Daily (Loop 1 — OPERATE): ~2 min, only if something looks off
The machinery above runs the checks. To eyeball health on demand:
```bash
bash ~/observatory/scripts/backup-status.sh        # backups: green?
tail -5 ~/observatory/monitor/heartbeat-monitor.log # ETL/API/poller: green?
```
**Known silent-failure gap:** heartbeat alerts only go to a local log until an alert
destination is set (`monitor/alert.env`: `DISCORD_WEBHOOK_URL` / `SLACK_WEBHOOK_URL` /
`ALERT_WEBHOOK_URL`). **Owner action** — until then, failures are not pushed to a human.

### Weekly (Loop 3 — OBSERVE): usage, against the latest trustworthy baseline
```bash
sudo node ~/observatory/scripts/analyze-access-logs.mjs --days 7 --out /tmp/usage.md
```
Record in `WEEKLY_ADOPTION_REPORT.md`. Compare **only** against the latest trustworthy
baseline (Week 5, post-measurement-repair) — never against pre-repair weeks. Watch:
Projects, Command Center, Timeline, Search, Governance Daily, Memory Map, Pulse,
internal navigation. **Owner action** (needs sudo for nginx logs).

### Weekly (Loop 4 — DISTRIBUTE): publish one real observation
Not feature announcements — real facts already in the data: the largest governance
movement (`changes.json`), recently enriched projects (`ecosystem-pulse`), a treasury
milestone, a project-history highlight. Lead people *into* the platform. Log sends in
`OUTREACH_TRACKER.md`. **Owner action** (sending). *(Tooling to draft these from
existing data can be added on request — it is data extraction, not a new feature.)*

### Weekly (Loop 5 — LISTEN): collect, don't tally
Builder/DRep/developer/researcher feedback → `OUTREACH_TRACKER.md`. **One request =
note. Three unrelated requests = roadmap candidate.** Opinions are not counted; only
repeated independent demand promotes an item.

### Quarterly (Loop 6 — VERIFY): never assume yesterday's correctness
Re-run the full audit set (truth · links · integrity · security · recovery · docs).
The Completion Sprint (2026-06-25) is the template and the last run; next ≈ 2026-09.

---

## Loop 7 — SURVIVE (the only incomplete engineering milestone)

| Phase | Status |
|-------|--------|
| 1 Append-only log | ✅ |
| 2 Automated local backup | ✅ |
| 3 Encrypted offsite replication | 🟡 **prepared** — `scripts/backup-offsite.sh` (gpg, tested round-trip); needs owner to set encryption key + `OFFSITE_PUSH_CMD` transport |
| 4 Automated restore verification | ✅ (`backup-selftest.sh`, 18 checks) |
| 4b Full clean-machine disaster recovery | ⬜ pending Phase 3 |

To finish (owner): configure `~/backups/observatory/offsite.env`
(`OFFSITE_GPG_RECIPIENT` + `OFFSITE_PUSH_CMD`), add a cron line after 21:35, then run
the clean-machine drill in `RECOVERY.md` §3 end to end. Only when a real server-loss
restore boots with `pm_event` history intact is Memory Integrity complete.

---

## Loop 8 — GROW: the build gate

Do **not** build unless one is true:
1. Usage identifies a new winner.
2. Multiple independent users request the same capability (Loop 5 → 3 requests).
3. A verified usability issue blocks understanding.
4. Operational reliability requires engineering.

No speculative features. No new flagship pages on a hunch.

## Loop 9 — MEASURE IMPACT: the build retro

Every change must answer: did it increase understanding? improve navigation? increase
usage? improve resilience? If a *kind* of work shows no such impact, stop doing it.

## Loop 10 — LEGACY: how this is judged

Not by page count. By: how much history survives · how much truth survives · how many
researchers depend on it · how many builders reference it · how many years it keeps
operating.

---

## Open owner actions (the whole backlog, in one place)

1. **Alert destination** (`monitor/alert.env`) — so heartbeat failures reach a human.
2. **Phase 3 offsite** — configure `backup-offsite.sh` (key + transport) + cron.
3. **Phase 4b** — one clean-machine disaster-recovery drill (after #2).
4. **nginx hardening** — apply `docs/nginx-observatory-hardening.md` (sudo).
5. **Weekly usage** (Loop 3) + **distribution/listening** (Loops 4–5) — ongoing.

Everything else runs itself. The agent resumes engineering only on a Loop 8 trigger.

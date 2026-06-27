# Completion Report — Cardano Observatory

*The Completion Sprint: finish the platform by removing remaining engineering
weakness, not by adding features. Dated 2026-06-25. Scope: zero-defect audit, data
integrity, performance, recovery, operator experience, security, longevity.*

This report is the honest state of the platform: what is done, what is deferred (and
why), what is owner-blocked, the known limitations, and the risk register. No claim
here is aspirational — each maps to a verification run in this sprint.

---

## Operational status — READY TO OPERATE

The Observatory is technically ready to run for years, with the single caveat that
true server-loss survivability awaits offsite replication (owner-blocked, below).

- Site: static files under `web/`, served by nginx (observatory.asy.life).
- API: `cardano-data-layer.service` (systemd --user), read-only, api.asy.life.
- Recording: `etl/snapshot.py` twice daily (08:10/20:10); accruing since 2024-09.
- Backups: daily 21:30 + status 21:35 + weekly self-test (Sun 21:40).
- All cron verified (6 active lines), all `--user` services + cron survive reboot
  via `loginctl enable-linger` (confirm on any new host — see RECOVERY.md §3.4).

---

## Part-by-part results

### Part 1 — Zero-defect audit ✅
Full audit of ~42 pages + i18n.js + page scripts. **1 verified defect, fixed:**
- `ecosystem-map.html` linked to the deprecated `categories.html` redirect →
  repointed to `category-explorer.html`. No remaining links to the stub.

Clean: no broken internal links (all href targets exist); i18n EN/JA parity perfect
(205/205 keys); no orphan pages; no dead nav or "What next?" entries; no empty
widgets; no placeholder/TODO text; terminology consistent; no duplicate concepts
(state.html→command-center and categories.html→category-explorer are intentional
redirects).

### Part 2 — Data integrity ✅
Validated **2,729 JSON files — 0 parse failures.** Project Memory: 847 projects,
**0 duplicate IDs, 0 missing per-project files, 0 ID mismatches**; categories: 74,
**0 member references to unknown projects.** Governance/treasury/epoch JSON all parse
and shape-check. No orphan records, no broken histories. Integrity is clean.

### Part 3 — Performance ✅ (audited; no defects, optimizations deferred)
No render-blocking scripts (all JS at end of body / inline); no duplicate fetches
*within* a single page load; efficient single-pass `innerHTML` rendering, no layout
thrash. Pages measured: index ~67KB, governance-daily ~51KB, timeline ~110KB — fine.
Heavier: command-center ~1MB, search ~1.13MB, project ~1.14MB worst case (they load
`projectmemory/index.json` 615KB + `categories.json` 515KB).

Optimizations identified but **deferred** (each requires a data-pipeline change or
new export, i.e. methodology/ETL surface — out of sprint scope, and no usage evidence
of a perf complaint): cross-page `sessionStorage` cache of index.json; a lightweight
`search-index.json`; a `treasury_summary.json` to replace the 226KB snapshot on
command-center; lazy-load categories.json on project pages. Logged for an evidence
trigger.

### Part 4 — Recovery ✅ (as complete as credentials allow)
Re-verified end to end: backup runs clean; self-test **18/18 PASS** (incl. real
restore + `integrity_check` + row-count assertions + failure-mode exit codes);
status report Health: OK; retention keep-14 working; logging present. WAL healthy
(autocheckpoint 1000, no unbounded WAL). Phases 3 and 4b remain owner-blocked (below).

### Part 5 — Operator experience ✅
`docs/RECOVERY.md` is a command-complete, timed runbook a brand-new maintainer can
follow with no prior knowledge: install/provision, single-DB restore, full
clean-machine disaster recovery, the green verification checklist, and operational
reference (cron, logs, env vars). Install/update/restore/verify/troubleshoot/deploy
are all covered.

### Part 6 — Security ⚠️ (1 verified finding; fix is owner-blocked)
Headers present (X-Content-Type-Options, X-Frame-Options, Referrer-Policy). Dotfiles
denied (`.git` → 404). **Backups are NOT web-exposed** (outside docroot → 404).
Backup/script permissions hardened this sprint (`~/backups/observatory` now `700`,
`*.gz` `600`; scripts `755`).

**Verified finding (MEDIUM): repo-internal files are publicly served.** The nginx
vhost roots at a full deployed copy of the repo, and the `try_files … $uri` fallback +
broad `location /data/` serve more than intended:
- `/data/observatory.db` — the raw 43MB SQLite — is downloadable (bandwidth/DoS
  vector; exposes internal tables). Not a breach (CC0 data, public repo) but unintended.
- `/scripts/`, `/etl/`, `/docs/` are served (already public on GitHub, so no secret
  leak, but shouldn't be on the production domain).

Exact fix written in `docs/nginx-observatory-hardening.md`. **Owner-blocked** —
editing `/etc/nginx` + reload need sudo.

### Part 7 — Longevity ✅ (audited; brittle items documented in risk register)
Audited counts, dates, external deps, magic numbers. Most magic numbers are
well-named, documented constants (TOP_N=30, timeouts, retries, LOVELACE_PER_ADA) —
working-as-designed. Brittle/derivable items are catalogued in the risk register
below rather than churned during a defect-removal sprint (and the hardcoded UI counts
were explicitly **parked** by the owner in two prior sessions — they are currently
*accurate*: 847/787/74 verified). One operational longevity fix shipped: weekly
truncation of the unbounded `poller.log`.

### Part 8 — This report ✅

---

## Completed this sprint
- Fixed the stale `ecosystem-map.html` → `category-explorer.html` link.
- Hardened backup/script permissions (owner-only backups).
- Added weekly `poller.log` truncation (cron) — closes unbounded log growth.
- Re-verified recovery (self-test 18/18, status OK).
- Wrote `docs/nginx-observatory-hardening.md` (exact security fix for the owner).
- Wrote this report.
- (Verified, no change needed: 2,729 JSON files, i18n parity, no broken links,
  performance, WAL health.)

## Deferred (no evidence they're bottlenecks; need a trigger)
- Performance payload optimizations (sessionStorage cache, search-index.json,
  treasury_summary.json, lazy categories.json) — require an ETL/export change.
- Dynamic UI counts (847/787/74 etc.) — owner-parked twice; currently accurate.

## Owner-blocked (need sudo / credentials)
- **Security fix** — apply `docs/nginx-observatory-hardening.md` (sudo nginx).
- **Memory Integrity Phase 3** — encrypted offsite replication of
  `~/backups/observatory` (credentials).
- **Memory Integrity Phase 4b** — one full clean-machine disaster-recovery drill
  (depends on Phase 3).

## Known limitations (honest, by design)
- Coverage is broad but not exhaustive: project memory is a curated record, the token
  set is a ~110-token seed, DReps are top-30 by weight. The site says so.
- Project Memory history depth is ~3 weeks (recording began 2026-06-03); no archive
  exists to backfill earlier project state. Governance/treasury reach 2024-09.
- Local backups protect against deletion/corruption/bad-ETL/bad-deploy, **not**
  disk/VPS/datacenter loss (closes at Phase 3).

---

## Risk register

| # | Risk | Severity | Likelihood | Status / mitigation |
|---|------|----------|-----------|---------------------|
| R1 | Server/disk/datacenter loss → total loss | **High** | Low–Med | **Open.** Local backups only. Closes at Phase 3 (offsite) + 4b (proven). Owner-blocked. |
| R2 | Repo-internal files (raw DB, scripts, etl, docs) web-served | Medium | Certain (live now) | **Open.** Fix ready in nginx-observatory-hardening.md. Owner-blocked (sudo). No secret/CC0 data leaked. |
| R3 | Hardcoded UI counts (847/74/…) drift from data | Low | High over time | Documented. Currently accurate; owner-parked. Make dynamic when a count next changes. |
| R4 | `ECOSYSTEM_DENOM=1046` (rankings.js) goes stale | Low | Med | Documented. Comment notes "refresh periodically"; re-measure quarterly. |
| R5 | `432000` epoch-seconds assumes fixed epoch length | Low | Very low | Documented (backfill_history.py). Cardano epoch length is stable; revisit only on a protocol change. |
| R6 | `FIRST_EPOCH=508` / Conway-era assumption | Low | Low | Documented. Mainnet-locked; revisit on hard fork. |
| R7 | Hardcoded `api.asy.life` / Koios hosts in JS/ETL | Low | Low | Documented. Query-param override exists; centralize config if domain ever moves. |
| R8 | Single ETL source (Koios) — outage stalls recording | Low | Med | Retries + timeouts in place; a missed snapshot is a gap, not data loss (append-only resumes). |
| R9 | `poller.log` unbounded growth | Low | — | **Closed** this sprint (weekly truncate cron). |
| R10 | Backups world-readable | Low | — | **Closed** this sprint (chmod 700/600). |

---

## Truth status ✅
The platform lives up to provenance-first / observability-not-attribution / no-scores
/ unknown-stays-unknown. Verified prior: no quality scores or rankings (only factual
superlatives backed by counts); the "whole ecosystem" overclaim was corrected to
"into the ecosystem … not exhaustive"; values trace to source/authority/as-of;
unknowns render as `—`/null, never fabricated. No AI-generated facts, no inferred
relationships, no fabricated provenance.

## Recovery status
Phase 1 (append-only log) ✅ · Phase 2 (automated local backup) ✅ · Phase 3
(encrypted offsite replication) ⬜ owner-blocked · Phase 4 (automated restore
verification) ✅ · Phase 4b (full clean-machine disaster recovery) ⬜ pending Phase 3.
**Resilient against file-level loss; not yet against server loss.**

---

## Stop-condition assessment
- No verified engineering defects remain (the 1 found was fixed; the security finding
  has a ready fix, owner-blocked). ✅
- No known broken journeys remain. ✅
- Recovery is as complete as current credentials allow (Phases 3/4b need the owner). ✅
- Documentation is sufficient for a new operator (RECOVERY.md). ✅
- Technically ready to operate for years, modulo R1 (offsite) and R2 (nginx). ✅

**The Completion Sprint is complete to the limit of available credentials.** The two
remaining items (offsite replication; nginx hardening) are owner actions, fully
specified and ready to apply. After them, the Observatory survives losing the server —
the final infrastructure milestone.

---

# Era III — Preservation update (2026-06-27)

The final preservation loop. Everything below strengthens truth, memory, verification,
recovery, or longevity — no features, no new pages. Full detail in `PRESERVATION.md`.

## Completed
- **Preservation audit (verified, not assumed):** event ordering contiguous (seq
  1–5728, no gaps); append-only enforced at TWO layers (DB triggers
  `pm_event_no_update`/`no_delete` + sha256 hash chain); chain head published in
  `index.json`. Timestamp note: 2 `machine:seed` events carry explicit historical
  dates, so `ts` is not strictly seq-monotonic — benign, the chain orders by `seq`.
- **Independent verification (Part 2) — shipped & proven:**
  - `scripts/verify-memory-chain.py` (stdlib Python; reads a sqlite DB **or** the
    public NDJSON artifact) — reproduces the published head, detects a single altered
    event, rejects a wrong head.
  - `scripts/export-event-log.py` + git-tracked
    `data/snapshots/projectmemory/events.ndjson` (~3.7 MB) — the **complete ordered
    event log as a public artifact**. Anyone can now verify the entire chain from
    exported artifacts alone, no DB/service. (Part 6 recommendation: clearly positive
    → implemented.)
- **Disaster-recovery drill executed** (from local backups): restore → integrity ok →
  chain re-verifies & matches published head → triggers intact → historical queries
  succeed (pm_event 5,728; governance 113,972 rows back to 2024-09-06). Recovery
  mechanism proven; chain check added to `RECOVERY.md` §5.
- **Final truth audit (Part 8):** fixed 2 overclaims — `about.html` "serves the whole
  ecosystem" → "serves all of it"; `README.md` stale "Pre-launch / no live deployment"
  → "Live and operating" + operator-succession pointers.
- **Longevity audited:** memory is tiny (pm_event 3.4 MB); the only unbounded grower is
  `ohlcv` market data (~96% of cdl.sqlite), mitigated (gzip 6.5×, 92 GB free) and
  documented with future options.

## Verification status ✅
The historical record is independently verifiable by anyone, forever, from public
artifacts using only the Python standard library. Tamper and head-mismatch both
detected. This is a first-class capability, not a claim.

## Recovery status
P1 ✅ · P2 ✅ · P3 🟡 prepared (owner config pending) · P4 ✅ · P4b 🟡 **mechanism proven
from local backups**; literal fresh-VPS run pending Phase 3. The chain now survives even
total infra loss via any git clone (`events.ndjson`), independent of DB backups.

## Security status ⚠️ (unchanged — owner-blocked)
R2 nginx exposure (serves `/data/observatory.db`, `/scripts/`, `/etl/`, `/docs/`) — fix
ready in `nginx-observatory-hardening.md`, needs sudo. Re-confirmed this loop: backups
not web-exposed; `.git` denied. `sudo -n` unavailable to the agent.

## Updated risk register (deltas)
- **R1 (server loss):** downgraded **High → Medium**. The *verifiable canonical chain*
  now survives via git (`events.ndjson`). Full data survivability still needs Phase 3
  offsite (DB backups are local-only). Closes fully at P3 + P4b.
- **R2 (nginx exposure):** unchanged, owner-blocked.
- **R11 (new, Low):** `ohlcv` unbounded growth — watch item, mitigations documented.

---

# Part 10 — Final verdict

**Can the Observatory survive… without losing truth?**

| Threat | Survives? | Basis |
|--------|-----------|-------|
| **Server loss** | 🟡 Mostly | Verifiable chain survives via git (`events.ndjson`); full DB recovery needs Phase 3 offsite (prepared, owner). Recovery mechanism proven. |
| **Maintainer loss** | ✅ Yes | RECOVERY.md + OPERATIONS.md + PRESERVATION.md + README pointers; no tribal knowledge required. |
| **Repository loss** | ✅ Yes | Distributed on GitHub + every clone + local (and, once configured, offsite) backups. |
| **Infrastructure migration** | ✅ Yes | Clean-machine provisioning documented; recovery drill proven; stdlib-only verification. |
| **Ten years of operation** | ✅ Yes | Append-only by design; storage comfortable; only `ohlcv` growth to watch, with mitigations. |

**Exactly what prevents an unqualified "yes":** one owner action — **Phase 3 encrypted
offsite replication** (script prepared & tested). Until the DB backups live off the
machine, a simultaneous loss of server *and* local backups would lose the full DBs
(though the verifiable event chain would still survive via git). Configure offsite +
run one fresh-machine drill (Phase 4b) and the answer becomes an unqualified **yes**.

**The Observatory is preservable.** A future generation can independently verify,
restore, operate, and extend it without its original creators — pending that single
remaining owner step.

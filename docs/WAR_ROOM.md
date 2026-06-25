# War Room — Cardano Knowledge Infrastructure

*Status board for the post-build expansion loop. The platform is no longer in
MVP / observatory / dashboard mode — it is a knowledge infrastructure whose only
remaining bottleneck is reach, not engineering. This file records what the
**evidence** says, what is **already won**, and what is **blocked** — so the
roadmap is selected by evidence, not by brainstorming.*

Companion docs: `WEEKLY_ADOPTION_REPORT.md` (weekly usage verdict),
`ROADMAP_POST_LAUNCH.md` (parked/active items), `OUTREACH_TRACKER.md` (reach),
`FEEDBACK_PIPELINE.md` (where feedback lands).

Last reconciled: 2026-06-23.

---

## The standing verdict (5 consecutive weekly measurements)

- **Project Memory is the flagship.** Projects won weeks 1–5. Not a hypothesis.
  Every decision begins there.
- **Flagships are NOT zero** (Week 5, post-repair): Command Center, Ecosystem Pulse,
  Memory Map, Governance Daily, Project/DRep detail all show real traffic. Earlier
  "zeros" were instrument blindness — see the measurement-repair note below.
- **Internal navigation works** (Week 5 referer evidence): Homepage → flagships →
  detail → history. The "What next?" strip + hub + nav consolidation are doing their job.
- **Categories-as-destination failed** (weeks 1–4, when categories.html was the real
  page) — category data now lives *inside* Search / Memory Map / Projects.
- **The bottleneck is now volume, not discovery and not measurement.** Traffic is
  real but small. The lever is distribution. Engineering is ahead of reach.

Messaging everywhere leads with: **847 projects · 787 enriched · 5,700+ events ·
74 categories — everything sourced, everything traceable.**

---

## Phase status (war-mode 10-phase loop)

| # | Phase | Status | Note |
|---|-------|--------|------|
| 1 | Adoption messaging | ✅ Done | Announcement + outreach lead with Project Memory + the four numbers. |
| 2 | Discovery dominance | ✅ Audited + fixed | Audit below. One true dead-end (category-explorer) closed. |
| 3 | Project Memory clarity | ✅ Improved | `project.html` 30-second identity line + coverage label + status-card fix. |
| 4 | Governance WOW | ✅ Shipped | `governance-daily.html` movement-first redesign (verdict bar + podiums). |
| 5 | Timeline dominance | ✅ Mostly won | Timeline = most-linked page (85 inbound) + in nav + on hub + in WHATNEXT on 7 surfaces. |
| 6 | Command Center / consolidation | ✅ Already consolidated | `state.html` redirects → command-center; index/CC/timeline have distinct roles. No merge needed. |
| 7 | Project intelligence | ✅ Already exists | All 7 factual views live in memory-insights + ecosystem-pulse. Rebuilding = duplication (avoided). |
| 8 | Distribution war | ⛔ Owner-blocked | Templates ready; **actual sending is an owner action.** |
| 9 | Measurement (`usage.md`) | ⛔ Owner-blocked | Needs sudo nginx-log access: `sudo node scripts/analyze-access-logs.mjs --days 7`. |
| 10| Reality loop | 🔁 Gated on #9 | Evidence-driven roadmap; needs weekly usage data to fire. |

**The honest takeaway:** most of war-mode was *already won* by prior loops. The
remaining real engineering surface was small and presentation-only (Phases 2/3).
The decisive remaining work is **reach (8) and measurement (9)** — both owner
actions. Building more product now would be motion without evidence.

---

## Discovery audit (2026-06-23)

Mapped every internal link path across 42 pages. Method: nav structure from
`i18n.js`, homepage hub, and an inbound-link count (grep `href`) per surface.

**Flagship discoverability — all strong except per-entity pages:**

| Surface | In nav | On hub | Inbound | WHATNEXT |
|---|---|---|---|---|
| timeline.html | ✓ Gov | ✓ | **85** | ✓ |
| memory.html | ✓ Disc | – | 50 | ✓ |
| category-explorer.html | ✓ Disc | ✓ | 49 | ✓ *(fixed — was missing)* |
| projects.html | ✓ Disc | ✓ | 48 | ✓ |
| search.html | ✓ Disc | ✓ | 44 | ✓ |
| command-center.html | ✓ Disc | ✓ | 43 | ✓ |
| memory-insights.html | ✓ Disc | ✓ | 43 | ✓ |
| memory-map.html | ✓ Disc | ✓ | 43 | ✓ |
| treasury-timeline.html | ✓ Gov | ✓ | 43 | ✓ |
| ecosystem-pulse.html | ✓ Disc | ✓ | 42 | ✓ |
| **project.html** | ✗ | ✗ | 6 (dynamic) | ✓ |
| **drep.html** | ✗ | ✗ | 3 (dynamic) | ✓ |

**Findings & disposition:**
- `category-explorer.html` was the only flagship missing the injected "What next?"
  strip → **fixed** (added to WHATNEXT: Memory Map / Search / Memory Insights).
- `project.html` / `drep.html` are per-entity pages — they *cannot* sit in global
  nav (no single id). They are reached in 2 hops via Search / Projects / the Top-30
  table, which is correct. Both already carry the "What next?" strip. **Search is
  the front door to project.html and is one click from nav + hub — acceptable.**
- `state.html`, `categories.html` are intentional redirect stubs (canonical-tagged,
  noindex). Not dead-ends.
- No true orphans except entry-only pages (index.html) and `?id=` templates.

**Decision:** discovery is healthy. The remaining lever is *external* reach (Phase 8),
not more internal cross-linking.

---

## Changes shipped this loop (presentation-only, no new data/methodology)

- **`project.html` / `project-page.js`** — populated the previously-empty identity
  line (`kind · categories`); added a labelled "Documentation coverage — N/4
  sourced · events · evidence" summary to the scorecard; hide the Status card when
  there is no real value (no bare "—"); footer now points to the live
  `category-explorer.html` (was the dead `categories.html` redirect) and gains a
  Timeline link. EN/JA parity kept.
- **`governance-daily.html`** — movement-first redesign (verdict bar answers "who
  won?" in <5s; ranked podium cards; honest small empty-states; defaults to the
  populated 7-day window because 1-day weight movement is zero at snapshot
  granularity).
- **`i18n.js`** — `category-explorer.html` added to the WHATNEXT map.

**Not done, on purpose:** no Phase-7 intelligence rebuild (already exists), no
Phase-6 merge (already consolidated), no FLOW-1.5, no new sources/ETL.

---

## Absolute rules (unchanged, enforced)

No FLOW-1.5 implementation · no wallet tracking · no deanonymization · no
clustering · no AI-generated facts · no fabricated relationships · no inferred
provenance. Unknown stays "unknown."

---

## Next moves (in priority order)

1. **Owner:** run `usage.md` (Phase 9) → unlocks the reality loop (Phase 10).
2. **Owner:** send the first-15 outreach (Phase 8), leading with Project Memory.
3. **On evidence:** invest where usage wins, consolidate/merge where it loses.
   No new surface ships without a usage signal or a repeated user request.

---

## Measurement layer repaired — 2026-06-23

**Measurement layer repaired. Prior reports undercounted flagship surfaces due to
candidate-list and truncation limitations.**

Before the fix, the headline scoreboard in `scripts/analyze-access-logs.mjs` was
**partially blind**: Timeline, Ecosystem Pulse, Command Center, Memory Insights,
Memory Map, and Category Explorer were not surfaced. Three defects:

1. **Stale candidate list** — the scoreboard iterated a hardcoded 7-page list that
   predated every post-launch flagship, so those surfaces could never appear.
2. **Top-20 truncation** — the all-pages table silently dropped anything below the
   top 20 (~42 pages exist).
3. **Wrong Categories URL** — it tracked `categories.html` (now a redirect stub),
   not the live `category-explorer.html`. The week-5 "5th zero" was measuring a
   redirect; weeks 1–4 zeros (when categories.html was the real page) remain valid.

**Fix (measurement correctness, not a feature):** explicit `FLAGSHIPS` list printed
by exact path (a 0 is now a *measured* zero, not an omission); full untruncated
page list; referer-based internal-navigation table (Q5: does "What next?" deepen
paths?). Validated end-to-end against a synthetic log.

**Baseline reset:** the instrument changed, so **the next report is a NEW baseline.**
Do **not** compare new flagship counts directly against weeks 1–5 — those were
undercounts for the affected surfaces. Adoption conclusions are updated only from
the repaired report onward.

---

## Omega Loop / Season 2 audit — 2026-06-23

Three fresh audits (comprehension, journey, truth). Confirmed again: the platform is
coherent and most "dominance" phases were already closed in war-mode. Focus went to
genuinely-unverified items. **Clarity/truth/bug-fix only — no new data, methodology,
pages, or scoring.**

**Fixed:**
- **Truth (overclaim):** homepage lede said "a window on the **whole** Cardano
  ecosystem" — contradicted by the site's own seed-set honesty. → "a window **into**
  the Cardano ecosystem … coverage is broad but not exhaustive." (EN + JA, index.html
  + i18n.js).
- **Journey (real bug):** project category tags linked to `categories.html#slug` — a
  redirect that drops the hash, landing nowhere. → `category.html?slug=` (which
  fetches `/category/{slug}`). Fixes the Project→Category hop in the flagship loop.
- **Journey (dead-ends):** added WHATNEXT entries for `project-history.html` (was a
  dead-end at the end of the Project Memory loop; "back to the project" via {id}) plus
  9 previously-isolated surfaces (actions, tokens, governance-health, catalyst,
  rankings, market, ecosystem, memory-heatmap, history).
- **Comprehension:** `projects.html` table headers now carry tooltips, surfacing the
  authority A–E legend (was buried in a footnote) and explaining Source/Evidence/
  History/Kind on hover.

**Deferred backlog (NOT misleading today; greenlight before doing — avoids churn):**
- **Hardcoded counts** ("847 projects", "74 categories") in ~14 HTML/JS strings.
  Currently *accurate* (verified 847/787/74, 73 populated) but will drift. Make
  dynamic from the loaded index/categories JSON when a count next changes.
- Command Center governance panel: a one-line narrative headline (10-second test).
- `project-history.html` empty state: educational callout + a featured example
  instead of "No project selected."
- Visual metrics (coverage bars/chips) carry no inline "as of"/source — methodology
  is linked, so not misleading, but a hover-source would honour provenance-first.

**Verdict unchanged:** product is coherent; the bottleneck is reach/volume, not code.

---

## Memory Engine capability review + durability hardening — 2026-06-24

A "Cardano Memory Engine" capability loop (Time Machine, Project Evolution, Memory
Graph, Research Mode, Ecosystem Memory, Archaeology, Provenance-First) was proposed.
Data-grounded feasibility finding: **the memory engine already exists** — it IS the
event-sourced, append-only, hash-chained log. What it lacks is not capability but
**age**, plus two hard limits under our own no-fabrication rule:

- **Recorded depth (verified):** treasury/epochs → 2024-09-06; DReps/governance →
  2024-09-06 (epoch-boundary backfill in `observatory.db.snapshots`, 113,852 rows /
  140 days, still +60/day); **Project Memory → only 2026-06-03 (~3 weeks)** — no
  archive exists to backfill what projects looked like before then.
- **Time Machine** for 2024/2025 project/governance state = not honestly possible
  (no recorded truth; would require estimates/fabrication — forbidden). Treasury is
  the only deep domain.
- **Memory Graph** cross-domain edges (project↔governance↔treasury) are NOT sourced
  relationships → fabrication → forbidden. Real edges (project↔category↔evidence↔
  history) already render in project.html / memory-map.
- **Research Mode** already exists as `project.html?id=`; **Archaeology** and
  **Provenance-First** are already the architecture; **Ecosystem Memory** is
  buildable but meaningless until years of depth accrue.

**Decision (operator): Hold + harden recording.** Build nothing that would show empty
data today; instead make sure the memory durably accrues. The way to win the century
goal is to keep recording faithfully for years, not to add features.

**Hardening shipped:**
- `scripts/backup-memory.sh` — WAL-safe, integrity-checked, gzip'd, date-stamped,
  rotated (keep 14) backup of BOTH memory DBs into `~/backups/observatory` (OUTSIDE
  the repo). Tested: cdl.sqlite 175M→28M, observatory.db 43M→13M; a restored copy
  passes `integrity_check` and contains the full `pm_event` log.
- cron: daily 21:30 UTC (after the 20:10 ETL).
- **Risk closed:** `cdl.sqlite` (the Project Memory event log) was git-ignored and
  had ZERO backup — one disk failure from total loss of the flagship. Now backed up.

**Still owner-blocked:** the backup is LOCAL (same disk) — protects against
corruption / bad ETL / accidental deletion, NOT disk loss. Offsite replication of
`~/backups/observatory` (rsync/cloud) is an owner action.

### Memory Integrity — phase tracker

| Phase | Status | What it covers |
|-------|--------|----------------|
| 1 — Append-only event log | ✅ | `pm_event` is append-only + hash-chained; nothing overwritten. |
| 2 — Automated local backup | ✅ | `scripts/backup-memory.sh` daily 21:30 UTC, integrity-checked + rotated. |
| 3 — Encrypted offsite replication | ⬜ Owner blocked | Encrypted copy of `~/backups/observatory` off-machine (needs owner credentials). |
| 4 — Automated restore verification | ✅ | `scripts/backup-selftest.sh` restores + `integrity_check`s every run (18 checks), weekly cron. |
| 4b — Full clean-machine disaster recovery | ⬜ Pending Phase 3 | One real provision-restore-boot-verify on a fresh machine per `docs/RECOVERY.md`. |

**Current backup PROTECTS against:** accidental deletion · corruption · bad ETL ·
bad deployment.
**Current backup does NOT protect against:** physical disk failure · VPS loss ·
datacenter loss. This gap is real and explicitly documented, not hidden — it closes
only with Phase 3 (offsite replication).

**Engineering objective:** from *build features* → *guarantee survivability.*

**Memory Integrity is COMPLETE only when:** a clean machine can be provisioned,
backups restored, integrity verified, the application boots, historical queries
succeed, and Project Memory is preserved (Phase 4b on a fresh machine). Phases 1, 2
and 4 are done; 3 and 4b remain owner-blocked. Until 4b passes, durability is partial
by design — resilient against file-level loss, not yet against server loss.

**New engineering phase:** the mission is no longer building capabilities — it is
preserving truth. Protect the memory, the history, the evidence. Everything else waits.

### Recovery engineering — 2026-06-25

Resilience hardening while Phases 3–4 wait on credentials. **No user-facing change.**

**Recovery audit (passed):** WAL healthy (autocheckpoint 1000; cdl-wal ~4M, no
unbounded growth); both source DBs `integrity_check: ok`; retention working
(keep-14); ETL runs clean twice daily; ~92G disk free. One operational finding:
`poller.log` grows unbounded (~65M) — documented in RECOVERY.md §6 with a fix.

**Shipped (all tested):**
- `scripts/backup-selftest.sh` — proves the pipeline: 18 checks (source integrity,
  backup written, gzip valid, **restore integrity**, `pm_event`/`snapshots` row
  counts > 0, rotation exact, missing-source → non-zero). Stamps `last-selftest.txt`.
- `scripts/backup-status.sh` — internal observability → `~/backups/observatory/STATUS.md`
  (last backup, age, size, gzip, restore integrity, retention, disk, last self-test,
  ETL freshness). Exit non-zero if missing/stale/bad. **Internal only, never public.**
- `scripts/backup-memory.sh` — added `BACKUP_SOURCES` test hook.
- `docs/RECOVERY.md` — full operator runbook: single-DB restore, **full clean-machine
  disaster recovery**, the verification checklist (integrity · pm_event history ·
  snapshot depth · app boot · historical queries · project page renders), Phase 3
  offsite procedure, operational reference. Timed, command-complete, no assumptions.
- cron: status daily 21:35; self-test weekly Sun 21:40 (after the 21:30 backup).

**Tracker update:** P4 (restore drill) is now **automated + documented and proven at
the file level** (self-test restores and integrity-checks every run). It is NOT yet
"complete" — that still requires one real **clean-machine** disaster-recovery run,
which depends on Phase 3 offsite first. Both remain owner-blocked.

---

## Completion Sprint — 2026-06-25

Finish the platform by removing engineering weakness, not adding features. Full
results in `docs/COMPLETION_REPORT.md`. Headline: **technically ready to operate for
years**, modulo two owner actions (offsite replication; nginx hardening).

- **Zero-defect audit:** 1 verified defect (stale `ecosystem-map.html` link) → fixed.
  i18n parity 205/205, no broken links/orphans/dead-nav/placeholders.
- **Data integrity:** 2,729 JSON files, **0 parse failures**; 0 dup IDs, 0 missing
  per-project files, 0 bad category refs. Clean.
- **Performance:** no defects; payload optimizations deferred (need ETL/export change,
  no usage evidence of a complaint).
- **Recovery:** re-verified (self-test 18/18, status OK, WAL healthy).
- **Security (Part 6) — verified MEDIUM finding:** nginx serves the whole deployed
  repo — `/data/observatory.db` (raw 43MB DB), `/scripts/`, `/etl/`, `/docs/` are
  publicly fetchable. No secret/CC0 leak, but unintended. Fix written in
  `docs/nginx-observatory-hardening.md`; **owner-blocked (sudo)**. Backups confirmed
  NOT exposed; perms hardened (700/600).
- **Longevity:** brittle items catalogued in the COMPLETION_REPORT risk register
  (R3–R8) rather than churned; `poller.log` unbounded growth **fixed** (weekly cron
  truncate). Hardcoded UI counts stay owner-parked (currently accurate).

**Open risk register top items:** R1 server loss (→ Phase 3/4b, owner) · R2 nginx
exposure (→ owner sudo). Everything else closed or documented.
</content>
</invoke>

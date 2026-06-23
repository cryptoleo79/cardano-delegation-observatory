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
</content>
</invoke>

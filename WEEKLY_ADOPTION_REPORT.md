# Weekly Adoption Report

**Rule:** Usage > opinions. Evidence > assumptions. Users > features. Every number in
this report comes from `scripts/analyze-access-logs.mjs` (traffic/API) or from logged
feedback (`docs/FEEDBACK_LOG.md` / `OUTREACH_TRACKER.md`). **No section is filled by
guessing.** If the evidence isn't in yet, the section says so.

**Cadence:** one entry per week. Copy the template block below, date it, fill only what
the evidence supports. Keep prior weeks for trend.

**Inputs that fill this report:**
- **Traffic / pages / API** ← `sudo node scripts/analyze-access-logs.mjs --days 7 --out /tmp/usage.md`
- **Feedback themes / repeated requests / blockers** ← `OUTREACH_TRACKER.md` §2–4 + `docs/FEEDBACK_LOG.md`

---

## Current status: WEEK 1 RECORDED — first usage evidence in

First `usage.md` exists. Page-traffic tiers and strongest API routes are from that
report (relayed). Navigation/inbound-link figures are from a read-only code link-graph
trace (`grep` over `web/*.html`) run to answer "find the path." No feedback logged yet
(no outreach replies received). Nothing here is assumed.

---

## Week 1 · first usage report (7-day window ending 2026-06-20)

### 1. Traffic
- Page-traffic **tiers** (from usage.md): Winner **Projects** · Strong **Rankings, Catalyst** · Weak **Changes, Memory, Treasury** · Loser **Categories (0)**.
- Raw request counts not transcribed here (only the digested verdict was relayed); the next run can paste the full `analyze-access-logs.mjs` table for exact numbers + trend.
- _Navigation evidence (code trace): inbound-link counts per page below — these explain the tiers._

### 2. Most used pages (winners)
| Page | Tier | In nav? | Inbound links (sitewide) | Why it wins (evidence) |
|------|------|---------|--------------------------|-------------------------|
| Projects | WINNER | yes (pos 4) | **36 (most-linked page)** | Reachable by the most paths: nav + highest inbound + funneled by memory/ecosystem/about + new Builders Fund onboarding. `/projects` also a strong API route. |
| Catalyst | strong | yes | 31 | Nav + well-linked. |
| Rankings | strong | yes | 29 | Nav + well-linked. |

_Winner confirmed by structure, not opinion: Projects is the single most-linked page on the site **and** in nav. The moat (Project Memory) is what people reach for._

### 3. Least used pages (losers — diagnose, don't delete)
| Page | Hits | Why | Action |
|------|-----:|-----|--------|
| **Categories** | **0** | **Discoverability, not value.** NOT in main nav; only **2** inbound links sitewide (`project.html`, `ecosystem-map.html`); 0 links from the homepage → structurally unreachable. | **Candidate fix: add Categories to main nav** (see Decisions). Do not deprecate. |
| Changes / Memory / Treasury | weak (not zero) | NOT discoverability — all three are in nav and well-linked (29/32/31 inbound) yet under-chosen. "Findable but less compelling." | Watch only. No nav action. Needs a *reaction* signal (confusion/praise) before any change. |

_Obj 4 gate satisfied for Categories: the **why** is evidenced (orphaned from nav + homepage), and the API contradiction (§4) proves demand is real._

### 4. API usage
| Signal | Evidence |
|--------|----------|
| Strongest routes | `/categories` · `/tokens/top` · `/treasury` · `/actions` · `/funds` · `/projects` |
| **Most-used API route** | **`/categories`** |
| **Least-used API route** | **Not provided** in this evidence drop — needs the full route table from `usage.md`. Not guessed. |
| Page-vs-data gaps (key insight) | `/categories` is the **#1 route** while the categories *page* = **0 traffic** → data wanted, page unreachable. `/treasury` strong while treasury *page* weak → same pattern, milder. `/projects` strong **and** page is the winner → aligned; the moat is working. |
| Caller diversity | Not relayed (distinct-/24 per route) — include it next run; one subnet = us, many = real adoption. |

### 5. Feedback themes
- bug: **0** · confusion: **0** · missing data: **0** · missing feature: **0** · praise: **0** · repeated request: **0**
- _No outreach replies received yet. First-15 outreach not started. Nothing to classify._

### 6. Repeated requests
- _None yet (≥2× promotes here). Nothing authorizes new feature build under STEP 4B._

### 7. Adoption blockers
- **Categories is unreachable by normal navigation** (not in nav, 2 inbound, 0 from homepage) despite being the most-requested API resource. This is the one concrete, evidenced blocker this week.
- All other findings are observations, not blockers.

### Decisions this week
- **Build authorized? APPLIED 2026-06-20** under **STEP 4A (real usage proves demand)**: `/categories` is the #1 API route → demand proven; the page had no nav path. Fix = one discoverability change: `Categories` added to the canonical nav across all 29 pages (immediately after Ecosystem; `categories.html` self-highlights). No redesign, no restructure, no features.
  - **A/B baseline for the 7-day measurement:** Categories page **before = 0 traffic** (this week). **Re-measure on/after 2026-06-27** via `analyze-access-logs.mjs`. **Success = Categories page no longer zero.** This is the first closed-loop evidence-driven change: shipped because the data demanded it, and verified by the data after.
- **Fixes (bugs / data correctness):** none pending.
- **Outreach next:** First-15 still not started — DReps → Builders → Developers (`OUTREACH_TRACKER.md`).

---

## Week of ____ → ____  _(template — copy this block per week)_

### 1. Traffic
- Total human requests (bots excluded): **—**
- Range / files parsed: **—**
- Δ vs last week: **—**
- _Source: usage.md. Awaiting first run._

### 2. Most used pages (winners)
| Page | Hits | Signal | Confirmed by reactions? |
|------|-----:|--------|--------------------------|
| _awaiting usage.md_ | | | |

_A winner = high traffic AND positive/zero confusion reactions. Don't crown on traffic alone._

### 3. Least used pages (losers — diagnose, don't delete)
| Page | Hits | Why (archival / discoverability / value / confusing) | Action |
|------|-----:|------------------------------------------------------|--------|
| _awaiting usage.md_ | | | |

_Obj 4 gate: record the *why* before any fix. Quiet-by-design ≠ loser._

### 4. API usage
| Route | Calls | Err % | Distinct /24 | Read |
|-------|------:|------:|-------------:|------|
| _awaiting usage.md_ | | | | |

_Many subnets repeatedly = real external adoption. One subnet = probably us._

### 5. Feedback themes
Categorized counts this week (from the FEEDBACK_PIPELINE taxonomy):
- bug: **—** · confusion: **—** · missing data: **—** · missing feature: **—** · praise: **—** · repeated request: **—**
- Notable verbatim: _none logged yet._

### 6. Repeated requests
| Request | Times asked | Tiers asking | Status |
|---------|------------:|--------------|--------|
| _none yet (≥2× promotes here)_ | | | |

_This table is the only thing that authorizes new build work (STEP 4B)._

### 7. Adoption blockers
What actually stopped someone from using it (from replies / API-validation Q3 /
Builders-Fund-validation answers):
- _none identified yet._

### Decisions this week
- Build authorized? **No** unless a §6 repeated request or §4 real-usage demand exists.
- Fixes (bugs / data correctness): _none pending._
- Outreach next: _per OUTREACH_TRACKER First-15 priority (DReps → Builders → Developers)._

---

_End of current weeks. New weeks are appended above this line in reverse-chronological
order as evidence arrives._

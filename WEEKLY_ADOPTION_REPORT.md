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

## Current status: AWAITING FIRST DATA

No `usage.md` has been produced yet, and no feedback has been logged. Per STEP 1, this
report stays empty until usage decides. Nothing below is assumed.

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

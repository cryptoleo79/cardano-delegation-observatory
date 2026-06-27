# Authority Report — Cardano Observatory

*The authority sprint: make the Observatory publication-grade — the source researchers,
builders, SPOs, DReps, and journalists can confidently cite. Not feature growth;
citability, verifiability, reproducibility, and neutral tone. Dated 2026-06-27.*

Every change below improves one of: verifiability · citability · reproducibility ·
authority · durability. No fabricated data, no AI-generated facts, no methodology
expansion.

---

## Improvements shipped

### Citation readiness (WS1) — the headline gap, now closed site-wide
**Finding:** claim-level provenance was strong (project.html, governance-daily.html are
exemplary), but **8 flagship pages showed no visible as-of date** and there was **no
citation affordance anywhere** — a researcher couldn't pin a citation to a moment
without inspecting the network tab.

**Fix:** a DRY **"Cite this page"** affordance injected into every page's footer by
`i18n.js` (`citeInit`). One implementation, ~42 pages. It produces a copy-pasteable
citation:

> *{Page title}. {canonical URL}. CC0. Data snapshot {data_through} (epoch {tip_epoch}).
> Retrieved {access date}.*

The snapshot date + epoch come from the existing `data/snapshots/meta.json` (the daily
on-chain ETL), the access date is filled client-side, and it links to `verify.html` for
reproducibility. Bilingual (EN/JA). Closes the page-level as-of gap everywhere at once
without per-page churn or any new data.

### Verification experience (WS3) — honest scope
Added a **"What this proves — and what it doesn't"** section to `verify.html`. It states
plainly that the check proves the event log is internally consistent and unaltered (and
matches the published head), but does **not** prove a recorded claim is true in the
outside world — only that it was recorded with its stated source at its stated time. It
also scopes the chain to Project Memory and points governance/treasury figures to their
own provenance + methodology. Intellectual honesty is itself an authority signal.

### Public trust / tone (WS5) — de-marketing
Two verified residual overclaims fixed in `category-explorer.html` (EN + JA):
- "see the **whole ecosystem** at a glance" → "see the **shape of the** ecosystem at a
  glance" (coverage is broad but not exhaustive — the site's stated principle).
- "Sort: **best** coverage" → "Sort: **coverage %**" (a measurement, not a judgment).

A full tone scan found the site otherwise appropriately archival; `memory-insights`
"most documented" etc. are factual sorts (explicitly labelled as such), not marketing —
left as-is.

### Quality (WS4) — re-audited, clean
Re-ran broken-link, stale-reference, terminology, accessibility, mobile, and EN/JA
parity audits across all pages incl. the new `verify.html`. **0 verified defects.** No
regressions from the verify.html / events.ndjson additions.

---

## Research exports (WS2) — already sufficient; no duplication added
Per the "no duplicate data" rule, no new exports were created — the existing set already
serves researchers, now documented as a catalogue:

| Export | What | Stable? |
|--------|------|---------|
| `data/snapshots/projectmemory/events.ndjson` | The complete ordered, hash-chained event log (the canonical memory) | Versioned by content; verifiable |
| `data/snapshots/projectmemory/index.json` | Per-project memory index + `meta.chain_head` | Stable schema |
| `data/snapshots/projectmemory/categories.json` | Category membership + coverage | Stable schema |
| `data/snapshots/*.json` | Governance / treasury / changes / epoch snapshots | Daily, dated via `meta.json` |
| `api.asy.life` (~37 routes) | All of the above as read-only JSON, `_quality` block on each | Documented at `/docs`, `/openapi.json` |

---

## Long-term operation (WS6)
No new automation added (the rule: automate only where operational evidence justifies).
Current state is low-burden — see `OPERATIONS.md`. One **manual** step remains by design:
`events.ndjson` is regenerated via `scripts/export-event-log.py` when the memory export
is refreshed (then verified against `chain_head` and committed). This is intentional —
the canonical artifact should be reviewed/committed deliberately, not auto-pushed.

---

## Final authority review (WS7)

| Question | Answer |
|----------|--------|
| Can a researcher confidently **cite** a page? | **Yes** — every page now yields a dated, licensed, permalinked citation; data pages pin to a snapshot + epoch. |
| Can a builder confidently **reference** the data? | **Yes** — keyless CC0 API + stable JSON exports, `_quality` provenance on each response. |
| Can another engineer **reproduce** a result? | **Yes** — the full event log is public and independently verifiable with stdlib Python (`verify.html`); governance/treasury methodology is published. |
| Does it **read like an archive, not a product**? | **Yes** — tone scan clean after the two fixes; honest scoping throughout. |

---

## Unresolved — owner-blocked (unchanged this sprint)
1. **Phase 3 offsite replication** — configure `scripts/backup-offsite.sh` (key +
   transport + cron). Prepared & tested; the last step for full server-loss survivability.
2. **Phase 4b** — one fresh-machine disaster-recovery drill (after #1).
3. **nginx hardening** — apply `docs/nginx-observatory-hardening.md` (sudo).
4. **Alert destination** — set `monitor/alert.env` so heartbeat failures reach a human.

## Remaining operational risks
- **R1 (server loss): Medium** — verifiable chain survives via git (`events.ndjson`);
  full DB recovery needs Phase 3. Recovery mechanism proven.
- **R2 (nginx exposure): Medium** — repo-internal files served; fix ready, owner-blocked.
  No secret/CC0 leak.
- **R11 (ohlcv growth): Low** — only unbounded grower; mitigated + documented.

## Recommendation for continued operation
The Observatory is **publication-grade**: citable, verifiable, reproducible, and
archival in tone. Recommended posture: **return to observation mode.** Engineering
resumes only on a real trigger (operational reliability · verified security · usage
evidence · repeated independent user demand · a Cardano change). The four owner-blocked
items are the only path to an unqualified "survives everything" — none require further
implementation, only credentials/sudo. Authority now grows mainly through *use and
citation*, not code.

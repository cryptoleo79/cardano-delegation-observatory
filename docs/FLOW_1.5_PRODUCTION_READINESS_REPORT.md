# FLOW-1.5 — Production Readiness Report

**Status:** research / evaluation only. **No implementation, no ETL, no UI, no schema.**
**Date:** 2026-06-22. Companions: `FLOW_1.5_MIGRATION_METHODOLOGY.md` (draft §19),
`DREP_MIGRATION_MATRIX.md`. This report answers one question:

> **Can a production Migration Observatory publish `Source DRep → Destination DRep ·
> aggregate ADA moved · mover count` without breaking the observatory's privacy
> commitments — and is it useful enough to be a flagship?**

Verdict in one line: **principles-safe is achievable, but it requires a new data
pipeline + a methodology ratification, and the whale-heavy reality means the most-asked-
for flows are exactly the ones suppression must hide.** Conditional yes — detailed below.

---

## 1. What is already public vs. what FLOW-1.5 actually adds

A critical distinction, because half of the value proposition is **already shipped and
safe**:

| Capability | Status | Privacy |
|---|---|---|
| Per-DRep **net** change ("A lost 500M, B gained 300M") | **Already public** (`flows.html`, `changes.json`, Governance Daily) | Safe — aggregate net, no attribution |
| **Edges** ("A's 500M went *to* B (+300M) and C (+150M)") | **This is FLOW-1.5** | Sensitive — requires per-credential transition tracking |

The net deltas cannot tell you *where* a DRep's lost weight went — B's +300M could come
from A, from new delegation, or from C. **Attribution edges are the new capability**, and
attribution is the entire privacy question. Everything below is about the edges.

---

## 2. Data reality check (the binding constraint)

**The current pipeline cannot produce migration edges at all.** Two facts from the live
data (2026-06-22):

- `changes.json` `delegator_delta` is **null across the 7d / 30d / 90d windows** — the
  observatory does not even track reliable per-DRep *delegator* deltas today, let alone
  per-credential *transitions*.
- Migration edges require, per stake credential, the change of vote-delegation between two
  epoch boundaries (T1→T2). That data lives only in **db-sync vote-delegation
  certificates** — a source the observatory does **not** currently ingest.

So FLOW-1.5 is **not** "turn on a view over existing data." It is a **new ingestion +
processing pipeline** over the per-credential certificate stream. That stream is precisely
the layer the never-list and §18.3 currently forbid processing. This is the central cost
and the central risk.

---

## 3. The privacy model — can the principles hold?

**Yes, if and only if** processing is *internal and ephemeral* and *only aggregates are
ever persisted or published.* The model (from draft §19):

1. Read per-credential T1→T2 transitions **in memory only**, to compute, for each
   `(source node, destination node, window)` cell: `{ aggregate_ada, mover_count }`.
2. **Never persist or publish any per-credential value** — not the credential, not its
   amount, not its (source,dest) pair.
3. Publish a cell **only if** it passes **k-anonymity** (≥ k distinct movers) **and** a
   **dominance** test (no single mover is too large a share of the cell's ADA).
4. Movements to/from outside the top-N fold into pseudo-nodes `New delegation` /
   `Undelegated` so the matrix balances without attributing between un-tracked DReps.

Mapped against the requirements:

| Requirement | Held? | How |
|---|---|---|
| No wallets | ✅ | stake credentials ≠ payment wallets; neither is published |
| No stake credentials | ✅ | credentials used in memory only, never emitted |
| No clustering | ✅ | no linkage across credentials or addresses |
| No deanonymization | ✅ | published cells are k-anonymous aggregates |
| No identity inference | ✅ | no names, no motive, no actor attribution |

**The principles can be preserved** — but only under strict discipline, because the raw
input *is* the forbidden layer. A single leak (an un-suppressed thin cell, a logged
intermediate) breaks it. This is a "one mistake = broken promise" feature.

---

## 4. Quantitative estimates (modeled on the real distribution)

These are **models**, not measured suppression — the real numbers require an offline
prototype against db-sync (see §7). Grounded in the live top-30 distribution:

- 30 tracked DReps, **57,509 delegators**; delegator_count **min 10 · median 604 · max
  19,921**; **7 of 30 DReps have < 200 delegators** (one has 10).
- Voting weight: **top-1 = 16.3 %, top-5 = 48.3 %** (whale-heavy).

### 4.1 Coverage
Top-30 captures the large majority of *voting weight* but a small fraction of the
~1,000+ total DReps. So **weight-coverage is high, DRep-count-coverage is low**. Every
migration touching an untracked DRep collapses into a pseudo-node — the matrix shows
"moved to Undelegated/New," not the real destination. **Estimated honest attribution:
strong for top-30 ↔ top-30 flows, lossy everywhere else.**

### 4.2 Suppression rate (k-anonymity)
Possible directed cells ≈ 32 nodes × 32 ≈ **~1,000 edges**. Real migrations concentrate
in a handful; the rest are 0–few movers. With per-window movement small (today's
delegator deltas round to ~0; realistic quarterly churn ≈ 1–3 % → ~575–1,700 movers
spread across all edges), **most cells fall below any reasonable k.** Modeled suppression:

| k (min movers) | Window | Est. cells surviving | Est. suppression |
|---|---|---|---|
| 5 | weekly | ~0–5 | ~99 % |
| 20 | weekly | ~0 | ~100 % |
| 20 | quarterly (90d) | ~5–15 (largest flows) | **~85–95 %** |

**Weekly/daily matrices are effectively fully suppressed.** Only long windows
(≥30–90d) yield publishable cells, and only for the biggest DRep-pairs.

### 4.3 Dominance-rule impact (the killer caveat)
With one DRep at 16.3 % and a long whale tail among delegators, the **largest single ADA
movements are individually re-identifiable by amount.** A cell of "5 movers, 480M ADA"
where one mover is 450M fingerprints that whale even at k=5. The dominance rule (suppress
if any single mover > ~⅓ of cell ADA) therefore **suppresses exactly the dramatic
whale-moved-X flows users ask about.** What survives dominance: cells made of *many
comparable small movers*.

### 4.4 Practical usefulness
Net of k-anonymity + dominance + viable window:
- **Survives:** broad, diffuse migrations — many small delegators shifting between two
  *large* DReps over a quarter. ("Sentiment" flows.)
- **Suppressed:** whale moves, thin-DRep flows, recent/weekly movement, long-tail
  destinations.
- So the feature answers *"is delegation broadly drifting from A toward B?"* — **not**
  *"where did that 500M whale go?"* The privacy-safe output is the **less sensational
  one**, which is the opposite of the demand that reopened this ("where did it go?").

---

## 5. The prototype output, assessed

```
A lost 500M → B +300M → C +150M → Abstain +50M
```

Publishable **only if** each edge cell independently passes k-anonymity *and* dominance:
- If A→B's 300M is **50 small movers** → publishable.
- If A→B's 300M is **one whale** → **suppressed** (re-identifiable), and the row becomes
  `A → B: withheld (below privacy threshold)`.
- The "A lost 500M" headline is *already* publishable (net); the **→B / →C attribution**
  is the part gated by suppression.

So the methodology supports the output **shape**, but in the current whale-heavy reality
many real rows would render as partially-withheld. Honest, but visibly incomplete.

---

## 6. Verdict — flagship without breaking principles?

**Conditional yes**, with three hard conditions and one expectations caveat:

1. **Methodology ratification (gating).** Publishing edges requires reversing §18.3's "no
   per-delegator processing of any kind" → "internal-ephemeral per-credential processing,
   aggregates only." This is a methodology *change*, logged in §11 **before** any code,
   with an explicit owner decision. Not a config flag — a governance act.
2. **New pipeline (cost).** A db-sync vote-delegation-certificate ingest + in-memory
   transition computation + k-anon/dominance suppression. This is the real build, and it
   handles the most sensitive data the observatory has ever touched.
3. **Conservative parameters (safety).** Recommend evaluating **k ≥ 20 distinct movers**,
   **dominance ≤ 33 % single-mover share**, **window ≥ 30d** (quarterly default),
   top-N ↔ top-N only with pseudo-node folding. Tune *down* coverage before *up*.
4. **Expectation caveat (honesty).** It will **not** deliver the whale-tracking the demand
   implies; it delivers diffuse-flow observability. Marketing it as "see where the money
   moved" would over-promise and pressure the suppression rules — the exact failure mode.

**It can be a flagship without breaking the principles — but only as an honest "broad
delegation drift" instrument, not a whale tracker, and only after a ratified methodology
change and a purpose-built, audited pipeline.**

---

## 7. Recommended next step (research, not build)

Before any production commitment: **an offline prototype against db-sync, never published**,
to replace §4's *models* with *measured* suppression — how many cells actually survive
k=20 + dominance at 30/90d on real certificate data. That single measurement decides
whether the surviving signal is rich enough to be worth the pipeline and the governance
change. If measured suppression is ~95 %+ with only 3–4 cells surviving, the feature is
not worth its risk; if 20–40 meaningful cells survive quarterly, it is.

Until that measurement exists and the methodology change is ratified, **FLOW-1.5 remains
HOLD** — now with a costed, quantified path rather than an open question.

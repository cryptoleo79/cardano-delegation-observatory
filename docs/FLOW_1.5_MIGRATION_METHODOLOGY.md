# FLOW-1.5 — DRep Migration Methodology (DRAFT)

**Status:** DRAFT · research only · **not ratified, not implemented.** No ETL, no
UI, no schema. This section, if adopted, would be added to METHODOLOGY.md as §19
(Migration) and would *conditionally supersede* the blanket prohibition in §18.3.
Nothing in FLOW-1.5 ships until it is ratified and an explicit owner decision
permits internal, ephemeral per-credential processing. Companion evaluation:
`DREP_MIGRATION_MATRIX.md`.

## 19.0 Purpose
Answer one question: **can a Source-DRep → Destination-DRep migration matrix exist
while preserving every privacy commitment the observatory has made?** The
commitment is preserved not by refusing to compute movement, but by guaranteeing
that **what is stored and published is always an aggregate that cannot be reduced
to an individual.**

## 19.1 Relationship to §18 (and what changes)
§18.3 states net movement is *not* migration and that migration "would require
per-delegator event tracking… documented in its own methodology section before any
'A → B' claim appears." FLOW-1.5 is that section. It changes exactly one thing:

> From: *no per-delegator processing of any kind.*
> To: *per-delegator processing is permitted **internally and ephemerally** for the
> sole purpose of producing k-anonymized aggregate transition cells; no
> per-credential value is ever persisted, exported, or displayed.*

Everything else in §18 (net-only on the flows page, no inference of motive) stands.

## 19.2 Definitions
- **Governance choice (node):** an individual DRep in scope (top-N by methodology),
  plus the two protocol pools `Abstain` and `No Confidence`, plus two pseudo-nodes:
  `New delegation` (source = a credential that had no prior DRep delegation) and
  `Undelegated` (destination = a credential that ceased delegating). Pseudo-nodes
  keep the matrix balanced so movement is not falsely attributed between active DReps.
- **Transition:** for one stake credential, an observed change of governance choice
  between two epoch boundaries T1 → T2, derived from on-chain vote-delegation
  certificates (authority class A, on-chain). Amount = the credential's voting power
  (lovelace) at the transition.
- **Cell:** the aggregate of all transitions sharing the same (source node,
  destination node, window): `{ aggregate_ada, mover_count }`.
- **Window:** the interval between two epoch snapshots (per-epoch granularity, as in
  the rest of the observatory). Per-epoch, never sub-epoch, never per-transaction.

## 19.3 What is computed (internal, ephemeral)
1. For each in-scope window, read each credential's governance choice at T1 and T2
   from on-chain certificates.
2. Emit a per-credential transition (source, destination, amount) **in memory only.**
3. Aggregate transitions into cells.
4. Apply disclosure control (§19.5).
5. Persist **only** the cells that pass. Discard all per-credential data.

There is no per-credential table, file, cache, or export at any stage. The
per-credential layer exists solely as transient working state within a single pass.

## 19.4 Output schema (the only things that may be stored or published)
Per passing cell: `source_drep`, `destination_drep` (or pool / pseudo-node),
`window`, `reference_dates`, `aggregate_ada`, `mover_count`. Nothing else.

## 19.5 Disclosure control (mandatory; a cell is published only if ALL pass)
1. **k-anonymity:** `mover_count ≥ k`. Proposed default **k = 20** (to ratify).
2. **Dominance / (n,p) rule:** the single largest mover's ADA must be **≤ p%** of
   `aggregate_ada`. Proposed default **p = 50%** (to ratify). This blocks the case
   where a large cell is effectively one whale plus noise.
3. **Complementary (secondary) suppression:** because row totals, column totals, or
   §18 net deltas could let an attacker recover a suppressed cell by subtraction,
   additional cells are suppressed until **no suppressed value is solvable** from any
   published aggregate. If a row/column would expose a single suppressed cell, that
   row/column's exact total is also withheld (only an "includes withheld cells"
   marker is shown).
4. **Minimum-amount floor (optional, to ratify):** suppress cells below a small
   `aggregate_ada` floor to avoid trivially identifiable micro-flows.

A suppressed cell is shown as "below disclosure threshold," never as zero. A public
counter states how many cells were withheld.

## 19.6 What is forbidden (absolute, no exceptions)
- Publishing or storing **wallets, stake credentials, addresses,** or any per-credential row.
- **Identity linkage** (no off-chain identity, no whale naming, no labeling).
- **Ownership claims** (no "entity X controls these").
- **Clustering** — credentials are counted independently; never grouped by owner,
  balance band, or behavior, even internally.
- **Coordination / intent claims** — the matrix shows *that* voting power moved
  between choices, never *why*, never that movers acted together.
- Sub-epoch or per-transaction granularity; real-time mover tracking.

## 19.7 Edge cases (observed, not interpreted)
- **Stake-key rotation / wallet restore:** appears as one credential leaving and
  another arriving; counts as `Undelegated` + `New delegation`, never as a same-person
  A→B. The observatory cannot and does not assert sameness (cf. §18.8).
- **Custodial / exchange movements:** counted as transitions like any other; never
  attributed to a custodian or coordinated actor.
- **Dominant single mover:** handled by the dominance rule (§19.5.2) → suppressed.
- **Net ≠ sum of published flows:** suppression means published bilateral flows will
  not reconcile to §18 net deltas. This is stated explicitly wherever both appear;
  it is a privacy feature, not an error.
- **Sparse early history:** windows resolve to the nearest epoch snapshot (as in the
  change feed); per-epoch granularity is honest, not synthetic.

## 19.8 Honesty & limitations (must be displayed)
- "Movement between governance **choices** — aggregate and k-anonymized. **Not**
  individual users, **not** coordination, **not** intent."
- Disclosure thresholds (k, p) are published so the suppression is auditable.
- The matrix is a count of voting-power transitions between snapshots, at per-epoch
  granularity — not a continuous or per-person record.

## 19.9 Governance gate (ratification conditions)
Before any ETL/UI is built, ALL must hold:
1. This section is reviewed and ratified into METHODOLOGY.md (with final k, p, and
   secondary-suppression policy chosen).
2. An explicit owner decision records the §18.3 → §19 policy change (internal,
   ephemeral per-credential processing permitted; aggregate-only outputs).
3. A test plan demonstrates: no per-credential artifact is persisted; suppressed
   cells are unrecoverable from published totals; k and dominance hold on real data.

## 19.10 Conclusion
**The migration matrix can exist while preserving the observatory's privacy
commitments — conditionally.** Privacy is preserved by *what is stored and
published* (always a suppression-passing aggregate, never a credential) combined
with *ephemeral* internal computation. If, in implementation, the suppression
cannot be guaranteed sound or per-credential data cannot be guaranteed ephemeral,
then FLOW-1.5 must **not** ship and the §18.3 prohibition stands. The privacy line
is non-negotiable; the feature is optional.

## 19.11 Open parameters (to decide at ratification)
`k` (proposed 20) · dominance `p` (proposed 50%) · minimum-amount floor (optional) ·
secondary-suppression strictness · whether to launch with special-pool transitions
only (safest first slice) or the full top-N matrix · refresh cadence (per-epoch).

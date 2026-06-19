# DREP_MIGRATION_MATRIX — feasibility & safety evaluation

*Research evaluation. No implementation. The companion methodology draft is
`docs/FLOW_1.5_MIGRATION_METHODOLOGY.md`. Building anything is gated on that
section being ratified into METHODOLOGY.md and an explicit owner decision.*

## The question
Can the observatory publish **Source DRep → Destination DRep → aggregate ADA
moved** (and a mover count) **without** wallet identifiers, stake credentials,
clustering, deanonymization, or identity inference?

## Verdict
**Conditional yes.** The *published output* can be made privacy-safe with
statistical disclosure control (k-anonymity + dominance suppression). But the
matrix is **not obtainable without processing per-stake-credential before/after
delegations inside the ETL** — the exact layer the current methodology (§18.3 and
the exclusions list) and the project's hard never-list forbid. So this is a
**methodology decision, not a drop-in feature**: it requires a new section
(FLOW-1.5) that defines per-credential processing as *internal and ephemeral
only*, with aggregate-only, suppression-gated outputs.

## 1. Technical feasibility
- Net per-DRep deltas already exist — but they are **not** A→B. §18.3 is explicit:
  +100M at A and −100M at B is **not** evidence that A→B.
- A true A→B value requires, per stake credential, its DRep at T1 vs T2, summed by
  (source, destination). The *source* is the credential's prior delegation, so each
  credential's delegation history must be tracked.
- Raw material exists on-chain (vote-delegation certificates; per-account
  delegation/update history). **There is no aggregate transition primitive** — it
  must be derived from per-credential events.
- → Feasible, but only via a **new per-delegator-event ETL** (per-epoch). Moderate cost.

## 2. Privacy implications
- Output `A→B = Z ADA over N movers` is aggregate and safe **iff cells are large**.
  Small cells deanonymize (N=1 ⇒ Z = that wallet's stake); a dominant mover leaks
  the residual; and naïve suppression can be reversed from published totals.
- Required disclosure control (detailed in FLOW-1.5):
  - **k-anonymity** — suppress any cell with fewer than *k* movers.
  - **dominance rule** — suppress if the largest single mover exceeds *p%* of the cell.
  - **complementary suppression** — suppress enough additional cells so a suppressed
    value can't be recovered by subtracting from any published row/column total.
  - **aggregate-only / ephemeral** — per-credential transitions live only in memory
    during one ETL pass; only suppression-passing aggregate cells are ever persisted
    or published. No credential is stored or exported, ever.
- Tension: even with perfect output safety, the *intermediate computation* touches
  stake-credential-level data — currently forbidden outright. FLOW-1.5 exists to
  decide whether that internal, ephemeral processing is acceptable.

## 3. Methodology compatibility
- **Incompatible as written.** §18.3: migration "would require per-delegator event
  tracking… documented in its own methodology section **before any 'A → B' claim
  appears anywhere**." The exclusions list bars wallet-level data, clustering, and
  deanonymization.
- The methodology itself prescribes the path: ratify FLOW-1.5 first, and make the
  conscious policy shift from *"no per-delegator processing at all"* →
  *"per-delegator processing permitted **internally and ephemerally** iff every
  published value is a k-anonymized, dominance-checked, complement-suppressed
  aggregate — never per-credential."*

## 4. UI possibilities (only if ratified)
- **Sankey / chord** among top DReps + the two special pools; only suppression-passing
  cells rendered.
- **A→Abstain / A→No-Confidence** highlighted (movement toward non-participation /
  dissent) — highest signal, safest slice.
- **Matrix heatmap** (rows = source, cols = destination) with suppressed cells blanked,
  a "below disclosure threshold" legend, and an "N cells withheld for privacy" counter.
- Mandatory framing on every surface: *"Movement between governance choices —
  aggregate, k-anonymized. Not individual users. Not coordination. Not intent."*

## Recommendation
1. Valuable and safely *publishable* — but **build nothing** until FLOW-1.5 is ratified
   into METHODOLOGY.md with explicit *k* / dominance / secondary-suppression thresholds
   and an owner decision permitting internal, ephemeral per-credential processing.
2. **Lowest-risk first slice:** special-pool transitions only (to/from Abstain &
   No-Confidence) at high *k* — or hold the absolute "no per-delegator processing"
   line and shelve it (a fully defensible choice).

## Answer to the core question
*Can the migration matrix exist while preserving the observatory's privacy
commitments?* — **Yes, conditionally**, and only if the disclosure-control discipline
in FLOW-1.5 is enforced without exception. The privacy commitment is preserved by
**what is published and stored (aggregate, suppressed, never per-credential)**, not by
refusing to compute — provided the internal computation is ephemeral and the
suppression is sound. If that discipline cannot be guaranteed, the answer is **no**.

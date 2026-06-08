# DRep Delegation Flow — Observability Methodology

**Status:** research + methodology specification (no code, no pages).
**Date:** 2026-06-08.
**Author scope:** answers one question honestly — *can DRep delegation FLOW be derived between snapshots?* — and defines the methodology for the part that **is** derivable, while drawing a hard line at the part that is not.
**Relationship to existing methodology:** this document is a research companion to `METHODOLOGY.md`. It does not amend it. Nothing here ships until the relevant `METHODOLOGY.md` section is updated first, per the project's standing discipline (`METHODOLOGY.md §2`, §11). The aggregate flow part formalized here is already substantially covered by `METHODOLOGY.md §18` (FLOW-1); this document extends §18's reasoning to the proposed flow pages and exports and resolves the migration question explicitly.

---

## 0. The two rules that govern this entire document (state them first)

Everything below is constrained by two rules simultaneously. They are the crux; where they conflict with a proposed feature, the feature loses.

**RULE 1 — Observe movement; do not infer motive, coordination, or intent.**
The observatory measures *what changed* between two snapshots. It never claims *why*, never asserts that two movements are the *same* delegators, and never reads coordination or intent into co-occurring movement. This is the load-bearing boundary of `METHODOLOGY.md §18.3` and §18.8: "Net movement is not migration. Even when the magnitudes match exactly, this is not evidence of migration."

**RULE 2 — Respect the existing never-list.**
From `METHODOLOGY.md §2` and §7, the following are hard, permanent "never" commitments:

- top-30 DReps by design (`§1`, `§5`) — the observatory's evidentiary scope is DRep-level aggregates only;
- **no wallet-level information about delegators** (`§2`: "no whale identification, no clustering, no deanonymization, no inference of identity"; `§7`: "Delegator wallet addresses, balances, or any per-delegator detail");
- **no inferred relationships** between DReps, between delegators, or between DReps and delegators (`§7`);
- **no inferred motivations** for any delegation movement (`§7`).

These two rules together decide the central question. Aggregate flow survives both. Source→destination migration is killed by at least one of them no matter how it is approached — which is the honest finding of this document.

---

## 1. The central question

> Can we go from **old delegation state → new delegation state** between two snapshots?

This splits into two genuinely different questions that are often conflated, and the whole point of this document is to keep them apart:

- **(A) Per-DRep AGGREGATE flow** — for a single DRep, how much voting weight / how many delegators did it gain or lose versus a prior snapshot. ("DRep X is +120M ADA over 7 days.")
- **(B) Source→Destination MIGRATION** — a directed claim that delegation *moved from* DRep X *to* DRep Y. ("80M ADA moved from X to Y.")

(A) is a property of one DRep across time. (B) is a property of a *pair* of DReps plus an implicit claim about the *identity of the movers*. That difference is the entire answer.

---

## 2. Feasibility verdict

### (A) Per-DRep aggregate flow — **DERIVABLE. Safe. Already partly shipped.**

**Verdict: YES**, derivable purely from snapshot diffs, with **no wallet-level data of any kind.**

Each daily snapshot already records, per DRep, two aggregate quantities that are sufficient:

- `voting_weight_lovelace` — the `amount` field from Koios `drep_info` (a single aggregate number per DRep; verified present in `data/snapshots/top30.json`).
- `delegator_count` — a single integer per DRep, obtained from the **Content-Range header** of Koios `drep_delegators` (`METHODOLOGY.md §3`, §18.1). The observatory reads the *count*, not the list. No stake credential is stored.

Aggregate flow is then a subtraction between two snapshots of these two numbers. It touches no per-delegator record, performs no clustering, and identifies no wallet. It passes RULE 1 (it states only the net delta, asserts no cause) and RULE 2 (no wallet data, no inferred relationship). This is exactly `METHODOLOGY.md §18`, and the data shape already exists: `data/snapshots/dreps/<id>.json` carries `recent_net_change` (d1d/d7d/d30d) and a `daily_flow` time series of `voting_weight_delta_lovelace` + `delegator_count_delta` per interval (verified in the live export).

### (B) Source→Destination migration — **NOT DERIVABLE within the project's rules.**

**Verdict: BLOCKED.** It fails on *both* counts independently, so there is no clever path around it:

1. **From snapshot diffs alone, X→Y migration is INFERENCE, not observation.** Net snapshot diffs give one number per DRep. To turn "X is −80M" and "Y is +80M" into "80M moved from X to Y" you must *match* X's loss to Y's gain and *assume the same delegators did both*. That assumption is precisely the motive/identity inference RULE 1 forbids, and `METHODOLOGY.md §18.3` rejects it by name: "Even when the magnitudes match exactly, this is not evidence of migration." It is also not even arithmetically sound — in any interval many DReps move simultaneously, and a −80M / +80M pairing is one of combinatorially many decompositions, none observed.

2. **To do it *honestly* (i.e. as observation rather than inference) requires wallet-level re-delegation tracking — which RULE 2 forbids.** The only way to truthfully say "this delegation moved from X to Y" is to follow individual stake credentials across snapshots: read `drep_delegators` as a *list* for X and Y (not just the count), or pull each account's delegation history (Koios account/`drep` delegation history), and observe the same credential leave X and arrive at Y. That is per-delegator detail and cross-DRep linkage of a delegator — banned outright by `METHODOLOGY.md §2` ("no clustering, no deanonymization") and §7 ("Delegator wallet addresses … or any per-delegator detail"; "Inferred relationships between … DReps and delegators").

So the honest decomposition: **the only methodologically valid way to show X→Y is the one the never-list prohibits, and the only way that fits in the current snapshot data is pure inference the observe-don't-infer rule prohibits.** There is no third option. Migration is blocked.

---

## 3. Methodology definitions for the derivable part (aggregate, snapshot-diff, no wallet data)

These formalize and align with `METHODOLOGY.md §18.2`. All quantities are per single DRep `D` over an interval ending at the most recent snapshot date `t`, with prior reference date `t'` = the most recent snapshot at or before `t − n` days.

**Net voting-weight flow**

```
net_voting_weight_flow(D, t, n) = voting_weight(D, t) − voting_weight(D, t')
```

**Net delegator-count flow**

```
net_delegator_flow(D, t, n) = delegator_count(D, t) − delegator_count(D, t')
```

**Inflow / outflow — defined honestly as the SIGN of the net aggregate, not as gross movement.** This is the single most important definitional choice in this document:

- A DRep is an **aggregate-net-inflow DRep** over the interval iff `net_voting_weight_flow > 0`.
- A DRep is an **aggregate-net-outflow DRep** over the interval iff `net_voting_weight_flow < 0`.
- The magnitude reported is `|net_voting_weight_flow|`.

The terms "inflow" and "outflow" here mean **the direction of the net change for that one DRep** — they do **NOT** mean gross arrivals or gross departures, and they carry **no source and no destination**. This matters because the intuitive meaning of "inflow" (total ADA that newly arrived, ignoring departures) is **gross** inflow, and gross flow is *not derivable* from aggregates: a DRep showing net +0 may have had 50M arrive and 50M leave, and snapshot diffs cannot see that. `METHODOLOGY.md §18.4` already states this: gross inflow, gross outflow, and migration "each require tracking per-delegator events." The observatory must therefore never label a net number as gross "inflow"/"outflow" without the "net" qualifier, or it implies knowledge it does not have.

**Per-DRep net-flow time series**

```
flow_series(D) = [ (date_i, ref_date_i, net_voting_weight_flow_i, net_delegator_flow_i) ]
```

one row per interval between consecutive available snapshots (this is the existing `daily_flow` array). Each row carries its `ref_date` so any third party can recompute it from the published daily snapshots — the reproducibility commitment of `METHODOLOGY.md §18.5`.

**Null discipline (carried verbatim from §18.6):** if the reference snapshot is missing, the value is `null`, never `0`, never interpolated. A DRep newly in the top-30 has `null` flows until enough snapshots accumulate.

**Independence of the two quantities (§18.1):** voting-weight flow and delegator-count flow are reported separately and never reconciled into one "movement" number. They can move in opposite directions (one whale leaving while many small delegators join) and that divergence is itself an honest observation — but note even *naming* it "one whale leaving" would be wallet-level inference; the observatory reports only the two signed numbers.

---

## 4. Proposed exports (safe / derivable only)

All under `/data/snapshots/`, CC0, regenerated by the daily ETL, `schema_version` + `methodology_version` stamped, byte-for-byte reproducible from the public daily snapshots. All are **aggregate, per-DRep, net** — none encodes a source→destination pair.

1. **`flows.json` — per-DRep net-flow time series (top-30).**
   For each top-30 DRep: the `daily_flow` array (already computed per-DRep) plus `recent_net_change` for d1d/d7d/d30d. This is mostly a roll-up of data already in `dreps/<id>.json` into one queryable file, so the flow view does not require 30 fetches.
   Fields per row: `drep_id`, `date`, `ref_date`, `net_voting_weight_delta_lovelace`, `net_delegator_count_delta`. Nulls preserved.

2. **`flows_top_movers.json` — aggregate net movers for the canonical intervals.**
   Two ranked lists per interval (d7d, d30d), strictly within the top-30 universe:
   - `top_net_inflow`: top-30 DReps ranked by `net_voting_weight_flow` descending (most-positive first).
   - `top_net_outflow`: top-30 DReps ranked by `net_voting_weight_flow` ascending (most-negative first).
   Each entry: `drep_id`, `net_voting_weight_delta_lovelace`, `net_delegator_count_delta`, `flow_reference_date`. **No "winners/losers" language** (`METHODOLOGY.md §18.8`: "The largest movers are not 'winners' or 'losers'"); the lists are titled "largest net increase" / "largest net decrease" and carry the no-motive disclaimer.

   These two lists are the honest analogue of "top inflows / top outflows." They are **not** source→destination — `top_net_inflow` and `top_net_outflow` are independent rankings of independent DReps. A reader must not pair row 1 of one with row 1 of the other; the export must carry an explicit machine-readable `disclaimer` field and the rendered page must repeat it (RULE 1).

**Explicitly NOT exported:** any `source_drep → dest_drep` edge, any migration matrix, any gross-inflow / gross-outflow figure, any per-delegator field, any pairing of an outflow DRep with an inflow DRep.

---

## 5. Recommendation on the proposed pages

| Proposed page | Content | Recommendation |
|---|---|---|
| `flows.html` / `drep-flows.html` | Aggregate **net** voting-weight and delegator-count flow per top-30 DRep over d7d/d30d, with the per-DRep net-flow time series and the two independent "largest net increase / largest net decrease" lists. | **PROCEED — methodology-safe**, after a `METHODOLOGY.md` changelog entry (it extends §18 to a dedicated page + the two new exports). It surfaces only net aggregates already derivable and already partly published. Must use neutral, no-color, no-"winner/loser" presentation per §18.8, and must carry the "net is not migration / no motive" disclaimer inline (§18.3, §18.8). |
| `migration.html` (source→dest "ADA moved from X to Y") | A directed graph / Sankey / "from→to" table of delegation moving between DReps. | **RECOMMEND AGAINST — blocked.** Per §2 above it is either inference (from snapshot diffs — violates RULE 1 and `§18.3`) or it requires per-delegator cross-DRep tracking (violates RULE 2 / `§2` / `§7`). There is no methodology-safe version of this page. Do not build it. |

**Exactly what `migration.html` would require to ever be possible** (documented so the answer is "here is the precise, large cost," not a vague "maybe later"):

1. **New data the observatory does not collect and the never-list forbids:** per-delegator re-delegation events — reading `drep_delegators` as a *list of stake credentials* for each DRep over time, or per-account delegation history (Koios account-level / `drep` delegation history endpoints; `CARDANO_API_REGISTRY.md §1/§5` confirms Koios exposes `/drep_delegators` as a per-delegator list and account delegation history, beyond the count the observatory uses). Matching a credential leaving X to the same credential arriving at Y is the *only* way to observe (not infer) X→Y.
2. **A direct conflict with `METHODOLOGY.md §2` and §7** ("no clustering, no deanonymization … no per-delegator detail … no inferred relationships between DReps and delegators"). Tracking the same stake credential across two DReps **is** the linkage §7 names. This is a stated permanent "never," not a gap awaiting tooling.
3. **Therefore a migration page is not a methodology *amendment*; it is a methodology *reversal*** of a core never-commitment, which the project has positioned as non-negotiable. The honest recommendation is not "amend §X to enable it" but "do not pursue it." If a future maintainer ever reconsidered, it would demand (a) a published deanonymization-risk analysis, (b) a community comment period per `§2`/`§34`-style discipline, and (c) most likely a *k*-anonymity / aggregation threshold that would, by construction, blur exactly the X→Y detail the page is for — i.e. the safe version of the feature is the feature not existing. State this plainly rather than leaving a door ajar.

---

## 6. Honest gaps and limitations

- **Net masks gross, always.** A DRep with net ≈ 0 may have had large offsetting arrivals and departures. The flow pages can show only net; they must never imply gross. (`§18.4`.)
- **Top-30 boundary truncates flow.** Flow is only computed for DReps in the current top-30. A delegator-weight move into a DRep that *enters* the top-30 shows up as `null`-until-accumulated, and any movement involving DReps outside the top-30 is invisible. This is a deliberate scope limit (`§1`, `§5`), not a defect, but it means the flow view is not a complete picture of network-wide delegation movement.
- **Snapshot granularity vs. protocol epochs.** Voting power is pinned at epoch boundaries (5-day cadence); daily snapshot diffs can show within-epoch wobble that is not governance-relevant (`§18.5`). The flow pages should keep the existing d7d/d30d framing and not over-surface d1d.
- **Mechanism is invisible.** Stake-key rotation, wallet restore, exchange custody shifts, and consolidation all produce flow numbers indistinguishable from genuine delegation decisions (`§18.7`). The observatory reports the number and disclaims the cause.
- **Identity-divergence between the two metrics cannot be explained.** When voting-weight flow and delegator-count flow disagree in sign, the observatory cannot say which delegators drove it without crossing into wallet-level inference. It reports both numbers and stops.
- **No backfill.** Pre-deployment flow is never reported (`§15`, `§21.10`).

---

## 6b. The four-layer confidence ladder (Q1–Q4)

The questions form a strict descending-confidence stack. Each layer is only as sound as the one above it; we stop at the highest layer that is both derivable and methodology-safe.

| # | Question | Derivable? | Method | Verdict |
|---|---|---|---|---|
| 1 | **Who gained?** | ✅ Yes | sign(+) of per-DRep aggregate net voting-weight diff between snapshots | **Safe — already partly shipped.** flows.html. No wallet data. |
| 2 | **Who lost?** | ✅ Yes | sign(−) of the same diff | **Safe.** flows.html. |
| 3 | **Where did delegation move? (DRep A → DRep B)** | ⛔ Not as a published surface | aggregates → *inference* (forbidden); honest version → per-credential cross-DRep tracking (banned never-list) | **Blocked** (see §2B, §5). Only via a methodology *reversal*, not an amendment. |
| 4 | **Which individual wallets moved?** | ⛔ No | per-delegator identity + linkage | **Never** (`§2`/`§7`). Technically on-chain but barred; **do not fake it.** |

**Default stance: stop at Layer 2.** Layers 3–4 are not "coming soon" — they require reversing a stated permanent commitment. The DRep→DRep migration graph is prioritized over wallet→DRep (as requested), but *both* sit below the line the never-list draws; prioritization does not move them above it.

## 6c. What historical data exists? — availability vs. permissibility

There are two different "exists" questions, and conflating them is how an observatory accidentally crosses its own line:

- **Aggregate history (Layers 1–2): exists and is ours to use.** Per-DRep `voting_weight` and `delegator_count` over time live in the observatory's daily snapshots (since deployment) and are re-derivable from on-chain epoch voting-power. This fully powers net-flow.
- **Per-delegator delegation history (Layers 3–4): exists on-chain, but is not ours to surface.** Every vote-delegation certificate since the Conway/Chang era is in the ledger; **db-sync** can replay each stake credential's DRep at any past epoch, and Koios exposes `drep_delegators` as a *list* and per-account delegation history (`CARDANO_API_REGISTRY.md §1/§5`). So the raw material to reconstruct **DRep A → DRep B** physically exists.
- **The decisive point:** *data availability ≠ methodology permissibility.* The blocker on migration is **not missing data** — it is the project's privacy commitment (`§2`/`§7`). "Can we reconstruct A → B?" → *technically yes* (db-sync cert replay); *under our rules, no*, and we will not fake it. Aggregating the result afterward does not launder the per-delegator linkage used to compute it, and k-anonymity blurs exactly the edge the page is for.
- **No backfill of our own aggregate flow** before deployment (`§15`, `§21.10`): even Layers 1–2 start at launch, not genesis.

## 6d. Abstain → DRep and No-Confidence → DRep

`drep_always_abstain` and `drep_always_no_confidence` are predefined DReps that hold real, aggregate delegated weight.

- **Aggregate, safe:** "total weight delegated to Abstain (or No-Confidence) rose/fell N over d30d" is a Layer-1/2 net-flow number on those two nodes — **derivable and publishable**, no wallet data. Worth surfacing on flows.html as two extra series.
- **As directed edges (Abstain → DRep A, No-Confidence → DRep A): same verdict as any A → B edge — blocked.** Showing that specific delegation moved *from* Abstain *to* a DRep requires per-credential tracking (banned). So: the *level* of weight parked in Abstain/No-Confidence is observable; the *routing* of it into/out of specific DReps is not.

## 6e. `concentration.html` and `clusters.html`

| Proposed page | Content | Recommendation |
|---|---|---|
| `concentration.html` | Observed concentration of **voting weight across DReps** — top-N share, HHI, Gini — from aggregate per-DRep weights over time. | **PROCEED — safe.** "Observe concentration" is explicitly permitted; this uses only aggregate weights, no wallet data, no inference. Must stay descriptive (report the index) and avoid editorial "centralization risk / capture" framing — the reader draws conclusions. |
| `clusters.html` | (as proposed) groupings of delegators/DReps. | **RECOMMEND AGAINST.** "Clustering" is a named permanent never (`§2`: no clustering / no deanonymization). A delegator/wallet cluster page is banned outright; a DRep "flow-community" page would depend on the blocked Layer-3 migration edges. There is no methodology-safe version. If the intent is purely DRep weight concentration, that *is* `concentration.html` — build that instead. |

## 7. One-line answer

**(A) Yes** — per-DRep aggregate net flow (voting-weight and delegator-count deltas, and their time series) is fully derivable from snapshot diffs with zero wallet-level data, and is the proper basis for a `flows.html` page and `flows.json` / `flows_top_movers.json` exports. **(B) No** — source→destination migration cannot be shown honestly: from aggregates it is inference (forbidden by observe-don't-infer / `§18.3`), and observing it for real requires per-delegator cross-DRep tracking (forbidden by the never-list / `§2`, `§7`). Build the aggregate flow page; do not build the migration page.

---

*Sources cited (all local): `METHODOLOGY.md` §1, §2, §5, §7, §18 (esp. §18.1–18.8), §21; live exports `data/snapshots/top30.json` and `data/snapshots/dreps/<id>.json` (`recent_net_change`, `daily_flow`); `~/cardano-data-layer/CARDANO_API_REGISTRY.md` §1 and §5 (Koios `drep_delegators`, account/DRep delegation history, governance endpoint surface).*

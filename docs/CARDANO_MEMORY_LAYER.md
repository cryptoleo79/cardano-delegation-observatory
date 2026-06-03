# The Cardano Memory Layer

**Status:** vision document. Not methodology. Not implementation. Not commitment to any specific future work.
**Date:** 2026-06-03
**Scope:** the ecosystem of preservation work this project has accumulated, and the frame through which future preservation work should be evaluated.

## What this document is

A single page that names the thing this project has been building. Across nine months of incremental work, the Cardano Delegation Observatory has grown from one narrow observability layer into something that is recognizably a memory infrastructure for the Cardano ecosystem. This document gives that thing a name and an articulation, so that future contributors, reviewers, and the operator can ask "does this work belong in the memory layer?" before they ask "does this work fit in the observatory?"

This is not a roadmap. It does not commit the operator to building any specific future layer. It identifies the layers that already exist, the layer that is plausibly next, and the shared principles that make all of them coherent.

If a future piece of work fits the memory layer's principles and addresses a genuine preservation gap, it is welcomed. If it does not — if it would require the project to become a curator, an interpreter, a ranker, a trader tool, an alert engine, a comparison engine, a recommendation engine, or any other surface that runs against the methodology in `METHODOLOGY.md §2` and §24.2 — it does not belong, regardless of how interesting or valuable the surface might be in the abstract.

## The four memory layers

### Governance Memory — `observatory.asy.life` (FLOW-1 through FLOW-4)

The original observatory. Daily snapshots of DRep voting weight, delegator counts, governance action submissions, vote tallies, state transitions, and the historical archive of all of the above. Methodology §1–§21. Schema v2. Deployed since 2026-05-28.

What it preserves:
- Per-DRep state at each daily snapshot, top 30 by current voting weight
- Per-governance-action record with submission, ratification, enactment, expiration, or drop, plus the DRep vote tally
- Per-DRep voting history with snapshot-to-snapshot net movement (FLOW-1)
- Governance event overlays on the per-DRep voting weight chart (FLOW-2)
- The full historical archive at `/data/snapshots/by-date/{YYYY-MM-DD}/` with byte-equal snapshot files and SHA-256 integrity hashing (FLOW-3, FLOW-4)

What it deliberately does not preserve:
- Trust scores, alignment scores, "good DRep / bad DRep" classifications
- Predictions of voting behavior
- Wallet-level information about delegators
- Editorial framings of individual DReps

### Treasury Memory — within `observatory.asy.life` (FLOW-5)

The treasury observability layer. Per-epoch treasury balance, governance-action-driven treasury withdrawals, the reconciliation between observed balance changes and governance-attributed withdrawals. Methodology §22. Schema v2 (additive). Deployed since 2026-06-01.

What it preserves:
- Treasury balance at every epoch boundary, back to the earliest epoch Koios exposes
- Every `TreasuryWithdrawals` governance action with its full recipient list (stake address + lovelace amount)
- The relationship between an enacted withdrawal and the observed treasury delta at the enactment epoch
- The reconciliation residual as an honest accounting figure, not an error term

What it deliberately does not preserve:
- Recipient evaluations, recipient categorizations, recipient quality scores
- "Net treasury health," "burn rate," "runway months," any forward projection
- Anomaly flags on individual withdrawals
- Off-chain identity linkage for stake addresses

### Catalyst Memory — `cardano-catalyst-archive` (FLOW-6)

The preservation archive for Cardano Catalyst's historical record. Separate repository from the observatory. Methodology §24. Currently at Phase 5 of FLOW-6: first capture committed (`projectcatalyst.io/funds/9` landing page), pipeline exercised end-to-end, ready to expand.

What it preserves:
- Per-fund landing pages and voting results from `projectcatalyst.io`
- IdeaScale campaign and proposal pages, captured via the Wayback Machine (the live `cardano.ideascale.com` is a JavaScript SPA returning an empty shell)
- The `cardano-foundation/catalyst-core` repository as a bare git mirror
- `catalystexplorer.com` community-mirror per-fund pages
- Per-funded-proposal milestone tracker pages
- On-chain Catalyst payout transaction query records

What it deliberately does not preserve:
- Catalyst Voices content (the successor platform, future scope)
- Editorial commentary on Catalyst funds
- Proposal quality scores, recipient rankings, milestone-completion judgments
- Anything derived from API tokens or special-access arrangements

### Project Memory — `cardano-project-memory-archive` (active 2026-06-03)

The fourth layer, surfaced by the question "what disappears if TapTools shuts down?" — a question that became concrete when TapTools announced a full company wind-down on 2026-06-02. The layer preserves the editorial Cardano ecosystem layer — project descriptions, team attestations, audit links, partnership lists, category classifications, launch date attestations, and historical ecosystem-wide ranking snapshots.

These are not on-chain. They are not in any single canonical off-chain registry. They are human-curated metadata that has accumulated across third-party ecosystem-discovery platforms (TapTools, cardanocube, "Built on Cardano," various forum threads, README files on GitHub). If those platforms disappear, the metadata orphans.

Companion artifacts: `docs/TAPTOOLS_INVENTORY.md` (surface inspection), `docs/TAPTOOLS_GAP_ANALYSIS.md` (preservation priorities), `docs/PROJECT_MEMORY_REGISTRY.md` (the source-of-record registry).

First captures completed 2026-06-03: TapTools pre-SPA ranking grids + a 2,224-URL historical-project-metadata index (Class C, via Wayback); cardanocube taxonomy, `/projects/graveyard`, and all 20 graveyard project profiles (Class D, wayback-pin). See the registry for status.

#### Scope discipline — what Project Memory is and is not

Project Memory is **preservation of editorial ecosystem metadata that would otherwise orphan**. It is bounded as follows.

**In scope:**
- Project descriptions, team/social attestations, audit links, partnership lists as published by ecosystem-discovery sources, captured as-found.
- Category classifications and taxonomies, preserved per-source (each source's taxonomy as-is, cross-referenced — never consolidated into one "canonical" taxonomy, which would be interpretation).
- Launch-date attestations and historical ecosystem-wide ranking snapshots (the perishable historical *state*).
- Chain-of-custody manifests and source enumeration indexes (e.g. the TapTools CDX index) that make the editorial layer enumerable and verifiable.

**Out of scope:**
- **A live data API or a TapTools replacement.** The memory layer preserves *what disappears*; it does not serve live prices, OHLCV, floors, liquidity, or portfolios, and it does not rebuild TapTools' product. Whether the ecosystem should build a neutral live **Data Layer** is a separate question tracked outside this preservation effort (`~/cardano-data-layer/`), under its own trust boundary and its own decision.
- Trader tooling, charts, portfolio features, and live market surfaces — these are product, not memory.
- Re-derived or recomputed metrics. The layer stores what a source published, not a new calculation over it.
- A consolidated "master" ecosystem registry that picks winners among sources' differing taxonomies or descriptions (that is curation/interpretation, barred by the shared principles below).

This boundary is the application of "Preservation, not replacement" (below) to the Project Memory layer specifically.

## Shared principles

All four layers share a small set of principles. A future surface that violates any of these principles does not belong in the memory layer.

### Preservation, not curation

The memory layer records. It does not choose what is worth remembering. Within each layer's scope, every record is preserved on the same footing as every other — funded and unfunded proposals, ratified and dropped actions, prominent and obscure DReps, top-of-leaderboard and long-tail tokens.

A layer that filters its scope by "what the operator considers important" is curation, not preservation. The decision about what was important is the reader's job, made later, with context the operator does not have today.

### Preservation, not interpretation

The memory layer presents what existed. It does not say what it meant. A treasury withdrawal is recorded with recipient address and amount; whether the recipient delivered, whether the amount was reasonable, whether the action was wise — those are reader judgments, not memory-layer outputs.

This rule is repeated across every layer's "what this layer does NOT do" subsection. It is not a stylistic preference; it is the structural commitment that makes the memory layer trustworthy as a research substrate. A reader who suspects the operator has interpreted the record will not trust the record.

### Preservation, not ranking

No "top N", no "most important", no "best", no "most successful", no "most controversial." Magnitude is preserved as a number; rank is preserved only when rank was the canonical record at the time (e.g., observatory snapshot rankings are preserved as published, but the memory layer does not re-rank historical data using current values).

### Preservation, not replacement

The memory layer preserves what disappears. It does not rebuild what disappeared as a live service. When a platform sunsets, the memory-layer response is to capture its perishable record with chain-of-custody — not to stand up a replacement product that serves the same live queries.

This matters because the sunset of a useful platform (TapTools, jpg.store) creates two distinct, legitimate opportunities that must not be conflated: (1) **preserve** the historical and editorial data that would otherwise orphan — this layer's job; and (2) **replace** the live API capability for consumers who depended on it — a separate data-infrastructure effort with its own trust boundary, sustainability model, and governance. The memory layer may serve as a *seed source* for a replacement (referenced under chain-of-custody), but the two are different systems with different obligations. Folding a live replacement into the preservation effort would compromise the preservation guarantees (immutability, neutrality, reproducibility) that make the archive trustworthy.

A layer that starts serving live, recomputed, or product-shaped queries has stopped being memory and become a product. The discipline is to keep the archive an archive.

### Reproducibility by ordinary researchers

Every preservation decision must result in artifacts that an ordinary researcher — a graduate student with a laptop and a network connection, not a Catalyst Foundation insider, not a paid API customer — can clone, verify, and use. This excludes API-token paths, private-access arrangements, paid services, and any source that the project cannot point at and say "fetch this URL, run this script, verify these hashes."

This principle is what closed the IdeaScale API-token path and the catalyst-core decryption-key path in FLOW-6 Phase 4. It will close future paths the same way.

### Chain-of-custody required

Every captured artifact carries provenance. Source URL, capture date, capture method, capture operator, SHA-256 hash, content type, source authority class, optionally a Wayback Machine snapshot URL. The custody manifest is the basis on which a researcher can later say "this byte sequence is what was on the source at this time." Without chain-of-custody, the captured bytes are evidence of nothing.

The observatory's `sha256.json` per dated archive (FLOW-4 §21.13), the Catalyst archive's per-artifact `.custody.json` (FLOW-6 §24.4), and any future layer's equivalent are instances of the same commitment.

### On-chain self-preserves; off-chain needs work

The Cardano blockchain preserves itself. The protocol's own consensus rules guarantee that DRep registrations, governance actions, votes, treasury balances, and Catalyst payout transactions remain queryable from any compatible explorer indefinitely. The memory layer does not duplicate this preservation; it preserves the queries needed to retrieve from on-chain plus the off-chain metadata that does NOT have an equivalent self-preservation guarantee.

This asymmetry is the source of the project's bias toward off-chain capture. Off-chain content disappears with the host. On-chain content does not.

### Separate trust boundaries when separation is achievable

Governance Memory and Treasury Memory live in the same observatory because they share an ETL, a schema, a deployment, and a researcher audience. Catalyst Memory lives in a separate repository because its lifecycle, license profile, footprint, and trust boundary all differ. Project Memory — if it materializes — would similarly live separately if its lifecycle and content-type differ from the observatory.

The principle: separation is a cost (more repositories to maintain, more boundary contracts to specify), but conflation is a worse cost (mixed lifecycles, license confusion, methodology drift). When a new layer's lifecycle materially differs, separate. When it does not, share.

## The relationship between the layers

The four layers are not a hierarchy. They share principles but they are not nested.

| Layer | Surface | Repository | Methodology | Lifecycle |
|---|---|---|---|---|
| Governance Memory | observatory.asy.life | `cardano-delegation-observatory` | §1–§21 | Daily ETL |
| Treasury Memory | observatory.asy.life | `cardano-delegation-observatory` | §22 | Daily ETL (same as Governance) |
| Catalyst Memory | (no public surface yet) | `cardano-catalyst-archive` (separate) | §24 | Bursty capture sessions |
| Project Memory | proposed | proposed | proposed | proposed |

Cross-references between layers are allowed but limited. Governance Memory may link to Catalyst Memory when a DRep voted on a TreasuryWithdrawals action that funded a Catalyst proposal — that linkage is itself a research question, not a preservation question, and would be surfaced via a future methodology section if the operator chose to surface it. The default is: the layers preserve in parallel; integration is a separate decision.

This is intentional. A reader interested in Governance Memory should be able to use it without knowing that Catalyst Memory exists. A researcher cloning the Catalyst archive should not need to clone the observatory. The cross-references are documentation links, not data dependencies.

## What this means for future work

When the operator (or any future contributor) considers a new piece of work, the memory-layer frame provides a small set of questions:

1. **Does this work preserve, or does it curate, interpret, rank?** If the latter, it does not belong.
2. **Does this work address a real off-chain preservation gap, or is it on-chain duplication?** If on-chain duplication, it is not preservation work; it may be observability work, but the memory layer does not need it.
3. **Is the source canonical enough to warrant capture, or is it one of several redundant community mirrors?** If many redundant mirrors exist, the preservation work is lower priority than for content with no mirror.
4. **Can ordinary researchers reproduce this preservation, or does it require special access?** If the latter, decline.
5. **Does this work share lifecycle and license with an existing layer, or does it need its own repository?** Choose based on the lifecycle, not the conceptual similarity.

A piece of work that answers "preserves / fills a real gap / no redundancy / ordinary-researcher reproducible / share or separate per lifecycle" — that piece of work belongs in the memory layer. A piece of work that fails any of those tests does not.

This is not a moral judgment about the failing pieces of work. A trader tool that aggregates Cardano DEX state into a portfolio screen is genuinely useful; it just isn't memory work. The memory layer is one kind of project; not every Cardano project should be it.

## What this means for project boundaries

The project's identity is sometimes ambiguous. The original observatory was an observability platform for one narrow slice of governance. The treasury layer extended that. The Catalyst archive moved away from observability into pure preservation. If Project Memory materializes, the project becomes recognizably a memory infrastructure rather than an observability platform.

The frame this document offers: the project is now a memory infrastructure that happens to use observability as one of its surfaces. The observability function (daily snapshots, live telemetry) is a means; the memory function (durable, citable, byte-verifiable preservation) is the end.

Renaming the project is not in this document's scope. The domain `observatory.asy.life` reflects the project's first surface, not its current identity. If the operator chooses to acquire `memory.asy.life` or similar in the future, that decision is separate from this document. The existing observatory remains the canonical Governance + Treasury Memory surface regardless of any future naming choices.

## Open questions

This document does not resolve, and does not need to resolve:

- **Does Project Memory materialize?** Pending the TapTools gap analysis. If the gap analysis shows that the editorial Cardano ecosystem layer has sufficient redundancy in existing community sources (cardanocube, Built on Cardano), the gap may not warrant a new preservation effort.
- **Where does Voting / Governance live?** `voting.asy.life` and `governance.asy.life` are sibling sites currently focused on different surfaces. They may, at some future point, become memory-layer surfaces in their own right — e.g., preservation of Catalyst Voices content once that platform is the canonical successor to IdeaScale. That decision is downstream of those platforms' own evolution.
- **What about Stake Pool Memory?** Stake pool operator metadata, pledge history, saturation over time, etc., are largely preserved by community tools (pooltool, adapools, balanceanalytics, cexplorer). The redundancy is high; no preservation gap is currently identified. If a major community tool announces sunset, this could shift.
- **What about per-DApp documentation preservation?** README files, technical specifications, audit reports, governance proposal text from non-Catalyst sources. Probably out of scope — too sprawling, no clear preservation boundary. Could fit Project Memory if that layer materializes with a narrow editorial focus.
- **When does the project's own methodology become a candidate for preservation?** Currently `METHODOLOGY.md` is preserved by being in the observatory's git history, which is in turn preserved by the operator running `git push` to GitHub. If GitHub or the operator disappears, the methodology disappears with them. A formal Methodology-as-archive question is not currently open but the memory-layer frame surfaces it as a question to think about eventually.

## Closing principle

The memory layer is not a product. It is not seeking users or growth metrics. It exists because Cardano's governance, treasury, Catalyst, and ecosystem records are the kind of thing that quietly disappears when individual projects pivot, sunset, or fail — and someone needs to be doing the boring work of writing the bytes down with chain-of-custody manifests, every day, with no fanfare.

If the memory layer succeeds, researchers in 2030 or 2035 will be able to ask questions about 2025 Cardano governance and get answers that come from preserved primary sources, not from reconstruction or hearsay. That is the entire ambition. Everything in this project should be evaluated against whether it advances that ambition or distracts from it.

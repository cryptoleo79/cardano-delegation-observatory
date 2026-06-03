# Project Memory source registry

**Status:** draft. The cardanocube section is populated after the parallel inventory research returns; everything else is the planning baseline.
**Owner:** observatory operator (`cryptoleo79`).
**Phase:** PM-3 of the Project Memory work (per user direction, 2026-06-03).
**Authoritative reference:** `docs/CARDANO_MEMORY_LAYER.md` — the meta-methodology governing all memory layers in this project. If this document contradicts it, the meta-methodology wins.
**Companion documents:** `docs/TAPTOOLS_INVENTORY.md`, `docs/TAPTOOLS_GAP_ANALYSIS.md` (the analysis that drove the source authority class assignments here).

## What this document is

The source-of-record registry for Project Memory — the editorial Cardano-ecosystem layer (project descriptions, categorizations, launch dates, taxonomy, historical ranking states). Modeled on `docs/CATALYST_SOURCE_REGISTRY.md` (the FLOW-6 Phase 2 deliverable) — same field schema, same authority class framework, same preservation status enum.

For every source the operator has identified as carrying editorial Cardano-ecosystem content, this document records the canonical primary URL, fallback secondary sources, source authority class, present-day preservation status, capture risk band, an estimate of completeness for the Cardano-ecosystem editorial layer, and any known gaps.

This is the mapping layer. The capture plan that follows it (`docs/PROJECT_MEMORY_CAPTURE_PLAN.md`, not yet drafted) will define *how* each source is captured. Capture itself comes after the plan is reviewed.

**No capture has been performed for Project Memory as of the date on this document.** The exception is that `docs/TAPTOOLS_INVENTORY.md` recorded a read-only surface inspection of TapTools, which did not download bytes for archival.

## Authority class framework

Reuses the framework defined in `METHODOLOGY.md §24.3` (the Catalyst preservation methodology). The classes generalize cleanly from Catalyst-issued to ecosystem-issued without modification; only the per-class examples change.

| Class | Description (for Project Memory) | Examples |
|---|---|---|
| A | On-chain — reproducible from the Cardano blockchain | Token policy IDs, NFT mint dates, on-chain DEX state, on-chain DApp script addresses |
| B | Official Cardano-ecosystem-issued | `cardano-foundation/cardano-token-registry` (CIP-26 registry on GitHub), `builtoncardano.com` (Cardano Foundation directory), `cardano.org/discover` |
| C | At-risk commercial platform-hosted | `taptools.io` (sunset risk per the 2026-06-03 user signal; preservation surface is the Wayback Machine, not the live SPA) |
| D | Community-maintained | `cardanocube.io`, DefiLlama Cardano subset, individual community-curated directories |
| E | Researcher capture | Contributions from individual researchers, accepted under chain-of-custody review |

Per `CARDANO_MEMORY_LAYER.md`'s "ordinary researcher reproducibility" principle, Class C sources accessed via paid APIs (e.g., the TapTools commercial API) are NOT included as preservation targets. The TapTools entry in this registry treats the Wayback Machine archive as the canonical preservation surface — same pattern that `METHODOLOGY.md §24.9` applies to IdeaScale.

## Preservation status enum

Same five values used in `docs/CATALYST_SOURCE_REGISTRY.md`:

- **Live and intact** — primary URL resolves, content appears complete to spot-check
- **Live but drifting** — primary URL resolves but some sub-pages return 404 / 5xx, or structure changed
- **Partially orphaned** — some essential URLs already return 404; coverage now in lower-authority classes
- **Fully orphaned** — primary URL no longer resolves; only secondary sources remain
- **Unknown** — status not yet verified during the registry pass

Each value is recorded with the date the status was last verified. The first observation of a Class C source transitioning from "Live and intact" to anything else triggers an escalation per `METHODOLOGY.md §24.9` Band 1.

## Capture risk band

Same Band 1–4 framework from `METHODOLOGY.md §24.9`:

- **Band 1** — at-risk Class C platform; capture before sunset / first 404 / loss of access.
- **Band 2** — Class B canonical source; capture on a quarterly schedule plus on observed structural change.
- **Band 3** — Class A on-chain; no proactive capture (chain self-preserves).
- **Band 4** — Class D community-maintained; capture on fund-equivalent milestone (e.g., when a source publishes a new dataset version), plus opportunistic.

## Completeness field

For Project Memory, completeness describes how much of the editorial Cardano-ecosystem layer is recoverable from a given source today:

- **Comprehensive** — the source aims to cover most active Cardano projects across categories.
- **Narrow** — the source covers a specific slice (e.g., DeFi only, NFTs only).
- **Curated** — the source covers a smaller hand-picked set; depth is high per project but breadth is intentionally limited.
- **Index-only** — the source links to other sources but does not carry primary content.

Completeness is qualitative. The capture plan that follows this registry will produce measured per-source artifact counts.

---

## Per-source entries

### TapTools (via Wayback Machine)

The 2026-06-03 inspection pass at `docs/TAPTOOLS_INVENTORY.md` established the architectural reality: live TapTools is a Next.js SPA returning empty shells; preservation routes through the Wayback Machine's incidental snapshots of historical state. The Wayback CDX path is identical in shape to the IdeaScale-via-Wayback path documented in `METHODOLOGY.md §24.9` and `docs/CATALYST_CAPTURE_PLAN.md §3.2`.

| Field | Value |
|---|---|
| Primary source | Wayback Machine snapshots of `taptools.io/charts/token/*`, `taptools.io/charts/nft/*`, and the ranking-grid root with subcategory filter parameters. Class C accessed via Class C-equivalent Wayback preservation. |
| Secondary source | The live `openapi.taptools.io` spec page (HTML render of the OpenAPI document; Class B-equivalent because it documents what the data was supposed to be, even though the live API is gated). |
| Preservation status | Live and intact (verified 2026-06-03 — the Wayback CDX returned ~2000 archived URLs; spot-checks confirmed snapshots resolve and contain server-rendered HTML from pre-SPA conversion era). |
| Authority class | C (via Wayback) for ranking-grid + per-token + per-collection editorial; B for the OpenAPI spec page. |
| Capture risk | **Band 1** — the Wayback snapshots are themselves perishable to the extent that Wayback's own retention policy is not infinite; and TapTools live access (even read-only via Wayback) may be impacted if TapTools issues content takedowns to the Wayback Machine. |
| Completeness | Comprehensive for tokens and NFT collections that TapTools indexed during its active period; index-only for projects that TapTools did not surface as separate per-project pages (TapTools has no `/projects/{id}` route per the inventory). |
| Known gaps | **No historical-state endpoints** — TapTools never exposed historical category memberships or historical ranking states; the only place those exist is in Wayback's incidental ranking-grid captures. Coverage is incidental, not systematic. Specific per-token and per-collection editorial overlays (`/token/links` + `/nft/collection/info` payloads as captured by API) are NOT preservable from Wayback because Wayback does not capture XHR responses. The captured ranking grid HTML pages contain the editorial overlay text, however, which is the substantive recovery path. |

### cardanocube.io

_Per-source detail awaits the parallel cardanocube inventory research. Confirmed structural facts from the prior reproducibility analysis: cardanocube is community-maintained, narrower in coverage than TapTools but accessible without API keys, and the closest open substitute for TapTools' editorial categorization layer. The capture plan that follows this registry will specify the capture method (direct polite-client GET vs Wayback path) based on the cardanocube inspection findings._

| Field | Value |
|---|---|
| Primary source | `https://cardanocube.io/` (root + per-project pages, exact URL pattern TBD pending inventory) |
| Secondary source | Wayback Machine snapshots of cardanocube.io; the cardanocube GitHub repository if the dataset is open-published there |
| Preservation status | Unknown — pending inventory pass |
| Authority class | D (community-maintained) |
| Capture risk | Band 4 (community-maintained baseline; may escalate to Band 2 if cardanocube announces sunset or substantial structural changes) |
| Completeness | Pending inventory — estimated comprehensive for active community projects, narrower than TapTools |
| Known gaps | Pending inventory |

### Built on Cardano (`builtoncardano.com`)

Cardano-Foundation-curated directory of Cardano-built projects. Lower volume than TapTools or cardanocube; higher official authority. Spot-checked at 2026-06-03: live and intact.

| Field | Value |
|---|---|
| Primary source | `https://builtoncardano.com/` |
| Secondary source | Wayback Machine snapshots |
| Preservation status | Live and intact (verified 2026-06-03 via existence check) |
| Authority class | B (Cardano Foundation-issued) |
| Capture risk | Band 2 (Class B canonical; quarterly capture cadence) |
| Completeness | Curated — Cardano Foundation hand-picked listing; depth higher per project than community directories, breadth lower |
| Known gaps | Editorial bias toward CF-recognized projects; community-driven projects may be under-represented. Coverage is the Foundation's choice, not exhaustive. |

### `cardano.org/discover`

Cardano Foundation's project-discovery landing page. Smaller catalog than `builtoncardano.com`; CF-curated.

| Field | Value |
|---|---|
| Primary source | `https://cardano.org/discover` (or the discover-equivalent path on the current cardano.org site) |
| Secondary source | Wayback Machine snapshots; the underlying CMS source if published openly |
| Preservation status | Live and intact (verified 2026-06-03 via existence check) |
| Authority class | B (Cardano Foundation-issued) |
| Capture risk | Band 2 |
| Completeness | Index-only / curated — `cardano.org/discover` historically functions as an introductory directory rather than a comprehensive catalog |
| Known gaps | Snapshot coverage rather than depth; per-project profile detail typically lives elsewhere with `cardano.org/discover` providing the entry point |

### `cardano-foundation/cardano-token-registry` (CIP-26 off-chain registry)

The git-versioned off-chain Cardano native token registry. The most durable single Cardano metadata asset — already git-mirrorable, already public, already preserved by being in everyone's local clone. CF-maintained.

| Field | Value |
|---|---|
| Primary source | `https://github.com/cardano-foundation/cardano-token-registry.git` |
| Secondary source | Wayback Machine snapshots of the rendered GitHub web view; GitHub-style mirrors on other forges if any exist |
| Preservation status | Live and intact (verified 2026-06-03 via existence check — repo is active) |
| Authority class | B (Cardano Foundation-issued, git-versioned) |
| Capture risk | Band 2 (low risk; same `git clone --mirror` pattern used for `cardano-foundation/catalyst-core` in FLOW-6) |
| Completeness | Comprehensive for **token metadata that has been registered** — coverage is opt-in (token issuers must submit a PR to add their token), so coverage equals the set of token issuers who chose to register. Unregistered tokens are off-register but still on-chain; the registry covers the off-chain metadata layer only. |
| Known gaps | Opt-in coverage — many Cardano native tokens have no entry. The registry is the canonical store for tokens that have entries; it is not a comprehensive Cardano-token catalog. |

### DefiLlama (Cardano subset)

Multi-chain DeFi protocol aggregator. Cardano-DeFi subset is a Class D source for project metadata where TVL, protocol type, and protocol descriptions overlap with the Project Memory scope.

| Field | Value |
|---|---|
| Primary source | `https://defillama.com/protocols/Cardano` (or equivalent path; verify current URL during capture planning) |
| Secondary source | DefiLlama's public API (`api.llama.fi` family) if it covers the Cardano subset; Wayback snapshots |
| Preservation status | Live and intact (verified 2026-06-03 via existence check) |
| Authority class | D (community-maintained) |
| Capture risk | Band 4 |
| Completeness | Narrow — DeFi-only. Does not cover non-DeFi Cardano projects (NFT collections, infrastructure, social tooling, etc.). Within DeFi, coverage is comprehensive. |
| Known gaps | Out of scope for non-DeFi projects. Some Cardano DeFi protocols are missing from DefiLlama for various reasons (small TVL, slow indexer integration); spot-check during capture. |

### On-chain (Class A — referenced, not captured)

Per `CARDANO_MEMORY_LAYER.md`'s principle that on-chain self-preserves, the project does not capture bytes for Class A sources. The registry notes the on-chain identifiers that ground the Project Memory layer:

- Token policy IDs — canonical identifier per token; on-chain by definition.
- NFT collection policy IDs — same.
- DApp script addresses — on-chain.
- Pool registration metadata — on-chain.
- DRep registration — already captured by Governance Memory.

| Field | Value |
|---|---|
| Primary source | The Cardano blockchain via Koios (`https://api.koios.rest/`) |
| Secondary source | Blockfrost, self-hosted db-sync, other compatible explorers |
| Preservation status | Self-preserving (the chain itself) |
| Authority class | A |
| Capture risk | Band 3 — no proactive capture; query records only |
| Completeness | Comprehensive for on-chain state |
| Known gaps | None for on-chain itself; off-chain metadata linked from on-chain (e.g., DRep metadata URLs, pool metadata URLs) may have separate preservation status |

---

## Aggregate preservation overview

At-a-glance summary across all sources. The per-source subsections above are the authoritative record.

| Source | Authority class (primary) | Capture risk band | Preservation status | Completeness |
|---|---|---|---|---|
| TapTools (via Wayback) | C | **Band 1** | Live and intact (Wayback CDX returns ~2000 URLs) | Comprehensive for indexed tokens / NFT collections; no per-project pages |
| cardanocube.io | D | Band 4 | Unknown (pending inventory) | Pending |
| Built on Cardano | B | Band 2 | Live and intact | Curated |
| cardano.org/discover | B | Band 2 | Live and intact | Index-only / curated |
| cardano-foundation/cardano-token-registry | B | Band 2 | Live and intact | Opt-in token catalog |
| DefiLlama (Cardano subset) | D | Band 4 | Live and intact | Narrow (DeFi-only) |
| On-chain | A | Band 3 | Self-preserving | Comprehensive for on-chain |

One Band 1 source (TapTools-via-Wayback). Multiple Band 2 official Cardano-issued sources providing redundant coverage for the curated layer. Band 4 community sources providing comprehensiveness where the official sources are narrow.

## Aggregate gaps

Cross-source observations from the registry pass:

1. **No single source provides comprehensive Cardano-ecosystem editorial coverage.** TapTools is the most comprehensive (per the gap analysis) but its preservation surface is the Wayback Machine's incidental archive — not the live API. cardanocube approaches comprehensiveness for active community projects but is narrower than TapTools' breadth. Built on Cardano and `cardano.org/discover` are curated rather than comprehensive. The combined coverage from all sources together is the de facto Project Memory layer.

2. **The editorial overlay (per-project descriptions, socials, audit links) lives on every source in slightly different form.** Each source has its own taxonomy (TapTools' subcategories, cardanocube's categories, Cardano Foundation's classifications, DefiLlama's DeFi-specific protocol types). The taxonomies do not align cleanly. A preservation effort cannot pick one taxonomy as canonical without losing information from the others. The capture plan should preserve each source's taxonomy as-found, with cross-references rather than consolidation.

3. **Historical-state preservation is limited everywhere.** TapTools does not expose historical-state endpoints. Built on Cardano and `cardano.org/discover` do not version their pages publicly. The Wayback Machine's historical snapshots are the only durable historical-state record across the entire Project Memory layer. **This makes Wayback the most important upstream dependency for the entire Project Memory effort.**

4. **Class B sources are stable but curated.** Cardano Foundation's directories are unlikely to disappear, but their editorial choices shape what gets recorded. The preservation effort preserves their choices as-found, not as a comprehensive ecosystem record. Researchers should be aware that "Built on Cardano" is the Foundation's view of the ecosystem on the capture date, not the ecosystem itself.

5. **Class D community sources have heterogeneous lifecycles.** cardanocube.io is community-maintained without a single corporate backer; DefiLlama is a multi-chain venture-backed project; smaller community directories may sunset without warning. The capture plan should treat Class D coverage as opportunistic and on-fund-close-equivalent rather than predictable.

6. **On-chain linkage is the underpinning** but does not by itself carry the editorial layer. A project's policy ID is on-chain; its description, team, audit, and partnerships are not. The Project Memory layer's value is precisely the off-chain editorial overlay; the on-chain identifiers are the keys but not the content.

## Implementation order

When PM-3 is approved and PM-1 + PM-2 proceed, the work order is:

1. **Set up the second archive repository** at `~/cardano-project-memory-archive/` (proposed name; subject to confirmation). Repository scaffold identical in shape to `cardano-catalyst-archive` (FLOW-6): README, LICENSE Apache 2.0, NOTICE multi-layer, CONTRIBUTING, METHODOLOGY pointer, CHANGELOG, INDEX.json, per-source subfolder skeletons, `_verify/` tooling reused from the Catalyst archive.

2. **PM-1: TapTools-via-Wayback capture.** Issue the Wayback CDX query for `taptools.io/charts/*` and similar paths. Enumerate archived URLs. Fetch each Wayback snapshot, hash, manifest, store at `taptools-via-wayback/charts/token/{policy_id}/` and parallel paths. Per-snapshot custody manifest carries `source_authority_class = "C"` and `wayback_url` as load-bearing.

3. **PM-2: cardanocube capture.** Inventory first (pending agent return). Then either direct polite-client fetch (if the site is server-rendered HTML) or Wayback path (if it is SPA-only). Per-page custody manifest with `source_authority_class = "D"`.

4. **Band 2 captures (Built on Cardano, cardano.org/discover, CIP-26 registry).** Lower priority than Band 1; do these once the at-risk material is preserved.

5. **DefiLlama capture.** Lowest priority among the registered sources; lifecycle is stable.

6. **PM-4: scope discipline document.** Add a "Scope discipline" section to `docs/CARDANO_MEMORY_LAYER.md` (or a separate `docs/MEMORY_LAYER_SCOPE.md`) that explicitly lists in-scope and out-of-scope items for the Project Memory layer. Captures the user's "do not build TapTools replacement" guidance as a methodology constraint.

## Document lifecycle

This registry is re-verified on every methodology version bump and whenever any preservation status changes for any source. Updates land in a small change log at the bottom of this document (added on first revision). The first observation of any Class C source transitioning from "Live and intact" to anything else triggers an escalation review for that source.

## Open questions

- **Repository name for the second archive.** Proposed `cardano-project-memory-archive`. Alternatives: `cardano-ecosystem-archive`, `cardano-project-archive`. The user's decision is welcomed; defaulting to the proposed name if no preference is expressed.
- **Does Project Memory warrant a §25 methodology section in `METHODOLOGY.md`?** The Catalyst pattern (§24) suggests yes for consistency. The `CARDANO_MEMORY_LAYER.md` pattern suggests the meta-methodology may be sufficient and per-layer methodology proliferation could be scope creep. Deferred decision; can be added later if needed.
- **Coordination with the on-chain Project Memory upstream.** Several DRep metadata URLs and stake-pool metadata URLs point at off-chain editorial content that overlaps with Project Memory scope. Whether to capture those alongside the dedicated Project Memory sources is a future scope decision.
- **Coordination with the Catalyst archive.** Some Catalyst proposals contain project descriptions that overlap with Project Memory scope. Cross-links between the two archives are documented as references, not data flows, per the `CARDANO_MEMORY_LAYER.md` separate-trust-boundary principle.

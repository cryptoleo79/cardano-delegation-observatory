# Project Memory source registry

**Status:** active. PM-1 (TapTools-via-Wayback) and PM-2 (cardanocube) first captures are complete as of 2026-06-03; see the change log at the bottom. All source sections are populated.
**Owner:** observatory operator (`cryptoleo79`).
**Phase:** PM-3 of the Project Memory work (per user direction, 2026-06-03).
**Authoritative reference:** `docs/CARDANO_MEMORY_LAYER.md` — the meta-methodology governing all memory layers in this project. If this document contradicts it, the meta-methodology wins.
**Companion documents:** `docs/TAPTOOLS_INVENTORY.md`, `docs/TAPTOOLS_GAP_ANALYSIS.md` (the analysis that drove the source authority class assignments here), `docs/PROJECT_MEMORY_GOVERNANCE_MODEL.md` (who may add/update/challenge the curated editorial layer and how its history is preserved).

## What this document is

The source-of-record registry for Project Memory — the editorial Cardano-ecosystem layer (project descriptions, categorizations, launch dates, taxonomy, historical ranking states). Modeled on `docs/CATALYST_SOURCE_REGISTRY.md` (the FLOW-6 Phase 2 deliverable) — same field schema, same authority class framework, same preservation status enum.

For every source the operator has identified as carrying editorial Cardano-ecosystem content, this document records the canonical primary URL, fallback secondary sources, source authority class, present-day preservation status, capture risk band, an estimate of completeness for the Cardano-ecosystem editorial layer, and any known gaps.

This is the mapping layer. The capture plan that follows it (`docs/PROJECT_MEMORY_CAPTURE_PLAN.md`, not yet drafted) will define *how* each source is captured. Capture itself comes after the plan is reviewed.

**First captures are complete (2026-06-03).** The archive lives at `~/cardano-project-memory-archive/` (repository name resolved; see Open questions). PM-1 mirrored 21 TapTools pre-SPA ranking-grid snapshots plus a 2,224-URL historical-project-metadata index; PM-2 wayback-pinned the cardanocube taxonomy root, `/projects/graveyard`, and all 20 graveyard (defunct) project profiles. All 45 archive artifacts pass `_verify/verify-archive.sh`. The remaining sources (Built on Cardano, cardano.org/discover, CIP-26 registry, DefiLlama, on-chain) are registered here but not yet captured — they are lower-urgency Band 2–4. The earlier `docs/TAPTOOLS_INVENTORY.md` read-only surface inspection downloaded no bytes for archival.

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
| Preservation status | Captured (2026-06-03). CDX returned 2,224 archived `/charts/*` URLs. **PM-1 capture finding:** server-rendered ranking content exists only in the pre-SPA era — the `/charts` root snapshots from 2022-05 to 2022-10 carry a genuine server-rendered top-N ranked token list (e.g. AADA, MELD, WMT, HOSKY, AGIX, SUNDAE…) with % changes plus the featured token's full metadata panel (volume, holders, supply, pool-created date); snapshots from 2023 onward are empty Next.js SPA shells (ranking numbers are XHR-loaded and not captured by Wayback). Mirrored: 21 grid-root snapshots (`rankings/{charts,token,nft}/`) + a 2,224-row index (`_inventory/cdx-charts-all.jsonl`). |
| Authority class | C (via Wayback) for ranking-grid + per-token + per-collection editorial; B for the OpenAPI spec page. |
| Capture risk | **Band 1** — the Wayback snapshots are themselves perishable to the extent that Wayback's own retention policy is not infinite; and TapTools live access (even read-only via Wayback) may be impacted if TapTools issues content takedowns to the Wayback Machine. |
| Completeness | Comprehensive for tokens and NFT collections that TapTools indexed during its active period; index-only for projects that TapTools did not surface as separate per-project pages (TapTools has no `/projects/{id}` route per the inventory). |
| Known gaps | **No historical-state endpoints** — TapTools never exposed historical category memberships or historical ranking states; the only place those exist is in Wayback's incidental ranking-grid captures. Coverage is incidental, not systematic. Specific per-token and per-collection editorial overlays (`/token/links` + `/nft/collection/info` payloads as captured by API) are NOT preservable from Wayback because Wayback does not capture XHR responses. The captured ranking grid HTML pages contain the editorial overlay text, however, which is the substantive recovery path. |

### cardanocube.com (canonical host; `cardanocube.io` 301-redirects)

A 2026-06-03 inspection pass returned substantive findings that shape both the capture method and a new methodology pattern for the Project Memory layer. Findings:

- **Architecture: server-rendered Ruby on Rails / Hotwire application.** Full HTML on first GET. Side-panels load lazily via Turbo frames but the main content is present in the initial response. Operationally a friendly preservation target — no SPA hydration problem, unlike TapTools.
- **No public API.** No `/api`, `/graphql`, OpenAPI surface, or documented data export. The website is the only public surface; turbo-stream fragments are not an API.
- **No robots.txt rules** (single comment line; no Disallow / Allow / Sitemap declaration). No sitemap.xml (404). No User-Agent restrictions in evidence.
- **Catalog size estimated 1,500–3,000+ projects.** Wayback Machine CDX returns ~964 distinct `/projects/{slug}` URLs on `.com` and ~1,245 on `.io` (older domain), an aggregate lower bound of ~1,500+ slugs already in Wayback.
- **73 editorial categories** at `/categories`. The taxonomy is human-curated (defi, nft, wallets, light-wallets, hardware-wallets, exchanges-dex, lending-borrowing, stablecoin, gaming, metaverse, dao-tools, governance, launchpad, oracles, identity, ispo, layer-2-solution, partner-chain, meme-coins, shitcoin, graveyard, etc.).
- **`/projects/graveyard`** — the most time-sensitive sub-target. Projects that cardanocube's curators have already declared dead. The editorial commentary attached to graveyard entries is the exact memory-layer content the Project Memory layer is designed to preserve.
- **Operator is effectively anonymous.** No /about-the-team, no jurisdiction disclosure, no named operator. Only contact: `hello@cardanocube.io` (footer). License-renegotiation paths are fragile because there is no named counterparty.
- **Terms of Service: "All rights reserved."** No Creative Commons license, no open-data clause, no affirmative grant of republication rights. The site's standard Rails-template ToS includes user-submission grants to Cardano Cube and a $100 / 12-month liability cap. Republication of the site's editorial content as bytes-in-our-archive would be a fair-use / quotation argument, not a license-backed right.

The ToS finding drives a methodology refinement that distinguishes Project Memory's cardanocube preservation pattern from the Catalyst archive's IdeaScale preservation pattern:

| Field | Value |
|---|---|
| Primary source | `https://cardanocube.com/projects/{slug}` per project; `/projects/graveyard` for the at-risk subset; `/categories/{slug}` for the taxonomy itself |
| Secondary source | Wayback Machine snapshots of the same URLs (already ~1,500 slugs indexed) |
| Preservation status | Captured (2026-06-03, wayback-pin). Site live and intact (server-rendered Rails, all major routes HTTP 200). **PM-2 capture:** pinned the taxonomy root `/categories` (~74 categories), `/projects/graveyard`, and all 20 graveyard (curator-declared dead) project profiles, with `bytes_stored:false` custody manifests (Wayback holds the bytes; the archive holds chain-of-custody references). No gaps — every targeted slug resolved via existing Wayback snapshots or a fresh Save-Page-Now. |
| Authority class | D (community-maintained) |
| Capture risk | Band 4 (community-maintained baseline). May escalate to Band 2 if cardanocube announces sunset, paywalls the catalog, or substantially restructures. |
| Completeness | Comprehensive for active community projects (1,500–3,000+ projects spanning 73 categories). Narrower than TapTools' breadth but with richer per-project editorial than the Class B Cardano Foundation sources. |
| Known gaps | (1) The site's ToS is "All rights reserved" with no Creative Commons grant. (2) Operator is effectively anonymous; a license-renegotiation conversation has no clear counterparty. (3) Update cadence is opaque — no visible `<time>` tags, no "last updated" timestamps, so deriving the recency of any given project's editorial state requires diffing across Wayback snapshots. (4) Some per-project fields (policy ID, DRep, pool) are not consistently rendered across all project pages; the schema appears to expose them per-project but uniform coverage was not confirmed in the inspection. |

**Capture method: wayback-pin, not wayback-mirror.** Given the ToS, the Project Memory layer's cardanocube preservation does NOT mirror cardanocube's bytes into our archive. Instead:

1. For each cardanocube project page targeted for preservation, the operator submits the URL to the Wayback Machine's Save Page Now (SPN) endpoint if Wayback does not already have a recent snapshot.
2. The resulting Wayback snapshot URL is recorded in a `.custody.json` manifest in our archive.
3. The manifest carries `bytes_stored: false` (new field) to indicate the archive holds a reference, not the bytes themselves. The `sha256` field is still populated — it records the SHA-256 of the Wayback-fetched content at capture time, computed for forensic evidence but not stored in the archive. Researchers verifying the manifest fetch from `wayback_url` and re-compute the hash; a match proves the captured content is what we observed.
4. The cardanocube editorial content lives on the Wayback Machine (already archive-friendly per their public-mission charter). Our archive holds the references with chain-of-custody — not the redistributed content.

This pattern preserves the Project Memory layer's value (durable references to editorial content, byte-verifiable via Wayback re-fetch) without redistributing content whose ToS does not grant republication. The companion capture plan (PROJECT_MEMORY_CAPTURE_PLAN.md, not yet drafted) will specify the wayback-pin operational details.

The wayback-pin pattern is a new addition to the Memory Layer methodology. It may retroactively apply to the FLOW-6 Catalyst archive's IdeaScale captures if the operator chooses to revisit that decision in a future amendment; that revisitation is not committed here.

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
| cardanocube.com | D | Band 4 | Live and intact (server-rendered Rails, 1,500-3,000+ projects, 73 categories, /projects/graveyard is the time-sensitive sub-target) | Comprehensive for community projects |
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

- ~~**Repository name for the second archive.**~~ **Resolved:** `cardano-project-memory-archive` (created at `~/cardano-project-memory-archive/`, scaffold mirrors `cardano-catalyst-archive`).
- **Does Project Memory warrant a §25 methodology section in `METHODOLOGY.md`?** The Catalyst pattern (§24) suggests yes for consistency. The `CARDANO_MEMORY_LAYER.md` pattern suggests the meta-methodology may be sufficient and per-layer methodology proliferation could be scope creep. Deferred decision; can be added later if needed.
- **Coordination with the on-chain Project Memory upstream.** Several DRep metadata URLs and stake-pool metadata URLs point at off-chain editorial content that overlaps with Project Memory scope. Whether to capture those alongside the dedicated Project Memory sources is a future scope decision.
- **Coordination with the Catalyst archive.** Some Catalyst proposals contain project descriptions that overlap with Project Memory scope. Cross-links between the two archives are documented as references, not data flows, per the `CARDANO_MEMORY_LAYER.md` separate-trust-boundary principle.

## Change log

- **2026-06-03 — first captures.** Status moved draft → active. Archive repository `cardano-project-memory-archive` created (scaffold mirrors `cardano-catalyst-archive`). **PM-1 (TapTools-via-Wayback, Class C, Band 1):** mirrored 21 ranking-grid root snapshots (`rankings/{charts,token,nft}/`) and a 2,224-row historical-project-metadata index (`_inventory/cdx-charts-all.jsonl`). Capture finding: only the 2022-05..2022-10 `/charts` snapshots are server-rendered with real ranking rows; 2023+ are empty SPA shells. **PM-2 (cardanocube, Class D, Band 4, wayback-pin):** pinned `/categories` (~74 categories), `/projects/graveyard`, and all 20 graveyard project profiles (`bytes_stored:false`), no gaps. All 45 archive artifacts pass `_verify/verify-archive.sh`; two wayback-pins additionally re-verified over the network. The triggering context — TapTools announced a full company wind-down on 2026-06-02 (~2 weeks to shutdown) — elevates the TapTools entry from anticipated sunset to active sunset; the Class C escalation note now applies in practice. (The live-API replacement question raised by the shutdown is tracked separately under the Cardano **Data Layer** research, `~/cardano-data-layer/`, which is out of scope for this preservation registry.)

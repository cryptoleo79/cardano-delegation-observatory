# TapTools gap analysis and preservation candidates

**Status:** analysis only. No capture, no scraping, no API key purchased, no preservation effort committed.
**Date:** 2026-06-03.
**Companion documents:** `docs/TAPTOOLS_INVENTORY.md` (Phase 1 — what surfaces exist). `docs/CARDANO_MEMORY_LAYER.md` (the philosophical frame). `METHODOLOGY.md §24` and `docs/CATALYST_ARCHIVE_REPOSITORY_DESIGN.md` (the methodology and operational pattern that any TapTools preservation effort would inherit).

## What this document is

The Phase 2–4 deliverable for the TapTools preservation-and-gap-analysis exercise. The four phases the user specified:

- **Phase 2 — Classification.** Every surface tagged A through E per the user's rubric.
- **Phase 3 — Gap analysis.** For each surface: would the data disappear, would it be expensive to reconstruct, is preservation justified.
- **Phase 4 — Ranking.** HIGH / MEDIUM / LOW preservation value.

Plus the user's three follow-on asks:
- **Preservation candidates** (which surfaces to actually pursue, if any).
- **Effort estimate** (rough sizing).
- **Recommended next actions.**

The framing the user emphasized: **What disappears forever? Not "what is useful today." What becomes impossible to reconstruct later?**

## Phase 2 — Classification

The user's five-class rubric, applied to TapTools surfaces. The classes map onto: how reconstructible is this data from non-TapTools sources?

- **A.** Publicly reproducible elsewhere (on-chain or in a durable existing mirror).
- **B.** Public but difficult to reconstruct (scattered across sources, requires cross-reference work).
- **C.** Unique historical data (a state record that exists only because someone captured it at that moment).
- **D.** Unique metadata (curated content with no equivalent canonical source).
- **E.** Should be preserved urgently (intersection of "valuable" and "perishable").

| Surface | Class | Why this class |
|---|---|---|
| Token price, OHLCV, mcap, holders, distribution | **A** | On-chain UTxO state and DEX state. Koios, Blockfrost, db-sync all expose this. Multiple durable indexers preserve. |
| Token holder lists, top-N holders | **A** | On-chain. |
| DEX pair listings, liquidity, trading volume | **A** | On-chain DEX state (Minswap, Sundae, WingRiders, etc., all AMM contracts on chain). |
| NFT mint dates, NFT trait metadata (CIP-25) | **A** | On-chain tx metadata, IPFS for asset-level metadata. |
| Network stats, epoch data | **A** | Chain protocol. |
| Stake pool data | **A** | On-chain registration + multiple community mirrors (pooltool, adapools). Out of TapTools scope. |
| **Project description, socials, website, audit links (per token)** | **D** | TapTools's `/token/links` endpoint is the canonical surface for this editorial overlay. No other Cardano-wide source carries it uniformly. cardanocube.io is the closest substitute but has narrower coverage. |
| **Project description, socials, logo (per NFT collection)** | **D** | TapTools's `/nft/collection/info`. Same situation as tokens — no equivalent canonical source. Per-collection logos sometimes pinned to IPFS but no uniform registry maps policy ID → logo URL. |
| **Subcategory taxonomy** (DeFi/GameFi/Infrastructure/...) | **D** | Purely editorial. Each ecosystem-discovery platform has its own taxonomy. TapTools's specific taxonomy is unique to TapTools. |
| **Subcategory→token mapping** (which tokens are in DeFi, etc.) | **D** | Editorial classification. Equivalent classifications exist on cardanocube and DefiLlama but with different boundaries and different coverage. |
| **Historical state of subcategory mappings** (which tokens were in which category on a given past date) | **C + E** | Not retained anywhere. TapTools itself does not expose a historical-state endpoint — only current state plus timeseries of numeric metrics. **The only place this state has ever been preserved is the Wayback Machine's incidental captures of the ranking-grid pages.** |
| **Historical top-N rankings by subcategory** (e.g., "top 20 DeFi tokens on 2024-03-15") | **C + E** | Same situation. The state existed; it was visible on TapTools on that date; it is not retained anywhere accessible today except in Wayback snapshots. |
| Project launch dates (`rankBy=age`) | **B** | For token-issuing projects, on-chain (first mint timestamp). For non-token projects (e.g., infrastructure), source unclear — TapTools may attest a launch date but the canonical reference is missing. |
| NFT collection trait rarity (TapTools-derived rarity rank) | **D** | TapTools-computed; algorithm not disclosed; small community of alternative rarity calculators exists but with different methodologies. |
| TVL per protocol | **A** | DefiLlama covers Cardano DeFi specifically. |
| Recently-updated project metadata feed (`/api/asset/recentlyUpdated`) | **C** | An edit log. The states it announces are recoverable via point-in-time `/token/links` captures, but the *fact of an edit* is itself information. Lower priority. |
| Trader UX (portfolio, alerts, watchlist, Pro features) | **excluded per user framing** | Not memory-layer content. |

## Phase 3 — Gap analysis

For each surface above (grouping by class), the user's four-part question:

### Class A surfaces (on-chain reproducible)

**Would the data disappear?** No. The Cardano blockchain self-preserves. Multiple Koios, Blockfrost, and db-sync instances are operated independently. Even if every major commercial indexer disappeared, the chain itself remains queryable by anyone willing to run a Cardano node.

**Would the metadata disappear?** No.

**Would the historical record disappear?** No.

**Would reconstruction be expensive?** No. Querying on-chain is cheap and reproducible.

**Preservation justified?** No. **LOW priority.** The memory-layer principle "on-chain self-preserves; off-chain needs work" applies cleanly.

### Class B surfaces (scattered but reconstructible)

The main item: project launch dates for non-token-issuing projects.

**Would the data disappear?** Partially. Token-issuing projects' launch dates remain recoverable from chain. Pure-frontend DApps or infrastructure projects whose launch was announced only via forum post or GitHub initial commit are less canonically preservable.

**Would reconstruction be expensive?** Manual research per project, with no single authoritative source. Plausibly hours-to-days per fund-sized batch of projects.

**Preservation justified?** Yes, but **MEDIUM priority**. The cost of reconstruction is bounded; the urgency is limited to projects whose own primary record (forum post, blog post) is itself at risk.

### Class C surfaces (unique historical states — not retained anywhere)

These are the highest-stakes items.

**Historical subcategory mappings.** TapTools's classification of a token as "DeFi" or "GameFi" on a specific past date is not stored in any endpoint TapTools exposes. The current category is queryable; the category-as-of-2024-Q2 is not. If a research question in 2030 asks "what did the Cardano DeFi space look like in early 2024?", the answer requires a snapshot of TapTools's classifications on that date — which only exists in the Wayback Machine's incidental captures.

**Historical top-N rankings.** Same situation. A ranking is a derived view; the inputs to the ranking are preservable from chain, but the ranking itself, as TapTools presented it on a specific date with TapTools's filtering decisions baked in, is not retained.

**Would these disappear?** They have already partially disappeared. TapTools never retained them; they survive only in Wayback Machine snapshots. If TapTools shuts down, the live source disappears entirely, and only Wayback's captures remain.

**Would reconstruction be expensive?** **Impossible**, not just expensive. A historical ranking depends on TapTools's filtering decisions (which tokens were indexed, spam-filtered, included in a subcategory at that time). Re-running the ranking from chain data in 2030 produces a different ranking — one based on what we know in 2030, not what TapTools showed in 2024. The historical ranking-as-presented is a perishable artifact that cannot be reconstructed from primary sources.

**Preservation justified?** **HIGH priority** — but for a specific and narrow capture target: the Wayback Machine's existing historical snapshots of `/api/market/tokens/rankings?...` and the equivalent for NFT collections. Preserve what Wayback already has; do not chase the live TapTools API.

### Class D surfaces (unique editorial metadata — TapTools-specific)

**Project descriptions, socials, websites (per token).** TapTools's `/token/links` is the canonical surface. cardanocube.io exists but is narrower in coverage. The Cardano Foundation token registry carries logo + ticker + decimals + description-of-token but typically not the broader project description.

**Would the data disappear?** If TapTools shuts down, the live API returns nothing. The Wayback Machine may have captured individual `/charts/token/{policyId.hex}/about` style pages but coverage is incidental, not comprehensive.

**Would reconstruction be expensive?** Per-project research from the project's own website, GitHub repository, Cardano Forum announcement, etc. Possible but laborious for thousands of tokens. Some projects' own websites have themselves disappeared; for those, TapTools's curated record is the only surviving description.

**Preservation justified?** **HIGH priority** for the editorial overlay (descriptions, socials, audit links, website URLs) — but with an operational caveat below regarding API-key access.

**Subcategory taxonomy itself.** The `/asset/subcategory/options` endpoint returns a small payload — a list of subcategories with their numeric IDs and human-readable names. If TapTools shuts down, this taxonomy is lost as a structured artifact, although the category *names* are recoverable from any historical TapTools snapshot (forum mentions, archived ranking grids).

**Preservation justified?** **HIGH priority — single one-shot capture, small payload.** Trivially cheap to preserve if access is available.

### Class E (urgent intersection)

In the user's rubric, Class E is the intersection of "valuable" and "perishable." Applied to TapTools, Class E concentrates in three places:

- The Wayback Machine's historical ranking-grid snapshots (already-perishable: Wayback retention isn't guaranteed forever).
- The current `/token/links` and `/nft/collection/info` editorial overlays (perishable if TapTools shuts down within the user's one-week timeframe).
- The current `/asset/subcategory/options` taxonomy (small but uniquely TapTools).

These are the actual preservation targets, if a preservation effort is mounted.

## Phase 4 — Ranking

Ranked HIGH / MEDIUM / LOW per the user's spec:

### HIGH preservation value

| Item | Source | Why HIGH |
|---|---|---|
| Wayback Machine historical snapshots of TapTools ranking-grid pages | `web.archive.org/cdx/search/cdx?url=taptools.io/*&...` | The only surviving historical-state record. Reconstruction impossible. |
| `/token/links` × every policy ID (current state) | TapTools paid API | Single most editorial-dense surface. No equivalent canonical source. |
| `/nft/collection/info` × every policy ID (current state) | TapTools paid API | Same for NFT collections. |
| `/asset/subcategory/options` (current taxonomy) | TapTools paid API | Small payload, single point of truth, defines the editorial taxonomy. |

### MEDIUM preservation value

| Item | Source | Why MEDIUM |
|---|---|---|
| Project launch dates (non-token-issuing projects) | TapTools `rankBy=age` plus manual reconstruction | Partially recoverable from chain (for token-issuing) and from forum archives (otherwise). |
| NFT collection grouping (where multiple policies belong to one "project") | TapTools editorial | Sometimes editorial; sometimes recoverable from CIP-66 collection contracts on chain. |
| `/asset/recentlyUpdated` feed (the edit log) | TapTools API | The states are recoverable from point-in-time `/token/links` captures; the *fact* of edits is supplementary information. |

### LOW preservation value (or out of scope)

| Item | Source | Why LOW |
|---|---|---|
| Token prices, OHLCV, mcap, holders, distribution | Chain + DEX state | On-chain reproducible. |
| DEX pair listings, liquidity, volume | Chain | On-chain reproducible. |
| Stake pool data | Multiple community mirrors | Redundant. |
| TVL per protocol | DefiLlama | Already preserved. |
| Network stats, epoch data | Chain | Self-preserving. |
| All trader UX (portfolio, alerts, watchlist, Pro) | TapTools | Explicitly excluded per user framing. |

## Preservation candidates

Concretely, four candidate efforts a future preservation initiative could pursue, in priority order:

### Candidate 1 — Wayback CDX enumeration of TapTools historical rankings

Mirror the pattern that worked for IdeaScale in FLOW-6 Phase 3. Issue a CDX query against `web.archive.org/cdx/search/cdx?url=taptools.io/charts/*` and similar paths to enumerate what the Wayback Machine has archived. For each archived URL with ranking-grid or category-list content, fetch the Wayback snapshot and preserve it locally with full chain-of-custody manifest per `METHODOLOGY.md §24.4`.

**Why first.** This candidate is the only one that addresses the Class E intersection of "uniquely historical + perishable" without requiring a TapTools API key. The Wayback Machine has done most of the preservation already; FLOW-6's IdeaScale-via-Wayback pattern applies cleanly.

**Output.** A `taptools-archive/wayback/` folder paralleling the Catalyst archive's `ideascale/` folder. Per-snapshot HTML + custody manifest + SHA-256 + Wayback URL.

**Cost.** Negligible monetary. ~1 week of work for enumeration + capture + manifest generation, similar to the IdeaScale capture effort.

### Candidate 2 — TapTools current-state editorial snapshot via paid API

Subscribe to a TapTools API tier sufficient to issue `/token/links`, `/nft/collection/info`, and `/asset/subcategory/options` calls comprehensively. One-time capture. Store the resulting JSON with chain-of-custody.

**Why second.** This candidate addresses HIGH-priority Class D content but **runs against the `CARDANO_MEMORY_LAYER.md` "ordinary researcher reproducibility" principle**. Any researcher who later wants to verify the capture would need their own TapTools API subscription. This is more like "paid commerce" than "private arrangement" — any researcher can buy access — but the verification reproducibility is impaired.

**Operational caveat.** TapTools's API terms of service may prohibit redistribution of API output. **Review the terms before subscribing; if redistribution is prohibited, this candidate is not viable** and the preservation effort defaults to Candidate 3 (which uses only public Wayback content).

**Cost.** Unknown subscription fee. The estimate would be: API tier sufficient to enumerate thousands of policies, single one-shot capture session.

### Candidate 3 — cardanocube.io as a preservable cardanocube → secondary preservation effort

If TapTools API access is not pursued (Candidate 2 declined), the next-best editorial coverage of the Cardano ecosystem lives at `cardanocube.io`. The site is community-maintained, smaller in coverage than TapTools, but accessible without API keys. Preserving cardanocube — using the same Wayback-CDX-plus-direct-fetch pattern — would partially mitigate the loss of TapTools's editorial layer.

**Why third.** This candidate shifts the preservation target from TapTools (which carries access friction) to a more open community source. It is partial — cardanocube has narrower coverage — but it satisfies the ordinary-researcher-reproducibility principle.

**Cost.** Similar to Catalyst's projectcatalyst.io capture: per-page fetch, manifest, Wayback submission. ~1 week of work.

### Candidate 4 — Combined Cardano ecosystem editorial registry (longer-term)

If the preservation effort is taken seriously as a long-term commitment rather than a one-time defensive snapshot, the right target is a cross-source registry that draws from cardanocube + Cardano Foundation's "Built on Cardano" listing + `cardano.org/discover` + DappRadar Cardano subset + any TapTools content that is captured via Candidates 1–3. The registry would be a structured rendering of "what Cardano projects existed, what they did, when they launched" with chain-of-custody pointing at each contributing source.

**Why fourth.** This is the most ambitious candidate and the most aligned with the `CARDANO_MEMORY_LAYER.md` vision (Project Memory as a fourth layer). It is also the most expensive and the least one-week-actionable.

**Cost.** Multi-month effort. Probably out of scope for the immediate one-week window the user mentioned; appropriate as a Phase 2 target if Phase 1 (Candidate 1) establishes that the work is worth doing.

## Effort estimate

A rough budget for each candidate, expressed in operator-days:

| Candidate | Operator days | External cost | Risk |
|---|---|---|---|
| 1. Wayback CDX enumeration of TapTools | 3–5 | Zero | Low — pattern proven by FLOW-6 IdeaScale work |
| 2. TapTools API snapshot | 2–4 + ToS review + subscription procurement | API subscription fee, unknown | Medium — depends on ToS allowing redistribution; depends on TapTools remaining operational long enough to complete subscription + capture |
| 3. cardanocube preservation | 4–7 | Zero | Low |
| 4. Cross-source editorial registry | 30–60 | Zero | Medium — scope drift risk |

Combined minimum viable preservation (Candidates 1 + 3): roughly **2 operator-weeks** plus standard chain-of-custody overhead. This buys the Wayback historical layer and the open-community editorial layer, without engaging TapTools commercially.

Candidate 2 adds the editorial overlay TapTools uniquely carries; the question is whether the ToS allows redistribution.

Candidate 4 is a separate, larger commitment that this analysis defers.

## Recommended next actions

In priority order, with explicit decision gates:

1. **Read TapTools's Terms of Service for the API.** Specifically: does the ToS permit redistributing API output, or does it restrict the data to internal use only? This single question determines whether Candidate 2 is viable. **Until this is answered, no API subscription should be initiated.**

2. **Execute Candidate 1 (Wayback CDX enumeration of TapTools).** This is methodologically uncontroversial: the Wayback Machine has the snapshots already; FLOW-6's IdeaScale pattern preserves them with chain-of-custody. No API key, no ToS concern, no commercial relationship. Operator can proceed without further analysis.

3. **Decide on Candidate 2 based on the ToS read.** If redistribution is permitted: subscribe, capture, preserve, terminate subscription. If redistribution is not permitted: Candidate 2 is declined; preservation falls back to Candidate 3.

4. **Execute Candidate 3 (cardanocube preservation).** Regardless of the Candidate 2 decision, cardanocube is an ordinary-researcher-reproducible source that the memory layer should preserve. Lower urgency than Candidate 1 (cardanocube is not in announced sunset) but operationally similar.

5. **Defer Candidate 4 (cross-source registry).** Do not commit to building Project Memory as a fourth memory layer until the immediate preservation work above is complete and the operator has reassessed scope and capacity.

6. **Do NOT build a TapTools replacement.** The user's framing is explicit on this point and the principles in `CARDANO_MEMORY_LAYER.md` reinforce it. Trader UX, alerts, portfolio tracking, watchlists are not memory work.

7. **Add to the Cardano Memory Layer document an explicit note** that Project Memory's first preservation candidate is Wayback-sourced TapTools content, not TapTools itself directly. The Wayback Machine becomes the canonical source for TapTools the way it became the canonical source for IdeaScale in FLOW-6.

## What can be added to the observatory ecosystem versus what should become a separate archive

Per `CARDANO_MEMORY_LAYER.md`'s separate-trust-boundary principle:

- **Observatory ecosystem (this repo):** the methodology section that defines Project Memory's scope, principles, and source authority hierarchy — if and when Project Memory is committed to as a fourth layer. Methodology, not artifacts.
- **Separate archive (new repository):** the captured artifacts themselves — Wayback snapshots, cardanocube mirror, any TapTools API output. Proposed name: `cardano-project-memory-archive` or `cardano-ecosystem-archive`. Same separation-of-concerns as `cardano-catalyst-archive` (FLOW-6).

The observatory's deployment, ETL, and database are not appropriate hosts for the ecosystem editorial layer. Different lifecycle, different content shape, different reviewer pool.

## Open question — operator decision

The user has asked for the analysis; the deliverable is this document plus the inventory. The operator's decision after reading is one of:

- **Pursue Candidate 1 only.** Wayback-sourced TapTools preservation. Methodologically clean, no commercial exposure, partial coverage. Estimated 1 operator-week.
- **Pursue Candidates 1 + 3.** Adds cardanocube. Still no commercial exposure. Estimated 2 operator-weeks.
- **Pursue 1 + 2 + 3.** Adds the TapTools API snapshot if ToS allows. Most coverage; commercial exposure; depends on ToS review.
- **Pursue none.** Defer all TapTools preservation; treat the inventory + gap analysis as the deliverable and reassess if a sunset announcement appears.

This document does not pre-decide. The operator decides after reading. The author's recommendation, weighing the user's "one week" framing and the FLOW-6 precedent: **Candidates 1 + 3, with Candidate 2 gated on ToS review.** This is the option that maximizes coverage while preserving the ordinary-researcher-reproducibility principle.

## Closing observation

The most important sentence in this analysis is the user's own: **"What disappears forever? Not what is useful today. What becomes impossible to reconstruct later?"**

Applied to TapTools, the answer is small and specific. Most of what TapTools shows is reconstructible from chain. The irreducibly perishable surface is the editorial layer — taxonomy, project descriptions, historical category memberships — concentrated in three API endpoints plus the Wayback Machine's incidental historical captures.

A focused preservation effort on those targets is a tractable one-to-two-week project. Trying to "preserve TapTools" as a whole is not the goal and not the right framing. Preserving the Cardano ecosystem's editorial memory layer — using TapTools as one source among several — is the goal. This document is the basis for deciding whether that work is worth doing now.

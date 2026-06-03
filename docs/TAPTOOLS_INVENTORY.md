# TapTools surface inventory

**Status:** read-only inspection, 2026-06-03.
**Method:** Wayback CDX enumeration of public route stems + OpenAPI spec read + robots.txt inspection. No bytes downloaded for archival. No API key issued. No automated harvesting.
**Companion documents:** `docs/TAPTOOLS_GAP_ANALYSIS.md` (Phase 2-4 — classification, gap analysis, ranking, candidates, effort). `docs/CARDANO_MEMORY_LAYER.md` (the philosophical frame this inventory feeds into).

## What this document is

A surface-by-surface map of `taptools.io`, written as Phase 1 of the TapTools preservation-and-gap-analysis exercise the user requested on 2026-06-03. The inventory's purpose is to identify *what could disappear* — not to clone TapTools, not to plan a replacement, not to enumerate trader UX features. The user's framing is preservation, not product replication.

## Site architecture (load-bearing facts)

These facts shape every preservation question that follows. They came out of the inspection pass and they constrain what is possible.

1. **TapTools is a Next.js single-page application deployed on Vercel.** Direct HTML fetches return empty pages — there is no server-rendered content. Every visible datum is hydrated client-side from `/api/*` XHR calls. **Crawling the public site does not preserve any data; mirroring the HTML mirrors an empty shell.** This is the same architectural reality as today's `cardano.ideascale.com` and forces the same preservation conclusion: live mirroring is futile.
2. **There is a documented public API at `https://openapi.taptools.io/`.** A 109 KB ReDoc-rendered OpenAPI specification. The spec is the authoritative description of what TapTools stores. Every documented endpoint requires an API key. The 401/429 error handling is documented. The spec itself is publicly readable; the data behind it is not.
3. **`robots.txt` is permissive.** `User-agent: *  Allow: /`. Explicit `Allow: /charts/token/`. Disallow only on internal next.js paths (`/pages/api/`, etc.). A `sitemap.xml` is declared at the root. Automated access to the public surfaces is permitted by the site's own policy.
4. **The Wayback Machine has indexed TapTools historically.** A CDX query yields ~2000 archived URLs across the lifetime of the site. Per-token-chart pages, ranking grid snapshots, and OpenAPI page snapshots are all present. The Wayback snapshots may carry editorial state from earlier dates — content that the live API no longer surfaces.
5. **There is no public ownership or jurisdiction disclosure on the site.** No `/about`, no `/team`, no `/company` page in 2000 CDX records. Only legal stubs at `/advertising-terms` and `/api-terms`. The operator's identity, location, and accountability surface are not part of the public archive.

## Surface inventory

The user's twelve listed surface classes, mapped to what TapTools actually exposes. Surfaces are organized by frontend route stem; the data shown on each is described in terms of what would be lost if the surface disappeared.

### Frontend routes (server-discoverable)

| Route | Description | Per | Editorial content present? |
|---|---|---|---|
| `/` | Homepage. Top-50 ranking grid with filters (`subcategory`, `rankBy=mcap/volume/age/trades/holders/liquidity`, `timeframe`), watchlist, market overview | mixed | Yes — the subcategory taxonomy is editorial |
| `/charts/token/{policyId.hexName}` or `/charts/token/{ticker}` | Per-token page. Chart + metadata + holders + trades + socials | per-token | Yes — description, socials, project association |
| `/charts/nft/{policyId}` | Per-NFT-collection page. Chart + floor + sales + traits + listings + holders + description | per-collection | Yes — description, socials, logo |
| `/charts` | Hub page | — | — |
| `/advertising-terms`, `/api-terms` | Legal stubs | — | — |

There is **no** `/projects/{id}` route, no `/categories` route, no per-project profile page distinct from the token or collection chart pages. **Project metadata lives only as overlay editorial on a token or collection page** — there is no canonical per-project profile URL the way other ecosystem directories provide. This is structurally important: a preservation effort that captured project profiles would have to enumerate every tokenized or collection-fronted project on TapTools, then capture the editorial overlay on each chart page.

The Wayback CDX returned no `/about`, `/team`, `/blog`, `/pricing`, or `/projects/...` routes. The 2000-URL sample is dominated by `/charts/token/` and `/charts/nft/` paths. This confirms the structure: TapTools is a per-asset chart engine with editorial overlays, not a per-project directory.

### `/api/*` endpoints visible in Wayback XHR captures (internal, not part of documented public API)

These are the XHR calls the SPA itself makes to populate frontend pages. They are not part of the documented `openapi.taptools.io` surface but are observable in Wayback's captured network panels.

| Endpoint | Data | Memory-layer relevance |
|---|---|---|
| `/api/asset/subcategory/options` | **The full subcategory taxonomy** (DeFi, GameFi, Infrastructure, etc.) | **HIGH — purely editorial, no other source** |
| `/api/asset/token/get?policyID=...&assetName=...` | Per-token data blob | Mixed — some editorial, mostly chain-derived |
| `/api/asset/recentlyUpdated?type=tokens` | Feed of recently-edited project metadata | HIGH — implies an edit log the public site exposes |
| `/api/market/tokens/rankings` | Leaderboards filterable by `rankBy=mcap/volume/trades/age/holders/liquidity` and `subcategory` | Mixed — rankings are reproducible but **subcategory→token-list mapping is editorial** |
| `/api/market/tokens/topMovers`, `topTrending`, `recentlyAdded/extended`, `recentlyBoosted`, `ticker`, `trades`, `trading/stats` | Various market views | Low — reproducible from DEX |
| `/api/market/tokens/pairs/all?tokenID=N` | DEX pair listing per token | Low — reproducible from on-chain DEX state |
| `/api/market/pairs/ohlcv?pairID=...` | OHLCV per pair | Low — chain/DEX reproducible |
| `/api/cardano/stats/current`, `/api/epoch`, `/api/v1/market/stats` | Network and global stats | Low — chain reproducible |
| `/api/og/token/{policyId.assetName}` | Open Graph share image | Low — derived |

### Documented OpenAPI endpoints — `openapi.taptools.io` (API-key gated)

The public OpenAPI spec is grouped under tag groups: Metrics, Market, Market » NFTs, Market » Tokens, Onchain » Asset / Address / Transaction, Wallet » Portfolio, Integration. The endpoints with memory-layer value:

| Endpoint | Category | What it stores | Memory-layer value |
|---|---|---|---|
| **`GET /token/links`** | Market » Tokens | Per-token editorial: `description`, `website`, `twitter`, `discord`, `telegram`, `github`, `medium`, `reddit`, `youtube`, `facebook`, `instagram`, `email` | **HIGHEST** — the irreducible editorial surface |
| **`GET /nft/collection/info`** | Market » NFTs | Per-collection editorial: description, socials, logo, policy ID, project association | **HIGHEST** — equivalent editorial surface for NFTs |
| **`GET /asset/subcategory/options`** (via internal `/api/`) | n/a | The full categorization taxonomy itself | **HIGHEST** — small payload, single point of truth |
| `GET /token/holders`, `/token/mcap`, `/token/ohlcv`, `/token/pools`, `/token/prices`, `/token/quote`, `/token/trades`, `/token/indicators`, `/token/trading/stats` | Tokens | Computed/timeseries | LOW — chain/DEX reproducible |
| `GET /token/debt/loans`, `/token/debt/offers` | Tokens | DeFi lending state | LOW-MEDIUM — chain reproducible from lending protocols |
| `GET /token/top/{mcap,volume,liquidity}` | Tokens | Rankings | LOW for ranking; **MEDIUM if historical snapshots** of these rankings are accessible (which OpenAPI does NOT expose) |
| `GET /nft/collection/{assets,stats,stats/extended,trades,trades/stats,listings,listings/depth,listings/individual,listings/trended,ohlcv,volume/trended,holders/{top,distribution,trended},traits/{price,rarity,rarity/rank}}` | NFTs | Per-collection analytics | Mostly LOW; **traits/rarity is partially editorial** when the collection's rarity assignment is TapTools-derived rather than mint-time-defined |
| `GET /nft/asset/{sales,stats,traits}` | NFTs | Per-NFT | LOW — chain |
| `GET /nft/top/{volume,timeframe}`, `/nft/market{,/extended}`, `/nft/marketplace/stats`, `/nft/market/volume/trended` | NFTs | Market-wide rankings | LOW |
| `GET /asset/supply`, `/address/{info,utxos}`, `/transaction/utxos` | Onchain | Direct chain | LOW — reproducible by definition |
| `GET /wallet/portfolio/positions`, `/wallet/trades/tokens`, `/wallet/value/trended` | Wallet | Trader UX | **EXCLUDED** per user framing — not memory |
| `GET /market/stats`, `/metrics`, `/integration/*` | Aggregate | Aggregate market state | LOW |

### Surfaces explicitly absent

The user's twelve listed surface classes include some surfaces TapTools simply does not have. These absences are themselves informative.

| Surface (per user's list) | Present? | Notes |
|---|---|---|
| Project pages | **No distinct route.** Folded into `/charts/token/{id}` and `/charts/nft/{id}`. Project metadata lives only as overlay editorial on a chart page. |
| Token pages | Yes (`/charts/token/`) |
| NFT collection pages | Yes (`/charts/nft/`) |
| Ecosystem directory | **No `/directory` route.** Implemented as filterable home grid with `?subcategory=N`. |
| Categories | **Editorial taxonomy, no /categories page.** Served via `/api/asset/subcategory/options`. |
| Rankings | Yes, computed |
| Launch dates | Partial — `rankBy=age` exists in rankings; explicit launch-date field not visible in OpenAPI schema, source unclear (likely first-trade timestamp) |
| Metadata (whitepaper / audit / team) | **Thin.** `/token/links` carries socials + description + website but NOT whitepaper, audit, or team fields. The editorial layer is shallower than other ecosystem directories provide. |
| Policy IDs | **Canonical identifier**, visible directly in URL paths |
| Market pages | Yes — DEX OHLCV, trading pairs |
| Analytics pages | Yes — `*/trended` endpoints for various metrics |
| Historical pages (project lists / category memberships over time) | **Not retained anywhere TapTools exposes.** No historical-state endpoint in OpenAPI; only current-state plus timeseries of metrics. **This is the highest-value preservation gap.** |

## Authentication and paywall

- **Public, no login:** chart pages, ranking grid, OpenAPI spec page.
- **Account-required:** watchlist (`?favorites=1`), portfolio.
- **TapTools Pro (paid tier):** `?pageType=PRO` and `?proModal=1` modals exist. Pro gates portfolio depth, alerts, some analytics. **Trader UX surface — explicitly excluded from preservation scope per user framing.**
- **API key required:** every documented OpenAPI endpoint. The API is the only programmatic access to the data; the website does not expose it without an account-bound session.

## Catalog size estimate

The inspection pass could not determine catalog cardinality from the read-only surface. The home grid is dynamically paginated; the OpenAPI spec documents endpoints but not cardinality. Wayback CDX shows ~2000 archived URLs, most of which are individual `/charts/token/` and `/charts/nft/` pages — this is the count of *captured* assets, not the count of assets TapTools indexes. Likely an order of magnitude or more uncaptured.

For preservation effort sizing, the rough estimate is:
- Cardano native tokens with any meaningful presence: thousands (5,000–15,000 plausibly)
- Cardano NFT collections with any meaningful presence: thousands (3,000–10,000 plausibly)
- Subcategories: small (probably <100, possibly <50)

The cardinality matters because it determines whether a one-time `/token/links` × every-policy-ID enumeration is a manageable capture session or a multi-day undertaking. The gap analysis in `TAPTOOLS_GAP_ANALYSIS.md` discusses this.

## Where the editorial memory layer concentrates

Synthesis of the inventory: across the entire TapTools surface, the editorial Cardano-ecosystem layer concentrates in **three small endpoints**:

1. **`/asset/subcategory/options`** — the taxonomy itself. Small payload. Single one-shot capture. Without this, no one can later reconstruct what TapTools considered the categories of the Cardano ecosystem.
2. **`/token/links` × every policy ID** — the curated description + socials per token. Large payload (thousands of tokens). The single most editorial-dense surface on the site.
3. **`/nft/collection/info` × every policy ID** — the equivalent for NFT collections. Similar volume.

Plus, for retrospective rankings:

4. **Wayback Machine historical snapshots** of `/api/market/tokens/rankings?subcategory=N&rankBy=mcap` per subcategory per date — the only place where TapTools's historical category memberships and ranking states are preserved at all. Their existence is incidental to TapTools's own architecture; the Wayback Machine captured them by visiting the site over time.

Plus, as a supplementary signal:

5. **`/asset/recentlyUpdated?type=tokens`** — the project-edit feed. Periodic captures of this endpoint would record which projects' metadata changed when. Lower priority but cheap to add.

Everything else on TapTools is either reproducible from on-chain / DEX state, or is trader UX that the user has explicitly excluded from preservation scope.

## Inventory pass conclusion

The TapTools surface, viewed through the preservation lens, has a **small irreducible memory-layer payload concentrated in 2-3 API endpoints plus the Wayback Machine's incidental historical archive**. The rest of the surface is replaceable, reproducible, or out of scope.

This is a significantly more focused preservation question than "preserve all of TapTools." The gap analysis (`docs/TAPTOOLS_GAP_ANALYSIS.md`) takes this inventory and decides whether to preserve, what to preserve, how much effort to invest, and where the preserved content should live.

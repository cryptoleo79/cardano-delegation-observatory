# Market reality research — feasibility study for a Cardano market-observability layer

**Status:** research only. No code, no charts, no schema, no conclusions, no recommendation to build. This document inventories sources and classifies feasibility. Nothing here commits the Observatory to standing anything up.
**Date:** 2026-06-05.
**Companion sources:** `~/cardano-data-layer/CARDANO_API_REGISTRY.md` (the source map this study builds on), `docs/TAPTOOLS_GAP_ANALYSIS.md`, `docs/CARDANO_MEMORY_LAYER.md`, `METHODOLOGY.md §24` (authority classes).

---

## 0. THE RULE — observability, not attribution

> **This layer measures WHAT happened and WHEN. It never asserts WHY, or WHO caused it.**

This is the binding constraint on every signal below. It is not a stylistic preference; it is the line that separates a defensible record from speculation.

**Allowed (descriptive, time-anchored, falsifiable):**
- "Event X occurred on date Y."
- "Over the N days following date Y, ADA/USD moved Z%."
- "On date Y, M ADA was withdrawn from the treasury via governance action G."
- "A single transaction moving K ADA was recorded in block B at time T."

**Forbidden (causal / intent / identity / blame):**
- "ADA fell *because* TapTools shut down." (causation)
- "Whales *dumped* ADA *to* crash the price." (intent + blame)
- "This wallet *belongs to* exchange E / person P." (real-world identity attribution, unless self-disclosed and on-chain-verifiable)
- "The treasury withdrawal was *to fund* project P." (motive — even when plausible)
- "Smart money is *accumulating*." (intent + identity cluster)

**Why the rule matters technically, not just editorially:** Cardano is an (extended) UTXO chain. Wallets routinely generate fresh change addresses per transaction, and a single transaction can legitimately carry inputs from multiple independent signers (multi-sig, `cardano-cli` collaborative spends, shared-send constructions). This breaks the "common-input-ownership" heuristic that whale/entity attribution depends on, and produces false-positive clusters. So even *if* we wanted to attribute, the chain's data model makes identity inference unreliable — which is exactly why the observability framing is the honest one. Sources: [Cardano eUTXO model — Developer Portal](https://developers.cardano.org/docs/learn/core-concepts/eutxo/); [Heuristic-Based Address Clustering in Cardano Blockchain (arXiv 2503.09327)](https://arxiv.org/html/2503.09327v1); [Cardano shared-send transaction untangling (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S2096720924000824).

**Reliability vocabulary used below:**
- **Class A — on-chain, reproducible.** Derivable from the ledger by anyone running a node / db-sync. Independently verifiable. Highest trust.
- **Class B — official off-chain.** Published by Cardano-aligned bodies (IO, Intersect, Catalyst). Authoritative but not chain-verifiable.
- **Class C — at-risk / proprietary platform.** Commercial third party; data often unverifiable, redistribution restricted, platform may sunset.
- **Class D — community.** Open-ish but single-operator or undocumented.
- **Third-party / CEX-derived** is called out explicitly as the *weakest* tier wherever it appears.

**Availability vocabulary:** **LIVE** = public source works today · **PARTIAL** = obtainable but incomplete, gated, or undocumented · **MISSING** = no usable public source.

---

## 1. Signal-by-signal source matrix

Each signal: **source(s)**, **availability**, **reliability/class**, **cost**, **retention** (how far back history goes and whether it is retained).

### 1.1 ADA price (ADA/USD, ADA/BTC) and trading volume

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| [CoinGecko API](https://www.coingecko.com/en/api) | **LIVE** | Third-party aggregate (off-chain, CEX-sourced). Mid-trust. | Demo free: ~30 calls/min, 10k calls/mo. Paid from a low monthly tier. | Free tier ~365 days of history; paid plans reach back to 2013–2014. Granularity auto-degrades over long windows. |
| [CoinMarketCap API](https://coinmarketcap.com/api/pricing/) | **LIVE** | Third-party aggregate (off-chain). Mid-trust. | Free Basic tier with monthly call cap; historical endpoints gated to paid. | Historical depth gated by tier. |
| ADA/BTC pair | **LIVE** (CoinGecko/CMC) | Third-party. | as above | as above |
| On-chain DEX-implied ADA/USD (via stablecoin pairs) | **PARTIAL** | **Class A** for the swap rate; "USD" leg depends on a stablecoin peg holding. | free (Minswap/DexHunter/Charli3 per registry) | as long as the indexer keeps it |

**Honest caveat:** the *canonical* ADA/USD and trading-volume numbers are **CEX-derived and third-party** — they are not reproducible from the Cardano chain. "Volume" especially is whatever the aggregator's contributing venues report; it can include wash trading we cannot see or correct. Treat price/volume as the *lowest-trust* numeric inputs after exchange flows. The ADA/BTC ratio is doubly off-chain (neither leg is on Cardano).

### 1.2 DEX volume / liquidity (on-chain)

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| [Minswap API](https://api-mainnet-prod.minswap.org) | **LIVE** | **Class A/C** — reflects on-chain AMM state; hosted by the DEX. High for Minswap scope. | free/public | indexer-retained (timeseries + candles exposed) |
| [DexHunter](https://api-us.dexhunterv3.app) | **LIVE** | **Class A/C** — aggregates 15+ DEXes; proprietary host. | keyed; "free for devs" (unverified ToS) | undocumented |
| [Charli3](https://api.charli3.io/api/v1) | **LIVE** | Class C oracle; aggregate manipulation-resistant price. | key (pricing unverified) | undocumented |
| [DefiLlama](https://api-docs.defillama.com/) — [Cardano chain](https://defillama.com/chain/cardano), [Minswap](https://defillama.com/protocol/minswap) | **LIVE** (chain/DEX level) | Class D, open data. Strong for chain/protocol TVL & DEX volume; weak on per-native-token granularity. | free; Pro for some endpoints | historical TVL/volume retained |
| Self-host db-sync + DEX contract decoding | **LIVE (self-host)** | **Class A**, fully reproducible | infra only | full chain history |

**Note:** DEX volume and liquidity are genuinely **Class A** — they are functions of on-chain AMM contract state and swap transactions. They can be reconstructed independently from the ledger. This is one of the stronger signals. The weakness is *coverage assembly* (no single free API spans every DEX post-TapTools) and the USD-denomination leg (see 1.1).

### 1.3 Exchange inflows / outflows (CEX deposit / withdrawal flows)

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| [CryptoQuant](https://cryptoquant.com/asset/ada/chart/exchange-flows/exchange-reserve) | **PARTIAL** | **Third-party, weakest tier.** Depends on CryptoQuant's *private* exchange-address labels. | Free tier severely limited; Data API gated to Professional (~$109/mo) and above; full export at Premium (~$799/mo). | full history on paid tiers |
| [Glassnode](https://docs.glassnode.com/data/metric-catalog) | **PARTIAL** | **Third-party, weakest tier.** ADA in coverage; exchange-flow metrics are higher-tier. | API is Professional-only (~$79/mo individual; enterprise higher); free tier is Tier-1 daily metrics only. | tier-dependent |
| Self-derived from chain | **MISSING / not reliably reproducible** | Would require our *own* exchange-address label set | infra + ongoing labeling | n/a |

**This is the single weakest and most-caveated signal.** Critical honesty points:
1. "Exchange flow" is **not on-chain truth.** The chain shows ADA moving between addresses. Calling an address "a Binance hot wallet" is a *third-party label*, applied by CryptoQuant/Glassnode using proprietary heuristics they do not publish and we cannot audit.
2. On a UTXO chain with per-tx change addresses, those labels are **harder to maintain** than on account-based chains and are subject to false positives ([arXiv 2503.09327](https://arxiv.org/html/2503.09327v1)).
3. The numbers are **proprietary, paywalled, and non-reproducible.** Two providers can disagree, and we cannot reconcile them from first principles.
4. Under the observability rule, the *most* we can ever say is "an address that source S labels as belonging to exchange E received/sent K ADA on date Y" — explicitly tagging the label as a third-party claim, never as fact, and never inferring intent.

### 1.4 "Whale" / large-wallet movement (large on-chain transfers)

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| Koios / Blockfrost / db-sync (large-tx detection by ADA amount) | **LIVE** | **Class A** for the *movement*; reproducible | free / infra | full chain history |
| [Arkham Intelligence](https://intel.arkm.com/) | **PARTIAL** | Third-party *identity labels*; EVM-centric, Cardano UTXO coverage weaker | freemium / paid | platform-retained |
| [Nansen](https://nansen.ai/) | **PARTIAL** | Third-party labels; primarily EVM | paid | platform-retained |
| Whale-Alert / adawhales.com / WhenADA | **PARTIAL** | Class D feeds; threshold alerts | free/freemium | feed-dependent |

**Split the signal honestly:**
- **The transfer itself** (amount, block, timestamp, from/to address) is **Class A and fully observable.** "A transaction moving K ADA was recorded in block B at time T" is squarely allowed.
- **"Whale identity"** — that the address is a specific person, fund, or that several addresses are one "whale" — is **attribution, forbidden, and unreliable** on Cardano for the eUTXO/clustering reasons above. Arkham/Nansen labels exist but are weakest-tier third-party claims and thin on Cardano.
- A defensible observable: count and total value of transfers above a fixed ADA threshold per day. An indefensible one: "whales are accumulating/distributing."

### 1.5 Treasury movement (Cardano treasury balance + withdrawals)

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| Koios `/totals`, `/treasury_withdrawals`, proposal endpoints | **LIVE** | **Class A**, reproducible | free tiers | full history |
| Blockfrost governance/proposals (`treasuryWithdrawals`) | **LIVE / PARTIAL** | **Class A** for withdrawals; balance is derived | free tier | full |
| Self-host db-sync (pots/ada_pots tables) | **LIVE (self-host)** | **Class A**, canonical | infra | full |
| [Cardano Treasury Explorer](https://cardano.org/apps/cardano-treasury-explorer/) | **LIVE** (UI) | Class B/D value-add over chain data | free UI | UI |

**Strong signal.** The treasury is a protocol-level virtual pot, filled each epoch from monetary expansion (ρ = 0.3% of reserves/epoch) and a share (τ) of the rewards pot; withdrawals now flow through Conway governance actions. Both balance (per-epoch) and withdrawals (per governance action) are **on-chain and reproducible**. Sources: [Cardano monetary policy](https://docs.cardano.org/about-cardano/explore-more/monetary-policy); registry §1, §5. The only caveat: balance is *derived* (`/totals` + epoch pots), not a single named endpoint.

### 1.6 DRep activity (registrations, voting power, votes)

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| Koios governance (`/drep_list`, `/drep_info`, `/drep_votes`, `/drep_delegators`, `/vote_list`) | **LIVE** | **Class A**, reproducible (requires db-sync ≥13.2) | free tiers | full (since Chang/Conway) |
| Blockfrost `/governance/dreps*` | **LIVE** | **Class A** | free tier | full |
| Self-host db-sync | **LIVE (self-host)** | **Class A** | infra | full |
| DRep *metadata* (CIP-119 anchor URL+hash) | **PARTIAL** | Class A pointer; off-chain target is **link-rot-exposed** | free | only if anchor resolves / was cached |

**Strong on-chain signal.** Registrations, delegated voting power, and individual votes are all on-chain since the Conway era began (Chang, 2024-09-01). The perishable part is **off-chain metadata** behind anchor links — names, rationales — which can rot; Koios/Blockfrost proxy/cache it but resolution is not guaranteed.

### 1.7 Governance actions (proposals, outcomes)

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| Koios `/proposal_list`, `/proposal_voting_summary`, `/vote_list`, `/committee_info` | **LIVE** | **Class A**, reproducible | free tiers | full |
| Blockfrost `/governance/proposals*` | **LIVE** | **Class A** | free tier | full |
| [gov.tools / GovTool](https://gov.tools) backend | **PARTIAL** | Class A/B; Intersect discourages external use of the public backend | free (self-host) | full on-chain part |
| GovTool **Proposal Pillar** (off-chain draft proposals + discussion) | **PARTIAL** | Class B, **unique, no alternative source**; data-use policy "TBD" | free | only via that service |
| Aggregator UIs (1694.io, AdaStat, Cexplorer) | **PARTIAL** | Class C/D, UI-only (no documented API) | free UI | UI |

**Strong on-chain signal for enacted actions and outcomes.** The weak/perishable edge is **pre-chain draft proposals and discussion** (Proposal Pillar), which exist off-chain only and have no second source.

### 1.8 Catalyst events (funds, milestones, funding outcomes)

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| [projectcatalyst.io](https://projectcatalyst.io) | **PARTIAL** | Class B; **no programmatic API** — per-fund CSV/PDF result files only | free (web/files) | only as long as pages/files stay up |
| [Catalyst Explorer (Lidonation)](https://www.lidonation.com/catalyst-explorer/api) | **PARTIAL→LIVE** | Class B/D, Apache-2.0; best aggregator; single-operator risk | free | aggregator-retained |
| IdeaScale (`cardano.ideascale.com/a/rest/...`) | **PARTIAL — at-risk** | Class C; admin-token-gated, vendor-controlled, **being sunset** | key + admin token | **perishable** — historical proposal text/comments may become unrecoverable |
| Jörmungandr legacy voting data | **PARTIAL** | Class B/community; deprecated infra, survives via archives | — | archive-only, very high replacement difficulty |

**Mixed and partly perishable.** Funding *outcomes* are published (Class B). On-chain voting for recent funds is reproducible. But **early-fund proposal text/comments (IdeaScale) and legacy Jörmungandr votes are at-risk** — this is the subject of the separate IdeaScale preservation effort and FLOW-6 planning. Catalyst has *no clean programmatic API*; observability here depends on archival capture.

### 1.9 Hard forks / protocol upgrades

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| [cardano.org/hardforks](https://cardano.org/hardforks/) | **LIVE** | Class B, authoritative | free | permanent (canonical list) |
| On-chain epoch/protocol-version bump (Koios/Blockfrost/db-sync) | **LIVE** | **Class A** — the version change is recorded at the boundary epoch | free / infra | full |

**Strongest, smallest signal.** Hard-fork events are both officially documented and on-chain-observable (the protocol-version change at the boundary). Verified dates (source: [cardano.org/hardforks](https://cardano.org/hardforks/)):

| Upgrade | Era | Date |
|---|---|---|
| Byron (mainnet launch) | Byron | 2017-09-29 |
| Shelley | Shelley | 2020-07-29 |
| Allegra | Allegra | 2020-12-16 |
| Mary | Mary | 2021-03-01 |
| Alonzo | Alonzo | 2021-09-12 |
| (Lobster) | Alonzo | 2021-10-22 |
| Vasil | Babbage | 2022-09-22 |
| Valentine | Babbage | 2023-02-14 |
| Chang | Conway | 2024-09-01 |
| Plomin | Conway | 2025-01-29 |
| van Rossem | Conway | 2026-06 (tentative) |

### 1.10 Major ecosystem events (launches, shutdowns, listings)

| Source | Availability | Reliability / class | Cost | Retention |
|---|---|---|---|---|
| Press / project announcements (crypto.news, The Block, Cointelegraph, etc.) | **PARTIAL** | Class D editorial; not chain-verifiable; requires manual curation | free (paywalls vary) | volatile (link-rot) |
| CEX listing dates | **PARTIAL** | Third-party (exchange blogs / aggregators) | free/paid | volatile |
| On-chain corroboration (contract deploy, last activity, mint/burn cessation) | **PARTIAL → LIVE** | **Class A** for the on-chain footprint of a launch/shutdown | infra | full |

**Weakest *structured* signal; partly observable.** "An event was announced on date Y" is a curated, off-chain, editorial claim — not reproducible, only citable. But many launches/shutdowns leave an **on-chain footprint** (first/last contract activity, mint cessation) that *is* Class A and can date the event independently of the press release. Recent, verifiable-by-citation examples within scope:
- **jpg.store** entered restricted mode 2026-04-23 and fully shut down 2026-05-23 ([crypto.news](https://crypto.news/cardano-analytics-platform-taptools-to-shut-down-after-4-years/); registry §3). On-chain: contract activity cessation is observable.
- **TapTools** wind-down announced ~2026-06-02/03; API expected dark mid-to-late June 2026 ([crypto.news](https://crypto.news/cardano-analytics-platform-taptools-to-shut-down-after-4-years/), [The Block](https://www.theblock.co/post/403457/taptools-winds-down), [The Defiant](https://thedefiant.io/news/blockchains/cardano-s-taptools-winding-down-is-a-symptom-of-a-shrinking-chain)).

Per the rule: we may record "jpg.store shut down 2026-05-23" and "ADA/USD moved Z% over the following N days." We may **not** record "ADA fell *because* jpg.store shut down."

---

## 2. What CAN be measured (on-chain-verifiable + reliably sourced)

Signals that are **Class A (reproducible from the ledger)** or **Class B (authoritatively published)**, and therefore defensible under the observability rule:

1. **DEX volume & liquidity** — functions of on-chain AMM state and swap txs (USD leg excepted). *Class A.*
2. **Large on-chain transfers** — amount, block, timestamp, addresses, count/sum above a fixed threshold per day. *Class A.* (The *movement*, never the *whale identity*.)
3. **Treasury balance & withdrawals** — per-epoch pot balance and per-governance-action withdrawals. *Class A.*
4. **DRep activity** — registrations, voting power, individual votes. *Class A* (Conway-era onward).
5. **Governance actions & outcomes** — proposals, tallies, enactment, committee state. *Class A.*
6. **Hard forks / protocol upgrades** — boundary-epoch version change + official list. *Class A + B.*
7. **Catalyst funding outcomes & on-chain voting** (recent funds) — *Class A/B* (results files + chain).
8. **On-chain footprints of ecosystem events** — first/last contract activity, mint/burn cessation, to *date* a launch/shutdown independently. *Class A.*
9. **Asset-level facts** (supply, mint/burn, holder lists) — *Class A* via Koios/Blockfrost/db-sync (per registry §1).

Common property: an independent party running db-sync (or querying Koios/Blockfrost) can reproduce the number. Time-anchoring ("event on date Y; ADA moved Z% over N days") is supported because both the event side (where Class A) and the price side (third-party, caveated) are timestamped.

---

## 3. What CANNOT be measured (be honest)

These are out of reach in principle, not merely unimplemented. Each is listed with *why*.

1. **True CEX internal ledgers.** Deposits/withdrawals *within* an exchange's own books never touch the chain. Off-chain trades, internal transfers between users, and omnibus rebalancing are invisible. CryptoQuant/Glassnode "exchange flows" are **third-party labels over on-chain movements**, not the exchange's ledger — proprietary, paywalled, non-reproducible, and weakest-tier. *Why: the data does not exist on-chain.*

2. **Real-world identity behind a wallet.** Who controls an address — person, fund, exchange — is not on-chain unless self-disclosed and verifiable. Third-party labels (Arkham/Nansen) are claims, EVM-centric, and thin on Cardano. *Why: pseudonymity by design + eUTXO change-address proliferation + multi-signer txs break clustering ([arXiv 2503.09327](https://arxiv.org/html/2503.09327v1), [ScienceDirect shared-send study](https://www.sciencedirect.com/science/article/pii/S2096720924000824)).*

3. **Motive / causation.** Whether a price move was *caused by* an event, or a transfer was *intended* to do anything, is unobservable. Correlation in time is the ceiling. *Why: intent is not a chain field; causation requires a counterfactual we cannot run. This is the core of the rule.*

4. **Off-chain / OTC trades.** OTC desk fills, dark-pool prints, and bilateral deals never hit the chain or public order books. Reported "volume" excludes or distorts them. *Why: by construction these settle off public rails.*

5. **Wallet "intent" / behavioral labels** — "accumulation," "smart money," "panic." These are interpretive overlays, not measurements. *Why: forbidden by the rule and unfalsifiable.*

6. **Authoritative ADA/USD ground truth.** There is no single true price; only aggregates of CEX prints we cannot audit for wash trading. *Why: ADA/USD is off-chain and venue-dependent; ADA/BTC doubly so.*

7. **Causal links between ecosystem events and price.** "X shut down, therefore ADA fell." *Why: same as #3 — explicitly the line this document draws.*

---

## 4. What would be REQUIRED to stand up the observability layer responsibly

*(Inventory of what it would take — not a build plan, not a recommendation.)*

**4.1 Core on-chain backbone (Class A — the trustworthy spine)**
- A **cardano-db-sync** instance (full node + Postgres) as the canonical, rate-limit-free, license-clean source for treasury, governance, DReps, large transfers, asset facts, and protocol-version boundaries. Hosted Koios + Blockfrost as redundancy/failover for the same Class-A data. *(registry §1)*
- DEX coverage assembly: Minswap + DexHunter + Charli3 for price/OHLCV/volume, with DefiLlama for chain/protocol TVL — because no single free API spans all DEXes post-TapTools. *(registry §2)*

**4.2 Third-party / off-chain inputs (clearly fenced as lower-trust)**
- Price/volume: CoinGecko (or CMC) for ADA/USD, ADA/BTC, volume — **labeled third-party, non-reproducible**, never presented as Class A.
- Exchange flows: **only** if explicitly framed as "source-S-labeled," CryptoQuant/Glassnode are the options (paywalled, weakest tier). A responsible layer might *exclude* this signal rather than launder a proprietary label as fact.
- Whale identity: deliberately **omitted** as a labeled signal; keep only the Class-A transfer facts.

**4.3 Persistence / history-capture (the part that decays if not captured now)**
- **Governance/DRep off-chain metadata** behind CIP-119/CIP-100 anchors — cache the anchor *target* at observation time, since links rot.
- **GovTool Proposal Pillar** off-chain drafts/discussion — no second source; capture or lose it.
- **Catalyst IdeaScale + Jörmungandr legacy** — perishable, vendor-sunset; this is the active preservation track (see `IDEASCALE_PRESERVATION.md`, FLOW-6).
- **Ecosystem-event record** — a curated, cited, append-only event log (date + source URL + on-chain corroboration where available), since press links rot.
- **Pre-sunset platform terms/specs** — archive TapTools/jpg.store ToS and any OpenAPI specs before the sites go dark (registry §2/§3).

**4.4 Refresh cadence (by signal volatility)**
- Price/volume/DEX: minutes (intraday), but persisted as periodic snapshots, not a live ticker.
- Treasury / DRep / governance / Catalyst on-chain: per **epoch** (~5 days) or per-action as it lands.
- Large transfers: per **block / continuous**, then daily aggregation above a fixed threshold.
- Hard forks / ecosystem events: event-driven, manually curated.
- Exchange flows (if included at all): daily, on the provider's cadence.

**4.5 Methodological guardrails (non-optional for "responsibly")**
- Tag every datum with its **authority class (A–E)** and source URL; never blend Class A with third-party labels silently. *(METHODOLOGY §24.3)*
- Show the **reproducibility path** for Class-A signals (which db-sync query / endpoint yields it).
- Enforce the **§0 rule** in the data model: events and price are stored as separate, time-stamped facts; the layer never persists a "cause" field.
- Mark third-party price/flow data as **non-reproducible** in the surface itself, not just in docs.
- Respect **redistribution licenses** (several market sources restrict it; on-chain/db-sync data does not).

---

## Sources

- [Cardano API Registry (internal)](../../cardano-data-layer/CARDANO_API_REGISTRY.md)
- [Cardano eUTXO model — Developer Portal](https://developers.cardano.org/docs/learn/core-concepts/eutxo/)
- [Heuristic-Based Address Clustering in Cardano Blockchain — arXiv 2503.09327](https://arxiv.org/html/2503.09327v1)
- [Cardano shared-send transaction untangling — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2096720924000824)
- [CoinGecko API](https://www.coingecko.com/en/api) · [pricing](https://www.coingecko.com/en/api/pricing) · [rate-limit docs](https://docs.coingecko.com/docs/common-errors-rate-limit)
- [CoinMarketCap API pricing](https://coinmarketcap.com/api/pricing/)
- [Minswap / DexHunter / Charli3 — see registry §2]
- [DefiLlama API docs](https://api-docs.defillama.com/) · [Cardano chain](https://defillama.com/chain/cardano) · [Minswap](https://defillama.com/protocol/minswap)
- [CryptoQuant — ADA exchange flows](https://cryptoquant.com/asset/ada/chart/exchange-flows/exchange-reserve) · [pricing](https://cryptoquant.com/pricing) · [API docs](https://cryptoquant.com/docs)
- [Glassnode — metric catalog](https://docs.glassnode.com/data/metric-catalog) · [pricing](https://glassnode.com/pricing/studio) · [supported assets](https://docs.glassnode.com/data/supported-assets)
- [Arkham Intelligence](https://intel.arkm.com/) · [Nansen](https://nansen.ai/)
- [Cardano monetary policy — Cardano Docs](https://docs.cardano.org/about-cardano/explore-more/monetary-policy)
- [Cardano Treasury Explorer](https://cardano.org/apps/cardano-treasury-explorer/)
- [Cardano hard forks — cardano.org](https://cardano.org/hardforks/)
- [gov.tools](https://gov.tools)
- [projectcatalyst.io](https://projectcatalyst.io) · [Catalyst Explorer (Lidonation)](https://www.lidonation.com/catalyst-explorer/api)
- TapTools wind-down: [crypto.news](https://crypto.news/cardano-analytics-platform-taptools-to-shut-down-after-4-years/) · [The Block](https://www.theblock.co/post/403457/taptools-winds-down) · [The Defiant](https://thedefiant.io/news/blockchains/cardano-s-taptools-winding-down-is-a-symptom-of-a-shrinking-chain)

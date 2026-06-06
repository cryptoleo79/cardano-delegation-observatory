# Event Registry

A registry of Cardano ecosystem events to serve as neutral **timeline markers** for a future market-observability page.

---

## ⚠️ Framing rule — observability, NOT attribution

**Events in this registry are factual chronological markers ONLY.**

- This registry records **what happened** and **when**, with a source. Nothing more.
- It must **NEVER** state or imply that an event **caused** a price move, a market move, a volume change, or any market outcome.
- It must **NEVER** rank, weight, or editorialize events by market "impact."
- When an event is placed alongside a market chart, the only permitted relationship is **temporal co-location** ("this happened on this date"). Any causal language ("because of," "led to," "triggered," "in response to," "drove") is prohibited.
- Each event is stated strictly as: **type, date, what happened (neutral factual description), source.**

If a future contributor cannot describe an event without implying it moved the market, the event does not belong here as written.

---

## Part 1 — Event taxonomy

### Common fields (every event carries these)

| Field | Meaning |
|---|---|
| `id` | Stable unique identifier (e.g. `hf-shelley`, `gov-constitution-v1`). |
| `type` | One of the six event types below. |
| `date` | ISO 8601 date (`YYYY-MM-DD`). Prefix `~` if approximate; see "Date confidence" below. |
| `title` | Short neutral label. No adjectives implying market significance. |
| `description` | Neutral factual description of what happened. No causal/market language. |
| `source_url` | Authoritative URL. Required. |
| `on_chain_ref` | On-chain reference if one exists (tx hash, governance action ID, epoch/era boundary). Empty for off-chain events. |
| `authority_class` | A–E. See class definitions below. |

### Date confidence convention

- Exact verified date: plain ISO date.
- Approximate (month known, day uncertain, or rounded): prefix `~` and note in description.
- Uncertain / needs verification: mark **`[UNVERIFIED]`** in the description and prefer a range.

### Authority classes (A–E)

| Class | Meaning | Reproducibility |
|---|---|---|
| **A** | Directly observable on-chain as a ledger/era event (hard fork enactment at epoch boundary, era transition). | Fully reproducible from the chain. |
| **B** | On-chain governance/treasury object (Conway governance action, treasury withdrawal, DRep/CC vote) identifiable by a governance action ID or tx hash. | Reproducible from the chain given the ref. |
| **C** | Officially announced protocol/software artifact (node release, tagged release) — verifiable in a public repo/release page, not itself a ledger event. | Reproducible from a release registry. |
| **D** | Off-chain ecosystem event (launch, shutdown, listing, partnership, business announcement). Exists only as a curated/sourced claim; **requires a maintained source**. | Not reproducible on-chain; depends on archived sources. |
| **E** | Programmatic/curated milestone external to the chain (e.g. Catalyst fund phases administered partly off-chain). Some sub-events have on-chain refs (the on-chain voting / treasury payout), others are programmatic announcements. | Partially reproducible. |

### Event types

| Type | One-line description | Typical fields beyond common | Typical class |
|---|---|---|---|
| **governance action** | A Conway-era on-chain governance action and/or its ratification outcome. | `on_chain_ref` = governance action ID; ratification epoch. | B |
| **hard fork / protocol upgrade** | A protocol hard fork or era transition enacted at an epoch boundary. | `on_chain_ref` = era/epoch boundary; protocol major version. | A |
| **treasury action** | A treasury withdrawal or major treasury movement. | `on_chain_ref` = withdrawal governance action ID / tx; ADA amount. | B |
| **Catalyst milestone** | A Project Catalyst fund event (launch, voting open/close, results, payout). | Fund number; phase; ADA budget; on-chain ref for voting/payout if any. | E (some B) |
| **ecosystem event** | A major ecosystem launch, shutdown, exchange listing, or partnership. | Maintained source required. | D |
| **major protocol release** | A node or core-software release (cardano-node, etc.). | `on_chain_ref` empty; version tag + release URL. | C |

---

## Part 2 — Starter event set

> Dates are verified against the cited sources where possible. Approximate dates are prefixed `~` and flagged in the description. Catalyst early-fund dates are the least certain and are marked accordingly.

### 2.1 Hard forks / protocol upgrades (Class A)

| id | date | title | description | on_chain_ref | source |
|---|---|---|---|---|---|
| `hf-byron` | ~2017-09-29 | Byron mainnet launch | Cardano mainnet launched (Byron era); ADA becomes transferable. Foundational era; not a "hard fork" but the genesis marker. | Byron genesis | [cardano.org/hardforks](https://cardano.org/hardforks/) |
| `hf-shelley` | 2020-07-29 | Shelley hard fork | Transition from Byron (federated) to Shelley ledger rules; introduced staking and stake delegation. | Byron→Shelley era boundary | [cardano.org/hardforks](https://cardano.org/hardforks/) |
| `hf-allegra` | 2020-12-16 | Allegra hard fork | Added token-locking / timelock support (prerequisite for native tokens). | Shelley→Allegra | [cardano.org/hardforks](https://cardano.org/hardforks/) |
| `hf-mary` | 2021-03-01 | Mary hard fork (native tokens) | Introduced native multi-asset tokens and NFTs on the ledger. | Allegra→Mary | [cardano.org/hardforks](https://cardano.org/hardforks/) |
| `hf-alonzo` | 2021-09-12 | Alonzo hard fork (smart contracts) | Introduced Plutus smart-contract capability, enabling on-chain scripts/dApps. | Mary→Alonzo | [cardano.org/hardforks](https://cardano.org/hardforks/) |
| `hf-vasil` | 2022-09-22 | Vasil hard fork | Performance/scalability upgrade (Plutus V2, reference inputs, diffusion pipelining). Mainnet enacted Sept 2022. | Babbage era | [cardano.org/hardforks](https://cardano.org/hardforks/) |
| `hf-chang1` | 2024-09-01 | Chang #1 hard fork (Conway era begins) | Initiated the Conway ledger era; enabled initial on-chain governance scaffolding (DRep registration, vote delegation; interim CC + SPO voting). Enacted 2024-09-01 ~21:44 UTC. | Babbage→Conway (bootstrap) | [forum.cardano.org digest 2024-09-02](https://forum.cardano.org/t/digest-september-2-2024-cardanos-chang-hard-fork-initiated-on-chain-governance-begins-step-into-the-conway-era-become-a-cardano-delegated-representative/135581) |
| `hf-plomin` | 2025-01-29 | Plomin hard fork (Chang #2) | Second stage of the Chang upgrade; activated full Conway on-chain governance (ADA-holder governance, treasury voting, etc.). Enacted 2025-01-29 ~21:45 UTC. Renamed in memory of Matthew Plomin (originally "Chang #2"). | Conway (full) boundary | [cardano.org news 2025-01-30](https://cardano.org/news/2025-01-30-chang-upgrade-completed/) |

### 2.2 Governance actions / milestones (Class A/B)

| id | date | title | description | on_chain_ref | source |
|---|---|---|---|---|---|
| `gov-conway-start` | 2024-09-01 | Conway governance era begins | On-chain governance features activated with Chang #1: DReps may register, ADA holders may delegate voting power; limited action set (parameter changes, hard fork, Info). | Conway bootstrap | [forum.cardano.org digest 2024-09-02](https://forum.cardano.org/t/digest-september-2-2024-cardanos-chang-hard-fork-initiated-on-chain-governance-begins-step-into-the-conway-era-become-a-cardano-delegated-representative/135581) |
| `gov-drep-launch` | ~2024-09 | DRep system live | Delegated Representative (DRep) registration and ADA-holder vote delegation become available on mainnet following Chang #1. `[approx — same window as Chang #1]` | DRep registration certs | [cardano.org community digest 2024-09-02](https://cardano.org/news/2024-09-02-community-digest/) |
| `gov-full-governance` | 2025-01-29 | Full ADA-holder governance active | With Plomin, the full Conway governance action set (incl. treasury withdrawals, no-confidence, CC updates) becomes votable by DReps/SPOs/CC. | Conway full boundary | [cardano.org news 2025-01-30](https://cardano.org/news/2025-01-30-chang-upgrade-completed/) |
| `gov-constitution-v1` | 2025-02-23 | Cardano Constitution ratified (v1) | First official Cardano Constitution ratified (~85% approval) and enacted on-chain. Governance action submitted 2025-01-30. | Constitution governance action (Info/ratification) | [intersectmbo.org constitution outcome](https://www.intersectmbo.org/news/updated-cardano-constitution-ratification-outcome-and-effective-date) |
| `gov-ncl-2025` | ~2025-04 | 2025 Net Change Limit adopted | Governance action setting a treasury Net Change Limit (cap ~350M ADA on net treasury withdrawals) from start of Epoch 532 through end of Epoch 604. `[~April 2025]` | NCL governance action | [intersectmbo.org net change limit](https://www.intersectmbo.org/news/what-is-cardanos-net-change-limit) |
| `gov-constitution-v2` | 2026-01-24 | Updated Cardano Constitution effective | Updated Constitution took effect at the epoch boundary ~2026-01-24 (ratified ~2026-01-19, ~79% support); refines governance-action structure and removes Info actions as treasury authorization. | Constitution-update governance action | [cardano.org news 2026-01-22](https://cardano.org/news/2026-01-22-update-cardano-constitution/) |

### 2.3 Treasury actions (Class B)

| id | date | title | description | on_chain_ref | source |
|---|---|---|---|---|---|
| `tre-cci-v1` | ~2025-Q4 | Cardano Critical Integrations (CCI V1) withdrawal | Treasury withdrawal of ₳70,000,000 approved by the community under the Cardano Critical Integrations budget; reported as the fastest treasury withdrawal to pass to date. `[late 2025 — exact enactment epoch to confirm]` | Treasury withdrawal governance action | [intersectmbo.org CCI status report](https://intersectmbo.org/news/cardano-critical-integrations-program-status-update-report) |
| `tre-ncl-near-exhaust` | ~2026-01 | 2025 NCL near exhaustion | Per Intersect Budget Committee minutes (2026-01-05), the 2025 Net Change Limit was materially close to exhausted after CCI approval (~1–2M ADA remaining). Reporting/administrative marker, not a single transaction. | (n/a — committee report) | [intersectmbo.org net change limit](https://www.intersectmbo.org/news/what-is-cardanos-net-change-limit) |

> Note: The **first** treasury withdrawals under Conway are the load-bearing markers for an observability page and should each be pinned to their governance action ID and enactment epoch when the registry is populated programmatically. The on-chain refs above are placeholders pending that lookup.

### 2.4 Catalyst milestones (Class E; on-chain voting/payout sub-events are Class B)

> Early Catalyst fund dates are approximate and the day-level precision is uncertain. Treat Fund 1–4 dates as `~` and verify against projectcatalyst.io / archived announcements before display.

| id | date | title | description | source |
|---|---|---|---|---|
| `cat-f0` | ~2020-06 | Catalyst Fund 0 (test) | Initial test fund run by IOHK before public funding. `[approx]` | [iohk.zendesk Catalyst FAQ](https://iohk.zendesk.com/hc/en-us/articles/900006490763-Project-Catalyst-FAQ) |
| `cat-f1` | ~2020-09 | Catalyst Fund 1 (test) | Early test fund preceding Fund 2. `[approx — exact date uncertain]` | [iohk.zendesk Catalyst FAQ](https://iohk.zendesk.com/hc/en-us/articles/900006490763-Project-Catalyst-FAQ) |
| `cat-f2` | ~2020-09 | Catalyst Fund 2 | First broadly public fund; ~$250k ADA allocated to community proposals. `[approx]` | [ambcrypto Fund3 launch](https://ambcrypto.com/cardano-poject-catalyst-fund3-launches-with-500k/) |
| `cat-f3` | ~2020-11 | Catalyst Fund 3 | ~$500k budget; developer-ecosystem, dApp, and community-choice challenges; on-chain community voting. `[approx]` | [ambcrypto Fund3 launch](https://ambcrypto.com/cardano-poject-catalyst-fund3-launches-with-500k/) |
| `cat-f4` | ~2021-02 | Catalyst Fund 4 | Continued scaling of community funding. `[approx — verify]` | [docs.projectcatalyst.io fund timeline](https://docs.projectcatalyst.io/current-fund/fund-basics/fund-timeline) |
| `cat-f5..f9` | ~2021–2022 | Catalyst Funds 5–9 | Successive funding rounds through 2021–2022 with growing budgets. `[approx — populate per-fund from official timeline]` | [docs.projectcatalyst.io fund timeline](https://docs.projectcatalyst.io/current-fund/fund-basics/fund-timeline) |
| `cat-f10..f12` | ~2023–2024 | Catalyst Funds 10–12 | Funding rounds through 2023–2024. `[approx — populate per-fund]` | [projectcatalyst.io/funds/12](https://projectcatalyst.io/funds/12) |
| `cat-f13` | 2024-11-18 | Catalyst Fund 13 voting snapshot | Voting-power snapshot taken 2024-11-18 ~09:29 UTC; voting and results followed. | [projectcatalyst.io/funds/13](https://projectcatalyst.io/funds/13) |
| `cat-f14` | ~2025 | Catalyst Fund 14 | Subsequent fund; proposal submission/voting in 2025. `[approx — verify phases]` | [docs.projectcatalyst.io fund14 notice](https://docs.projectcatalyst.io/current-fund/fund-basics/fund14-proposal-submission-notice) |
| `cat-f15` | ~2025-12 | Catalyst Fund 15 (current) | Current fund as of the fund-timeline page (last updated 2025-12-02). `[approx — current fund]` | [docs.projectcatalyst.io fund timeline](https://docs.projectcatalyst.io/current-fund/fund-basics/fund-timeline) |

> Catalyst aggregate marker (for context, not a dated event): ~2,100 funded projects, ~290M+ ADA allocated since 2020 per official figures. Source: [iohk.zendesk Catalyst FAQ](https://iohk.zendesk.com/hc/en-us/articles/900006490763-Project-Catalyst-FAQ).

### 2.5 Ecosystem events (Class D — off-chain, maintained source required)

| id | date | title | description | source |
|---|---|---|---|---|
| `eco-jpgstore-restrict` | 2026-04-23 | jpg.store enters restriction mode | jpg.store (Cardano NFT marketplace) disabled new listings, offers, lending, and minting; purchases/cancellations/loan repayments still possible. | [nftevening jpg.store shutdown](https://nftevening.com/jpg-store-shuts-down-cardano-nft-holders-deadline/) |
| `eco-jpgstore-shutdown` | 2026-05-23 | jpg.store final shutdown | jpg.store and its Comet platform ceased operations; smart-contract interactions via the site no longer available after this date. Launched 2021. | [tokenpost jpg.store shutdown](https://tokenpost.com/news/business/20043) |
| `eco-taptools-winddown` | 2026-06-03 | TapTools announces wind-down | TapTools (Cardano analytics platform, launched 2022) announced it would wind down operations over ~two weeks following senior-executive departures and rising costs; stated openness to acquisition. | [theblock.co TapTools winds down](https://www.theblock.co/post/403457/taptools-winds-down) |

> Add to this section over time: major exchange listings/delistings, large dApp launches, protocol/DAO shutdowns, partnerships. Each requires a stable, archivable source URL.

### 2.6 Major protocol releases (Class C)

> Not yet populated. Source from the `cardano-node` GitHub releases page. Each entry should carry the version tag and release URL; `on_chain_ref` stays empty (a software release is not itself a ledger event — the corresponding hard fork is the on-chain marker).

| id | date | title | description | source |
|---|---|---|---|---|
| `rel-node-template` | (per release) | cardano-node vX.Y.Z | Tagged node release. Populate from the release registry. | https://github.com/IntersectMBO/cardano-node/releases |

---

## Part 3 — Reproducibility (on-chain vs curated)

| Event category | Class | Reproducible on-chain? | What anchors it | Maintenance need |
|---|---|---|---|---|
| Hard forks / era transitions | **A** | **Yes** — fully | Era/epoch boundary, protocol major version | None beyond the chain |
| Governance actions / outcomes | **B** | **Yes**, given the governance action ID | Conway governance action ID + ratification epoch | Pin each action ID |
| Treasury actions | **B** | **Yes**, given the action ID / tx | Treasury withdrawal governance action ID, ADA amount, enactment epoch | Pin action ID + amount |
| Catalyst milestones | **E** (voting/payout sub-events **B**) | **Partly** — voting snapshots and on-chain payouts are reproducible; fund-launch announcements and phase dates are programmatic/off-chain | Snapshot block / payout tx where applicable; otherwise official announcement | Maintained Catalyst source |
| Ecosystem events (launch/shutdown/listing/partnership) | **D** | **No** | Curated claim only | **Maintained, archivable source URL required** (link rot risk — archive on capture) |
| Major protocol releases | **C** | **No** (release artifact, not a ledger event) | Tagged release in a public repo | Release registry; the related hard fork is the on-chain twin |

**Practical implications for the observability page:**

- **Class A/B events are the backbone.** They can be regenerated deterministically from chain data (era boundaries, governance action IDs, treasury withdrawal txs) and need no external curation. These are the only markers safe to treat as ground truth.
- **Class C** events should link the software release to its on-chain counterpart (the hard fork) so the chain remains the source of truth.
- **Class D events are the fragile ones.** They exist only as sourced claims and are subject to link rot (note: jpg.store and TapTools are themselves shutting down — their own sites may disappear). Any Class D event should be **archived at capture time** (e.g. snapshot to a web archive) and carry a maintained source. Do not display a Class D event without a live or archived source.
- **Class E (Catalyst)** is mixed: prefer the on-chain sub-event (snapshot/payout) as the reproducible anchor; treat fund-phase announcement dates as curated.

---

## Sources

- [Cardano hard forks / network upgrade history — cardano.org](https://cardano.org/hardforks/)
- [Chang upgrade completed / Plomin hard fork — cardano.org](https://cardano.org/news/2025-01-30-chang-upgrade-completed/)
- [Chang #1 digest — forum.cardano.org](https://forum.cardano.org/t/digest-september-2-2024-cardanos-chang-hard-fork-initiated-on-chain-governance-begins-step-into-the-conway-era-become-a-cardano-delegated-representative/135581)
- [Community digest 2024-09-02 (DRep) — cardano.org](https://cardano.org/news/2024-09-02-community-digest/)
- [Constitution ratification outcome & effective date — intersectmbo.org](https://www.intersectmbo.org/news/updated-cardano-constitution-ratification-outcome-and-effective-date)
- [Updated Constitution 2026 — cardano.org](https://cardano.org/news/2026-01-22-update-cardano-constitution/)
- [What is Cardano's Net Change Limit — intersectmbo.org](https://www.intersectmbo.org/news/what-is-cardanos-net-change-limit)
- [Cardano Critical Integrations status report — intersectmbo.org](https://intersectmbo.org/news/cardano-critical-integrations-program-status-update-report)
- [Project Catalyst fund timeline — docs.projectcatalyst.io](https://docs.projectcatalyst.io/current-fund/fund-basics/fund-timeline)
- [Project Catalyst FAQ — iohk.zendesk.com](https://iohk.zendesk.com/hc/en-us/articles/900006490763-Project-Catalyst-FAQ)
- [Catalyst Fund 13 — projectcatalyst.io](https://projectcatalyst.io/funds/13)
- [jpg.store shutdown — tokenpost.com](https://tokenpost.com/news/business/20043) / [nftevening.com](https://nftevening.com/jpg-store-shuts-down-cardano-nft-holders-deadline/)
- [TapTools wind-down — theblock.co](https://www.theblock.co/post/403457/taptools-winds-down)
- cardano-node releases (Class C, to populate): https://github.com/IntersectMBO/cardano-node/releases

---

## Open verification items (honest gaps)

- **Byron genesis date** (`hf-byron`): commonly cited as 2017-09-29; confirm against cardano.org before display.
- **Catalyst Fund 0–9 exact dates** (`cat-f0`–`cat-f9`): only approximate; the official fund timeline data lives in images on docs.projectcatalyst.io and was not machine-readable here. Populate per-fund from the official timeline or archived announcements.
- **CCI V1 treasury withdrawal** (`tre-cci-v1`): "late 2025" / ~₳70M confirmed by Intersect; exact enactment epoch and governance action ID still to be pinned.
- **2025 Net Change Limit adoption date** (`gov-ncl-2025`): "~April 2025" per source; confirm the exact enactment epoch.
- **DRep launch precise date** (`gov-drep-launch`): tied to Chang #1 window (~2024-09); no distinct day-level event — treat as part of `hf-chang1`.
- All **Class D** sources should be archived on capture (jpg.store and TapTools are winding down; their primary sources may vanish).

# Launch Status — asy.life Cardano ecosystem

**Status date:** 2026-06-17
**Purpose:** The single launch-truth report. What exists, what is live, what remains, and an honest list of known gaps. Every number below was verified against the live API on the status date.

This document is read-only reporting. It records the state of the ecosystem for launch; it does not change any site.

---

## 1. Live properties

All five properties returned **HTTP 200** on 2026-06-17.

| Property | URL | What it is | Status |
|---|---|---|---|
| Observatory | https://observatory.asy.life | Governance + treasury observability, discovery (projects / categories / tokens / rankings), and the memory layer | Live (200) |
| Data Layer API | https://api.asy.life | Read-only, keyless Cardano data API; `_quality` provenance on every value; `/` redirects to `/docs` | Live (200) |
| CTF | https://ctf.asy.life | Connected Treasury Framework — a separate, propositional treasury-policy packet, in observation mode | Live (200) |
| Voting | https://voting.asy.life | Voting surface | Live (200) |
| Governance | https://governance.asy.life | Governance surface | Live (200) |

**GitHub operator:** [cryptoleo79](https://github.com/cryptoleo79) — an independent Cardano SPO and DRep. Repositories:

- `cardano-data-layer` — the API
- `cardano-delegation-observatory` — the Observatory site + ETL
- `cardano-catalyst-archive` — Catalyst preservation archive
- `cardano-project-memory-archive` — Project Memory seed source

**Licensing:** code Apache-2.0; published data CC0. The operator's own DRep entry, if any, appears in the published data with no special treatment.

**Languages:** fully bilingual EN / JA across all surfaces.

---

## 2. Data Layer — routes, sources, coverage

- **API routes:** 37 (confirmed via `GET /health` → `routes: 37` and `GET /routes` → 37 entries).
- **Provenance:** every meaningful token / market / project / governance / catalyst response carries a nested `_quality` block — `source`, `authority_class`, `refresh`, `confidence`, human-readable `provenance`, `as_of`. The legacy `nft` / `onchain` routes emit a flatter envelope (top-level `source` + `as_of`).
- **Authority classes:** A on-chain · B official · C at-risk · D community · E researcher.
- **No fabrication:** unknown values return `null` with a `note`; missing governance/catalyst exports return `4xx`/`503` with an envelope-shaped error rather than inventing rows.
- **Access:** read-only, no key, no auth, CORS `*` (callable directly from browser JS).
- **Discoverability:** `GET /routes`, `GET /openapi.json` (OpenAPI 3.1), `GET /health`.

**Upstream sources:** DexHunter, Minswap, Koios, CIP-26, OpenCNFT (market data is treated as a thin convenience layer over open sources; the durable value is the curated project/category/memory data). Consumers surfacing NFT data should credit OpenCNFT, whose license requires it.

**Coverage (verified live 2026-06-17):**

| Domain | Number | Source of truth |
|---|---|---|
| Projects | 847 (766 classified) | `/projects?limit=1` → `total: 847` |
| Categories | 74 (73 populated, 1 deprecated) | `/categories` → `count: 74` |
| Token ranked universe | 1,048 | `/tokens/top` → `universe: 1048`, `coverage: partial` |
| Tokens with live market data | 573 | verified set |
| Tokens with live tradable market (`/markets`) | 103 `tracked_units` | `/markets` → `tracked_units: 103` |
| Catalyst funds | 15 / 15 | `/funds` → `total_funds: 15` |
| Governance actions | 120 | `/actions?limit=1` → `total: 120` |
| DReps tracked | 30 (top-30 by raw voting weight) | top-30 methodology |
| Treasury epochs | 426 | `/treasury` → `n_epochs: 426` |

**Enrichment:** 510 enriched projects — website 560, github 146, docs 43, whitepaper 112.

---

## 3. Memory layer

Event-sourced, hash-chained, tamper-evident.

- **Project Memory log:** ~4,950 events, hash-chained; ~3,100 active claims.
- **Four memory layers:** Governance Memory, Treasury Memory, Catalyst Memory, Project Memory — parallel, each with its own lifecycle and trust boundary; not a hierarchy.
- **Model:** append-only; corrections are new events, nothing is overwritten; every claim carries provenance (source, capture date/method, SHA-256, authority class, optional Wayback snapshot).
- **Surface:** https://observatory.asy.life/memory.html.

---

## 4. Discovery pages

Live on observatory.asy.life and served from the Data Layer:

- Governance home (`index`), `drep`, `actions`/`action`, `treasury`, `history`
- Discovery: `projects`/`project`, `categories`/`category`, `ecosystem`, `tokens`/`token`, `rankings`, `market`
- Derived: `flows`, `concentration`, `governance-health`
- Preservation: `catalyst`, `memory`
- Reference: `methodology`, `status`, `about`, `docs`, `ecosystem-map`

---

## 5. Differentiators

- Provenance + authority class (A–E) on every value.
- Event-sourced, tamper-evident Project Memory.
- Chain-of-custody preservation archives (Catalyst 15/15).
- Free / keyless / open / bilingual.
- One layer integrating market + projects + categories + governance + treasury + catalyst + memory.

---

## 6. Known gaps and defects (honest)

**Data gaps (by design, disclosed in-product):**

- **True market cap is rare.** Only ~46–60 tokens have a genuine *circulating* market cap; the rest are FDV-flagged or `null`. Rankings disclose this; do not read FDV as market cap.
- **Long-tail staleness.** Long-tail market data refreshes on a rotation and can be flagged stale. `/tokens/top` and `/markets` return `coverage: partial` so a tracked-set overview is never mistaken for full coverage.
- **No audit links.** Security-audit links are not available from upstream sources, so they are not surfaced.
- **Governance cadence is daily.** Snapshots have at least a 24-hour lag from any on-chain event; this is a snapshot cadence, not a live feed.

**Staleness found in entry-point pages (REPORTED — not edited; another worker owns the web files):**

1. **`web/ecosystem-map.html` — "Tracked tokens" metric understates the universe.** The live metric reads `tracked_units` from `/markets` (= **103**), but the ranked token universe is **1,048** (`/tokens/top` → `universe: 1048`). The 103 figure is the live tradable/market-data set, not the full ranked universe. Consider switching the metric source to `/tokens/top` `universe` (and labeling 103 as "with live market" / "tradable") so the map does not undersell coverage. Not wrong, but easily misread.
2. **`web/ecosystem-map.html` — Catalyst labeled "Funds 1–13".** The node copy (EN + JA) says "Funds 1–13" / "Funds 1〜13", but the archive is now **15/15 funds** (`/funds` → `total_funds: 15`). The card is stale by two funds.
3. **`START_HERE.md` — Catalyst described as "Funds 1–13".** Lines 124 and 128 say "Funds 1–13"; should be Funds 1–15 (15/15) to match the live archive.
4. **`docs/LAUNCH_ANNOUNCEMENT.md` (the older announcement, linked from `docs.html` and `START_HERE`) is numerically stale.** It states "725 projects across 74 categories" and "roughly 103–110 tokens" as the tracked set. Current verified numbers are **847 projects (766 classified)** and a **1,048-token ranked universe (573 with live market data)**. This file is superseded by `docs/ANNOUNCEMENT.md` (new). Recommend updating or redirecting the docs.html "Launch announcement" link to the new file.

**Clean / no staleness found:**

- `web/about.html` — qualitative copy, no hardcoded counts. Accurate.
- `web/docs.html` — catalog of links, no hardcoded counts. Accurate. (Only caveat: it links to the stale `LAUNCH_ANNOUNCEMENT.md`; see gap #4.)
- `web/ecosystem-map.html` public-metrics hero — pulls projects / categories / funds / actions / epochs / routes live from the API, so those six stay current automatically. Only the two hardcoded items above (tracked-tokens source and the Catalyst card copy) are stale.

---

## 7. Go / No-Go launch checklist

| # | Check | Status |
|---|---|---|
| 1 | All five properties return HTTP 200 | GO — verified 2026-06-17 |
| 2 | API `/health` reports 37 routes | GO |
| 3 | `/openapi.json`, `/routes`, `/health` reachable | GO |
| 4 | Provenance `_quality` block present on token/market/project/governance/catalyst | GO |
| 5 | No-fabrication contract (null + note, 4xx/503 on missing exports) | GO |
| 6 | Core counts match verified numbers (projects 847, categories 74, funds 15, actions 120, epochs 426) | GO |
| 7 | Memory layer live (memory.html, ~4,950 events / ~3,100 claims) | GO |
| 8 | Bilingual EN/JA across surfaces | GO |
| 9 | Licensing correct (Apache-2.0 code, CC0 data; OpenCNFT credited) | GO |
| 10 | Coverage honesty disclosed in-product (`coverage: partial`, FDV flags, null notes) | GO |
| 11 | New announcement package ready (`docs/ANNOUNCEMENT.md`) | GO |
| 12 | Entry points accurate (about, docs, ecosystem-map, START_HERE) | GO with notes — four cosmetic/numeric staleness items in §6; none block launch |

**Overall: GO.** No blocking defects. The four staleness items in §6 are cosmetic/numeric corrections (Catalyst fund count and the tracked-tokens label) and a superseded older announcement file; they should be fixed by the web owner but do not gate the launch.

# Announcement — asy.life, Cardano's public knowledge layer

*Refreshed 2026-06-22 to lead with the measured flagship (Project Memory) and the
discovery surfaces. Read-only, provenance-first, observability — not attribution. Code
Apache-2.0, data CC0, fully bilingual (EN / 日本語). Every claim below is checkable live.*

Three versions — **short**, **medium**, **technical**. Use whichever fits the venue.

---

## Short

> **asy.life is a free, read-only knowledge layer for Cardano.** Its flagship —
> **Project Memory** — records **847 projects across 74 categories**, every fact carrying
> its source, and lets you *explore* the ecosystem: **Search** any project, watch the
> **Timeline** of what happened, read the **Ecosystem Pulse** of what's active now, and
> see the whole picture in 60 seconds in the **Command Center**. Governance, treasury and
> Catalyst too — observed and preserved, never scored or guessed.
>
> Start → https://observatory.asy.life/command-center.html · Projects →
> https://observatory.asy.life/projects.html · API → https://api.asy.life/docs

---

## Medium

**What it is.** asy.life is a neutral, read-only knowledge layer for Cardano — built to
make the ecosystem *understandable and durable*, not to rank or judge it. The guiding
line is plain: read-only, provenance-first, observability rather than attribution, open
(Apache-2.0 code, CC0 data), bilingual.

**The flagship: Project Memory.** An event-sourced, append-only, hash-chained record of
the Cardano ecosystem — **847 projects across 74 categories, 787 enriched with sourced
links (website / GitHub / docs / whitepaper), over 5,700 provenance-stamped events**.
Nothing is overwritten; every value traces to where it came from. Explore it:

- **Search** (`/search.html`) — find any of 847 projects by name, category or ticker,
  each result a coverage scorecard.
- **Command Center** (`/command-center.html`) — the whole ecosystem in one 60-second
  operating picture: governance, treasury, projects, memory, pulse and timeline.
- **Timeline** (`/timeline.html`) — what happened in Cardano, when, in one chronological
  stream across governance, treasury and project memory.
- **Ecosystem Pulse** (`/ecosystem-pulse.html`) — what's active right now: recently
  enriched and documented projects, the most active categories.

**Governance, treasury, Catalyst.** Computed daily from on-chain data: the top-30 DReps
by voting weight with daily movement, **128 governance actions** with vote tallies and
outcomes, **430 epochs** of treasury history plus withdrawals (Treasury Timeline +
intelligence), delegation flows and concentration over time, and a Catalyst archive
preserving **Funds 1–15** with chain-of-custody.

**The Data Layer API** (https://api.asy.life) serves all of it read-only — **~37 routes,
no key, CORS open**, with a `_quality` provenance block on every meaningful response so
you always know where a value came from.

**An honest note on coverage.** The tracked token set (~110 tokens) is an explicit *seed
set*, not full-ecosystem coverage, and the platform says so. Unknown values return `null`
with a note rather than a fabrication. Nothing ranks projects, scores DReps, or claims to
be the whole ecosystem.

**Where to start.** The **Command Center** (https://observatory.asy.life/command-center.html)
for the 60-second picture, **Projects** (https://observatory.asy.life/projects.html) for
the flagship, and the read API at https://api.asy.life/docs.

---

## Technical

For developers and API consumers.

**The API.** https://api.asy.life is a neutral, read-only Cardano data layer — ~37 routes
across token, market, NFT, project, category, governance and catalyst domains, including
the four memory layers. One base URL instead of juggling Koios, Blockfrost, DexHunter,
Minswap, CIP-26 and OpenCNFT with separate keys and quotas.

- **No key, no auth.** Every route is a `GET`; upstream keys are held server-side.
- **CORS open (`*`).** Call directly from browser JS — static DRep pages, light wallets,
  embeddable widgets integrate with zero backend.
- **`_quality` on (almost) everything.** `source`, `authority_class` (A on-chain / B
  official / C at-risk / D community / E researcher), `refresh`, `confidence`,
  `provenance`, `as_of`.
- **No fabrication.** Unknown → `null` with a `note`; missing exports → `4xx`/`503` with
  an envelope-shaped error, never invented rows.

**Lead with the flagship — Project Memory.**

```
# A project: per-field provenance + evidence, and its append-only history log
curl -s "https://api.asy.life/project/minswap"
curl -s "https://api.asy.life/history/minswap"

# Browse / filter the 847-project record by category
curl -s "https://api.asy.life/projects?category=defi"
curl -s "https://api.asy.life/categories"
```

**Then governance, treasury, tokens.**

```
curl -s "https://api.asy.life/treasury"
curl -s "https://api.asy.life/actions?type=TreasuryWithdrawals&outcome=enacted"
curl -s "https://api.asy.life/token/279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b"
```

**Discoverability.** `GET /routes` lists every route, `GET /openapi.json` is the OpenAPI
3.1 spec, `GET /health` is the liveness probe.

**Seed-set caveat.** Market coverage is partial by design (~110-token seed set); `/markets`
and `/tokens/top` label it `coverage: partial`. Catalyst coverage is deliberately scoped
to preserved funds. The unique, durable layer is **Project Memory** — the curated,
provenance-stamped project record — not market data.

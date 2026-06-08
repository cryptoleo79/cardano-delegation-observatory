# Launch — the ASY / asy.life Cardano ecosystem

A set of related Cardano projects, run by an independent stake pool operator and DRep,
that does one thing across several surfaces: writes down the parts of Cardano's public
record that quietly disappear when individual platforms pivot, sunset, or fail. It is
**read-only**, **provenance-first**, and about **observability — not attribution or
judgment**. The code is Apache-2.0; the published data is CC0.

This file holds the first public announcement in three versions — **short**,
**medium**, and **technical**. Use whichever fits the venue.

---

## Short

> A neutral, read-only memory layer for Cardano: governance, treasury, Catalyst, and
> ecosystem records — every value carrying its own provenance. It observes and
> preserves; it does not rank, score, or guess intent.
>
> Observatory → https://observatory.asy.life · API → https://api.asy.life/docs ·
> Start here → https://observatory.asy.life/memory.html

---

## Medium

**What it is.** ASY (at asy.life) is one set of related Cardano projects with a single
purpose: to preserve the parts of Cardano's public record that vanish when the
platforms holding them pivot or shut down. It observes; it does not interpret. The
guiding principles are plain — read-only, provenance-first, observability rather than
attribution, and open (Apache-2.0 code, CC0 data). It records what existed and what
happened; it does not assign trust, alignment, blame, or quality, and it does not try
to infer anyone's intent.

**What's live.** The **Observatory** (https://observatory.asy.life) is a governance
observability layer computed daily from on-chain data: the top-30 DReps by voting
weight, 120 governance actions with their vote tallies, 426 epochs of treasury history
plus withdrawals, delegation flows and voting-weight concentration over time, a
governance-health page, and a market-event timeline. The **Data Layer API**
(https://api.asy.life) re-floats read capabilities that orphan when platforms sunset:
37 read-only routes, no key, CORS open, and a `_quality` provenance block on every
meaningful response so you always know where a value came from. Alongside these,
**Project Memory** preserves 725 projects across 74 categories (event-sourced, with
provenance), the **Catalyst archive** preserves Funds 1–13 with chain-of-custody, and
the **Treasury** layer holds the full per-epoch series and withdrawals. Everything is
fully bilingual (English and Japanese). A separate, propositional piece — the
**Connected Treasury Framework** (https://ctf.asy.life) — argues a treasury policy
position and is kept deliberately apart from the non-interpretive observatory work.

**Why it matters.** Cardano's governance is observable in principle but hard to watch
over time, and its off-chain records — Catalyst proposals, ecosystem metadata, the
live capabilities of platforms people built on — disappear with their hosts. This does
the unglamorous work of writing those bytes down, every day, with chain-of-custody, so
a delegator doing due diligence, a DRep reviewing their own record, a researcher
measuring decentralization, or someone in 2030 can verify exactly what the record said.

**An honest note on coverage.** The tracked token set (roughly 103–110 tokens) is an
explicit *seed set*, not full-ecosystem coverage, and the project says so openly:
coverage is labeled "populated / pending / missing" rather than presented as complete.
Where a value is unknown, the API returns `null` with a note instead of fabricating
one. Nothing here ranks projects, scores DReps, or claims to be the whole ecosystem.

**Where to start.** Read https://observatory.asy.life/memory.html to understand why
the project exists and what it refuses to do, browse the record at
https://observatory.asy.life, and explore the read API at https://api.asy.life/docs.

---

## Technical

For developers and API consumers.

**The API.** https://api.asy.life is a neutral, read-only Cardano data layer — 37
routes across the token, market, NFT, project, category, governance, and catalyst
domains, including the four memory layers. It is built for consolidation plus
provenance: one base URL instead of juggling Koios, Blockfrost, DexHunter, Minswap,
CIP-26, and OpenCNFT with their separate keys and quotas.

- **No key, no auth.** Every route is a `GET`. There is nothing to sign up for and no
  token to rotate; upstream keys, where needed, are held server-side, never by you.
- **CORS open (`*`).** Safe to call directly from browser JavaScript — static DRep
  pages, light wallets, and embeddable widgets can integrate with zero backend.
- **`_quality` on (almost) everything.** Token, market, project, governance, and
  catalyst responses carry a nested `_quality` block: `source`, `authority_class`
  (A on-chain / B official / C at-risk / D community / E researcher), `refresh`,
  `confidence`, a human-readable `provenance` string, and an `as_of` timestamp. The
  legacy `nft`/`onchain` routes emit a flatter envelope (top-level `source` + `as_of`);
  read both shapes.
- **No fabrication.** Unknown values return `null` with a `note`. Missing
  governance/catalyst exports return `4xx`/`503` with an envelope-shaped error rather
  than inventing rows.

**Example calls.**

```
# Latest treasury epoch, balance series, and withdrawals (pre-assembled)
curl -s "https://api.asy.life/treasury"

# Governance actions filtered by type and outcome
curl -s "https://api.asy.life/actions?type=TreasuryWithdrawals&outcome=enacted"

# A single token: CIP-26 metadata + on-chain supply + DEX price + holders, one call
curl -s "https://api.asy.life/token/279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b"

# Project Memory with per-field provenance and an append-only history log
curl -s "https://api.asy.life/project/minswap"
curl -s "https://api.asy.life/history/minswap"
```

**Discoverability.** `GET /routes` lists every live route, `GET /openapi.json` is the
machine-readable OpenAPI 3.1 spec (point a client generator at it), and `GET /health`
is the liveness probe. Full use cases — ten concrete integrations (DRep site,
governance dashboard, light wallet, explorer, directory, SPO tool, notebook, bot,
embeddable widget, NFT page) with endpoints and rationale — are documented alongside
the API.

**Seed-set caveat.** Treat market coverage as partial by design. The tracked token set
is roughly 103–110 tokens — an explicit seed set, not an ecosystem-wide ranking;
`/markets` and `/tokens/top` label this `coverage: partial` so a tracked-set overview
is never mistaken for full coverage. Catalyst coverage is likewise deliberately sparse,
with a `503` on a missing archive rather than guessed data. Build accordingly: cache on
your side, avoid tight polling loops, and read the provenance before trusting a value.

**Licensing and source.** Governance and treasury data are CC0 (public domain, no
attribution required); the observatory ETL is the canonical computation, so you can
clone it, re-run it, and verify the published snapshots yourself. Code is Apache-2.0.
Consumers surfacing NFT data should credit OpenCNFT, whose license requires it. Source
lives on GitHub under **[cryptoleo79](https://github.com/cryptoleo79)**.

**Links.** API docs https://api.asy.life/docs · spec https://api.asy.life/openapi.json
· Observatory https://observatory.asy.life · overview
https://observatory.asy.life/memory.html

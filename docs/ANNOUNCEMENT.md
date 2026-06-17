# Announcement package — asy.life Cardano ecosystem

Ready-to-post copy. Four labeled sections: (a) short X post, (b) long X thread, (c) developer announcement, (d) ecosystem announcement.

Tone: factual, confident, humble about limits. Every claim matches the verified numbers as of 2026-06-17. Emphasis: provenance, free, open, bilingual.

Real URLs:
- Observatory — https://observatory.asy.life
- API + docs — https://api.asy.life/docs
- Memory — https://observatory.asy.life/memory.html
- CTF — https://ctf.asy.life
- GitHub — https://github.com/cryptoleo79

---

## (a) SHORT X POST  (<=280 chars)

> A free, keyless, open data layer for Cardano: governance, treasury, Catalyst, projects + market — every value carries its own provenance. It observes and preserves; it doesn't rank or guess intent. EN/JA.
>
> API → https://api.asy.life/docs
> Site → https://observatory.asy.life

(Character count: ~250.)

---

## (b) LONG X THREAD  (numbered tweets, each <=280 chars)

**1/**
Launching the asy.life Cardano ecosystem: a free, open, read-only data + memory layer.
Governance, treasury, Catalyst, projects and market — in one API, with provenance on every value.
It observes and preserves. It does not rank, score, or guess intent.
🧵

**2/**
Why? Cardano's public record is fragile. Funding portals go offline, project directories vanish, market tools sunset.
When that happens, the shared memory of what was built, funded and decided quietly disappears.
This writes those bytes down — every day, with chain-of-custody.

**3/**
The Observatory (https://observatory.asy.life): governance observability, computed daily from on-chain data.
Top-30 DReps by voting weight · 120 governance actions with vote tallies · 426 epochs of treasury history + withdrawals · delegation flows.
Numbers only — no verdicts.

**4/**
The Data Layer API (https://api.asy.life): 37 read-only routes, no key, open CORS.
Every token/market/project/governance/catalyst value carries a _quality block: source, authority class (A on-chain → E researcher), refresh, confidence.
Unknown values return null. No fabrication.

**5/**
Discovery: 847 projects (766 classified) across 74 categories, event-sourced with per-claim provenance.
A ranked token universe of 1,048 (573 with live market data).
All seeded from a preservation archive, not scraped and forgotten.

**6/**
Memory: an append-only, hash-chained log — ~4,950 events, ~3,100 active claims.
Four layers: Governance, Treasury, Catalyst, Project.
Corrections are new events; nothing is overwritten. Someone in 2035 can verify what the record said.
https://observatory.asy.life/memory.html

**7/**
Preservation: the Catalyst archive captures Funds 1–15 (15/15) with chain-of-custody before the platforms holding them sunset.
Every proposal preserved on the same footing — funded and unfunded. No scores, no rankings.

**8/**
Honest about limits: only ~46–60 tokens have a true *circulating* market cap; the rest are FDV-flagged or null.
Long-tail market data refreshes on rotation and can be flagged stale.
Coverage is labeled "partial" — never dressed up as complete.

**9/**
All of it is bilingual (EN/JA), code is Apache-2.0, data is CC0 (public domain).
Source: https://github.com/cryptoleo79
Run by one independent Cardano SPO + DRep. The operator's own DRep entry appears alongside every other, with no special treatment.

**10/**
Start here:
Site → https://observatory.asy.life
API docs → https://api.asy.life/docs
What it is and refuses to do → https://observatory.asy.life/memory.html
Build on it, check it, outlive it. /end

---

## (c) DEVELOPER ANNOUNCEMENT  (free keyless API + provenance)

**A free, keyless, provenance-first Cardano data layer**

https://api.asy.life is a neutral, read-only Cardano data API — 37 routes across token, market, NFT, project, category, governance, and catalyst domains, including four memory layers. One base URL instead of juggling Koios, DexHunter, Minswap, CIP-26, and OpenCNFT with separate keys and quotas.

**What makes it different**

- **No key, no auth.** Every route is a `GET`. Nothing to sign up for, no token to rotate; upstream keys (where needed) are held server-side, never by you.
- **CORS open (`*`).** Call it directly from browser JavaScript — static DRep pages, light wallets, embeddable widgets integrate with zero backend.
- **`_quality` on every meaningful value.** Token, market, project, governance, and catalyst responses carry a nested block: `source`, `authority_class` (A on-chain · B official · C at-risk · D community · E researcher), `refresh`, `confidence`, a human-readable `provenance` string, and an `as_of` timestamp. (Legacy `nft`/`onchain` routes use a flatter envelope — top-level `source` + `as_of`.)
- **No fabrication.** Unknown values return `null` with a `note`. Missing governance/catalyst exports return `4xx`/`503` with an envelope-shaped error rather than inventing rows.
- **Reproducible.** The Observatory ETL is the canonical computation — clone it, re-run it, verify the published snapshots yourself.

**Example calls**

```
# Latest treasury epoch, balance series, and withdrawals (pre-assembled)
curl -s "https://api.asy.life/treasury"

# Governance actions filtered by type and outcome
curl -s "https://api.asy.life/actions?type=TreasuryWithdrawals&outcome=enacted"

# One token: CIP-26 metadata + on-chain supply + DEX price + holders, one call
curl -s "https://api.asy.life/token/<unit>"

# Project Memory with per-field provenance and an append-only history log
curl -s "https://api.asy.life/project/minswap"
curl -s "https://api.asy.life/history/minswap"
```

**Discoverability**

- `GET /routes` — every live route
- `GET /openapi.json` — OpenAPI 3.1 spec (point a client generator at it)
- `GET /health` — liveness + route count

**Coverage, stated honestly.** The ranked token universe is 1,048 (573 with live market data); `/tokens/top` and `/markets` return `coverage: partial`, so a tracked-set overview is never mistaken for full coverage. Only ~46–60 tokens have a true circulating market cap; the rest are FDV-flagged or null. Catalyst coverage is deliberate (15/15 funds, with a `503` on a missing archive rather than guessed data). Build accordingly: cache on your side, avoid tight polling loops, read the provenance before trusting a value.

**Licensing & source.** Governance and treasury data are CC0 (public domain, no attribution required); code is Apache-2.0. Consumers surfacing NFT data should credit OpenCNFT, whose license requires it. Source: https://github.com/cryptoleo79 (`cardano-data-layer`).

**Links.** Docs https://api.asy.life/docs · spec https://api.asy.life/openapi.json · Observatory https://observatory.asy.life · overview https://observatory.asy.life/memory.html

---

## (d) ECOSYSTEM ANNOUNCEMENT  (discovery, memory, preservation)

**A memory layer for Cardano — observe, preserve, serve**

asy.life is a small, open set of tools that observe and preserve the public life of Cardano — governance, treasury, projects, and funding history — and serve all of it through one read-only API. It records what is verifiably there, with its source attached. It does not rank, score, or guess at intent.

**Why it exists**

The public record of an ecosystem is fragile. Funding rounds close and their portals go offline. Project directories vanish. Market tools sunset. When that happens, the shared memory of what was built, funded, and decided quietly disappears — and with it the ability to hold a clear, common view of Cardano. This project keeps that record open, sourced, and durable. The guiding line: *observe movement, do not infer motive.*

**What's live**

- **Discovery.** 847 projects (766 classified) across 74 categories, each event-sourced with per-claim provenance, plus a ranked token universe of 1,048 (573 with live market data). https://observatory.asy.life
- **Governance observability.** Top-30 DReps by voting weight, 120 governance actions with vote tallies, delegation flows and voting-weight concentration over time — computed daily from on-chain data, numbers only.
- **Treasury.** 426 epochs of per-epoch balance and withdrawal actions, preserved neutrally over time.
- **Memory.** An append-only, hash-chained log (~4,950 events, ~3,100 active claims) across four layers — Governance, Treasury, Catalyst, Project. Corrections are added as new events; the past stays legible. https://observatory.asy.life/memory.html
- **Preservation.** The Catalyst archive captures Funds 1–15 (15/15) with chain-of-custody before the platforms holding them sunset — every proposal on the same footing, funded and unfunded, with no quality scores or rankings.

**Principles**

- **Read-only.** No accounts, no writes, no trading. A reference you observe, not a service you log into.
- **Provenance-first.** Every fact carries its source and authority class (A on-chain · B official · C at-risk · D community · E researcher). If it can't be sourced, it isn't claimed.
- **Observability, not attribution.** It records what happened and when — never that one event caused another, or what anyone intended.
- **Open.** Apache-2.0 code, CC0 data, fully bilingual (EN/JA). Built to be reused, checked, and outlived.

**An honest note on coverage.** Market data is partial by design — only ~46–60 tokens have a true circulating market cap; the rest are FDV-flagged or null, and long-tail data can be flagged stale. Coverage is labeled "partial," never presented as complete. Where a value is unknown, it is returned as null with a note, never invented.

Separately, the **Connected Treasury Framework** (https://ctf.asy.life) argues a treasury-policy position — kept deliberately apart from the non-interpretive observatory work so the two trust boundaries don't bleed together.

Run by one independent Cardano SPO and DRep. The operator's own DRep entry, if any, appears in the published data alongside every other, with no special treatment.

**Where to start.** Read https://observatory.asy.life/memory.html to understand why this exists and what it refuses to do · browse the record at https://observatory.asy.life · explore the API at https://api.asy.life/docs · source at https://github.com/cryptoleo79

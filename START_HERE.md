# START HERE — the ASY / asy.life ecosystem

This is one set of related Cardano projects, run by an independent stake pool operator
and DRep, that does one thing across many surfaces: **write down the parts of Cardano's
public record that quietly disappear when individual platforms pivot, sunset, or fail.**
It observes; it does not interpret, rank, or replace.

If you read nothing else: the work is **read-only**, **provenance-first**, **observability not
attribution**, and **open / CC0**. Everything below is an instance of that.

---

## Quick map (domain → URL → repo)

| Part | URL | Repository |
|---|---|---|
| Observatory (Governance + Treasury Memory) | https://observatory.asy.life | `cardano-delegation-observatory` |
| Data Layer / API | https://api.asy.life | `cardano-data-layer` |
| Memory Layer (the frame over all of it) | https://observatory.asy.life/memory.html | (vision doc, lives in observatory) |
| Catalyst Memory | (archive; surfaced at observatory.asy.life/catalyst.html) | `cardano-catalyst-archive` |
| Project Memory | (seed source for the Data Layer) | `cardano-project-memory-archive` |
| Connected Treasury Framework (CTF) | https://ctf.asy.life | `~/CTF/` |

GitHub operator: **[cryptoleo79](https://github.com/cryptoleo79)** — an independent Cardano
SPO and DRep. The operator's own DRep entry, if any, appears in the published data alongside
every other DRep, with no special treatment.

---

## Observatory — governance observability

**What:** A neutral observability layer for Cardano governance. Daily snapshots, computed from
on-chain data (with at least a 24-hour lag from any on-chain event to the site), of:

- **Top-30 DReps** by raw voting weight, with delegator counts and per-DRep voting history.
- **Governance actions** — each action's submission, ratification, enactment, expiration, or
  drop, plus the DRep vote tally.
- **Treasury** — per-epoch balance and `TreasuryWithdrawals` actions (see Treasury, below).
- **History** — the full dated archive of every snapshot, byte-equal, SHA-256 hashed.
- **Projects / Ecosystem / Categories** — the curated editorial ecosystem view (Project Memory).
- **Market timeline** — token/market surfaces with a market-events overlay.
- **Flows / Concentration / Governance-health** — derived views of delegation movement and
  voting-weight concentration over time.
- **Status** — operational telemetry for the ETL and the site.

Live pages include `index`, `drep`, `actions`/`action`, `treasury`, `history`, `projects`/
`project`, `ecosystem`, `categories`/`category`, `market`, `tokens`/`token`, `flows`,
`concentration`, `governance-health`, `rankings`, `memory`, `catalyst`, `methodology`, `status`.

**Where:** https://observatory.asy.life — repo `cardano-delegation-observatory`.

**Why:** Cardano's on-chain governance is observable in principle but hard to watch over time.
The Observatory makes governance behavior legible to delegators doing due diligence, DReps
reviewing their own record, researchers measuring decentralization, and journalists citing
source data — **without** producing trust scores, alignment ratings, predictions, or any
editorial judgment on individual DReps. Every number is reproducible from public Koios API
responses via the published ETL.

---

## API / Data Layer — the read API for the whole ecosystem

**What:** A neutral, **read-only** Cardano data-infrastructure service. One HTTP API surfaces
token markets, on-chain facts, NFT collections, and the four memory layers — across the
**token / market / nft / project / category / governance / catalyst** domains. There is no
authentication and no API key for consumers; every `GET` response that comes from the token,
market, project, governance, or catalyst modules carries a `_quality` provenance block (source,
authority class A–E, refresh cadence, confidence, human-readable provenance, `as_of` timestamp)
so you always know where a value came from and how authoritative it is. The service never
fabricates: unknown values come back as `null` with a note.

It is **not a TapTools clone.** Market data is treated as a thin convenience layer over open
sources (DexHunter, Minswap, Koios, CIP-26, OpenCNFT); the genuine value is the curated
**project / category** "moat" seeded from the preservation archive.

**Where:**
- API root and docs: https://api.asy.life (`/` redirects to `/docs`)
- Self-contained docs page: https://api.asy.life/docs
- Machine-readable spec: https://api.asy.life/openapi.json (OpenAPI 3.1)
- Health: https://api.asy.life/health
- Repo: `cardano-data-layer`

**Why:** When a useful platform sunsets (TapTools' wind-down was announced 2026-06-02), the live
API capability that consumers depended on orphans. The Data Layer re-floats the orphaned
capabilities under a neutral, open, provenance-labeled trust boundary — distinct from, but
seeded by, the archival Memory Layer.

---

## Memory Layer — the frame that unifies everything

**What:** The articulation of what this whole project is: a **memory infrastructure for Cardano**
that happens to use observability as one of its surfaces. There are **four memory layers**:

1. **Governance Memory** — the Observatory's DRep/action/vote record (observatory.asy.life).
2. **Treasury Memory** — per-epoch treasury balance and withdrawals (observatory.asy.life).
3. **Catalyst Memory** — the Catalyst preservation archive (`cardano-catalyst-archive`).
4. **Project Memory** — the editorial ecosystem metadata that would otherwise orphan
   (`cardano-project-memory-archive`).

The layers are not a hierarchy; they share principles but preserve in parallel, each with its own
lifecycle and trust boundary.

**The philosophy:** preserve what disappears; observe, do not interpret. On-chain content
self-preserves (consensus guarantees it stays queryable); off-chain content disappears with its
host, so the bias is toward off-chain capture with chain-of-custody. The layer **records**; it
does not choose what is worth remembering, does not say what the record meant, does not rank, and
does not rebuild a sunset platform as a live product. Every captured artifact carries provenance
(source URL, capture date and method, SHA-256, authority class, optional Wayback snapshot) so a
researcher in 2030 or 2035 can verify that a byte sequence is exactly what was on the source at
the time.

**Where:** https://observatory.asy.life/memory.html — vision document at
`observatory/docs/CARDANO_MEMORY_LAYER.md`.

**Why:** Cardano's governance, treasury, Catalyst, and ecosystem records are the kind of thing
that vanishes when projects pivot or fail. Someone has to do the boring work of writing the bytes
down, every day, with chain-of-custody, and no fanfare. That is the entire ambition.

---

## Catalyst — the preservation archive

**What:** A standalone archive of Cardano Catalyst's historical record across **Funds 1–15** —
per-fund landing pages and voting results from `projectcatalyst.io`, IdeaScale campaign/proposal
pages captured via the Wayback Machine (the live IdeaScale site is a JS shell), the
`catalyst-core` repository as a bare git mirror, `catalystexplorer.com` community-mirror pages,
per-proposal milestone tracker pages, and on-chain Catalyst payout query records. It preserves
every proposal on the same footing — funded and unfunded — and deliberately omits quality scores,
rankings, milestone-completion judgments, and anything requiring API tokens or special access
(ordinary-researcher reproducibility is a hard rule).

**Where:** repo `cardano-catalyst-archive`; surfaced at
https://observatory.asy.life/catalyst.html.

**Why:** Catalyst's record lives on platforms (IdeaScale, in particular) that are sunsetting. Once
they go, the prior state is gone unless it was snapshotted. This is the time-sensitive capture.

---

## Treasury — FLOW-5 observability

**What:** The treasury observability layer inside the Observatory. Per-epoch treasury balance back
to the earliest epoch Koios exposes; every `TreasuryWithdrawals` governance action with its full
recipient list (stake address + lovelace); and the reconciliation between an enacted withdrawal
and the observed treasury delta at the enactment epoch, with the residual reported as an honest
accounting figure. It does **not** evaluate recipients, project "runway" or "burn rate," or flag
anomalies.

**Where:** https://observatory.asy.life/treasury.html (Methodology §22; repo
`cardano-delegation-observatory`).

**Why:** Where treasury ADA goes, and whether observed balance changes line up with
governance-attributed withdrawals, is a public-interest question that nothing else preserves
neutrally over time.

---

## Builders Fund — integration target (planned)

**What:** A planned integration that would connect builder/project pages to **Project Memory** —
so a builder surface can draw on, and link back to, the preserved editorial ecosystem metadata
under chain-of-custody rather than restating it. The integration spec is tracked as
`BUILDERS_FUND_INTEGRATION.md` (forward-looking; not yet shipped).

**Where:** to be sited within the Observatory's project/ecosystem surfaces, drawing on
`cardano-project-memory-archive`.

**Why:** Project Memory already holds the durable, provenance-backed record of who built what;
connecting builder pages to it avoids duplicating curation and keeps a single source of custody.

---

## CTF — Connected Treasury Framework

**What:** A separate, self-contained proposal packet (not part of the Memory/Data work) arguing
that the Cardano on-chain treasury should become a yield-generating, transparently-reported,
fiscally-disciplined endowment rather than a passive ADA reservoir. It includes a foundation
report, a submission-ready Phase 1 governance action, a long-game CIP outline for protocol-level
treasury staking with voting-power neutralization, and an interactive runway simulator. It is
currently in observation mode.

**Where:** https://ctf.asy.life — repo `~/CTF/`.

**Why:** It is the one explicitly *propositional* piece in the ecosystem — a treasury policy
argument — kept deliberately separate from the read-only, non-interpretive observatory work so the
two trust boundaries don't bleed into each other.

---

## For developers

- Start at **https://api.asy.life/docs** — the self-contained API documentation.
- Pull the spec from **https://api.asy.life/openapi.json** (OpenAPI 3.1) to generate a client.
- Every meaningful response carries a `_quality` provenance block; read it before trusting a value.
- The API is read-only and key-free for consumers. CORS is `*`, so you can fetch it from a browser.
- Source is on GitHub under **[cryptoleo79](https://github.com/cryptoleo79)**. Observatory data is
  **CC0** (public domain, no attribution required); observatory code is Apache 2.0. The ETL is the
  canonical computation — clone it, re-run it, and verify the published snapshots yourself.

## For a curious visitor

1. **Start at the Observatory** — https://observatory.asy.life. Look at the top-30 DReps, a
   governance action or two, and the treasury page. Notice there are no scores or verdicts; it is
   just the record.
2. **Then read Memory** — https://observatory.asy.life/memory.html. This explains *why* the project
   exists and what it refuses to do, and ties the four layers together.
3. **Then explore the API** — https://api.asy.life/docs. The same record, plus market and project
   data, as a read API you can build on.

## Guiding principles

- **Read-only.** No write paths, no accounts, no alerts, no social layer. It is data.
- **Provenance-first.** Every value and every captured artifact carries chain-of-custody
  (source, date, method, SHA-256, authority class). Without provenance, the bytes are evidence of
  nothing.
- **Observability, not attribution.** It shows what existed and what happened; it does not assign
  trust, alignment, blame, or quality. Interpretation is the reader's job, made later, with
  context the operator does not have today.
- **Open / CC0.** Published data is public domain; code is openly licensed; everything must be
  reproducible by an ordinary researcher with a laptop and a network connection — no API tokens,
  no special access.

# FINAL LAUNCH REPORT — asy.life Cardano ecosystem
*Truth document · verified live 2026-06-18. Code Apache-2.0 · data CC0 · bilingual EN/JA.*

## What exists / what is live (all HTTP 200)
| Property | URL | Purpose |
|---|---|---|
| Observatory | observatory.asy.life | Governance observability + discovery + memory + the change feed |
| Data Layer API | api.asy.life | Read-only, keyless, **37 routes**, `_quality` provenance on every value |
| CTF | ctf.asy.life | Connected Treasury Framework |
| Voting / Governance | voting.asy.life · governance.asy.life | Governance surfaces |
| Source | github.com/cryptoleo79 | 4 repos (data-layer, observatory, catalyst-archive, project-memory-archive) |

**Discovery pages (all on the shared product-grade design system):** Observatory (home), Tokens, Rankings, Projects, Ecosystem, Treasury, Catalyst, Market, Health, **Changes** (DRep change feed), Memory — plus About, Map, Docs, Status, **Heartbeat**.

## Coverage (live numbers)
- **Projects:** 847 (766 classified; **715 with ≥1 sourced link** — website 674, github 152, docs 65, whitepaper 142, every link Wayback+SHA-256 backed)
- **Categories:** 74 (73 populated · 1 deprecated · 0 ambiguous)
- **Tokens:** ranked universe 1,048 · 573 with live market data · 47 true circulating market caps
- **Catalyst:** 15 / 15 funds archived (chain-of-custody)
- **Governance:** 30 DReps (top-30 by methodology) · 120 actions · **epoch 637, data through 2026-06-18**
- **Treasury:** 429 epochs · **API:** 37 routes · **Project Memory:** 5,549-event tamper-evident log

## Operational health (the heartbeat)
- Governance ETL **scheduled** (twice-daily cron, version-controlled) after the 2026-06-01 stall — now self-refreshing (last run today).
- Market/OHLCV poller every 5 min (dynamic priority keeps the visible rankings fresh: **0 liquid tokens stale**).
- **`heartbeat.html`** dashboard (Fresh/Warning/Stale) + **active alerting** monitor (cron every 10 min, transition-based) — armed; needs one webhook in `monitor/alert.env` to deliver to Discord/Telegram. See `HEARTBEAT_MONITOR.md`, `MONITORING_SETUP.md`, `ROOT_CAUSE.md`.

## Known limitations (honest)
- **Market depth:** only 47 tokens have a true *circulating* market cap; the rest are FDV-flagged or null. This is a free-source (GeckoTerminal/CoinGecko) ceiling — no static, citable circulating figures exist for the long tail, so none were invented. Mint-cap artifacts are guarded against.
- **Project links:** 132 of 847 projects have no published website/GitHub/docs in any source (recorded as skipped, not invented). No audit links — sources don't expose them.
- **Change feed depth:** 24h/7d windows live; 30d/90d fill as daily snapshots accumulate.
- **Alerting:** detection/transition logic tested; live channel delivery pending one user-supplied webhook.

## Next milestones (post-launch)
1. Wire the alert webhook → fully active heartbeat alerting.
2. Live-computed circulating supply (on-chain treasury netting) to lift market-cap coverage beyond 47.
3. Continue enrichment as new sources/snapshots appear; change-feed windows deepen automatically.

## Verdict
**GO.** Data is fresh and provenance-bearing, the presentation matches the infrastructure, monitoring is in place, and every known limitation is surfaced honestly rather than hidden. Ready to announce.

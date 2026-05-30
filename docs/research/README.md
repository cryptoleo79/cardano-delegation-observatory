# Research notes

This directory holds research briefs produced by parallel research passes to inform Observatory methodology and architecture decisions. The briefs are *intelligence*, not commitments. Code and methodology drafts that act on them are written separately on the main thread and reviewed before landing.

Each brief is dated and scoped to a single question. They are kept in this repo so that future work can audit the basis on which decisions were made — even after the conversational context in which they were produced is gone.

## Index

- [`voting_layer.md`](voting_layer.md) — Architecture brief for voting.asy.life (Ekklesia, Hydra, liquid democracy, CIP-1694, participation UX). Three-phase recommendation.
- [`governance_portal.md`](governance_portal.md) — Structure recommendation for governance.asy.life umbrella portal (governance portals, observability portals, civic participation portals; status-label discipline; bilingual presentation).
- [`treasury_flow5.md`](treasury_flow5.md) — FLOW-5 implementation notes. Koios endpoint catalog, schema additions, withdrawal linkage. **Important correction:** `/treasury_withdrawals` is NOT governance-driven; governance treasury actions live in `/proposal_list` filtered to `TreasuryWithdrawals`.
- [`catalyst_preservation_flow6.md`](catalyst_preservation_flow6.md) — FLOW-6 preservation plan extending `docs/IDEASCALE_PRESERVATION.md`. Hybrid Browsertrix + Wayback + catalyst-toolbox API extraction. Trigger conditions, chain-of-custody schema, GDPR/copyright considerations.
- [`history_timeline_ui.md`](history_timeline_ui.md) — Direction document for history.html evolution: pattern catalog, three-level semantic zoom, accessibility checklist, anti-patterns that would violate "movement, not intent."
- [`search_architecture.md`](search_architecture.md) — Client-side search layer brief. Library comparison (FlexSearch, MiniSearch, Fuse.js, Pagefind, Stork, Tinysearch, Lunr.js). Lexical-only ranking; explicit non-goal of semantic search.
- [`analytics_concentration.md`](analytics_concentration.md) — Concentration metrics research (Gini, HHI, Theil, Atkinson, Nakamoto, top-N share, Shannon entropy). Five-metric panel recommended; worked sensitivity tests; editorial-firewall language.

## Status

These are research deliverables, not implementation. Each brief contains an *open questions* section that the methodology author resolves before any §22+ section is drafted or any FLOW-5+ code lands.

## Convention

- Plain markdown, no special tooling.
- Cite primary sources inline with URLs and access dates.
- No editorial superlatives ("best", "leading", "innovative", "revolutionary").
- If a concept is speculative or proposal-stage, the brief says so.

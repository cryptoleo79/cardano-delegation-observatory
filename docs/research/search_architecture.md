# Search architecture — client-side search layer for observatory

**Status:** Research only. Future architecture brief. No code, no methodology edits.
**Date:** 2026-05-29
**Scope:** Client-side JS search libraries, index format, CJK tokenization, ranking discipline, semantic-search firewall.

---

## Library comparison

| Library | Size (min+gz) | JS-only vs WASM | Fuzzy | CJK tokenization | License | Last release |
|---|---|---|---|---|---|---|
| **Lunr.js** | 32 KB / 11 KB | JS-only | No (stemming only) | Weak (whitespace) | AGPL-2.0 | 2021 |
| **FlexSearch** | 16.3 KB / 4.5 KB | JS-only | Yes (phonetic, tolerant) | Yes (`Charset.CJK` preset) | Apache-2.0 | May 2025 |
| **MiniSearch** | ~7 KB / ~2 KB | JS-only | Yes (edit distance) | Weak (Unicode punct/space) | MIT | 2024 |
| **Fuse.js** | 8.6 KB / 6.8 KB | JS-only | Yes (token + extended) | Partial (via `Intl.Segmenter`) | Apache-2.0 | Recent |
| **Pagefind** | ~30–50 KB chunks / 15–25 KB | WASM | No (exact phrase) | Yes (`Intl.Segmenter`, ~45% smaller v1.5) | MIT | May 2025 |
| **Stork** | ~99 KB / 49 KB | WASM (Rust) | No (substring exact) | Yes (config) | Apache-2.0 | 2023 |
| **Tinysearch** | ~99 KB / 49 KB | WASM (Rust) | No (XOR filter) | No (size-focused) | MIT | 2020 |

**Summary for observatory scale (~1000 DReps, ~150 actions):**

- JS-only libraries ship 2–7 KB gzipped and build indices at runtime in ~50–200 ms.
- WASM options precompile at build time but require binary infrastructure; Pagefind v1.5 now includes CJK segmentation via `Intl.Segmenter` and 45% smaller indices.
- **CJK constraint:** Only FlexSearch and Pagefind offer production-grade CJK support out of the box. Fuse.js allows custom tokenization but requires explicit setup.

---

## Index format & ETL integration

### Phase 1 — runtime indexing

- Load `top30.json` (DReps) + `actions.json` (governance actions) + `dreps/*.json` (per-DRep history)
- FlexSearch or Fuse.js builds indices in-memory at page load (~100 ms)
- Index payload: ~5–10 KB gzipped for the full dataset
- **No ETL change required**

### Phase 2+ — prebuilt indices

- ETL generates `search-index.json` at build time (concatenate DRep names, action titles, action_ids into denormalized index)
- Pagefind or Stork could pre-index at build time (requires Rust toolchain for WASM)
- Trade-off: prebuilt saves ~100 ms client-side build but adds server-side binary dependency

### JSON shipping overhead

A denormalized index (name + action_id + title only) for ~1150 documents:
- ~50–80 KB uncompressed
- ~8–12 KB gzipped (acceptable alongside existing top30.json ~20 KB)

---

## Search surface scope

### Indexed fields

- DRep `name` (string; required)
- DRep `drep_id` (string; exact anchor-link use case)
- Action `title` (string)
- Action `action_id` (string; canonical governance identifier)
- Action `action_type` (enum: ParameterChange, TreasuryWithdrawals, etc.)
- Vote tally summary: `drep_yes_count`, `drep_no_count`, `drep_abstain_count` (numeric range queries)

### Explicitly excluded

- Vote `vote_history` transcripts or per-DRep voting comments (would inject narrative bias)
- `metadata_url` or external IPFS links (editorial curation signal)
- `daily_flow` or `recent_net_change` time-series data (aggregate-only observability; search is point-in-time)
- Derived fields like "sentiment" or "priority" (not numbers-only)
- Full-text of methodology pages (governance.asy.life scope, not observatory)

**Rationale:** Indexing names, IDs, type/outcome enums preserves reproducibility; excluding narrative or derived fields protects the "numbers only" design.

---

## UX patterns

### Placement

- **Header-right Cmd-K modal** (keyboard-driven, matches GitHub / VS Code)
- Alternative: dedicated `/search` page (less discoverable; recommend modal instead)

### Keyboard

- Cmd-K (Mac) / Ctrl-K (Linux/Windows): open
- Esc: close
- Arrow keys: navigate results
- Enter: navigate to selected result

### Ranking (lexical only, no popularity weighting)

- Exact prefix match (e.g., "Yoroi" matches "Yoroi W₳llet" first)
- Substring match (e.g., "llet" matches "Wallet")
- Alphabetical tiebreak (deterministic, auditable)
- **No** boost by voting weight, delegator count, or recency (editorial)

### Empty state

- "No results for '[query]'. Try a different name or action ID."
- Suggest: browse DReps by voting weight, or scan actions by type

### Bilingual search (EN/JA)

- Single index, results rank both English and Japanese matches equally
- `Intl.Segmenter` handles CJK phrase boundaries (if Fuse.js custom tokenizer used)
- FlexSearch built-in `Charset.CJK` is simpler; test with real JP DRep names and action titles

---

## Methodology implications: explainable ranking

Any ranking is editorial. The observatory must stay transparent.

### Acceptable ranking signals (preserve reproducibility)

- Lexical string distance (how close the match to the query)
- Field type (exact ID matches rank above substring matches)
- Alphabetical order (tiebreaker)

### Unacceptable ranking signals

- Popularity (voting weight, delegator count): treats observability as endorsement
- Recency: implies urgency, not observability
- Engagement (number of votes on an action): editorial emphasis
- Sentiment or derived scores: inference layer outside scope

### Documentation requirement

If search ships, methodology should note:

- Ranking uses lexical distance and field type only
- Search is a convenience layer; results are a view over the daily snapshot, not a recommendation or filtered feed
- CJK text is segmented by Unicode boundaries (or `Intl.Segmenter` rules if specified)

---

## Privacy & logging

- All search happens in the browser; no server-side logging
- No analytics or telemetry on what users search for
- No backend index server or API
- Index can be cached by browser (no-cache headers already set for snapshots; search index follows same cache policy)

---

## Phased recommendation

### Phase 0 (status quo — document existing filters)

- `actions.html` already has type + outcome dropdowns
- Document: "Per-page filters available; no global search yet"
- Baseline: 0 KB overhead

### Phase 1 (minimal lexical search, runtime indexing)

- Adopt FlexSearch (4.5 KB gzipped) or Fuse.js (6.8 KB gzipped)
- Index: DRep names + action titles + action_ids only
- Build at runtime from top30.json + actions.json (~100 ms)
- Search modal (Cmd-K); ranking: lexical distance + field type
- Exclude vote history, metadata, flow data
- Estimated implementation: 300 LOC
- **No ETL changes required**
- Overhead: ~7–10 KB gzipped JS

### Phase 2 (full-text + DRep detail pages)

- Extend index to include per-DRep vote_history (action titles + types voted on)
- Allow search like "find DReps who voted on 'Treasury'"
- Consider prebuilt indices (Pagefind) if latency becomes a concern
- Requires ETL integration to generate `search-index.json`
- **Risk:** vote_history indexing blurs observability into narrative — voting patterns become a signal, not just a fact. Discuss before shipping.

### Explicit non-goals

- Semantic search (embeddings, intent inference) — would inject editorial signal
- Recommendation ranking (boost by voting weight or consensus)
- Cross-link with external governance platforms (stays siloed)
- Real-time search (snapshots are daily; search stales until next ETL run)

---

## Recommended first step

1. Adopt **Fuse.js** or **FlexSearch** for Phase 1. Both sub-7 KB, CJK-capable, no build-time dependencies.
2. **Index surface:** DRep name, action title, action_id, action_type. Exclude vote_history initially.
3. **UX entry:** Cmd-K modal in site header.
4. **Ranking rule:** lexical distance, then field type (exact ID > substring > action type name), then alphabetical.
5. **Documentation:** add to methodology: "Search is a lexical convenience layer over the daily snapshot. No popularity or engagement ranking; results are not recommendations."
6. **Preserve agnosticism:** if external link or semantic inference is ever needed, ship it as a downstream tool (e.g., `voting-patterns-search.asy.life`), not in the observatory itself.

---

## Conclusion

A client-side search layer fits the observatory's observability mandate if it stays lexical, explainable, and numbers-only. FlexSearch or Fuse.js fit within a 7 KB budget, handle CJK via `Intl.Segmenter` or built-in presets, and require no ETL changes. Phasing avoids scope creep. The key commitment is to resist semantic ranking, which would implicitly endorse voting patterns as signal rather than recording them as fact.

---

## Sources

- https://github.com/nextapps-de/flexsearch
- https://github.com/lucaong/minisearch
- https://fusejs.io/
- https://github.com/Pagefind/pagefind/releases/tag/v1.5.0
- https://stork-search.net/
- https://github.com/tinysearch/tinysearch
- https://lunrjs.com/guides/index_prebuilding.html
- https://css-tricks.com/in-page-filtered-search-with-vanilla-javascript/
- https://listjs.com/
- https://phiilu.com/dealing-with-url-query-parameters-in-javascript-using-urlsearchparams
- https://moldstud.com/articles/p-step-by-step-guide-to-compressing-json-for-enhanced-mobile-app-performance
- https://dev.to/ternentdotdev/json-compression-in-the-browser-with-gzip-and-the-compression-streams-api-4135

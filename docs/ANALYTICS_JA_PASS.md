# Analytics Japanese Pass — Phase JA-Analytics

Scope: bring the four analytics pages added after the Japanese-first launch bundle
up to full bilingual (EN + JA) parity with the rest of the Observatory. These pages
already had bilingual titles/nav but rendered their **data labels, descriptions,
tooltips, and legends** in English only.

Shipped independently of, and after, the ecosystem-integration release (commit
`1636dcc`) — the release was not blocked on this pass.

## Pages in scope

| Page | File(s) | What was EN-only |
|------|---------|------------------|
| Governance health | `governance-health.html` / `.js` | stat-card labels + subs, section headers, outcome table headers, meta labels, footnote, lede |
| Delegation concentration | `concentration.html` / `.js` | stat labels, share-table headers + row labels, distribution value units, meta labels, footnote, lede |
| Delegation flow | `flows.html` / `.js` | window options, meta labels, accumulating-state banner, rule + footnote, lede |
| Market Reality | `market.html` / `.js` | filter buttons, authority tooltips, rule, footnote, lede |

## Translation rules

1. **Labels** — stat-card labels, table headers, meta-strip labels, filter buttons:
   translated in each page's `PAGE_I18N` (en+ja) and rendered through `t(key)` inside
   the page's `render()`/`renderTimeline()` so they re-translate on the `cdo-lang` event.
2. **Descriptions** — page ledes: plain text, added to `PAGE_I18N` under the element id
   so the shared `setLang()` swaps `textContent` (matches the treasury/rankings pattern).
3. **Tooltips** — the Market authority-class `title=` tooltips (On-chain / Official /
   At-risk platform / Community / Researcher): translated via an `AUTH` map keyed by lang.
4. **Legends** — the explanatory footnotes (HHI/Gini meaning, "net not migration", the
   observability-not-attribution rule): these contain limited markup (`<strong>`,
   `<em>`, `<code>`, `<a>`), so the shared `setLang()` (which uses `textContent`) cannot
   render them. They are painted via a small per-page `paintStatic()` that sets
   `innerHTML` from a dedicated `*-html` i18n key on boot and on `cdo-lang`. The `*-html`
   key is deliberately **not** an element id, so `setLang()` never clobbers it. The markup
   is our own literal strings (no external HTML), so `innerHTML` is safe here.

## Re-render on language toggle

- `concentration.js`, `flows.js`, `market.js` already re-rendered on `cdo-lang`; they
  gained `paintStatic()` in that listener.
- `governance-health.js` previously rendered once at boot. It was refactored to cache the
  fetched API payloads in `state` and split fetch (`boot`) from paint (`render` +
  `paintStatic`), so a language toggle re-paints from cache with **no extra API calls**.

## Deliberately left in English (data, not chrome)

- Governance **outcome values** (`enacted`, `ratified`, `expired`, …) are on-chain data
  values, not UI chrome — shown verbatim, consistent with how the rest of the site treats
  on-chain enums.
- Market **event titles/descriptions** come from `market-events.json` (sourced records);
  translating source records is out of scope for a UI i18n pass and would change provenance.
- DRep / project **names** are never translated.

## Verification

- `node --check` on all four `.js` files.
- Toggle EN⇄JA on each page: every label, lede, header, footnote, tooltip, filter, and
  banner switches; no element shows raw markup; no element is stuck in the other language;
  dynamic content re-paints from cache without re-fetching (governance-health).

# Discovery layer build spec (parallel agents)

Data-first discovery UI on the observatory site (`web/`), consuming the **live Cardano Data Layer API** (`https://api.asy.life`) and Project Memory. NO scraping. Read-only. Pages deploy via git → observatory.asy.life.

## Hard rules (no collisions)
- **One agent owns its files only.** Never edit another agent's file or shared files (`style.css`, `i18n.js`, existing `*.html`/`*.js`). Main thread merges.
- **Zero build step, no frameworks, no external CDNs.** Plain HTML + vanilla JS + the existing `style.css`. Page-specific CSS goes in a small `<style>` block inside your own `.html` (do NOT edit `style.css`).
- **Data source = the API only.** `const API = new URLSearchParams(location.search).get('api') || 'https://api.asy.life';` then `fetch(API + '/...')`. The API sends `Access-Control-Allow-Origin: *`, so cross-origin fetch works. Every API response has a `_quality` block — surface `source` + `authority_class` where it adds trust.
- **NO-GO (do not build):** portfolio, wallet, trading, order books, exchange UX, social, watchlists, accounts, moderation, editing of any kind. Discovery + display only. No opinions/narratives/rankings-with-judgment.
- **Japanese-first:** include the shared header (below) with `id="..."` nav links; add page-specific labels via a `PAGE_I18N` merge in your JS (see pattern in `web/projects-page.js`): define `{en:{...},ja:{...}}`, `Object.assign(i18n.en,..); Object.assign(i18n.ja,..); setLang(currentLang());`. Global nav keys are added by Agent I.

## Shared chrome (paste verbatim into every new page; set ONE nav link's class to "active")
```html
<div class="ecosystem-strip"><div class="ecosystem-strip-inner">
  <span class="eco-label" id="eco-label">Ecosystem</span>
  <a href="https://ctf.asy.life" class="eco-link">CTF</a><span class="eco-sep">·</span>
  <a href="https://observatory.asy.life" class="eco-link" id="eco-link-observatory">Observatory</a><span class="eco-sep">·</span>
  <a href="https://voting.asy.life" class="eco-link" id="eco-link-voting">Voting</a><span class="eco-sep">·</span>
  <a href="https://governance.asy.life" class="eco-link" id="eco-link-governance">Governance</a><span class="eco-sep">·</span>
  <a href="https://api.asy.life" class="eco-link" id="eco-link-api">API</a><span class="eco-sep">·</span>
  <a href="https://github.com/cryptoleo79" class="eco-link" target="_blank" rel="noopener">GitHub</a>
</div></div>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="brand"><span class="brand-mark">CDO</span><span class="brand-text" id="h-brand">Cardano Delegation Observatory</span></a>
  <nav class="site-nav">
    <a href="/" id="h-nav-observatory">Observatory</a>
    <a href="tokens.html" id="h-nav-tokens">Tokens</a>
    <a href="rankings.html" id="h-nav-rankings">Rankings</a>
    <a href="projects.html" id="h-nav-projects">Projects</a>
    <a href="ecosystem.html" id="h-nav-ecosystem">Ecosystem</a>
    <a href="treasury.html" id="h-nav-treasury">Treasury</a>
    <a href="catalyst.html" id="h-nav-catalyst">Catalyst</a>
    <a href="memory.html" id="h-nav-memory">Memory</a>
    <div class="lang-toggle"><button id="btn-en" class="active" onclick="setLang('en')">EN</button><button id="btn-ja" onclick="setLang('ja')">日本語</button></div>
  </nav>
</div></header>
<main><article class="container"> … your page … </article></main>
<footer class="site-footer"><div class="container footer-inner">
  <div><span id="ft-license">Apache 2.0 code · CC0 data</span></div>
  <div><a href="/" id="ft-observatory">Observatory</a> <a href="https://api.asy.life/docs" id="ft-api">API docs</a> <a href="methodology.html" id="ft-methodology">Methodology</a></div>
  <div class="footer-note">Data via the Cardano Data Layer API. Read-only; every value carries provenance.</div>
</div></footer>
<script src="i18n.js"></script>
<!-- if you use charts: --><script src="charts.js"></script>
<script src="YOURPAGE.js"></script>
```
Reusable CSS classes (already in `style.css`): `container, site-header, site-nav, ecosystem-strip, brand, lede, meta-strip/meta-strip-inner/meta-item/meta-label, table-scroll, vote-table, stat-card/stat-label/stat-value/stat-sub, drep-section, expand-section-label, footnote, actions-filters, filter-label, filter-count, auth-chip + auth-A..E, pm-status + pm-status-defunct/active, pm-muted, pm-id, pm-timeline/pm-tl-*`. Use them; add only page-specific bits in your own `<style>`.

## Chart interface (Agent J builds `web/charts.js`; B/G/C call it)
`charts.js` exposes a global `CDLChart` (zero-dep, inline SVG, responsive, theme colors from style.css vars):
- `CDLChart.line(el, points, opts)` — points `[{t:<epoch s or label>, v:<number>}]`; line chart (used by treasury.js).
- `CDLChart.candles(el, candles, opts)` — candles `[{ts,o,h,l,c}]` (the API's `/ohlcv` shape); candlestick (used by token.js).
- `CDLChart.bars(el, items, opts)` — items `[{label, value}]`; horizontal bar chart (optional, rankings.js).
Each: clears `el`, renders responsive SVG, shows an empty-state message if no data. `opts` may include `{height, valueFormat(fn), title}`. Until charts.js lands, callers should feature-detect (`if (window.CDLChart) …`) and otherwise render a small table fallback.

## Per-page API endpoints + response shapes (live, verified)
- **A tokens.js** — `GET /tokens/top?by=mcap|volume|liquidity&limit=` → `{by,ranking:[{unit,ticker,metric:{ada,usd},price:{ada,usd}}],coverage,tracked_units,note}`; `GET /token/search?q=` → `{q,count,results:[{unit,ticker,name,source}]}`. Link rows to `token.html?unit={unit}`. (Coverage is partial/tracked-set — surface the `coverage`/`note` honestly.)
- **B token.js** — `GET /token/{unit}` → `{unit,policy_id,asset_name_hex,metadata:{ticker,name,decimals,logo,url,description},supply,decimals,price:{ada,usd,confidence},holders:{count,capped},source,note}`; `GET /ohlcv/{unit}?interval=1h&limit=` → `{candles:[{ts,time,o,h,l,c,v,source}]}`. Read `?unit=`. Related project link: `GET /token/search` or link to `projects.html`. Render the OHLCV candlestick via `CDLChart.candles`.
- **C rankings.js** — `GET /tokens/top?by=mcap&limit=20`, `?by=volume`, `?by=liquidity`. (No gainers/losers endpoint exists; present mcap/volume/liquidity tabs and, for gainers/losers, show "not yet available" honestly — do NOT fabricate.) Pure tables; optional `CDLChart.bars`.
- **D ecosystem.js** — `GET /categories` → `{count,categories:[{slug,name,project_count,deprecated,alias_of,source:{authority_class,...}}]}`. Grid of categories with counts + source authority; each links to `category.html?slug={slug}`.
- **E category.js** — `GET /category/{slug}` → `{category:{slug,name,deprecated,alias_of,source_id,as_of,taxonomy_note},project_count,projects:[{id,kind,name,status,unclassified,assignment:{authority_class,as_of,source_id}}]}`. Read `?slug=`. Link projects to `project.html?id={id}` (existing page). Show provenance.
- **F memory.html** — mostly prose (philosophical front door). Four sections: Governance / Treasury / Catalyst / Project Memory — what each is, why memory matters, links to archives (github.com/cryptoleo79/cardano-catalyst-archive, …/cardano-project-memory-archive) + observatory pages (actions.html, treasury.html, catalyst.html, projects.html). Optionally fetch a few live counts (`/archive`, `/categories`, `/projects`) for color, but it must read fine with no JS. (memory.js optional.)
- **G treasury.js** — `GET /treasury` → `{snapshot_date,n_epochs,latest,epochs:[{epoch_no,treasury_lovelace,reserves_lovelace,supply_lovelace,...}],withdrawals:[...]}`. Show latest balance (stat cards), a treasury-balance-over-epochs line chart (`CDLChart.line` on `epochs` → {t:epoch_no, v:treasury_lovelace/1e6}), and a withdrawals table. Lovelace→ADA = /1e6. No interpretation.
- **H catalyst.js** — `GET /archive` → `{schema,archive_version,last_updated,subfolders:{<name>:{source_authority_class,artifact_count,last_capture_date,...}},coverage_note}`; `GET /funds` → `{total_funds,funds:[{fund,fund_label,artifact_count,session_count,sources}]}`; `GET /fund/{id}` → `{fund,captures:[{kind,source,authority_class,source_url,wayback_url,sha256,capture_date}]}`. Show preservation status (subfolders + authority classes), fund coverage table, source registry. Honest about sparseness (coverage_note). No rankings/judgment.

## Agent I — nav/i18n/consistency (edits EXISTING files only; never the new pages)
- Apply the shared header nav above to the existing pages (`index.html, actions.html, drep.html, projects.html, project.html, categories.html, methodology.html, history.html`): add the new nav links (tokens/rankings/ecosystem/treasury/catalyst/memory) so nav is consistent everywhere. Keep each page's own active item.
- Add i18n keys to `i18n.js` (en+ja): `h-nav-tokens, h-nav-rankings, h-nav-ecosystem, h-nav-treasury, h-nav-catalyst, h-nav-memory, ft-api` (Tokens/Rankings/Ecosystem/Treasury/Catalyst/Memory/"API docs"; JA: トークン/ランキング/エコシステム/トレジャリー/Catalyst/メモリ/API ドキュメント).
- Do NOT touch new pages (A–H own them); they already include the shared nav. Verify visual consistency.

## Success
A visitor discovers Tokens, Projects, Categories/Ecosystem, Treasury, Catalyst, Governance, Memory, and the API without docs — TapTools + CardanoCube + Observatory + Project Memory, on the Data Layer.

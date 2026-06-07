/* Token discovery page (tokens.html).
 * Read-only. Consumes the live Cardano Data Layer API:
 *   GET /token/search?q=          -> {q,count,results:[{unit,ticker,name,source}], _quality}
 *   GET /tokens/top?by=&limit=    -> {by,ranking:[{unit,ticker,metric:{ada,usd},price:{ada,usd}}],
 *                                     coverage,tracked_units,note, _quality}
 * Coverage is a tracked/seed set only — surfaced honestly, never as a full ecosystem list.
 * No external libs; page-specific i18n merged into the global dict. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };
const TOP_LIMIT = 25;

const state = { by: "mcap", top: null, searchSeq: 0 };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en && i18n.en[key]) || key; }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/* Format a money number with adaptive precision: tiny values keep significant digits. */
function fmtMoney(n) {
  if (n == null || !isFinite(n)) return null;
  const loc = NUM_LOCALE[currentLang()] || "en-US";
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs >= 1000) return Number(n).toLocaleString(loc, { maximumFractionDigits: 0 });
  if (abs >= 1) return Number(n).toLocaleString(loc, { maximumFractionDigits: 2 });
  if (abs >= 0.0001) return Number(n).toLocaleString(loc, { maximumFractionDigits: 6 });
  // very small: scientific-ish, but locale-safe
  return Number(n).toPrecision(3);
}
function fmtAda(n) { const v = fmtMoney(n); return v == null ? "—" : v + " ₳"; }
function fmtUsd(n) { const v = fmtMoney(n); return v == null ? "—" : "$" + v; }

/* Page-local i18n, merged into the global dict then applied. */
const PAGE_I18N = {
  en: {
    "tok-title": "Tokens",
    "tok-lede": "Discover Cardano native tokens on the Data Layer. Search by ticker or name, and browse the top tracked tokens by market cap, volume, or liquidity. Read-only; every value carries its provenance.",
    "tok-search-label": "Search tokens",
    "tok-top-title": "Top tokens",
    "tok-by-label": "Rank by",
    "tok-by-mcap": "Market cap", "tok-by-volume": "Volume", "tok-by-liquidity": "Liquidity",
    "th-tok-ticker": "Token", "th-tok-price": "Price", "th-tok-metric": "Metric", "th-tok-link": "",
    "tok-foot": "Coverage is a tracked/seed set only — NOT a full ecosystem list. Prices via DexHunter / Minswap / Koios. USD may be unavailable (shown as “—”). Authority classes: A on-chain · B official · C at-risk platform · D community · E researcher.",
    "tok-search-ph": "ticker or name (e.g. SNEK)",
    "tok-search-none": "No tokens found.",
    "tok-search-err": "Search unavailable.",
    "tok-search-typing": "Searching…",
    "tok-view": "View",
    "tok-empty": "No tracked tokens for this metric yet.",
    "tok-load-error": "Could not load top tokens.",
    "tok-m-coverage": "Coverage", "tok-m-tracked": "Tracked units", "tok-m-source": "Source", "tok-m-as-of": "As of",
    "tok-cov-partial": "Partial — a tracked/seed set only, not a full ecosystem ranking.",
    "metric-mcap": "Market cap", "metric-volume": "Volume", "metric-liquidity": "Liquidity",
  },
  ja: {
    "tok-title": "トークン",
    "tok-lede": "データレイヤー上の Cardano ネイティブトークンを発見できます。ティッカーや名称で検索し、時価総額・出来高・流動性で追跡対象トークンの上位を閲覧できます。読み取り専用。各値には来歴が付随します。",
    "tok-search-label": "トークン検索",
    "tok-top-title": "上位トークン",
    "tok-by-label": "並び替え",
    "tok-by-mcap": "時価総額", "tok-by-volume": "出来高", "tok-by-liquidity": "流動性",
    "th-tok-ticker": "トークン", "th-tok-price": "価格", "th-tok-metric": "指標", "th-tok-link": "",
    "tok-foot": "対象は追跡／シード集合のみで、エコシステム全体の一覧ではありません。価格は DexHunter／Minswap／Koios 由来。USD は取得できない場合があります（「—」表示）。権威クラス：A オンチェーン・B 公式・C 消失リスクのあるプラットフォーム・D コミュニティ・E 研究者。",
    "tok-search-ph": "ティッカーまたは名称（例：SNEK）",
    "tok-search-none": "トークンが見つかりません。",
    "tok-search-err": "検索を利用できません。",
    "tok-search-typing": "検索中…",
    "tok-view": "表示",
    "tok-empty": "この指標の追跡対象トークンはまだありません。",
    "tok-load-error": "上位トークンを読み込めませんでした。",
    "tok-m-coverage": "対象範囲", "tok-m-tracked": "追跡ユニット数", "tok-m-source": "出典", "tok-m-as-of": "時点",
    "tok-cov-partial": "部分的 — 追跡／シード集合のみで、エコシステム全体のランキングではありません。",
    "metric-mcap": "時価総額", "metric-volume": "出来高", "metric-liquidity": "流動性",
  },
};
if (typeof i18n !== "undefined") {
  Object.assign(i18n.en, PAGE_I18N.en);
  Object.assign(i18n.ja, PAGE_I18N.ja);
  if (typeof setLang === "function") setLang(currentLang());
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function authChip(cls) {
  if (!cls) return "—";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}

/* ---- search ---- */
let searchTimer = null;
function renderSearchResults(payload) {
  const el = document.getElementById("tok-results");
  if (!el) return;
  const results = (payload && payload.results) || [];
  if (!results.length) {
    el.innerHTML = `<li class="tok-r-msg">${t("tok-search-none")}</li>`;
    return;
  }
  el.innerHTML = results.map((r) => {
    const href = `token.html?unit=${encodeURIComponent(r.unit)}`;
    const name = r.name && r.name !== r.ticker ? `<span class="tok-r-name">${esc(r.name)}</span>` : "";
    return `<li><a href="${href}"><span class="tok-r-ticker">${esc(r.ticker || r.name || r.unit)}</span>${name}</a></li>`;
  }).join("");
}

async function doSearch(q) {
  const el = document.getElementById("tok-results");
  if (!el) return;
  const query = q.trim();
  if (!query) { el.innerHTML = ""; return; }
  const seq = ++state.searchSeq;
  el.innerHTML = `<li class="tok-r-msg">${t("tok-search-typing")}</li>`;
  try {
    const data = await fetchJson(`${API}/token/search?q=${encodeURIComponent(query)}`);
    if (seq !== state.searchSeq) return; // stale
    renderSearchResults(data);
  } catch (err) {
    if (seq !== state.searchSeq) return;
    console.error("token search failed", err);
    el.innerHTML = `<li class="tok-r-msg">${t("tok-search-err")}</li>`;
  }
}

function wireSearch() {
  const input = document.getElementById("tok-q");
  if (!input) return;
  input.addEventListener("input", () => {
    if (searchTimer) clearTimeout(searchTimer);
    const v = input.value;
    searchTimer = setTimeout(() => doSearch(v), 220);
  });
  // hide results when clicking away
  document.addEventListener("click", (e) => {
    const wrap = input.closest(".tok-search");
    const el = document.getElementById("tok-results");
    if (wrap && el && !wrap.contains(e.target)) el.innerHTML = "";
  });
}

/* ---- top tokens table ---- */
function metricLabel(by) { return t("metric-" + by) || by; }

function renderMeta() {
  const el = document.getElementById("tok-meta");
  const d = state.top;
  if (!el || !d) return;
  const q = d._quality || {};
  const src = esc(q.source || d.source || "—");
  const auth = q.authority_class;
  const asOf = q.as_of || d.as_of;
  const asOfTxt = asOf ? esc(String(asOf).replace("T", " ").replace(/\..*$/, " UTC")) : "—";
  el.innerHTML = [
    `<span class="meta-item"><span class="meta-label">${t("tok-m-coverage")}</span> ${esc(d.coverage || "—")}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("tok-m-tracked")}</span> ${d.tracked_units == null ? "—" : esc(d.tracked_units)}</span>`,
    `<span class="meta-item auth-chip-line"><span class="meta-label">${t("tok-m-source")}</span> ${src} ${auth ? authChip(auth) : ""}</span>`,
    `<span class="meta-item meta-item-right"><span class="meta-label">${t("tok-m-as-of")}</span> ${asOfTxt}</span>`,
  ].join("");
}

function renderCoverageNote() {
  const el = document.getElementById("tok-coverage-note");
  const d = state.top;
  if (!el) return;
  const note = (d && d.note) ? d.note : t("tok-cov-partial");
  el.textContent = note;
}

function renderTable() {
  const tbody = document.getElementById("tok-tbody");
  if (!tbody) return;
  const d = state.top;
  const rows = (d && d.ranking) || [];
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="loading">${t("tok-empty")}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r) => {
    const href = `token.html?unit=${encodeURIComponent(r.unit)}`;
    const price = r.price || {};
    const metric = r.metric || {};
    const priceCell = (price.ada == null && price.usd == null)
      ? "—"
      : `<span class="tok-num">${fmtAda(price.ada)}</span><div class="tok-price-usd tok-num">${fmtUsd(price.usd)}</div>`;
    const metricCell = (metric.ada == null && metric.usd == null)
      ? "—"
      : `<span class="tok-num">${fmtAda(metric.ada)}</span><div class="tok-price-usd tok-num">${fmtUsd(metric.usd)}</div>`;
    return `<tr>
      <td><a href="${href}" class="tok-ticker">${esc(r.ticker || r.unit)}</a></td>
      <td>${priceCell}</td>
      <td>${metricCell}</td>
      <td><a href="${href}">${t("tok-view")} →</a></td>
    </tr>`;
  }).join("");
}

function renderMetricHeader() {
  const th = document.getElementById("th-tok-metric");
  if (th) th.textContent = metricLabel(state.by);
}

function renderTop() {
  renderMetricHeader();
  if (!state.top) return;
  renderMeta();
  renderCoverageNote();
  renderTable();
}

function setActiveBy() {
  for (const by of ["mcap", "volume", "liquidity"]) {
    const btn = document.getElementById("tok-by-" + by);
    if (btn) btn.classList.toggle("active", by === state.by);
  }
}

async function loadTop() {
  const tbody = document.getElementById("tok-tbody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="loading">…</td></tr>`;
  setActiveBy();
  renderMetricHeader();
  try {
    state.top = await fetchJson(`${API}/tokens/top?by=${encodeURIComponent(state.by)}&limit=${TOP_LIMIT}`);
    renderTop();
  } catch (err) {
    console.error("top tokens load failed", err);
    state.top = null;
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="loading">${t("tok-load-error")}</td></tr>`;
    const meta = document.getElementById("tok-meta");
    if (meta) meta.innerHTML = "";
  }
}

function wireByToggle() {
  for (const by of ["mcap", "volume", "liquidity"]) {
    const btn = document.getElementById("tok-by-" + by);
    if (btn) btn.addEventListener("click", () => {
      if (state.by === by) return;
      state.by = by;
      loadTop();
    });
  }
}

/* keep dynamic content + search placeholder in sync with language */
function syncLangBits() {
  const input = document.getElementById("tok-q");
  if (input) input.placeholder = t("tok-search-ph");
  renderTop();
}

function boot() {
  document.addEventListener("cdo-lang", syncLangBits);
  wireSearch();
  wireByToggle();
  syncLangBits();
  loadTop();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

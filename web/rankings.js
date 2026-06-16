/* Market Rankings — product-grade presentation over the Data Layer API.
 * Hero + metric cards + segmented control + crypto-explorer ranking table.
 * Live API only; coverage and provenance are always surfaced honestly (the
 * ranking covers the verified tradeable universe; market data fills on a
 * rotating refresh). mcap prefers circulating supply and flags FDV fallbacks. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };
const BYS = ["mcap", "volume", "liquidity"];
// DexHunter's verified tradeable-token count — the honest denominator for the
// "ecosystem coverage" estimate (measured live 2026-06; refresh periodically).
const ECOSYSTEM_DENOM = 1046;

const state = { by: "mcap", data: {} /* by -> response */, loading: {} };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function fmtNum(n, opts) {
  if (n == null || !isFinite(n)) return null;
  return Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US", opts);
}
/* Compact money for big figures ($1.2M, $930K); full precision for small. */
function fmtUsdCompact(n) {
  if (n == null || !isFinite(n)) return null;
  const a = Math.abs(n);
  if (a >= 1000) return "$" + Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US", { notation: "compact", maximumFractionDigits: 2 });
  if (a >= 1) return "$" + fmtNum(n, { maximumFractionDigits: 2 });
  if (a > 0) return "$" + Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US", { maximumSignificantDigits: 3 });
  return "$0";
}
function fmtAdaCompact(n) {
  if (n == null || !isFinite(n)) return null;
  const a = Math.abs(n);
  if (a >= 1000) return "₳" + Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US", { notation: "compact", maximumFractionDigits: 2 });
  if (a >= 1) return "₳" + fmtNum(n, { maximumFractionDigits: 2 });
  if (a > 0) return "₳" + Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US", { maximumSignificantDigits: 4 });
  return "₳0";
}

/* Deterministic avatar background from a token's label (calm, on-palette hues). */
function avatarColor(label) {
  const s = label || "?";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}, 42%, 44%)`;
}
function avatarText(label) {
  const s = (label || "?").replace(/[^A-Za-z0-9]/g, "");
  return (s.slice(0, 2) || "?").toUpperCase();
}

/* Page-local i18n, merged into the global dict then applied. */
const PAGE_I18N = {
  en: {
    "h-nav-rankings": "Rankings",
    "rk-title": "Market Rankings",
    "rk-lede": "Live Cardano token rankings by market cap, traded volume, and pool liquidity — sourced on-chain, with provenance on every value.",
    "rk-hero-updated": "Last updated",
    "rk-m-universe": "Universe", "rk-m-withdata": "Market data", "rk-m-ranked": "Ranked",
    "rk-m-eco": "Coverage", "rk-m-source": "Source",
    "rk-m-universe-sub": "verified tradeable tokens", "rk-m-withdata-sub": "with live market data",
    "rk-m-ranked-sub": "rankable on this metric", "rk-m-eco-sub": "of the verified set", "rk-m-source-sub": "on-chain DEX aggregation",
    "rk-info-title": "About this ranking & coverage",
    "rk-info-html": "This ranking sweeps the full verified tradeable universe — about 1,046 DexHunter-verified tokens. Market data (circulating market cap via GeckoTerminal / CoinGecko, plus live DEX liquidity and 24h volume) is refreshed on a rotating schedule, so the count <strong>with live data</strong> grows over time and deep-tail tokens may be flagged stale. Market cap prefers <strong>circulating</strong> supply; tokens without one are ranked by fully-diluted valuation and flagged <strong>FDV</strong>, always below circulating-mcap tokens. Read the <a href=\"https://github.com/cryptoleo79/cardano-data-layer/blob/main/MARKET_COVERAGE_AUDIT.md\" target=\"_blank\" rel=\"noopener\">coverage audit</a>.",
    "tab-mcap": "Market cap", "tab-volume": "Volume", "tab-liquidity": "Liquidity",
    "th-rk-rank": "#", "th-rk-ticker": "Token", "th-rk-price": "Price",
    "th-rk-metric-mcap": "Market cap", "th-rk-metric-volume": "Volume (24h)", "th-rk-metric-liquidity": "Liquidity",
    "rk-empty-volume": "24h volume isn't available for this set right now. Rather than show an arbitrary order, the ranking is withheld.",
    "rk-empty-liquidity": "Liquidity isn't available for this set right now. Rather than show an arbitrary order, the ranking is withheld.",
    "rk-empty-mcap": "Market-cap data isn't available right now.",
    "rk-fdv": "FDV", "rk-fdv-title": "Fully-diluted valuation (price × total supply) — no circulating-supply figure available. Ranked below circulating-mcap tokens.",
    "rk-stale": "stale",
    "rk-na": "n/a",
    "rk-empty": "No tokens in this ranking.", "rk-load-error": "Couldn't load rankings from the API.",
  },
  ja: {
    "h-nav-rankings": "ランキング",
    "rk-title": "マーケットランキング",
    "rk-lede": "時価総額・取引量・プール流動性によるCardanoトークンのライブランキング — オンチェーン由来、すべての値に出所付き。",
    "rk-hero-updated": "最終更新",
    "rk-m-universe": "対象ユニバース", "rk-m-withdata": "市場データ", "rk-m-ranked": "ランク対象",
    "rk-m-eco": "カバレッジ", "rk-m-source": "出典",
    "rk-m-universe-sub": "検証済み取引可能トークン", "rk-m-withdata-sub": "ライブ市場データあり",
    "rk-m-ranked-sub": "この指標でランク可能", "rk-m-eco-sub": "検証済みセットのうち", "rk-m-source-sub": "オンチェーンDEX集計",
    "rk-info-title": "このランキングとカバレッジについて",
    "rk-info-html": "このランキングは検証済みの取引可能なユニバース全体 — DexHunterで検証された約1,046トークン — を対象とします。市場データ（GeckoTerminal / CoinGecko 経由の循環時価総額、ライブのDEX流動性と24時間取引量）はローテーション方式で更新されるため、<strong>ライブデータあり</strong>の件数は時間とともに増加し、末端のトークンは古いと表示される場合があります。時価総額は<strong>循環</strong>供給量を優先します。循環供給量が無いトークンは完全希薄化評価額でランク付けし<strong>FDV</strong>と表示され、常に循環時価総額のトークンより下に並びます。<a href=\"https://github.com/cryptoleo79/cardano-data-layer/blob/main/MARKET_COVERAGE_AUDIT.md\" target=\"_blank\" rel=\"noopener\">カバレッジ監査</a>をご覧ください。",
    "tab-mcap": "時価総額", "tab-volume": "取引量", "tab-liquidity": "流動性",
    "th-rk-rank": "#", "th-rk-ticker": "トークン", "th-rk-price": "価格",
    "th-rk-metric-mcap": "時価総額", "th-rk-metric-volume": "取引量 (24時間)", "th-rk-metric-liquidity": "流動性",
    "rk-empty-volume": "現在、このセットの24時間取引量データはありません。恣意的な順序を示す代わりに、ランキングは保留します。",
    "rk-empty-liquidity": "現在、このセットの流動性データはありません。恣意的な順序を示す代わりに、ランキングは保留します。",
    "rk-empty-mcap": "現在、時価総額データはありません。",
    "rk-fdv": "FDV", "rk-fdv-title": "完全希薄化評価額（価格 × 総供給量）— 循環供給量のデータがありません。循環時価総額のトークンより下に並びます。",
    "rk-stale": "古い",
    "rk-na": "なし",
    "rk-empty": "このランキングにトークンはありません。", "rk-load-error": "API からランキングを読み込めませんでした。",
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

/* Small inline icon set (stroke, currentColor). */
const ICON = {
  universe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  ranked: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="4" y2="13"/><line x1="12" y1="20" x2="12" y2="8"/><line x1="20" y1="20" x2="20" y2="4"/></svg>',
  coverage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
  source: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
};

function authChip(cls) {
  if (!cls) return "";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return ` <span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}

function renderHeroAside(d) {
  const el = document.getElementById("rk-hero-aside");
  if (!el) return;
  const q = (d && d._quality) || {};
  const asOf = q.as_of || (d && d.as_of);
  const asOfTxt = asOf ? new Date(asOf).toLocaleString(NUM_LOCALE[currentLang()] || "en-US") : "—";
  const src = q.source || (d && d.source) || "—";
  el.innerHTML =
    `<div class="ha-label">${t("rk-hero-updated")}</div>` +
    `<div class="ha-value">${esc(asOfTxt)}</div>` +
    `<div class="ha-sub">${esc(src)}${authChip(q.authority_class)}</div>`;
}

function metricCard(icon, value, isText, label, sub) {
  return `<div class="metric-card">
    <div class="mc-icon">${icon}</div>
    <div class="mc-value${isText ? " mc-text" : ""}">${value}</div>
    <div class="mc-label">${esc(label)}</div>
    <div class="mc-sub">${esc(sub)}</div>
  </div>`;
}

function renderMetrics(d) {
  const el = document.getElementById("rk-metrics");
  if (!el) return;
  if (!d) { el.innerHTML = ""; return; }
  const universe = d.universe ?? d.tracked_units;
  const withData = d.with_data ?? d.tracked_units;
  const ecoPct = universe != null ? Math.min(Math.round((universe / ECOSYSTEM_DENOM) * 100), 100) : null;
  el.innerHTML = [
    metricCard(ICON.universe, fmtNum(universe) || "—", false, t("rk-m-universe"), t("rk-m-universe-sub")),
    metricCard(ICON.data, fmtNum(withData) || "—", false, t("rk-m-withdata"), t("rk-m-withdata-sub")),
    metricCard(ICON.ranked, fmtNum(d.computable) || "—", false, t("rk-m-ranked"), t("rk-m-ranked-sub")),
    metricCard(ICON.coverage, ecoPct != null ? "≈" + ecoPct + "%" : "—", false, t("rk-m-eco"), t("rk-m-eco-sub")),
    metricCard(ICON.source, "GeckoTerminal", true, t("rk-m-source"), t("rk-m-source-sub")),
  ].join("");
}

function renderInfoCard() {
  const titleEl = document.getElementById("rk-info-title");
  if (titleEl) titleEl.textContent = t("rk-info-title");
  const bodyEl = document.getElementById("rk-info-body");
  if (bodyEl) bodyEl.innerHTML = t("rk-info-html");
}

function renderHeaders() {
  const set = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
  set("th-rk-ticker", "th-rk-ticker");
  set("th-rk-price", "th-rk-price");
  set("th-rk-metric", `th-rk-metric-${state.by}`);
}

function tokenCell(r) {
  const label = r.ticker || (r.unit ? r.unit.slice(0, 6) : "?");
  const sub = r.unit ? r.unit.slice(0, 8) + "…" + r.unit.slice(-4) : "";
  const fdv = (state.by === "mcap" && r.basis === "fdv")
    ? `<span class="rt-badge fdv" title="${esc(t("rk-fdv-title"))}">${esc(t("rk-fdv"))}</span>` : "";
  const stale = r.stale ? `<span class="rt-stale">· ${esc(t("rk-stale"))}</span>` : "";
  return `<div class="rt-token">
    <span class="token-avatar" style="background:${avatarColor(label)}">${esc(avatarText(label))}</span>
    <span>
      <span class="rt-name">${esc(label)}${fdv}${stale}</span>
      <span class="rt-ticker">${esc(sub)}</span>
    </span>
  </div>`;
}

function renderTable(d) {
  const tbody = document.getElementById("rk-tbody");
  if (!tbody) return;
  if (d && d.computable === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="rank-empty">${esc(t("rk-empty-" + state.by))}</td></tr>`;
    return;
  }
  const rows = (d && d.ranking) || [];
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="4" class="rank-empty">${esc(t("rk-empty"))}</td></tr>`; return; }
  // Bar scale = max metric value among priced rows.
  const maxMetric = rows.reduce((m, r) => Math.max(m, (r.metric && r.metric.usd) || 0), 0) || 1;
  tbody.innerHTML = rows.map((r, i) => {
    const href = `token.html?unit=${encodeURIComponent(r.unit)}`;
    const priceUsd = r.price ? fmtUsdCompact(r.price.usd) : null;
    const priceAda = r.price ? fmtAdaCompact(r.price.ada) : null;
    const metUsd = r.metric ? fmtUsdCompact(r.metric.usd) : null;
    const metAda = r.metric ? fmtAdaCompact(r.metric.ada) : null;
    const pct = (r.metric && r.metric.usd != null) ? Math.max(2, Math.round((r.metric.usd / maxMetric) * 100)) : 0;
    const bar = pct > 0 ? `<div class="mcap-bar-track"><div class="mcap-bar-fill" style="width:${pct}%"></div></div>` : "";
    const priceHtml = priceUsd == null
      ? `<span class="rt-na">${esc(t("rk-na"))}</span>`
      : `<div class="rt-usd">${esc(priceUsd)}</div>${priceAda ? `<div class="rt-ada">${esc(priceAda)}</div>` : ""}`;
    const metricHtml = metUsd == null
      ? `<span class="rt-na">${esc(t("rk-na"))}</span>`
      : `<div class="rt-usd">${esc(metUsd)}</div>${metAda ? `<div class="rt-ada">${esc(metAda)}</div>` : ""}${bar}`;
    return `<tr style="cursor:pointer" onclick="location.href='${href}'">
      <td class="rt-rank">${i + 1}</td>
      <td class="rt-token-cell">${tokenCell(r)}</td>
      <td class="rt-num">${priceHtml}</td>
      <td class="rt-num rt-metric-cell">${metricHtml}</td>
    </tr>`;
  }).join("");
}

function renderNote(d) {
  const el = document.getElementById("rk-note");
  if (!el) { return; }
  if (d && d.note) { el.textContent = d.note; el.style.display = ""; }
  else { el.textContent = ""; el.style.display = "none"; }
}

function renderActiveTab() {
  document.querySelectorAll("#rk-tabs button").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-by") === state.by);
  });
}

function renderCurrent() {
  const d = state.data[state.by];
  renderActiveTab();
  renderHeroAside(d);
  renderMetrics(d);
  renderInfoCard();
  renderHeaders();
  renderTable(d);
  renderNote(d);
}

async function loadBy(by) {
  if (state.data[by] || state.loading[by]) return;
  state.loading[by] = true;
  try {
    state.data[by] = await fetchJson(`${API}/tokens/top?by=${encodeURIComponent(by)}&limit=50`);
  } catch (err) {
    console.error("rankings load failed", by, err);
    state.data[by] = { __error: true };
  } finally {
    state.loading[by] = false;
  }
}

async function selectBy(by) {
  if (!BYS.includes(by)) return;
  state.by = by;
  renderActiveTab();
  renderHeaders();
  const cached = state.data[by];
  if (!cached) {
    const tbody = document.getElementById("rk-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="rank-empty">Loading…</td></tr>`;
    await loadBy(by);
  }
  if (state.by !== by) return; // user switched tabs while loading
  const d = state.data[by];
  if (d && d.__error) {
    const tbody = document.getElementById("rk-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="rank-empty">${esc(t("rk-load-error"))}</td></tr>`;
    renderHeroAside(null); renderMetrics(null); renderNote(null);
    return;
  }
  renderCurrent();
}

function wireTabs() {
  document.querySelectorAll("#rk-tabs button").forEach((b) => {
    b.addEventListener("click", () => selectBy(b.getAttribute("data-by")));
  });
}

async function boot() {
  document.addEventListener("cdo-lang", () => {
    renderInfoCard();
    const d = state.data[state.by];
    if (d && !d.__error) renderCurrent();
  });
  renderInfoCard();
  wireTabs();
  await selectBy("mcap");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

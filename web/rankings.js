/* Market Rankings — Discovery Agent C.
 * Pure market rankings over the API's tracked seed set: top by market cap,
 * volume, and liquidity. No opinions, no narratives, no judgment. Read-only.
 * Live API only; coverage/tracked_units/note and _quality.source are always
 * surfaced honestly (partial ranking, not a full-ecosystem leaderboard).
 * There is no gainers/losers endpoint, so that section honestly says so. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };
const BYS = ["mcap", "volume", "liquidity"];

const state = { by: "mcap", data: {} /* by -> response */, loading: {} };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function fmtNum(n, opts) {
  if (n == null || !isFinite(n)) return null;
  return Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US", opts);
}
/* Money with sensible precision: tiny prices keep significant digits. */
function fmtMoney(n) {
  if (n == null || !isFinite(n)) return null;
  const a = Math.abs(n);
  if (a !== 0 && a < 0.01) {
    return Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US", { maximumSignificantDigits: 4 });
  }
  return fmtNum(n, { maximumFractionDigits: a >= 1000 ? 0 : 4 });
}
function naCell(v) { return v == null ? `<span class="rk-na">${t("rk-na")}</span>` : v; }

/* Page-local i18n, merged into the global dict then applied. */
const PAGE_I18N = {
  en: {
    "h-nav-rankings": "Rankings",
    "rk-title": "Market Rankings",
    "rk-lede": "Live Cardano token rankings — ordered by market cap, traded volume, or pool liquidity. This is a partial ranking over a tracked seed set, not a full-ecosystem leaderboard. No opinions, no judgment: just the numbers and where they came from.",
    "tab-mcap": "Market cap", "tab-volume": "Volume", "tab-liquidity": "Liquidity",
    "th-rk-rank": "#", "th-rk-ticker": "Ticker", "th-rk-price": "Price (ADA)", "th-rk-priceusd": "Price (USD)",
    "th-rk-metric-mcap": "Market cap (ADA)", "th-rk-metricusd-mcap": "Market cap (USD)",
    "th-rk-metric-volume": "Volume (ADA)", "th-rk-metricusd-volume": "Volume (USD)",
    "th-rk-metric-liquidity": "Liquidity (ADA)", "th-rk-metricusd-liquidity": "Liquidity (USD)",
    "rk-gl-title": "Gainers & Losers", "rk-gl-label": "Top movers (24h)", "rk-gl-value": "Not yet available",
    "rk-gl-sub": "The Data Layer API does not yet expose a gainers/losers endpoint. Rather than fabricate price-change figures, this section is intentionally left empty until a verified change feed exists.",
    "rk-na": "n/a",
    "rk-m-coverage": "Coverage", "rk-m-tracked": "Tracked units", "rk-m-source": "Source", "rk-m-asof": "As of",
    "rk-empty": "No tokens in this ranking.", "rk-load-error": "Could not load rankings from the API.",
    "rk-chart-title": "Top by metric (tracked set)",
  },
  ja: {
    "h-nav-rankings": "ランキング",
    "rk-title": "マーケットランキング",
    "rk-lede": "Cardano トークンのライブランキング — 時価総額・取引量・プール流動性で並び替え。これは追跡対象のシードセットに対する部分的なランキングであり、エコシステム全体の順位ではありません。意見も判断もなく、数値とその出典のみを示します。",
    "tab-mcap": "時価総額", "tab-volume": "取引量", "tab-liquidity": "流動性",
    "th-rk-rank": "#", "th-rk-ticker": "ティッカー", "th-rk-price": "価格 (ADA)", "th-rk-priceusd": "価格 (USD)",
    "th-rk-metric-mcap": "時価総額 (ADA)", "th-rk-metricusd-mcap": "時価総額 (USD)",
    "th-rk-metric-volume": "取引量 (ADA)", "th-rk-metricusd-volume": "取引量 (USD)",
    "th-rk-metric-liquidity": "流動性 (ADA)", "th-rk-metricusd-liquidity": "流動性 (USD)",
    "rk-gl-title": "値上がり・値下がり", "rk-gl-label": "値動き上位 (24時間)", "rk-gl-value": "未提供",
    "rk-gl-sub": "Data Layer API はまだ値上がり・値下がりのエンドポイントを提供していません。価格変動の数値を捏造する代わりに、検証済みの変動フィードができるまでこのセクションは意図的に空のままにしています。",
    "rk-na": "なし",
    "rk-m-coverage": "カバレッジ", "rk-m-tracked": "追跡対象数", "rk-m-source": "出典", "rk-m-asof": "時点",
    "rk-empty": "このランキングにトークンはありません。", "rk-load-error": "API からランキングを読み込めませんでした。",
    "rk-chart-title": "メトリクス上位（追跡セット）",
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
  if (!cls) return "";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return ` <span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}

function renderMeta(d) {
  const el = document.getElementById("rk-meta");
  if (!el) return;
  if (!d) { el.innerHTML = ""; return; }
  const q = d._quality || {};
  const src = q.source || d.source || "—";
  const asOf = q.as_of || d.as_of;
  const asOfTxt = asOf ? new Date(asOf).toLocaleString(NUM_LOCALE[currentLang()] || "en-US") : "—";
  el.innerHTML = [
    `<span class="meta-item"><span class="meta-label">${t("rk-m-coverage")}</span> ${esc(d.coverage || "—")}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("rk-m-tracked")}</span> ${fmtNum(d.tracked_units) || "—"}</span>`,
    `<span class="meta-item rk-quality"><span class="meta-label">${t("rk-m-source")}</span> ${esc(src)}${authChip(q.authority_class)}</span>`,
    `<span class="meta-item meta-item-right"><span class="meta-label">${t("rk-m-asof")}</span> ${esc(asOfTxt)}</span>`,
  ].join("");
}

function renderHeaders() {
  const by = state.by;
  const set = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
  set("th-rk-metric", `th-rk-metric-${by}`);
  set("th-rk-metricusd", `th-rk-metricusd-${by}`);
}

function renderChart(d) {
  const el = document.getElementById("rk-chart");
  if (!el) return;
  if (!window.CDLChart || typeof CDLChart.bars !== "function" || !d) { el.innerHTML = ""; return; }
  const items = (d.ranking || [])
    .filter((r) => r.metric && r.metric.ada != null && isFinite(r.metric.ada))
    .map((r) => ({ label: r.ticker || r.unit.slice(0, 8), value: r.metric.ada }));
  if (!items.length) { el.innerHTML = ""; return; }
  CDLChart.bars(el, items, {
    title: t("rk-chart-title"),
    valueFormat: (v) => fmtMoney(v),
  });
}

function renderTable(d) {
  const tbody = document.getElementById("rk-tbody");
  if (!tbody) return;
  const rows = (d && d.ranking) || [];
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="6" class="loading">${t("rk-empty")}</td></tr>`; return; }
  tbody.innerHTML = rows.map((r, i) => {
    const href = `token.html?unit=${encodeURIComponent(r.unit)}`;
    const label = r.ticker || (r.unit ? r.unit.slice(0, 12) + "…" : "—");
    const priceAda = r.price ? fmtMoney(r.price.ada) : null;
    const priceUsd = r.price ? fmtMoney(r.price.usd) : null;
    const metAda = r.metric ? fmtMoney(r.metric.ada) : null;
    const metUsd = r.metric ? fmtMoney(r.metric.usd) : null;
    return `<tr>
      <td class="rk-col-rank">${i + 1}</td>
      <td><a class="rk-ticker" href="${href}">${esc(label)}</a></td>
      <td class="rk-col-num">${naCell(priceAda)}</td>
      <td class="rk-col-num">${naCell(priceUsd == null ? null : "$" + priceUsd)}</td>
      <td class="rk-col-num">${naCell(metAda)}</td>
      <td class="rk-col-num">${naCell(metUsd == null ? null : "$" + metUsd)}</td>
    </tr>`;
  }).join("");
}

function renderNote(d) {
  const el = document.getElementById("rk-note");
  if (el) el.textContent = (d && d.note) || "";
}

function renderGainersLosers() {
  const set = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
  set("rk-gl-title", "rk-gl-title");
  set("rk-gl-label", "rk-gl-label");
  set("rk-gl-value", "rk-gl-value");
  set("rk-gl-sub", "rk-gl-sub");
}

function renderActiveTab() {
  document.querySelectorAll(".rk-tab").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-by") === state.by);
  });
}

function renderCurrent() {
  const d = state.data[state.by];
  renderActiveTab();
  renderHeaders();
  renderMeta(d);
  renderChart(d);
  renderTable(d);
  renderNote(d);
  renderGainersLosers();
}

async function loadBy(by) {
  if (state.data[by] || state.loading[by]) return;
  state.loading[by] = true;
  try {
    state.data[by] = await fetchJson(`${API}/tokens/top?by=${encodeURIComponent(by)}&limit=25`);
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
  const cached = state.data[by];
  if (!cached) {
    const tbody = document.getElementById("rk-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="loading">Loading…</td></tr>`;
    await loadBy(by);
  }
  if (state.by !== by) return; // user switched tabs while loading
  const d = state.data[by];
  if (d && d.__error) {
    const tbody = document.getElementById("rk-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="loading">${t("rk-load-error")}</td></tr>`;
    renderMeta(null); renderChart(null); renderNote(null); renderGainersLosers();
    return;
  }
  renderCurrent();
}

function wireTabs() {
  document.querySelectorAll(".rk-tab").forEach((b) => {
    b.addEventListener("click", () => selectBy(b.getAttribute("data-by")));
  });
}

async function boot() {
  document.addEventListener("cdo-lang", () => {
    const d = state.data[state.by];
    if (d && !d.__error) renderCurrent(); else renderGainersLosers();
  });
  wireTabs();
  renderGainersLosers();
  await selectBy("mcap");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

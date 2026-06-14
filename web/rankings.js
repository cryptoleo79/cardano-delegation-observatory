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
// DexHunter's verified tradeable-token count — the honest denominator for an
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
    "rk-title": "Market Rankings (Tracked Set)",
    "rk-lede": "Live Cardano token rankings — ordered by market cap, traded volume, or pool liquidity. This is a partial ranking over a tracked seed set, not a full-ecosystem leaderboard. No opinions, no judgment: just the numbers and where they came from.",
    "rk-banner-html": "<strong>Experimental coverage.</strong> This ranking now sweeps the full verified tradeable universe — about 1,046 DexHunter-verified Cardano tokens. Market data (circulating market cap via GeckoTerminal / CoinGecko, plus live DEX liquidity and 24h volume) is refreshed on a rotating schedule, so the count <em>with live data</em> grows over time and deep-tail tokens may be flagged stale. Market cap prefers <em>circulating</em> supply; tokens without one are ranked by fully-diluted valuation and flagged <strong>FDV</strong>, always below circulating-mcap tokens. Read the <a href=\"https://github.com/cryptoleo79/cardano-data-layer/blob/main/MARKET_COVERAGE_AUDIT.md\" target=\"_blank\" rel=\"noopener\">coverage audit</a>.",
    "rk-m-priced": "Priced", "rk-m-eco": "Ecosystem coverage",
    "rk-m-universe": "Universe", "rk-m-withdata": "With market data", "rk-m-ranked": "Ranked",
    "rk-empty-volume": "24h volume is not available for the tracked set right now. Rather than show an arbitrary order, the ranking is withheld.",
    "rk-empty-liquidity": "Liquidity is not available for the tracked set right now. Rather than show an arbitrary order, the ranking is withheld.",
    "rk-empty-mcap": "Market-cap data is not available right now.",
    "rk-fdv": "FDV", "rk-fdv-title": "Fully-diluted valuation (price × total supply) — no circulating-supply figure available. Ranked below circulating-mcap tokens.",
    "rk-conf-title": "Confidence: ",
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
    "rk-title": "マーケットランキング（追跡セット）",
    "rk-lede": "Cardano トークンのライブランキング — 時価総額・取引量・プール流動性で並び替え。これは追跡対象のシードセットに対する部分的なランキングであり、エコシステム全体の順位ではありません。意見も判断もなく、数値とその出典のみを示します。",
    "rk-banner-html": "<strong>実験的なカバレッジ。</strong> このランキングは検証済みの取引可能なユニバース全体 — DexHunterで検証された約1,046のCardanoトークン — を対象とします。市場データ（GeckoTerminal / CoinGecko 経由の循環時価総額、ライブのDEX流動性と24時間取引量）はローテーション方式で更新されるため、<em>ライブデータあり</em>の件数は時間とともに増加し、末端のトークンは古いと表示される場合があります。時価総額は<em>循環</em>供給量を優先します。循環供給量が無いトークンは完全希薄化評価額でランク付けし<strong>FDV</strong>と表示され、常に循環時価総額のトークンより下に並びます。<a href=\"https://github.com/cryptoleo79/cardano-data-layer/blob/main/MARKET_COVERAGE_AUDIT.md\" target=\"_blank\" rel=\"noopener\">カバレッジ監査</a>をご覧ください。",
    "rk-m-priced": "価格付き", "rk-m-eco": "エコシステムカバレッジ",
    "rk-m-universe": "対象ユニバース", "rk-m-withdata": "市場データあり", "rk-m-ranked": "ランク対象",
    "rk-empty-volume": "現在、追跡セットの24時間取引量データはありません。恣意的な順序を示す代わりに、ランキングは保留します。",
    "rk-empty-liquidity": "現在、追跡セットの流動性データはありません。恣意的な順序を示す代わりに、ランキングは保留します。",
    "rk-empty-mcap": "現在、時価総額データはありません。",
    "rk-fdv": "FDV", "rk-fdv-title": "完全希薄化評価額（価格 × 総供給量）— 循環供給量のデータがありません。循環時価総額のトークンより下に並びます。",
    "rk-conf-title": "信頼度: ",
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

function renderBanner() {
  const el = document.getElementById("rk-banner");
  if (el) el.innerHTML = t("rk-banner-html");
}

function renderMeta(d) {
  const el = document.getElementById("rk-meta");
  if (!el) return;
  if (!d) { el.innerHTML = ""; return; }
  const q = d._quality || {};
  const src = q.source || d.source || "—";
  const asOf = q.as_of || d.as_of;
  const asOfTxt = asOf ? new Date(asOf).toLocaleString(NUM_LOCALE[currentLang()] || "en-US") : "—";
  // Universe = full verified set we sweep; with-data = tokens that returned live
  // market data; ranked = those rankable by the current metric. Older payloads
  // (pre-expansion) only have tracked_units — fall back to it gracefully.
  const universe = d.universe ?? d.tracked_units;
  const withData = d.with_data ?? d.tracked_units;
  const ecoPct = universe != null ? Math.round((universe / ECOSYSTEM_DENOM) * 100) : null;
  const ecoTxt = ecoPct != null ? `≈${Math.min(ecoPct, 100)}% (of ~${fmtNum(ECOSYSTEM_DENOM)})` : "—";
  const rankedTxt = (d.computable != null && withData != null) ? `${fmtNum(d.computable)}/${fmtNum(withData)}` : "—";
  el.innerHTML = [
    `<span class="meta-item"><span class="meta-label">${t("rk-m-universe")}</span> ${fmtNum(universe) || "—"}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("rk-m-withdata")}</span> ${fmtNum(withData) || "—"}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("rk-m-ranked")}</span> ${rankedTxt}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("rk-m-eco")}</span> ${ecoTxt}</span>`,
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
  // Honest empty-state: when no row has a computable metric, show why instead of
  // an arbitrary-order table that merely *looks* ranked.
  if (d && d.computable === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="rk-empty-metric">${t("rk-empty-" + state.by)}</div></td></tr>`;
    return;
  }
  const rows = (d && d.ranking) || [];
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="6" class="loading">${t("rk-empty")}</td></tr>`; return; }
  tbody.innerHTML = rows.map((r, i) => {
    const href = `token.html?unit=${encodeURIComponent(r.unit)}`;
    const label = r.ticker || (r.unit ? r.unit.slice(0, 12) + "…" : "—");
    const priceAda = r.price ? fmtMoney(r.price.ada) : null;
    const priceUsd = r.price ? fmtMoney(r.price.usd) : null;
    const metAda = r.metric ? fmtMoney(r.metric.ada) : null;
    const metUsd = r.metric ? fmtMoney(r.metric.usd) : null;
    // On the market-cap tab, flag rows ranked by fully-diluted valuation (no
    // circulating-supply figure) so an FDV number is never mistaken for a real
    // circulating market cap.
    const fdvBadge = (state.by === "mcap" && r.basis === "fdv")
      ? ` <span class="rk-fdv" title="${esc(t("rk-fdv-title"))}">${esc(t("rk-fdv"))}</span>` : "";
    return `<tr>
      <td class="rk-col-rank">${i + 1}</td>
      <td><a class="rk-ticker" href="${href}">${esc(label)}</a>${fdvBadge}</td>
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
  renderBanner();
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
    renderBanner();
    const d = state.data[state.by];
    if (d && !d.__error) renderCurrent(); else renderGainersLosers();
  });
  renderBanner();
  wireTabs();
  renderGainersLosers();
  await selectBy("mcap");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

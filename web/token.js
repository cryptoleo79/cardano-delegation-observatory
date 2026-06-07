/* Cardano Delegation Observatory — token detail page (Discovery Agent B).
 * Read-only. Resolves ?unit= from the URL, fetches GET /token/{unit} and
 * GET /ohlcv/{unit} from the live Data Layer API, and renders metadata,
 * on-chain identity, price/supply/holders, and an OHLCV candlestick chart
 * (via CDLChart if present, else a small table fallback). No external libs. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = { unit: null, token: null, ohlcv: null };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

const AUTH = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };

const PAGE_I18N = {
  en: {
    "back-link-tokens": "← Tokens",
    "tok-stat-price-label": "Price (ADA)", "tok-stat-usd-label": "Price (USD)",
    "tok-stat-supply-label": "Supply", "tok-stat-holders-label": "Holders",
    "tok-chart-label": "Price history (OHLCV)",
    "tok-chart-help": "Hourly candles from on-chain DEX aggregators, aggregated on read. Per-interval volume is not yet captured. Read-only — not financial advice.",
    "tok-identity-label": "On-chain identity",
    "tok-id-unit-label": "Unit", "tok-id-policy-label": "Policy ID", "tok-id-asset-label": "Asset name (hex)", "tok-id-source-label": "Source",
    "tok-related-label": "Related",
    "tok-not-found": "Token not found", "tok-missing-unit": "No token specified",
    "tok-missing-unit-help": "Add a ?unit=<policyId+hexAssetName> parameter, or browse the token list.",
    "tok-load-error": "Could not load this token from the API.",
    "tok-na": "not available", "tok-confidence-pre": "confidence",
    "tok-decimals": "decimals", "tok-holders-capped": "count capped",
    "tok-chart-none": "No price history available for this token.",
    "tok-chart-table-caption": "Recent candles (most recent first)",
    "th-time": "Time", "th-open": "Open", "th-high": "High", "th-low": "Low", "th-close": "Close",
    "tok-rel-projects": "Browse Project Memory", "tok-rel-ecosystem": "Browse the ecosystem",
    "tok-rel-search": "Search for related entries",
    "tok-q-source": "source", "tok-q-authority": "authority", "tok-q-confidence": "confidence", "tok-q-as-of": "as of", "tok-q-note": "note",
  },
  ja: {
    "back-link-tokens": "← トークン",
    "tok-stat-price-label": "価格 (ADA)", "tok-stat-usd-label": "価格 (USD)",
    "tok-stat-supply-label": "供給量", "tok-stat-holders-label": "保有者数",
    "tok-chart-label": "価格履歴 (OHLCV)",
    "tok-chart-help": "オンチェーン DEX アグリゲーターからの1時間足。読み取り時に集計。期間別の出来高は未取得です。読み取り専用 — 投資助言ではありません。",
    "tok-identity-label": "オンチェーン識別子",
    "tok-id-unit-label": "ユニット", "tok-id-policy-label": "ポリシーID", "tok-id-asset-label": "アセット名 (hex)", "tok-id-source-label": "出典",
    "tok-related-label": "関連",
    "tok-not-found": "トークンが見つかりません", "tok-missing-unit": "トークンが指定されていません",
    "tok-missing-unit-help": "?unit=<ポリシーID+hexアセット名> パラメータを付けるか、トークン一覧をご覧ください。",
    "tok-load-error": "このトークンを API から読み込めませんでした。",
    "tok-na": "利用不可", "tok-confidence-pre": "信頼度",
    "tok-decimals": "小数桁", "tok-holders-capped": "件数上限あり",
    "tok-chart-none": "このトークンの価格履歴はありません。",
    "tok-chart-table-caption": "直近の足（新しい順）",
    "th-time": "時刻", "th-open": "始値", "th-high": "高値", "th-low": "安値", "th-close": "終値",
    "tok-rel-projects": "プロジェクトメモリを見る", "tok-rel-ecosystem": "エコシステムを見る",
    "tok-rel-search": "関連エントリを検索",
    "tok-q-source": "出典", "tok-q-authority": "権威クラス", "tok-q-confidence": "信頼度", "tok-q-as-of": "時点", "tok-q-note": "備考",
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

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v == null ? "" : v; }
function setHtml(id, v) { const el = document.getElementById(id); if (el) el.innerHTML = v; }

function unitFromUrl() {
  const p = new URLSearchParams(location.search).get("unit");
  return p ? p.trim() : null;
}

function locale() { return NUM_LOCALE[currentLang()] || "en-US"; }

function fmtInt(n) { return n == null ? null : Number(n).toLocaleString(locale()); }

/* decimals-aware whole-token amount from a raw on-chain integer amount */
function fmtSupply(raw, decimals) {
  if (raw == null) return null;
  const d = Number(decimals) || 0;
  const n = Number(raw) / Math.pow(10, d);
  if (!isFinite(n)) return String(raw);
  return n.toLocaleString(locale(), { maximumFractionDigits: d > 0 ? Math.min(d, 6) : 0 });
}

/* price formatting: keep small prices readable */
function fmtPrice(n) {
  if (n == null) return null;
  const v = Number(n);
  if (!isFinite(v)) return null;
  if (v === 0) return "0";
  const digits = v < 0.01 ? 8 : v < 1 ? 6 : v < 1000 ? 4 : 2;
  return v.toLocaleString(locale(), { maximumFractionDigits: digits });
}

function authChip(cls) {
  if (!cls) return "";
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(AUTH[cls] || "")}">${esc(cls)}</span>`;
}

/* surface the _quality provenance block (and any note) for a response */
function qualityHtml(q, note) {
  const parts = [];
  if (q) {
    if (q.source) parts.push(`<span><strong>${t("tok-q-source")}:</strong> ${esc(q.source)}</span>`);
    if (q.authority_class) parts.push(`<span><strong>${t("tok-q-authority")}:</strong> ${authChip(q.authority_class)}</span>`);
    if (q.confidence) parts.push(`<span><strong>${t("tok-q-confidence")}:</strong> ${esc(q.confidence)}</span>`);
    if (q.provenance) parts.push(`<span>${esc(q.provenance)}</span>`);
    if (q.as_of) parts.push(`<span><strong>${t("tok-q-as-of")}:</strong> ${esc(q.as_of)}</span>`);
  }
  if (note) parts.push(`<span><strong>${t("tok-q-note")}:</strong> ${esc(note)}</span>`);
  return parts.length ? parts.join(" · ") : "";
}

function renderToken() {
  const d = state.token;
  if (!d) return;
  const m = d.metadata || {};
  const name = m.name || d.unit;
  const ticker = m.ticker || "";

  setText("tok-name", name);
  document.title = `${name}${ticker ? " (" + ticker + ")" : ""} — Cardano Delegation Observatory`;

  const tk = document.getElementById("tok-ticker");
  if (tk) { if (ticker) { tk.textContent = ticker; tk.hidden = false; } else { tk.hidden = true; } }

  const logoEl = document.getElementById("tok-logo");
  if (logoEl) {
    if (m.logo) { logoEl.src = `data:image/png;base64,${m.logo}`; logoEl.alt = name; logoEl.hidden = false; }
    else { logoEl.hidden = true; logoEl.removeAttribute("src"); }
  }

  setText("tok-policy", d.policy_id || "");

  /* url + description */
  const links = [];
  if (m.url) {
    const safe = /^https?:/i.test(m.url);
    links.push(safe ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.url)}</a>` : esc(m.url));
  }
  setHtml("tok-links", links.join(" "));
  setText("tok-desc", m.description || "");

  /* price stat cards */
  const price = d.price || {};
  const decimals = d.decimals != null ? d.decimals : m.decimals;
  setText("tok-stat-price", fmtPrice(price.ada) ?? t("tok-na"));
  setText("tok-stat-price-sub", price.ada != null ? "ADA" : "");
  setText("tok-stat-usd", fmtPrice(price.usd) != null ? "$" + fmtPrice(price.usd) : t("tok-na"));
  const conf = price.confidence ? `${t("tok-confidence-pre")}: ${esc(price.confidence)}` : "";
  const psrc = price.sources && price.sources.length ? ` · ${esc(price.sources.join(", "))}` : "";
  setHtml("tok-stat-confidence", conf ? conf + psrc : "");

  /* supply (decimals-aware) */
  setText("tok-stat-supply", fmtSupply(d.supply, decimals) ?? t("tok-na"));
  setText("tok-stat-supply-sub", decimals != null ? `${t("tok-decimals")}: ${decimals}` : "");

  /* holders (may be null) */
  const holders = d.holders || {};
  if (holders.count == null) {
    setText("tok-stat-holders", t("tok-na"));
    setText("tok-stat-holders-sub", "");
  } else {
    setText("tok-stat-holders", fmtInt(holders.count));
    setText("tok-stat-holders-sub", holders.capped ? t("tok-holders-capped") : "");
  }

  /* on-chain identity table */
  setText("tok-id-unit", d.unit || "");
  setText("tok-id-policy", d.policy_id || "");
  setText("tok-id-asset", d.asset_name_hex || "—");
  setHtml("tok-id-source", esc(d.source || (d._quality && d._quality.source) || "—"));

  setHtml("tok-meta-quality", qualityHtml(d._quality, d.note));

  renderRelated();
}

function renderRelated() {
  const d = state.token || {};
  const ticker = (d.metadata && d.metadata.ticker) || "";
  const items = [
    `<a href="projects.html">${t("tok-rel-projects")}</a>`,
    `<a href="ecosystem.html">${t("tok-rel-ecosystem")}</a>`,
  ];
  if (ticker) {
    items.push(`<a href="tokens.html?q=${encodeURIComponent(ticker)}">${t("tok-rel-search")}</a>`);
  }
  setHtml("tok-related", items.join(""));
}

/* OHLCV: candlestick via CDLChart if available, else small table fallback */
function renderOhlcv() {
  const el = document.getElementById("tok-chart");
  if (!el) return;
  const candles = (state.ohlcv && state.ohlcv.candles) || [];

  if (!candles.length) {
    el.innerHTML = `<p class="pm-muted">${t("tok-chart-none")}</p>`;
    setHtml("tok-chart-quality", state.ohlcv ? qualityHtml(state.ohlcv._quality, state.ohlcv.note) : "");
    return;
  }

  if (window.CDLChart && typeof window.CDLChart.candles === "function") {
    window.CDLChart.candles(el, candles, { height: 260, valueFormat: fmtPrice });
  } else {
    /* fallback: recent candles table, most recent first */
    const recent = candles.slice(-12).reverse();
    const rows = recent.map((c) => {
      const time = c.time || (c.ts ? new Date(c.ts * 1000).toISOString() : "");
      return `<tr>
        <td class="stake-addr">${esc(time)}</td>
        <td>${esc(fmtPrice(c.o) ?? "—")}</td>
        <td>${esc(fmtPrice(c.h) ?? "—")}</td>
        <td>${esc(fmtPrice(c.l) ?? "—")}</td>
        <td>${esc(fmtPrice(c.c) ?? "—")}</td>
      </tr>`;
    }).join("");
    el.innerHTML = `<div class="table-scroll"><table class="vote-table">
      <caption class="footnote" style="text-align:left;padding:6px 10px;">${t("tok-chart-table-caption")}</caption>
      <thead><tr>
        <th>${t("th-time")}</th><th>${t("th-open")}</th><th>${t("th-high")}</th><th>${t("th-low")}</th><th>${t("th-close")}</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  setHtml("tok-chart-quality", qualityHtml(state.ohlcv._quality, state.ohlcv.note));
}

function render() {
  if (state.token) renderToken();
  renderOhlcv();
}

function showFatal(titleKey, helpText) {
  setText("tok-name", t(titleKey));
  setHtml("tok-links", helpText ? `<span class="pm-muted">${esc(helpText)}</span>` : "");
  document.title = `${t(titleKey)} — Cardano Delegation Observatory`;
}

async function boot() {
  document.addEventListener("cdo-lang", () => render());
  state.unit = unitFromUrl();

  if (!state.unit) {
    showFatal("tok-missing-unit", t("tok-missing-unit-help"));
    return;
  }
  setText("tok-policy", state.unit);

  /* token detail — fatal if it fails */
  try {
    state.token = await fetchJson(`${API}/token/${encodeURIComponent(state.unit)}`);
  } catch (err) {
    console.error("token load failed", err);
    showFatal("tok-not-found", t("tok-load-error"));
    return;
  }
  renderToken();

  /* OHLCV — non-fatal; show empty state on failure */
  try {
    state.ohlcv = await fetchJson(`${API}/ohlcv/${encodeURIComponent(state.unit)}?interval=1h&limit=168`);
  } catch (err) {
    console.error("ohlcv load failed", err);
    state.ohlcv = { candles: [] };
  }
  renderOhlcv();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

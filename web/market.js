/* Market Reality — neutral Cardano event timeline. Observability, not attribution.
 * Renders market-events.json; no price/causal overlay, no inference. */
"use strict";
const state = { events: [], type: "all", meta: null };
function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const TYPES = ["all", "hard-fork", "governance", "treasury", "catalyst", "ecosystem", "protocol-release"];
const AUTH_K = { A: "mr-auth-a", B: "mr-auth-b", C: "mr-auth-c", D: "mr-auth-d", E: "mr-auth-e" };
function authLabel(cls) { return cls && AUTH_K[cls] ? t(AUTH_K[cls]) : ""; }
function typeLabel(ty) { return t("mr-ty-" + ty) || ty; }

const PAGE_I18N = {
  en: {
    "mr-title": "Market Reality — Cardano event timeline",
    "mr-lede": "A neutral, chronological record of Cardano ecosystem events as timeline markers.",
    "ft-memory": "Memory", "mr-none": "No events for this filter.",
    "mr-err": "Could not load events.", "mr-approx": "(approx)", "mr-source": "source",
    "mr-ha-label": "Tracked events", "mr-ha-source": "EVENT_REGISTRY · market-events.json", "mr-ha-range": "spanning", "mr-ha-empty": "—",
    "mr-ty-all": "All", "mr-ty-hard-fork": "Hard fork", "mr-ty-governance": "Governance", "mr-ty-treasury": "Treasury",
    "mr-ty-catalyst": "Catalyst", "mr-ty-ecosystem": "Ecosystem", "mr-ty-protocol-release": "Protocol release",
    "mr-auth-a": "On-chain", "mr-auth-b": "Official", "mr-auth-c": "At-risk platform", "mr-auth-d": "Community", "mr-auth-e": "Researcher",
    "mr-rule-html": "<strong>Observability, not attribution.</strong> Events are dated facts. This page never claims an event caused any price or market movement. It records <em>what happened and when</em> — interpretation is the reader's.",
    "mr-foot-html": "Source: <code>market-events.json</code>, derived from the project's <a href=\"https://github.com/cryptoleo79/cardano-delegation-observatory/blob/main/docs/EVENT_REGISTRY.md\" target=\"_blank\" rel=\"noopener\">EVENT_REGISTRY</a> · CC0. Authority: A on-chain · B official · C at-risk · D community · E researcher. Approximate dates are marked. Continuous ADA price history is collected forward-only by the Data Layer poller; this page deliberately shows chronology, not a causal price overlay.",
  },
  ja: {
    "mr-title": "マーケット・リアリティ — Cardano イベント年表",
    "mr-lede": "Cardano エコシステムのイベントを中立的・時系列の目印として記録します。",
    "ft-memory": "メモリ", "mr-none": "この絞り込みに該当するイベントはありません。",
    "mr-err": "イベントを読み込めませんでした。", "mr-approx": "(概算)", "mr-source": "出典",
    "mr-ha-label": "記録イベント数", "mr-ha-source": "EVENT_REGISTRY · market-events.json", "mr-ha-range": "対象期間", "mr-ha-empty": "—",
    "mr-ty-all": "すべて", "mr-ty-hard-fork": "ハードフォーク", "mr-ty-governance": "ガバナンス", "mr-ty-treasury": "トレジャリー",
    "mr-ty-catalyst": "カタリスト", "mr-ty-ecosystem": "エコシステム", "mr-ty-protocol-release": "プロトコルリリース",
    "mr-auth-a": "オンチェーン", "mr-auth-b": "公式", "mr-auth-c": "消失リスクのあるプラットフォーム", "mr-auth-d": "コミュニティ", "mr-auth-e": "研究者",
    "mr-rule-html": "<strong>観測であり、原因の特定ではありません。</strong> イベントは日付の付いた事実です。このページは、イベントが価格や市場の動きを引き起こしたとは決して主張しません。<em>何がいつ起きたか</em>を記録します — 解釈は読者に委ねられます。",
    "mr-foot-html": "出典: <code>market-events.json</code>、本プロジェクトの<a href=\"https://github.com/cryptoleo79/cardano-delegation-observatory/blob/main/docs/EVENT_REGISTRY.md\" target=\"_blank\" rel=\"noopener\">EVENT_REGISTRY</a>由来 · CC0。権威クラス: A オンチェーン · B 公式 · C 消失リスク · D コミュニティ · E 研究者。概算の日付には印を付けています。連続したADA価格履歴はData Layerのポーラーが前方向のみで収集します。このページは因果的な価格の重ね合わせではなく、意図的に時系列を示します。",
  },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }
function paintStatic() {
  const r = document.getElementById("mr-rule"); if (r) r.innerHTML = t("mr-rule-html");
  const f = document.getElementById("mr-foot"); if (f) f.innerHTML = t("mr-foot-html");
}

/* Hero aside — a small context card built from the page's own signal:
 * the count of tracked events, their source, and the date range covered. */
function renderHeroAside() {
  const el = document.getElementById("mr-hero-aside");
  if (!el) return;
  const m = state.meta || {};
  const count = (m.count != null ? m.count : state.events.length);
  const value = count ? fmtNum(count) : t("mr-ha-empty");
  const earliest = m.earliest, latest = m.latest;
  const range = (earliest && latest)
    ? `${t("mr-ha-range")} ${esc(earliest)} – ${esc(latest)}`
    : t("mr-ha-source");
  el.innerHTML =
    `<div class="ha-label">${esc(t("mr-ha-label"))}</div>` +
    `<div class="ha-value">${esc(value)}</div>` +
    `<div class="ha-sub">${range}</div>`;
}
function fmtNum(n) {
  if (n == null || !isFinite(n)) return "";
  const loc = currentLang() === "ja" ? "ja-JP" : "en-US";
  return Number(n).toLocaleString(loc);
}

function fmtDate(e) { return e.date_precision === "month" ? e.date : e.date; }

function renderFilters() {
  const el = document.getElementById("mr-filters");
  el.innerHTML = TYPES.map((ty) => `<button data-t="${ty}" class="${state.type === ty ? "active" : ""}">${esc(typeLabel(ty))}</button>`).join("");
  el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { state.type = b.dataset.t; renderFilters(); renderTimeline(); }));
}
function renderTimeline() {
  const el = document.getElementById("mr-tl");
  let evs = state.events.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (state.type !== "all") evs = evs.filter((e) => e.type === state.type);
  if (!evs.length) { el.innerHTML = `<li class="loading">${t("mr-none")}</li>`; return; }
  el.innerHTML = evs.map((e) => `<li class="mr-item mr-${esc(e.type)}">
    <span class="mr-date">${esc(fmtDate(e))}${e.approx ? " " + esc(t("mr-approx")) : ""}</span><span class="mr-type">${esc(typeLabel(e.type))}</span>
    <div class="mr-title">${esc(e.title)}</div>
    <div class="mr-desc">${esc(e.description)}</div>
    <div class="mr-src">${e.source_url ? `<a href="${esc(e.source_url)}" target="_blank" rel="noopener">${esc(t("mr-source"))}</a> · ` : ""}<span class="pm-muted" title="${esc(authLabel(e.authority_class))}">authority ${esc(e.authority_class)}</span></div>
  </li>`).join("");
}
async function boot() {
  document.addEventListener("cdo-lang", () => { renderFilters(); renderTimeline(); paintStatic(); renderHeroAside(); });
  paintStatic();
  renderFilters();
  renderHeroAside();
  try {
    const res = await fetch("market-events.json", { cache: "no-cache" });
    const j = await res.json();
    state.events = j.events || [];
    state.meta = j.meta || null;
    renderTimeline();
    renderHeroAside();
  } catch (e) {
    document.getElementById("mr-tl").innerHTML = `<li class="loading">${t("mr-err")}</li>`;
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

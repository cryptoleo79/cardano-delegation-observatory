/* Cardano Project Memory — ecosystem explorer (Discovery Agent D).
 * CardanoCube-style category grid, fed by the live Data Layer API. Read-only.
 * Fetches GET /categories and renders a filterable grid of category cards,
 * each linking to category.html?slug={slug}. No external libs, no build step. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = { data: null, q: "" };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function fmtNum(n) { return n == null ? "0" : Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US"); }
function fmtNumOrDash(n) { return n == null || !isFinite(n) ? "—" : Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US"); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

const AUTH = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };

/* Small inline icon set (stroke, currentColor). */
const ICON = {
  categories: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  classified: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  confidence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  source: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
};

/* Page-local i18n, merged into the global dict then applied (avoids editing the
 * shared i18n.js for page-specific strings). */
const PAGE_I18N = {
  en: {
    "eco-title": "Cardano ecosystem explorer",
    "eco-lede": "The bridge from CardanoCube-style discovery into Project Memory. Browse the ecosystem taxonomy — preserved as-found, each category carrying its source and authority class. Read-only; every value carries its provenance.",
    "eco-honest": "Categories come from the CardanoCube taxonomy; project assignments are sourced from the Built on Cardano directory and CardanoCube's own category listings. 73 of 74 categories are now populated. Counts reflect preserved, provenance-bearing assignments — not an exhaustive census of every project.",
    "ef-q-label": "Search",
    "eco-foot-pre": "Source: live Cardano Data Layer API ",
    "eco-foot-post": " · CC0. Taxonomy seeded from the CardanoCube community directory and preserved per-source — never silently merged. Categories link through to per-category project lists.",
    "eco-hero-updated": "Last updated",
    "eco-m-categories": "Categories",
    "eco-m-classified": "With projects",
    "eco-m-projects": "Projects",
    "eco-m-source": "Source",
    "eco-m-confidence": "Confidence",
    "eco-m-categories-sub": "in the taxonomy",
    "eco-m-classified-sub": "carrying assignments",
    "eco-m-projects-sub": "category assignments",
    "eco-m-confidence-sub": "provenance grade",
    "eco-m-source-sub": "event-sourced archive",
    "eco-count-label": "projects",
    "eco-deprecated": "deprecated",
    "eco-alias": "alias",
    "eco-none": "No categories match.",
    "eco-load-error": "Could not load the ecosystem taxonomy from the API.",
  },
  ja: {
    "eco-title": "Cardano エコシステムエクスプローラー",
    "eco-lede": "CardanoCube 的なディスカバリーからプロジェクトメモリへの架け橋。エコシステム分類を閲覧できます。現状のまま保存され、各カテゴリは出典と権威クラスを保持します。読み取り専用。各値には来歴が付随します。",
    "eco-honest": "カテゴリは CardanoCube の分類に由来し、プロジェクトの割り当ては Built on Cardano ディレクトリと CardanoCube 自身のカテゴリ一覧から取得しています。現在 74 カテゴリ中 73 が分類済みです。件数は来歴付きで保存された割り当てを反映しており、すべてのプロジェクトを網羅した集計ではありません。",
    "ef-q-label": "検索",
    "eco-foot-pre": "出典：ライブ Cardano Data Layer API ",
    "eco-foot-post": " · CC0。分類は CardanoCube コミュニティディレクトリから種を得て、出典ごとに保存されます（暗黙に統合しません）。各カテゴリはカテゴリ別プロジェクト一覧へリンクします。検証済みの割り当てが存在するまで、プロジェクトは未分類として表示されます。",
    "eco-hero-updated": "最終更新",
    "eco-m-categories": "カテゴリ",
    "eco-m-classified": "プロジェクトあり",
    "eco-m-projects": "プロジェクト",
    "eco-m-source": "出典",
    "eco-m-confidence": "信頼度",
    "eco-m-categories-sub": "分類内",
    "eco-m-classified-sub": "割り当てあり",
    "eco-m-projects-sub": "カテゴリ割り当て",
    "eco-m-confidence-sub": "来歴グレード",
    "eco-m-source-sub": "イベントソース型アーカイブ",
    "eco-count-label": "プロジェクト",
    "eco-deprecated": "非推奨",
    "eco-alias": "別名",
    "eco-none": "該当するカテゴリはありません。",
    "eco-load-error": "API からエコシステム分類を読み込めませんでした。",
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
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(AUTH[cls] || "")}">${esc(cls)}</span>`;
}

function renderHeroAside() {
  const el = document.getElementById("eco-hero-aside");
  if (!el) return;
  const d = state.data;
  if (!d) { el.innerHTML = ""; return; }
  const q = d._quality || {};
  const asOf = q.as_of || d.as_of;
  const asOfTxt = asOf ? new Date(asOf).toLocaleString(NUM_LOCALE[currentLang()] || "en-US") : "—";
  const src = q.source || (d.source && (d.source.label || d.source.source_id)) || "—";
  el.innerHTML =
    `<div class="ha-label">${esc(t("eco-hero-updated"))}</div>` +
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

function renderMeta() {
  const el = document.getElementById("eco-meta");
  if (!el) return;
  const d = state.data;
  if (!d) { el.innerHTML = ""; return; }
  const cats = d.categories || [];
  const categories = d.count != null ? d.count : cats.length;
  const classified = cats.filter((c) => Number(c.project_count) > 0).length;
  const projects = cats.reduce((sum, c) => sum + (Number(c.project_count) || 0), 0);
  const q = d._quality || {};
  const confidence = q.confidence || "—";
  const source = q.source || (d.source && (d.source.label || d.source.source_id)) || "—";
  el.innerHTML = [
    metricCard(ICON.categories, fmtNumOrDash(categories), false, t("eco-m-categories"), t("eco-m-categories-sub")),
    metricCard(ICON.classified, fmtNumOrDash(classified), false, t("eco-m-classified"), t("eco-m-classified-sub")),
    metricCard(ICON.projects, fmtNumOrDash(projects), false, t("eco-m-projects"), t("eco-m-projects-sub")),
    metricCard(ICON.confidence, esc(confidence), true, t("eco-m-confidence"), t("eco-m-confidence-sub")),
    metricCard(ICON.source, esc(source), true, t("eco-m-source"), t("eco-m-source-sub")),
  ].join("");
}

function renderGrid() {
  const grid = document.getElementById("eco-grid");
  if (!grid || !state.data) return;
  const all = state.data.categories || [];
  const ql = state.q.trim().toLowerCase();
  const rows = all.filter((c) =>
    !ql ||
    (c.slug && c.slug.toLowerCase().includes(ql)) ||
    (c.name && c.name.toLowerCase().includes(ql)));

  const cnt = document.getElementById("ef-count");
  if (cnt) cnt.textContent = `${rows.length} / ${all.length}`;

  if (!rows.length) {
    grid.innerHTML = `<div class="rank-empty" style="grid-column:1/-1">${esc(t("eco-none"))}</div>`;
    return;
  }

  grid.innerHTML = rows.map((c) => {
    const src = c.source || {};
    const n = Number(c.project_count) || 0;
    const flags = [];
    if (c.deprecated) flags.push(`<span class="eco-flag">${t("eco-deprecated")}</span>`);
    if (c.alias_of) flags.push(`<span class="eco-flag" title="${esc(c.alias_of)}">${t("eco-alias")} → ${esc(c.alias_of)}</span>`);
    const srcLabel = src.label || src.source_id || "—";
    return `<a class="eco-card" href="category.html?slug=${encodeURIComponent(c.slug)}">
      <div class="eco-card-head">
        <span class="eco-card-name">${esc(c.name || c.slug)}</span>
        <span class="eco-card-count${n ? "" : " eco-zero"}">${fmtNum(n)}<span class="eco-count-label">${t("eco-count-label")}</span></span>
      </div>
      <span class="eco-card-slug">${esc(c.slug)}</span>
      ${flags.length ? `<div class="eco-card-foot">${flags.join("")}</div>` : ""}
      <div class="eco-card-foot">
        ${authChip(src.authority_class)}
        <span class="eco-card-src">${esc(srcLabel)}</span>
      </div>
    </a>`;
  }).join("");
}

function applyFootnoteI18n() {
  // The footnote wraps a <code>; keep it intact while translating around it.
  const foot = document.getElementById("eco-foot");
  if (!foot) return;
  foot.innerHTML = `${esc(t("eco-foot-pre"))}<code>/categories</code>${esc(t("eco-foot-post"))}`;
}

function render() {
  if (!state.data) return;
  renderHeroAside();
  renderMeta();
  renderGrid();
  applyFootnoteI18n();
}

async function boot() {
  document.addEventListener("cdo-lang", () => render());
  const q = document.getElementById("ef-q");
  if (q) q.addEventListener("input", () => { state.q = q.value; renderGrid(); });
  applyFootnoteI18n();
  try {
    state.data = await fetchJson(`${API}/categories`);
    render();
  } catch (err) {
    console.error("ecosystem load failed", err);
    const grid = document.getElementById("eco-grid");
    if (grid) grid.innerHTML = `<div class="rank-empty" style="grid-column:1/-1">${esc(t("eco-load-error"))}</div>`;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

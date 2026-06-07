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
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

const AUTH = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };

/* Page-local i18n, merged into the global dict then applied (avoids editing the
 * shared i18n.js for page-specific strings). */
const PAGE_I18N = {
  en: {
    "eco-title": "Cardano ecosystem explorer",
    "eco-lede": "The bridge from CardanoCube-style discovery into Project Memory. Browse the ecosystem taxonomy — preserved as-found, each category carrying its source and authority class. Read-only; every value carries its provenance.",
    "eco-honest": "Category → project assignments are still being built. Most counts below are currently 0 (unclassified) — this view shows the preserved taxonomy, not a finished census of which project belongs where. Counts will fill in as verified assignments land.",
    "ef-q-label": "Search",
    "eco-foot-pre": "Source: live Cardano Data Layer API ",
    "eco-foot-post": " · CC0. Taxonomy seeded from the CardanoCube community directory and preserved per-source — never silently merged. Categories link through to per-category project lists; projects appear as unclassified until verified assignments exist.",
    "eco-m-categories": "Categories",
    "eco-m-classified": "With projects",
    "eco-m-source": "Source",
    "eco-m-confidence": "Confidence",
    "eco-count-label": "projects",
    "eco-deprecated": "deprecated",
    "eco-alias": "alias",
    "eco-none": "No categories match.",
    "eco-load-error": "Could not load the ecosystem taxonomy from the API.",
  },
  ja: {
    "eco-title": "Cardano エコシステムエクスプローラー",
    "eco-lede": "CardanoCube 的なディスカバリーからプロジェクトメモリへの架け橋。エコシステム分類を閲覧できます。現状のまま保存され、各カテゴリは出典と権威クラスを保持します。読み取り専用。各値には来歴が付随します。",
    "eco-honest": "カテゴリ → プロジェクトの割り当てはまだ構築中です。以下のほとんどの件数は現在 0（未分類）です。この画面は保存された分類を示すもので、どのプロジェクトがどこに属するかの完成した集計ではありません。検証済みの割り当てが入り次第、件数が埋まります。",
    "ef-q-label": "検索",
    "eco-foot-pre": "出典：ライブ Cardano Data Layer API ",
    "eco-foot-post": " · CC0。分類は CardanoCube コミュニティディレクトリから種を得て、出典ごとに保存されます（暗黙に統合しません）。各カテゴリはカテゴリ別プロジェクト一覧へリンクします。検証済みの割り当てが存在するまで、プロジェクトは未分類として表示されます。",
    "eco-m-categories": "カテゴリ",
    "eco-m-classified": "プロジェクトあり",
    "eco-m-source": "出典",
    "eco-m-confidence": "信頼度",
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

function renderMeta() {
  const el = document.getElementById("eco-meta");
  if (!el || !state.data) return;
  const cats = state.data.categories || [];
  const classified = cats.filter((c) => Number(c.project_count) > 0).length;
  const q = state.data._quality || {};
  const items = [
    `<span class="meta-item"><span class="meta-label">${t("eco-m-categories")}</span> ${fmtNum(state.data.count != null ? state.data.count : cats.length)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("eco-m-classified")}</span> ${fmtNum(classified)}</span>`,
  ];
  if (q.source) items.push(`<span class="meta-item"><span class="meta-label">${t("eco-m-source")}</span> ${esc(q.source)}${q.authority_class ? " " + authChip(q.authority_class) : ""}</span>`);
  if (q.confidence) items.push(`<span class="meta-item"><span class="meta-label">${t("eco-m-confidence")}</span> ${esc(q.confidence)}</span>`);
  const asof = q.as_of || state.data.as_of;
  if (asof) items.push(`<span class="meta-item meta-item-right">${esc(String(asof).slice(0, 10))}</span>`);
  el.innerHTML = items.join("");
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
    grid.innerHTML = `<div class="eco-empty">${t("eco-none")}</div>`;
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
    if (grid) grid.innerHTML = `<div class="eco-empty">${t("eco-load-error")}</div>`;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

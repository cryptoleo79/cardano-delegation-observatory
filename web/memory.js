/* Cardano Memory Layer — front door (memory.html).
 *
 * Progressive enhancement ONLY. The page is complete and correct with no JS.
 * This script fetches a few live counts from the read-only Data Layer API and
 * (a) fills the inline `.mem-count` spans inside each record card, and
 * (b) drives the product-grade hero aside ("last updated / source") and the
 * metric-card grid that summarises those same counts. Every fetch is
 * independent and failure-silent: a dead endpoint leaves its span empty and
 * its metric card shows "—", never breaks the page, never throws to the
 * console-visible top level. No interpretation, no rankings — counts only. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) {
  const l = currentLang();
  return (typeof i18n !== "undefined" && i18n[l] && i18n[l][key]) ||
         (typeof i18n !== "undefined" && i18n.en && i18n.en[key]) || key;
}
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function fmtNum(n) {
  if (n == null || isNaN(n)) return null;
  return Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
}

/* Page-local i18n merged into the global dict (do not edit the shared i18n.js). */
const PAGE_I18N = {
  en: {
    "mem-c-dreps": "tracked",
    "mem-c-actions": "actions",
    "mem-c-treasury": "epochs",
    "mem-c-archive": "sources",
    "mem-c-projects": "projects",
    "mem-c-categories": "categories",
    /* Hero aside */
    "mem-hero-updated": "Last updated",
    "mem-hero-source": "Cardano Data Layer API",
    "mem-hero-pending": "Live counts loading…",
    /* Metric cards: label + sub per record */
    "mem-m-dreps": "DReps", "mem-m-dreps-sub": "tracked by voting weight",
    "mem-m-actions": "Governance actions", "mem-m-actions-sub": "recorded on-chain",
    "mem-m-treasury": "Treasury epochs", "mem-m-treasury-sub": "balance series observed",
    "mem-m-archive": "Catalyst sources", "mem-m-archive-sub": "preserved with provenance",
    "mem-m-projects": "Projects", "mem-m-projects-sub": "in the project record",
    "mem-m-categories": "Categories", "mem-m-categories-sub": "in the ecosystem taxonomy",
  },
  ja: {
    "mem-c-dreps": "件 追跡中",
    "mem-c-actions": "件のアクション",
    "mem-c-treasury": "エポック",
    "mem-c-archive": "件の出典",
    "mem-c-projects": "件のプロジェクト",
    "mem-c-categories": "件のカテゴリ",
    /* Hero aside */
    "mem-hero-updated": "最終更新",
    "mem-hero-source": "Cardano Data Layer API",
    "mem-hero-pending": "ライブ件数を読み込み中…",
    /* Metric cards: label + sub per record */
    "mem-m-dreps": "DRep", "mem-m-dreps-sub": "投票権で追跡中",
    "mem-m-actions": "ガバナンスアクション", "mem-m-actions-sub": "オンチェーン記録",
    "mem-m-treasury": "トレジャリーのエポック", "mem-m-treasury-sub": "残高系列を観測",
    "mem-m-archive": "Catalyst の出典", "mem-m-archive-sub": "来歴付きで保存",
    "mem-m-projects": "プロジェクト", "mem-m-projects-sub": "プロジェクト記録内",
    "mem-m-categories": "カテゴリ", "mem-m-categories-sub": "エコシステム分類体系内",
  },
};
if (typeof i18n !== "undefined") {
  Object.assign(i18n.en, PAGE_I18N.en);
  Object.assign(i18n.ja, PAGE_I18N.ja);
  if (typeof setLang === "function") setLang(currentLang());
}

/* Small inline icon set (stroke, currentColor) — one per record. */
const ICON = {
  dreps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  actions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  treasury: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
  projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  categories: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
};

/* Live numbers + the freshest as_of seen across responses; filled by boot(). */
const metrics = {
  dreps: null, actions: null, treasury: null, archive: null, projects: null, categories: null,
  asOf: null,
};

async function fetchJson(path) {
  try {
    const res = await fetch(API + path, { cache: "no-cache" });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null; // failure-silent: leave the span empty
  }
}

/* Fill one count span. `value` is a number; `labelKey` an i18n key. If value is
 * null, the span is left empty (CSS hides empty .mem-count). */
function setCount(id, value, labelKey) {
  const el = document.getElementById(id);
  if (!el) return;
  const num = fmtNum(value);
  if (num == null) return;
  el.dataset.kind = labelKey; // remember key so re-render on lang toggle works
  el.dataset.value = String(value);
  renderCount(el);
}

function renderCount(el) {
  const v = el.dataset.value;
  const key = el.dataset.kind;
  if (v == null || key == null) return;
  const num = fmtNum(Number(v));
  if (num == null) return;
  el.textContent = `${num} ${t(key)}`;
  el.setAttribute("data-filled", "1");
}

/* ── Hero aside ("last updated / source") ─────────────────────────────── */
function renderHeroAside() {
  const el = document.getElementById("mem-hero-aside");
  if (!el) return;
  const asOfTxt = metrics.asOf
    ? new Date(metrics.asOf).toLocaleString(NUM_LOCALE[currentLang()] || "en-US")
    : t("mem-hero-pending");
  el.innerHTML =
    `<div class="ha-label">${esc(t("mem-hero-updated"))}</div>` +
    `<div class="ha-value">${esc(asOfTxt)}</div>` +
    `<div class="ha-sub">${esc(t("mem-hero-source"))}</div>`;
}

/* ── Metric cards ─────────────────────────────────────────────────────── */
function metricCard(icon, value, label, sub) {
  return `<div class="metric-card">
    <div class="mc-icon">${icon}</div>
    <div class="mc-value">${value}</div>
    <div class="mc-label">${esc(label)}</div>
    <div class="mc-sub">${esc(sub)}</div>
  </div>`;
}

function renderMetrics() {
  const el = document.getElementById("mem-metrics");
  if (!el) return;
  const v = (n) => fmtNum(n) || "—";
  el.innerHTML = [
    metricCard(ICON.dreps, v(metrics.dreps), t("mem-m-dreps"), t("mem-m-dreps-sub")),
    metricCard(ICON.actions, v(metrics.actions), t("mem-m-actions"), t("mem-m-actions-sub")),
    metricCard(ICON.treasury, v(metrics.treasury), t("mem-m-treasury"), t("mem-m-treasury-sub")),
    metricCard(ICON.archive, v(metrics.archive), t("mem-m-archive"), t("mem-m-archive-sub")),
    metricCard(ICON.projects, v(metrics.projects), t("mem-m-projects"), t("mem-m-projects-sub")),
    metricCard(ICON.categories, v(metrics.categories), t("mem-m-categories"), t("mem-m-categories-sub")),
  ].join("");
}

/* Track the freshest as_of seen in any response's _quality provenance block. */
function noteAsOf(d) {
  const asOf = d && d._quality && d._quality.as_of;
  if (!asOf) return;
  if (!metrics.asOf || new Date(asOf) > new Date(metrics.asOf)) metrics.asOf = asOf;
}

/* Re-render everything language-dependent when the language toggles. */
document.addEventListener("cdo-lang", () => {
  document.querySelectorAll(".mem-count[data-filled]").forEach(renderCount);
  renderHeroAside();
  renderMetrics();
});

async function boot() {
  renderHeroAside();   // pending placeholder before data lands
  renderMetrics();     // "—" placeholders before data lands

  /* Each fetch independent; results fill whichever spans/cards are present. */
  const [archive, categories, projects, treasury, actions] = await Promise.all([
    fetchJson("/archive"),
    fetchJson("/categories"),
    fetchJson("/projects"),
    fetchJson("/treasury"),
    fetchJson("/actions").catch(() => null), // may not exist; failure-silent
  ]);

  [archive, categories, projects, treasury, actions].forEach(noteAsOf);

  if (archive && archive.subfolders && typeof archive.subfolders === "object") {
    metrics.archive = Object.keys(archive.subfolders).length;
    setCount("c-archive", metrics.archive, "mem-c-archive");
  }
  if (categories && categories.count != null) {
    metrics.categories = categories.count;
    setCount("c-categories", categories.count, "mem-c-categories");
  }
  if (projects && (projects.total != null || projects.count != null)) {
    metrics.projects = projects.total != null ? projects.total : projects.count;
    setCount("c-projects", metrics.projects, "mem-c-projects");
  }
  if (treasury && treasury.n_epochs != null) {
    metrics.treasury = treasury.n_epochs;
    setCount("c-treasury", treasury.n_epochs, "mem-c-treasury");
  }
  if (actions && Array.isArray(actions.actions)) {
    metrics.actions = actions.actions.length;
    setCount("c-actions", actions.actions.length, "mem-c-actions");
  } else if (actions && actions.count != null) {
    metrics.actions = actions.count;
    setCount("c-actions", actions.count, "mem-c-actions");
  }
  /* c-dreps left to a dedicated endpoint if/when one is wired; intentionally
   * not faked. Its span and metric card stay empty / "—". */

  renderHeroAside();
  renderMetrics();
}

boot();

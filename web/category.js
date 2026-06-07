/* Cardano Project Memory — category detail page (Discovery Agent E).
 * Read-only. Reads ?slug= from the URL, fetches GET /category/{slug} from the
 * live Cardano Data Layer API, and renders the category name + slug, its
 * taxonomy provenance (source / as-of / taxonomy note, deprecated/alias flags),
 * a table of the projects assigned to it (each linking to project.html?id=),
 * and the response _quality block. Honest empty state when no assignments
 * exist; 404 surfaced for unknown slugs. No external libs. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";

const state = { slug: null, data: null };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

const AUTH = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };

/* Page-local i18n, merged into the global dict then applied (avoids editing the
 * shared i18n.js for page-specific strings). */
const PAGE_I18N = {
  en: {
    "back-link-ecosystem": "← Ecosystem",
    "c-stat-count-label": "Projects", "c-stat-source-label": "Source", "c-stat-asof-label": "As of", "c-stat-authority-label": "Authority",
    "c-prov-label": "Taxonomy provenance",
    "c-prov-help": "This category is preserved as-found from its source taxonomy — observed, not consolidated across sources. Each project's category assignment carries its own authority class. This is Project Memory: read-only, every value traces to where it came from.",
    "c-projects-label": "Projects in this category",
    "th-c-name": "Name", "th-c-kind": "Kind", "th-c-status": "Status", "th-c-assignment": "Assignment authority",
    "c-quality-label": "Data quality",
    "c-q-source": "Source", "c-q-authority": "Authority", "c-q-confidence": "Confidence", "c-q-refresh": "Refresh", "c-q-asof": "As of", "c-q-provenance": "Provenance",
    "c-flag-deprecated": "Deprecated", "c-flag-alias": "Alias of",
    "c-empty": "No verified assignments yet — Project Memory category assignments are being built.",
    "c-no-slug": "No category specified.", "c-not-found": "Category not found",
    "c-not-found-help": "No category with that slug exists in Project Memory. Browse all categories from the Ecosystem page.",
    "c-load-error": "Could not load this category from the API.",
    "c-unclassified": "unclassified", "c-none-value": "—",
  },
  ja: {
    "back-link-ecosystem": "← エコシステム",
    "c-stat-count-label": "プロジェクト", "c-stat-source-label": "出典", "c-stat-asof-label": "時点", "c-stat-authority-label": "権威クラス",
    "c-prov-label": "分類の来歴",
    "c-prov-help": "このカテゴリは出典の分類体系から「観測されたまま」保存されています（出典をまたいで統合していません）。各プロジェクトのカテゴリ割当ては固有の権威クラスを持ちます。プロジェクトメモリは読み取り専用で、各値は出所まで辿れます。",
    "c-projects-label": "このカテゴリのプロジェクト",
    "th-c-name": "名称", "th-c-kind": "種別", "th-c-status": "状態", "th-c-assignment": "割当ての権威クラス",
    "c-quality-label": "データ品質",
    "c-q-source": "出典", "c-q-authority": "権威クラス", "c-q-confidence": "信頼度", "c-q-refresh": "更新", "c-q-asof": "時点", "c-q-provenance": "来歴",
    "c-flag-deprecated": "非推奨", "c-flag-alias": "別名（エイリアス）",
    "c-empty": "検証済みの割当てはまだありません — プロジェクトメモリのカテゴリ割当ては現在構築中です。",
    "c-no-slug": "カテゴリが指定されていません。", "c-not-found": "カテゴリが見つかりません",
    "c-not-found-help": "そのスラッグのカテゴリはプロジェクトメモリに存在しません。エコシステムページから全カテゴリを閲覧できます。",
    "c-load-error": "このカテゴリを API から読み込めませんでした。",
    "c-unclassified": "未分類", "c-none-value": "—",
  },
};
if (typeof i18n !== "undefined") {
  Object.assign(i18n.en, PAGE_I18N.en);
  Object.assign(i18n.ja, PAGE_I18N.ja);
  if (typeof setLang === "function") setLang(currentLang());
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (res.status === 404) { const e = new Error("not found"); e.notFound = true; throw e; }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function slugFromUrl() {
  const p = new URLSearchParams(location.search).get("slug");
  return p ? p.trim() : null;
}

function authChip(cls) {
  if (!cls) return `<span class="pm-muted">${t("c-none-value")}</span>`;
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(AUTH[cls] || "")}">${esc(cls)}</span>`;
}

function statusLabel(s) {
  if (!s) return `<span class="pm-status pm-status-unknown">${t("c-none-value")}</span>`;
  return `<span class="pm-status pm-status-${esc(s)}">${esc(s)}</span>`;
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function setHtml(id, v) { const el = document.getElementById(id); if (el) el.innerHTML = v; }

function renderFlags(cat) {
  const flags = [];
  if (cat.deprecated) flags.push(`<span class="cat-flag cat-flag-deprecated">${t("c-flag-deprecated")}</span>`);
  if (cat.alias_of) flags.push(`<span class="cat-flag cat-flag-alias">${t("c-flag-alias")}: ${esc(cat.alias_of)}</span>`);
  setHtml("c-flags", flags.join(" "));
}

function renderProvenance(cat) {
  const cell = (label, value) =>
    `<div class="provenance-cell"><div class="provenance-label">${label}</div><div class="provenance-value">${value}</div></div>`;
  setHtml("c-provenance", [
    cell(t("c-stat-source-label"), esc(cat.source_id || t("c-none-value"))),
    cell(t("c-stat-asof-label"), esc(cat.as_of || t("c-none-value"))),
  ].join(""));
  const note = cat.taxonomy_note;
  setText("c-taxonomy-note", note ? note : "");
}

function renderStats(d) {
  const cat = d.category || {};
  setText("c-stat-count", String(d.project_count != null ? d.project_count : (d.projects ? d.projects.length : 0)));
  setText("c-stat-source", cat.source_id || t("c-none-value"));
  setText("c-stat-asof", cat.as_of || t("c-none-value"));
  const auth = d._quality && d._quality.authority_class;
  setHtml("c-stat-authority", auth ? authChip(auth) : t("c-none-value"));
}

function renderProjects(d) {
  const tbody = document.getElementById("c-tbody");
  const wrap = document.getElementById("c-table-wrap");
  if (!tbody || !wrap) return;
  const projects = d.projects || [];
  if (!projects.length) {
    wrap.innerHTML = `<div class="cat-empty">${t("c-empty")}</div>`;
    return;
  }
  tbody.innerHTML = projects.map((p) => {
    const href = `project.html?id=${encodeURIComponent(p.id)}`;
    const nameCell = `<a href="${esc(href)}">${esc(p.name || p.id)}</a><div class="pm-id">${esc(p.id)}</div>`;
    const status = p.unclassified ? `<span class="pm-muted">${t("c-unclassified")}</span>` : statusLabel(p.status);
    const auth = p.assignment && p.assignment.authority_class;
    return `<tr>
      <td>${nameCell}</td>
      <td>${esc(p.kind || t("c-none-value"))}</td>
      <td>${status}</td>
      <td>${authChip(auth)}</td>
    </tr>`;
  }).join("");
}

function renderQuality(d) {
  const q = d._quality;
  if (!q) { setHtml("c-quality", `<span class="meta-item pm-muted">${t("c-none-value")}</span>`); return; }
  const item = (label, value) =>
    `<span class="meta-item"><span class="meta-label">${label}</span> ${value}</span>`;
  const parts = [];
  if (q.source) parts.push(item(t("c-q-source"), esc(q.source)));
  if (q.authority_class) parts.push(item(t("c-q-authority"), authChip(q.authority_class)));
  if (q.confidence) parts.push(item(t("c-q-confidence"), esc(q.confidence)));
  if (q.refresh) parts.push(item(t("c-q-refresh"), esc(q.refresh)));
  if (q.as_of) parts.push(item(t("c-q-asof"), esc(q.as_of)));
  if (q.provenance) parts.push(item(t("c-q-provenance"), esc(q.provenance)));
  setHtml("c-quality", parts.join(""));
}

function render() {
  if (!state.data) return;
  const d = state.data;
  const cat = d.category || {};
  const name = cat.name || cat.slug || state.slug;
  setText("c-name", name);
  setText("c-slug", cat.slug || state.slug || "");
  renderFlags(cat);
  renderStats(d);
  renderProvenance(cat);
  renderProjects(d);
  renderQuality(d);
  document.title = `${name} — Cardano Project Memory`;
}

function showNotFound() {
  setText("c-name", t("c-not-found"));
  setText("c-slug", state.slug || "");
  const help = document.getElementById("c-prov-help");
  if (help) help.textContent = t("c-not-found-help");
  ["c-flags", "c-provenance", "c-taxonomy-note", "c-table-wrap", "c-quality"].forEach((id) => setHtml(id, ""));
  document.title = `${t("c-not-found")} — Cardano Project Memory`;
}

function showError() {
  setText("c-name", t("c-load-error"));
  setText("c-slug", state.slug || "");
}

async function boot() {
  document.addEventListener("cdo-lang", () => { if (state.data) render(); });
  state.slug = slugFromUrl();
  if (!state.slug) { setText("c-name", t("c-no-slug")); return; }
  setText("c-slug", state.slug);
  try {
    state.data = await fetchJson(`${API}/category/${encodeURIComponent(state.slug)}`);
    render();
  } catch (err) {
    if (err && err.notFound) { showNotFound(); return; }
    console.error("category detail load failed", err);
    showError();
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

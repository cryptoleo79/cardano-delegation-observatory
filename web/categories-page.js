/* Cardano Project Memory — categories (taxonomy) page. Read-only. */

"use strict";

const DATA_ROOT_DEFAULT = "/data/snapshots";
function DATA_ROOT() {
  return (typeof window !== "undefined" && window.dataRoot) ? window.dataRoot() : DATA_ROOT_DEFAULT;
}
const PM_ROOT = () => `${DATA_ROOT()}/projectmemory`;
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = { index: null, q: "" };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function fmtNum(n) { return n == null ? "0" : Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US"); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const AUTH = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };

const PAGE_I18N = {
  en: {
    "cat-title": "Cardano ecosystem taxonomy",
    "cat-lede": "The category taxonomy preserved from the ecosystem, as-found. Each category keeps its source and authority class; taxonomy is preserved per-source, never silently merged. Read-only.",
    "cf-q-label": "Search",
    "th-cat-name": "Category", "th-cat-slug": "Slug", "th-cat-count": "Projects",
    "th-cat-source": "Source", "th-cat-authority": "Authority", "th-cat-asof": "Added (as-of)",
    "ft-cat-note": "Taxonomy preserved as-found; per-source, never consolidated.", "ft-projects": "Projects",
    "cat-m-categories": "Categories", "cat-m-projects": "Projects",
    "pm-m-chain-ok": "hash chain verified", "pm-m-chain-bad": "chain check failed",
    "cat-none": "No categories match.", "cat-deprecated": "deprecated", "pm-load-error": "Could not load taxonomy data.",
  },
  ja: {
    "cat-title": "Cardano エコシステム分類",
    "cat-lede": "エコシステムから保存したカテゴリ分類（現状のまま）。各カテゴリは出典と権威クラスを保持し、分類は出典ごとに保存され、暗黙に統合されません。読み取り専用。",
    "cf-q-label": "検索",
    "th-cat-name": "カテゴリ", "th-cat-slug": "スラッグ", "th-cat-count": "プロジェクト",
    "th-cat-source": "出典", "th-cat-authority": "権威クラス", "th-cat-asof": "追加時点",
    "ft-cat-note": "分類は現状のまま保存。出典ごとで、統合しません。", "ft-projects": "プロジェクト",
    "cat-m-categories": "カテゴリ", "cat-m-projects": "プロジェクト",
    "pm-m-chain-ok": "ハッシュ連鎖検証済", "pm-m-chain-bad": "連鎖検証失敗",
    "cat-none": "該当するカテゴリはありません。", "cat-deprecated": "非推奨", "pm-load-error": "分類データを読み込めませんでした。",
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
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(AUTH[cls] || "")}">${esc(cls)}</span>`;
}

function renderMeta() {
  const m = state.index.meta, el = document.getElementById("cat-meta");
  if (!el) return;
  const c = m.counts || {};
  el.innerHTML = [
    `<span class="meta-item"><span class="meta-label">${t("cat-m-categories")}</span> ${fmtNum(c.categories)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("cat-m-projects")}</span> ${fmtNum(c.projects)}</span>`,
    `<span class="meta-item meta-item-right">${m.chain_ok ? "✓ " + t("pm-m-chain-ok") : "✗ " + t("pm-m-chain-bad")}</span>`,
  ].join("");
}

function renderTable() {
  const tbody = document.getElementById("cat-tbody");
  if (!tbody) return;
  const ql = state.q.trim().toLowerCase();
  const rows = state.index.categories.filter((c) =>
    !ql || c.slug.toLowerCase().includes(ql) || (c.name && c.name.toLowerCase().includes(ql)));
  const cnt = document.getElementById("cf-count");
  if (cnt) cnt.textContent = `${rows.length} / ${state.index.categories.length}`;
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="6" class="loading">${t("cat-none")}</td></tr>`; return; }
  tbody.innerHTML = rows.map((c) => {
    const src = c.source || {};
    const cnt = c.project_count
      ? `<a href="projects.html">${fmtNum(c.project_count)}</a>`
      : `<span class="pm-muted">0</span>`;
    return `<tr id="${esc(c.slug)}">
      <td>${esc(c.name || c.slug)}${c.deprecated ? ` <span class="pm-claim-state">${t("cat-deprecated")}</span>` : ""}</td>
      <td><code>${esc(c.slug)}</code></td>
      <td>${cnt}</td>
      <td>${esc(src.label || src.source_id || "—")}</td>
      <td>${authChip(src.authority_class)}</td>
      <td>${esc(c.source && c.source.captured_at ? c.source.captured_at : (state.index.meta.generated_at || "").slice(0, 10))}</td>
    </tr>`;
  }).join("");
  // jump to anchor if present
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
}

function render() { if (!state.index) return; renderMeta(); renderTable(); }

async function boot() {
  document.addEventListener("cdo-lang", () => render());
  const q = document.getElementById("cf-q");
  if (q) q.addEventListener("input", () => { state.q = q.value; renderTable(); });
  try {
    state.index = await fetchJson(`${PM_ROOT()}/index.json`);
    render();
  } catch (err) {
    console.error("categories load failed", err);
    const tbody = document.getElementById("cat-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="loading">${t("pm-load-error")}</td></tr>`;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

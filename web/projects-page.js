/* Cardano Project Memory — projects list page.
 * Read-only. Fetches the static export and renders a filterable table with
 * per-project source + authority + evidence + history counts. No external libs. */

"use strict";

const DATA_ROOT_DEFAULT = "/data/snapshots";
function DATA_ROOT() {
  return (typeof window !== "undefined" && window.dataRoot) ? window.dataRoot() : DATA_ROOT_DEFAULT;
}
const PM_ROOT = () => `${DATA_ROOT()}/projectmemory`;
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = { index: null, filters: { status: "", kind: "", q: "" } };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function fmtNum(n) { return n == null ? "0" : Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US"); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/* Page-local i18n, merged into the global dict then applied (avoids editing the
 * shared i18n.js for page-specific strings). */
const PAGE_I18N = {
  en: {
    "pm-title": "Cardano Project Memory",
    "pm-lede": "Preserved metadata for Cardano projects and the ecosystem taxonomy — every value carries its provenance (who said it, where it came from, when, and what archived evidence supports it). Read-only. Nothing here is overwritten or deleted; the record is reconstructed from an append-only event log seeded from the preservation archive.",
    "f-status-label": "Status", "f-kind-label": "Kind", "f-q-label": "Search",
    "th-pm-name": "Name / ID", "th-pm-kind": "Kind", "th-pm-status": "Status", "th-pm-cats": "Categories",
    "th-pm-source": "Source", "th-pm-authority": "Authority", "th-pm-evidence": "Evidence", "th-pm-history": "History",
    "ft-pm-note": "Project Memory is read-only. Adding, updating, and challenging metadata is a governed write path that is not yet built.",
    "pm-m-projects": "Projects", "pm-m-categories": "Categories", "pm-m-defunct": "Defunct", "pm-m-tokens": "Tokens",
    "pm-m-events": "Events", "pm-m-chain-ok": "hash chain verified", "pm-m-chain-bad": "chain check failed",
    "pm-none": "No projects match.", "pm-unclassified": "unclassified", "pm-load-error": "Could not load Project Memory data.",
  },
  ja: {
    "pm-title": "Cardano プロジェクトメモリ",
    "pm-lede": "Cardano のプロジェクトとエコシステム分類の保存済みメタデータです。各値には来歴（誰が・どこから・いつ・どの保存証拠に基づくか）が付随します。読み取り専用。上書き・削除は行わず、保存アーカイブから種を得た追記専用イベントログから再構成されます。",
    "f-status-label": "状態", "f-kind-label": "種別", "f-q-label": "検索",
    "th-pm-name": "名称 / ID", "th-pm-kind": "種別", "th-pm-status": "状態", "th-pm-cats": "カテゴリ",
    "th-pm-source": "出典", "th-pm-authority": "権威クラス", "th-pm-evidence": "証拠", "th-pm-history": "履歴",
    "ft-pm-note": "プロジェクトメモリは読み取り専用です。メタデータの追加・更新・異議申立てを行う統治された書込み経路は未構築です。",
    "pm-m-projects": "プロジェクト", "pm-m-categories": "カテゴリ", "pm-m-defunct": "停止", "pm-m-tokens": "トークン",
    "pm-m-events": "イベント", "pm-m-chain-ok": "ハッシュ連鎖検証済", "pm-m-chain-bad": "連鎖検証失敗",
    "pm-none": "該当するプロジェクトはありません。", "pm-unclassified": "未分類", "pm-load-error": "プロジェクトメモリのデータを読み込めませんでした。",
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
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}

function statusLabel(s) {
  if (!s) return `<span class="pm-status pm-status-unknown">—</span>`;
  return `<span class="pm-status pm-status-${esc(s)}">${esc(s)}</span>`;
}

function renderMeta() {
  const m = state.index.meta;
  const el = document.getElementById("pm-meta");
  if (!el) return;
  const c = m.counts || {};
  el.innerHTML = [
    `<span class="meta-item"><span class="meta-label">${t("pm-m-projects")}</span> ${fmtNum(c.projects)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("pm-m-categories")}</span> ${fmtNum(c.categories)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("pm-m-defunct")}</span> ${fmtNum(c.defunct)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("pm-m-tokens")}</span> ${fmtNum(c.tokens)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("pm-m-events")}</span> ${fmtNum(m.events)}</span>`,
    `<span class="meta-item meta-item-right">${m.chain_ok ? "✓ " + t("pm-m-chain-ok") : "✗ " + t("pm-m-chain-bad")}</span>`,
  ].join("");
}

function filtered() {
  const { status, kind, q } = state.filters;
  const ql = q.trim().toLowerCase();
  return state.index.projects.filter((p) =>
    (!status || p.status === status) &&
    (!kind || p.kind === kind) &&
    (!ql || (p.name && p.name.toLowerCase().includes(ql)) || p.id.toLowerCase().includes(ql)));
}

function renderTable() {
  const tbody = document.getElementById("pm-tbody");
  if (!tbody) return;
  const rows = filtered();
  const cnt = document.getElementById("f-count");
  if (cnt) cnt.textContent = `${rows.length} / ${state.index.projects.length}`;
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="8" class="loading">${t("pm-none")}</td></tr>`; return; }
  tbody.innerHTML = rows.map((p) => {
    const href = `project.html?id=${encodeURIComponent(p.id)}`;
    const nameCell = `<a href="${href}">${esc(p.name || p.id)}</a>` +
      (p.kind === "token" && p.rank ? ` <span class="pm-rank">#${esc(p.rank)}</span>` : "") +
      `<div class="pm-id">${esc(p.id)}</div>`;
    return `<tr>
      <td>${nameCell}</td>
      <td>${esc(p.kind)}</td>
      <td>${statusLabel(p.status)}</td>
      <td>${p.unclassified ? `<span class="pm-muted">${t("pm-unclassified")}</span>` : fmtNum(p.category_count)}</td>
      <td>${esc(p.source_id || "—")}</td>
      <td>${authChip(p.authority_class)}</td>
      <td>${fmtNum(p.evidence_count)}</td>
      <td><a href="${href}#history">${fmtNum(p.history_count)}</a></td>
    </tr>`;
  }).join("");
}

function render() { if (!state.index) return; renderMeta(); renderTable(); }

function wireFilters() {
  const s = document.getElementById("f-status"), k = document.getElementById("f-kind"), q = document.getElementById("f-q");
  if (s) s.addEventListener("change", () => { state.filters.status = s.value; renderTable(); });
  if (k) k.addEventListener("change", () => { state.filters.kind = k.value; renderTable(); });
  if (q) q.addEventListener("input", () => { state.filters.q = q.value; renderTable(); });
}

async function boot() {
  document.addEventListener("cdo-lang", () => render());
  wireFilters();
  try {
    state.index = await fetchJson(`${PM_ROOT()}/index.json`);
    render();
  } catch (err) {
    console.error("project memory load failed", err);
    const tbody = document.getElementById("pm-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="loading">${t("pm-load-error")}</td></tr>`;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

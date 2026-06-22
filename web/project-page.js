/* Cardano Project Memory — project detail page.
 * Read-only. Resolves ?id= via the index, fetches the per-project export, and
 * renders claims (with provenance + archived evidence), categories, and the
 * append-only history timeline. No external libs. */

"use strict";

const DATA_ROOT_DEFAULT = "/data/snapshots";
function DATA_ROOT() {
  return (typeof window !== "undefined" && window.dataRoot) ? window.dataRoot() : DATA_ROOT_DEFAULT;
}
const PM_ROOT = () => `${DATA_ROOT()}/projectmemory`;

const state = { id: null, detail: null, history: null };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const AUTH = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };

const PAGE_I18N = {
  en: {
    "back-link-projects": "← Project Memory",
    "p-stat-kind-label": "Kind", "p-stat-status-label": "Status", "p-stat-claims-label": "Claims", "p-stat-evidence-label": "Evidence",
    "p-claims-label": "Claims & provenance",
    "p-claims-help": "Every field is a sourced claim: who asserted it, where it came from (with authority class), when, and what archived evidence supports it. Superseded values are preserved in history below — nothing is overwritten.",
    "p-cats-label": "Categories", "p-history-label": "History timeline",
    "p-history-help": "The append-only event log for this project. Hash-chained; nothing is deleted. This is the source of truth from which the values above are derived.",
    "ft-projects": "Projects", "ft-categories": "Categories",
    "ft-pm-note2": "Read-only. Provenance and evidence trace to the preservation archive via the Wayback Machine.",
    "p-value": "Value", "p-source": "Source", "p-asserted-by": "Asserted by", "p-as-of": "As of", "p-evidence": "Evidence",
    "p-no-evidence": "no evidence recorded", "p-no-claims": "No claims recorded.", "p-unclassified": "Unclassified — no verified category assignments yet.",
    "p-no-history": "No history.", "p-actor": "actor", "p-not-found": "Project not found", "pm-unclassified": "unclassified",
    "p-related-label": "Related projects", "p-related-help": "Other projects that share a category with this one — a sourced relationship, not inferred.",
    "p-events": "events", "p-no-related": "No projects share a category yet.",
  },
  ja: {
    "back-link-projects": "← プロジェクトメモリ",
    "p-stat-kind-label": "種別", "p-stat-status-label": "状態", "p-stat-claims-label": "主張", "p-stat-evidence-label": "証拠",
    "p-claims-label": "主張と来歴",
    "p-claims-help": "各フィールドは出典付きの主張です。誰が・どこから（権威クラス付き）・いつ主張し、どの保存証拠が支えるか。置き換えられた値は下の履歴に保存されます（上書きしません）。",
    "p-cats-label": "カテゴリ", "p-history-label": "履歴タイムライン",
    "p-history-help": "このプロジェクトの追記専用イベントログです。ハッシュ連鎖され、削除されません。上記の値はここから導出されます。",
    "ft-projects": "プロジェクト", "ft-categories": "カテゴリ",
    "ft-pm-note2": "読み取り専用。来歴と証拠は Wayback Machine 経由で保存アーカイブに辿れます。",
    "p-value": "値", "p-source": "出典", "p-asserted-by": "主張者", "p-as-of": "時点", "p-evidence": "証拠",
    "p-no-evidence": "証拠の記録なし", "p-no-claims": "主張の記録はありません。", "p-unclassified": "未分類 — 検証済みのカテゴリ割当てはまだありません。",
    "p-no-history": "履歴なし。", "p-actor": "実行者", "p-not-found": "プロジェクトが見つかりません", "pm-unclassified": "未分類",
    "p-related-label": "関連プロジェクト", "p-related-help": "このプロジェクトとカテゴリを共有する他のプロジェクト — 出典に基づく関連で、推論ではありません。",
    "p-events": "イベント", "p-no-related": "カテゴリを共有するプロジェクトはまだありません。",
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

function idFromUrl() {
  const p = new URLSearchParams(location.search).get("id");
  return p ? p.trim() : null;
}

function authChip(cls) {
  if (!cls) return "";
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(AUTH[cls] || "")}">${esc(cls)}</span>`;
}

function evidenceHtml(ev) {
  if (!ev || !ev.length) return `<span class="pm-muted">${t("p-no-evidence")}</span>`;
  return ev.map((e) => {
    const link = e.ref && /^https?:/.test(e.ref)
      ? `<a href="${esc(e.ref)}" target="_blank" rel="noopener">${esc(e.kind || "evidence")}</a>`
      : esc(e.kind || "evidence");
    const sha = e.sha256 ? `<code class="pm-sha" title="${esc(e.sha256)}">${esc(e.sha256.slice(0, 12))}…</code>` : "";
    return `<div class="pm-evidence">${link} ${sha}${e.description ? `<div class="pm-evidence-desc">${esc(e.description)}</div>` : ""}</div>`;
  }).join("");
}

/* Render a claim value — linkify URLs (website/github/docs/whitepaper claims). */
function valueHtml(v) {
  if (v != null && /^https?:\/\/\S+$/.test(String(v))) {
    return `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(String(v).replace(/^https?:\/\//, ""))}</a>`;
  }
  return esc(v);
}

function claimHtml(c) {
  const pr = c.provenance || {};
  const src = pr.source || {};
  const stateBadge = c.state && c.state !== "active" ? `<span class="pm-claim-state pm-claim-${esc(c.state)}">${esc(c.state)}</span>` : "";
  return `<div class="provenance-grid pm-claim">
    <div class="provenance-cell"><div class="provenance-label">${t("p-value")}</div><div class="provenance-value">${valueHtml(c.value)} ${stateBadge}</div></div>
    <div class="provenance-cell"><div class="provenance-label">${t("p-source")}</div><div class="provenance-value">${esc(src.label || src.source_id || "—")} ${authChip(pr.authority_class)}</div></div>
    <div class="provenance-cell"><div class="provenance-label">${t("p-asserted-by")}</div><div class="provenance-value">${esc(pr.asserted_by || "—")}</div></div>
    <div class="provenance-cell"><div class="provenance-label">${t("p-as-of")}</div><div class="provenance-value">${esc(pr.as_of || "—")}</div></div>
    <div class="provenance-cell pm-evidence-cell"><div class="provenance-label">${t("p-evidence")}</div><div class="provenance-value">${evidenceHtml(pr.evidence)}</div></div>
  </div>`;
}

function renderClaims() {
  const wrap = document.getElementById("p-claims");
  const fields = state.detail.fields || {};
  const keys = Object.keys(fields);
  if (!keys.length) { wrap.innerHTML = `<p class="pm-muted">${t("p-no-claims")}</p>`; return; }
  wrap.innerHTML = keys.map((f) => {
    const claims = fields[f].map(claimHtml).join("");
    return `<div class="pm-field"><div class="pm-field-name">${esc(f)}</div>${claims}</div>`;
  }).join("");
}

function renderCats() {
  const wrap = document.getElementById("p-cats");
  const cats = state.detail.categories || [];
  if (!cats.length) { wrap.innerHTML = `<p class="pm-muted">${t("p-unclassified")}</p>`; return; }
  wrap.innerHTML = cats.map((c) =>
    `<a class="pm-cat-tag" href="categories.html#${esc(c.slug)}">${esc(c.name || c.slug)} ${authChip(c.authority_class)}</a>`).join(" ");
}

function payloadSummary(e) {
  const p = e.payload || {};
  if (e.type === "claim.asserted") return `${esc(p.field)} = ${esc(p.value)} <span class="pm-muted">(${esc(p.source_id || "?")} ${esc(p.authority_class || "")})</span>`;
  if (e.type === "project.imported" || e.type === "project.proposed") return `${esc(p.kind || "")} ${esc(p.id || "")}`;
  if (e.type === "category.assigned") return `${esc(p.category_slug)}`;
  if (e.type === "claim.superseded") return `${esc(p.claim_id)}`;
  if (e.type === "challenge.opened") return esc(p.grounds || "");
  return "";
}

function renderHistory() {
  const wrap = document.getElementById("p-history");
  const ev = state.history || [];
  if (!ev.length) { wrap.innerHTML = `<p class="pm-muted">${t("p-no-history")}</p>`; return; }
  wrap.innerHTML = `<ol class="pm-timeline">` + ev.map((e) =>
    `<li class="pm-tl-item">
      <div class="pm-tl-head"><span class="pm-tl-type">${esc(e.type)}</span><span class="pm-tl-ts">${esc(e.ts)}</span></div>
      <div class="pm-tl-body">${payloadSummary(e)}</div>
      <div class="pm-tl-meta"><span class="pm-muted">${t("p-actor")}: ${esc(e.actor)}</span> · <code class="pm-sha" title="${esc(e.hash)}">${esc((e.hash || "").slice(0, 12))}…</code></div>
    </li>`).join("") + `</ol>`;
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

// P8: coverage scorecard — which sourced link types exist + record depth.
function renderScorecard(evidenceCount) {
  const el = document.getElementById("p-scorecard"); if (!el) return;
  const f = state.detail.fields || {};
  const LINKS = [["website", "WEB"], ["github", "GIT"], ["documentation", "DOCS"], ["whitepaper", "WP"]];
  const chips = LINKS.map(([k, lbl]) => `<span class="p-cov ${(f[k] && f[k].length) ? "on" : "off"}">${lbl}</span>`).join("");
  const hist = (state.history || []).length;
  el.innerHTML = chips + `<span class="p-cov-meta">${hist} ${esc(t("p-events"))} · ${evidenceCount} ${esc(t("p-evidence")).toLowerCase()}</span>`;
}

// P8: related projects — those sharing a category (a sourced relationship, never inferred).
function renderRelated() {
  const el = document.getElementById("p-related"); if (!el) return;
  const slugs = (state.detail.categories || []).map((c) => c.slug);
  const byId = {};
  if (state.catData && slugs.length) {
    (state.catData.categories || []).forEach((c) => {
      if (slugs.indexOf(c.slug) < 0) return;
      (c.members || []).forEach((m) => { if (m.id !== state.detail.id) byId[m.id] = m; });
    });
  }
  const list = Object.keys(byId).map((k) => byId[k]).sort((a, b) => (a.name || "").localeCompare(b.name || "")).slice(0, 12);
  if (!list.length) { el.innerHTML = `<p class="pm-muted">${t("p-no-related")}</p>`; return; }
  el.innerHTML = list.map((m) =>
    `<a class="pm-cat-tag" href="project.html?id=${encodeURIComponent(m.id)}">${esc(m.name || m.id)} ${authChip(m.authority_class)}</a>`).join(" ");
}

function render() {
  if (!state.detail) return;
  const d = state.detail;
  setText("p-name", d.name || d.id);
  setText("p-id", d.id);
  setText("p-stat-kind", d.kind || "—");
  setText("p-stat-status", d.status || (d.unclassified ? t("pm-unclassified") : "—"));
  const claimCount = Object.values(d.fields || {}).reduce((n, a) => n + a.length, 0);
  const evidenceCount = Object.values(d.fields || {}).flat().reduce((n, c) => n + ((c.provenance && c.provenance.evidence) ? c.provenance.evidence.length : 0), 0);
  setText("p-stat-claims", String(claimCount));
  setText("p-stat-evidence", String(evidenceCount));
  renderScorecard(evidenceCount); renderClaims(); renderCats(); renderRelated(); renderHistory();
  document.title = `${d.name || d.id} — Cardano Project Memory`;
}

async function boot() {
  document.addEventListener("cdo-lang", () => render());
  state.id = idFromUrl();
  if (!state.id) { setText("p-name", t("p-not-found")); return; }
  setText("p-id", state.id);
  try {
    const index = await fetchJson(`${PM_ROOT()}/index.json`);
    const row = index.projects.find((p) => p.id === state.id);
    if (!row) { setText("p-name", t("p-not-found")); return; }
    const data = await fetchJson(`${PM_ROOT()}/projects/${row.file}`);
    state.detail = data.project;
    state.history = data.history;
    try { state.catData = await fetchJson(`${PM_ROOT()}/categories.json`); } catch (e) { state.catData = null; }
    render();
    if (location.hash === "#history") document.getElementById("history")?.scrollIntoView();
  } catch (err) {
    console.error("project detail load failed", err);
    setText("p-name", t("p-not-found"));
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

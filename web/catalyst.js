/* Cardano Catalyst Archive — preservation archive view (Discovery Agent H).
 * Read-only. Live API only. NO rankings, NO judgment. Honest about sparseness.
 * Endpoints: GET /archive, GET /funds, GET /fund/{id}. No external libs. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = { archive: null, funds: null, openFund: null };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function fmtNum(n) { return n == null ? "0" : Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US"); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function fmtDate(s) { return s ? esc(String(s).slice(0, 10)) : "—"; }

const PAGE_I18N = {
  en: {
    "cat-title": "Cardano Catalyst Archive",
    "cat-lede": "A preservation archive of Project Catalyst sources and funds. Every capture carries its provenance — source URL, Wayback snapshot, SHA-256, capture date, and source authority class. Read-only. This is not a directory of Catalyst proposals or a ranking: coverage equals what has been preserved, and the archive is deliberately sparse.",
    "cat-coverage-label": "Coverage honesty",
    "cat-h-preservation": "Preservation status",
    "cat-n-preservation": "Each subfolder is a preservation target. Most are registered with zero captures so far — that absence is recorded honestly rather than hidden.",
    "th-cat-name": "Subfolder", "th-cat-auth": "Authority", "th-cat-count": "Artifacts", "th-cat-last": "Last capture", "th-cat-pattern": "Capture pattern",
    "cat-h-funds": "Fund coverage",
    "cat-n-funds": "Funds for which at least one artifact has been captured. Select a fund to load its captures.",
    "th-fund": "Fund", "th-fund-arts": "Artifacts", "th-fund-sess": "Sessions", "th-fund-src": "Sources",
    "cat-h-registry": "Source registry",
    "cat-n-registry": "The registered preservation sources behind the archive, with their authority class and any capture notes.",
    "th-reg-name": "Source", "th-reg-auth": "Authority", "th-reg-index": "Subfolder index", "th-reg-notes": "Notes",
    "cat-foot": "Source: live Catalyst preservation archive via the Cardano Data Layer API. Authority classes: A on-chain · B official · C at-risk platform · D community · E researcher.",
    "cat-m-version": "Archive version", "cat-m-updated": "Last updated", "cat-m-subfolders": "Subfolders", "cat-m-artifacts": "Captured artifacts", "cat-m-funds": "Funds",
    "cat-none-sub": "No subfolders registered.", "cat-none-fund": "No funds captured yet.",
    "cat-dt-title": "Fund {f} captures", "cat-dt-meta": "{a} artifact(s) · {s} session(s)",
    "cat-dt-empty": "No captures recorded for this fund.", "cat-dt-loading": "Loading captures…",
    "cat-dt-close": "Close",
    "th-dt-kind": "Kind", "th-dt-source": "Source", "th-dt-auth": "Authority", "th-dt-url": "Source URL",
    "th-dt-wb": "Wayback", "th-dt-sha": "SHA-256", "th-dt-date": "Capture date",
    "cat-wb-link": "snapshot", "cat-load-error": "Could not load the Catalyst archive.",
    "cat-fund-error": "Could not load this fund.", "cat-no-pattern": "—",
  },
  ja: {
    "cat-title": "Cardano Catalyst アーカイブ",
    "cat-lede": "Project Catalyst の出典とファンドの保存アーカイブです。各キャプチャには来歴（出典URL・Wayback スナップショット・SHA-256・取得日・出典権威クラス）が付随します。読み取り専用。これは Catalyst 提案の一覧やランキングではありません。カバレッジは保存済みのものに等しく、アーカイブは意図的に疎です。",
    "cat-coverage-label": "カバレッジの正直さ",
    "cat-h-preservation": "保存状況",
    "cat-n-preservation": "各サブフォルダは保存対象です。現時点では大半がキャプチャ0件として登録されています。その不在は隠さず正直に記録します。",
    "th-cat-name": "サブフォルダ", "th-cat-auth": "権威", "th-cat-count": "成果物", "th-cat-last": "最終取得", "th-cat-pattern": "取得パターン",
    "cat-h-funds": "ファンドのカバレッジ",
    "cat-n-funds": "成果物が1件以上キャプチャされたファンドです。ファンドを選択するとキャプチャを読み込みます。",
    "th-fund": "ファンド", "th-fund-arts": "成果物", "th-fund-sess": "セッション", "th-fund-src": "出典",
    "cat-h-registry": "出典レジストリ",
    "cat-n-registry": "アーカイブを支える登録済み保存出典です。権威クラスと取得に関する注記を示します。",
    "th-reg-name": "出典", "th-reg-auth": "権威", "th-reg-index": "サブフォルダ索引", "th-reg-notes": "注記",
    "cat-foot": "出典: Cardano データレイヤー API 経由のライブ Catalyst 保存アーカイブ。権威クラス: A オンチェーン・B 公式・C 消失リスクのあるプラットフォーム・D コミュニティ・E 研究者。",
    "cat-m-version": "アーカイブ版", "cat-m-updated": "最終更新", "cat-m-subfolders": "サブフォルダ", "cat-m-artifacts": "取得済み成果物", "cat-m-funds": "ファンド",
    "cat-none-sub": "登録されたサブフォルダはありません。", "cat-none-fund": "キャプチャ済みのファンドはまだありません。",
    "cat-dt-title": "ファンド {f} のキャプチャ", "cat-dt-meta": "成果物 {a} 件 · セッション {s} 件",
    "cat-dt-empty": "このファンドに記録されたキャプチャはありません。", "cat-dt-loading": "キャプチャを読み込み中…",
    "cat-dt-close": "閉じる",
    "th-dt-kind": "種別", "th-dt-source": "出典", "th-dt-auth": "権威", "th-dt-url": "出典URL",
    "th-dt-wb": "Wayback", "th-dt-sha": "SHA-256", "th-dt-date": "取得日",
    "cat-wb-link": "スナップショット", "cat-load-error": "Catalyst アーカイブを読み込めませんでした。",
    "cat-fund-error": "このファンドを読み込めませんでした。", "cat-no-pattern": "—",
  },
};
if (typeof i18n !== "undefined") {
  Object.assign(i18n.en, PAGE_I18N.en);
  Object.assign(i18n.ja, PAGE_I18N.ja);
  if (typeof setLang === "function") setLang(currentLang());
}

async function fetchJson(path) {
  const res = await fetch(API + path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

function authChip(cls) {
  if (!cls) return "—";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}

/* The live archive describes a subfolder's capture pattern via its `notes`
 * (e.g. Wayback-only, git mirror, query specs). Surface honestly, no fabrication. */
function capturePattern(meta) {
  if (meta.capture_pattern) return esc(meta.capture_pattern);
  if (meta.notes) return `<span class="cat-notes">${esc(meta.notes)}</span>`;
  return t("cat-no-pattern");
}

function renderCoverage() {
  const note = document.getElementById("cat-coverage-note");
  if (note) note.textContent = (state.archive && state.archive.coverage_note) || "";
}

function renderMeta() {
  const el = document.getElementById("cat-meta");
  if (!el || !state.archive) return;
  const a = state.archive;
  const subs = a.subfolders || {};
  const subCount = Object.keys(subs).length;
  const artifactTotal = Object.values(subs).reduce((s, m) => s + (Number(m.artifact_count) || 0), 0);
  const fundCount = state.funds ? (state.funds.total_funds != null ? state.funds.total_funds : (state.funds.funds || []).length) : 0;
  el.innerHTML = [
    `<span class="meta-item"><span class="meta-label">${t("cat-m-version")}</span> ${esc(a.archive_version || "—")}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("cat-m-updated")}</span> ${fmtDate(a.last_updated)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("cat-m-subfolders")}</span> ${fmtNum(subCount)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("cat-m-artifacts")}</span> ${fmtNum(artifactTotal)}</span>`,
    `<span class="meta-item"><span class="meta-label">${t("cat-m-funds")}</span> ${fmtNum(fundCount)}</span>`,
  ].join("");
}

function subfolderEntries() {
  const subs = (state.archive && state.archive.subfolders) || {};
  return Object.keys(subs).map((name) => [name, subs[name]]);
}

function renderSubfolders() {
  const tbody = document.getElementById("cat-sub-tbody");
  if (!tbody) return;
  const rows = subfolderEntries();
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="5" class="loading">${t("cat-none-sub")}</td></tr>`; return; }
  tbody.innerHTML = rows.map(([name, m]) => {
    const zero = !(Number(m.artifact_count) > 0);
    return `<tr class="${zero ? "cat-zero" : ""}">
      <td><span class="cat-mono">${esc(name)}</span></td>
      <td>${authChip(m.source_authority_class)}</td>
      <td>${fmtNum(m.artifact_count)}</td>
      <td>${fmtDate(m.last_capture_date)}</td>
      <td>${capturePattern(m)}</td>
    </tr>`;
  }).join("");
}

function renderFunds() {
  const tbody = document.getElementById("cat-fund-tbody");
  if (!tbody) return;
  const funds = (state.funds && state.funds.funds) || [];
  if (!funds.length) { tbody.innerHTML = `<tr><td colspan="4" class="loading">${t("cat-none-fund")}</td></tr>`; return; }
  tbody.innerHTML = funds.map((f) => {
    const id = f.fund;
    const label = f.fund_label || ("F" + id);
    const sources = Array.isArray(f.sources) ? f.sources.join(", ") : "—";
    return `<tr>
      <td><button type="button" class="cat-fund-link" data-fund="${esc(id)}">${esc(label)}</button></td>
      <td>${fmtNum(f.artifact_count)}</td>
      <td>${fmtNum(f.session_count)}</td>
      <td><span class="cat-mono">${esc(sources)}</span></td>
    </tr>`;
  }).join("");
  tbody.querySelectorAll(".cat-fund-link").forEach((btn) => {
    btn.addEventListener("click", () => openFund(btn.getAttribute("data-fund")));
  });
}

function renderRegistry() {
  const tbody = document.getElementById("cat-reg-tbody");
  if (!tbody) return;
  const rows = subfolderEntries();
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="4" class="loading">${t("cat-none-sub")}</td></tr>`; return; }
  tbody.innerHTML = rows.map(([name, m]) => `<tr>
      <td><span class="cat-mono">${esc(name)}</span></td>
      <td>${authChip(m.source_authority_class)}</td>
      <td><span class="cat-mono">${esc(m.subfolder_index || "—")}</span></td>
      <td>${m.notes ? `<span class="cat-notes">${esc(m.notes)}</span>` : "—"}</td>
    </tr>`).join("");
}

function renderQuality() {
  const el = document.getElementById("cat-quality");
  if (!el) return;
  const q = (state.archive && state.archive._quality) || null;
  if (!q) { el.textContent = ""; return; }
  el.textContent = `_quality: source ${q.source || "—"} · authority ${q.authority_class || "—"} · confidence ${q.confidence || "—"} · ${q.provenance || ""}`;
}

function captureRow(c) {
  const wb = c.wayback_url
    ? `<a href="${esc(c.wayback_url)}" target="_blank" rel="noopener">${t("cat-wb-link")}</a>`
    : "—";
  const url = c.source_url
    ? `<a class="cat-mono" href="${esc(c.source_url)}" target="_blank" rel="noopener">${esc(c.source_url)}</a>`
    : "—";
  return `<tr>
    <td><span class="cat-kind">${esc(c.kind || "—")}</span></td>
    <td><span class="cat-mono">${esc(c.source || "—")}</span></td>
    <td>${authChip(c.authority_class)}</td>
    <td>${url}</td>
    <td>${wb}</td>
    <td><span class="cat-mono">${esc(c.sha256 || "—")}</span></td>
    <td>${fmtDate(c.capture_date)}</td>
  </tr>`;
}

function renderDetail() {
  const host = document.getElementById("cat-fund-detail");
  if (!host) return;
  const d = state.openFund;
  if (!d) { host.innerHTML = ""; return; }

  const closeBtn = `<button type="button" class="cat-close" id="cat-detail-close">${t("cat-dt-close")}</button>`;
  const title = t("cat-dt-title").replace("{f}", esc(d.label || d.id));

  if (d.loading) {
    host.innerHTML = `<div class="cat-detail">${closeBtn}<h3>${title}</h3><p class="cat-detail-empty">${t("cat-dt-loading")}</p></div>`;
  } else if (d.error) {
    host.innerHTML = `<div class="cat-detail">${closeBtn}<h3>${title}</h3><p class="cat-detail-empty">${t("cat-fund-error")}</p></div>`;
  } else {
    const data = d.data || {};
    const caps = Array.isArray(data.captures) ? data.captures : [];
    const meta = t("cat-dt-meta").replace("{a}", fmtNum(data.artifact_count)).replace("{s}", fmtNum(data.session_count));
    let body;
    if (!caps.length) {
      body = `<p class="cat-detail-empty">${t("cat-dt-empty")}</p>`;
    } else {
      body = `<div class="table-scroll"><table class="vote-table">
        <thead><tr>
          <th>${t("th-dt-kind")}</th><th>${t("th-dt-source")}</th><th>${t("th-dt-auth")}</th>
          <th>${t("th-dt-url")}</th><th>${t("th-dt-wb")}</th><th>${t("th-dt-sha")}</th><th>${t("th-dt-date")}</th>
        </tr></thead>
        <tbody>${caps.map(captureRow).join("")}</tbody>
      </table></div>`;
    }
    host.innerHTML = `<div class="cat-detail">${closeBtn}<h3>${title}</h3><p class="cat-detail-meta">${meta}</p>${body}</div>`;
  }
  const cb = document.getElementById("cat-detail-close");
  if (cb) cb.addEventListener("click", () => { state.openFund = null; renderDetail(); });
}

async function openFund(id) {
  const funds = (state.funds && state.funds.funds) || [];
  const f = funds.find((x) => String(x.fund) === String(id));
  const label = f ? (f.fund_label || ("F" + id)) : ("F" + id);
  state.openFund = { id, label, loading: true };
  renderDetail();
  try {
    const data = await fetchJson(`/fund/${encodeURIComponent(id)}`);
    if (state.openFund && String(state.openFund.id) === String(id)) {
      state.openFund = { id, label, data };
      renderDetail();
    }
  } catch (err) {
    console.error("fund load failed", err);
    if (state.openFund && String(state.openFund.id) === String(id)) {
      state.openFund = { id, label, error: true };
      renderDetail();
    }
  }
}

function render() {
  renderCoverage();
  renderMeta();
  renderSubfolders();
  renderFunds();
  renderRegistry();
  renderQuality();
  renderDetail();
}

function showLoadError() {
  const cov = document.getElementById("cat-coverage-note");
  if (cov) cov.textContent = t("cat-load-error");
  const sub = document.getElementById("cat-sub-tbody");
  if (sub) sub.innerHTML = `<tr><td colspan="5" class="loading">${t("cat-load-error")}</td></tr>`;
  const fnd = document.getElementById("cat-fund-tbody");
  if (fnd) fnd.innerHTML = `<tr><td colspan="4" class="loading">${t("cat-load-error")}</td></tr>`;
  const reg = document.getElementById("cat-reg-tbody");
  if (reg) reg.innerHTML = `<tr><td colspan="4" class="loading">${t("cat-load-error")}</td></tr>`;
}

async function boot() {
  document.addEventListener("cdo-lang", () => render());
  try {
    const [archive, funds] = await Promise.all([fetchJson("/archive"), fetchJson("/funds")]);
    state.archive = archive;
    state.funds = funds;
    render();
  } catch (err) {
    console.error("catalyst archive load failed", err);
    showLoadError();
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

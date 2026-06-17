/* Governance change feed — DRep movement between daily snapshots.
 * Reads ${DATA_ROOT}/changes.json (top-30 DReps only; no wallet-level data).
 * Movement only — never inference of cause or intent, never fabricated rows.
 * Windows (1d/7d/30d/90d) re-render from cached JSON; empty/unavailable
 * windows render honest empty states. */

"use strict";

const DATA_ROOT_DEFAULT = "/data/snapshots";
function DATA_ROOT() {
  if (typeof window !== "undefined" && window.dataRoot) return window.dataRoot();
  const p = new URLSearchParams(location.search);
  return p.get("data") || p.get("api") || DATA_ROOT_DEFAULT;
}
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };
const WINDOWS = ["1d", "7d", "30d", "90d"];

const state = { data: null, error: false, window: "1d" };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function fmtInt(n) {
  if (n == null || !isFinite(n)) return "—";
  return Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
}
/* Signed integer (thousands-separated): "+1,234" / "−1,234" / "0". */
function fmtSigned(n) {
  if (n == null || !isFinite(n)) return "—";
  const v = Number(n);
  const abs = Math.abs(v).toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
  if (v > 0) return "+" + abs;
  if (v < 0) return "−" + abs;
  return "0";
}
function deltaClass(n) {
  if (n == null || !isFinite(n) || Number(n) === 0) return "delta-zero";
  return Number(n) > 0 ? "delta-pos" : "delta-neg";
}
function shortId(id) { return id ? id.slice(0, 12) + "…" + id.slice(-4) : "—"; }
function drepName(r) { return (r && r.name && String(r.name).trim()) ? r.name : shortId(r && r.drep_id); }
function drepLink(r) {
  const name = esc(drepName(r));
  if (!r || !r.drep_id) return name;
  return `<a href="drep.html?id=${encodeURIComponent(r.drep_id)}">${name}</a>`;
}

/* Page-local i18n, merged into the global dict then applied. */
const PAGE_I18N = {
  en: {
    "h-nav-changes": "Changes",
    "ch-title": "Governance change feed",
    "ch-lede": "What changed — movement only, measured between daily snapshots. No inference.",
    "ch-ha-snapshot": "Snapshot",
    "ch-ha-source": "Koios (daily snapshot)",
    "tab-1d": "24h", "tab-7d": "7d", "tab-30d": "30d", "tab-90d": "90d",
    "ch-unavailable": "No snapshot this far back yet — this window fills in as history accumulates.",
    "ch-m-gainers": "Gainers", "ch-m-losers": "Losers", "ch-m-growth": "Delegator growth",
    "ch-m-entrants": "Entrants", "ch-m-exits": "Exits",
    "ch-m-gainers-sub": "weight up", "ch-m-losers-sub": "weight down", "ch-m-growth-sub": "more delegators",
    "ch-m-entrants-sub": "entered Top 30", "ch-m-exits-sub": "left Top 30",
    "ch-sec-gains": "Top gains", "ch-sec-losses": "Top losses",
    "ch-sec-grow": "Largest delegator growth", "ch-sec-decline": "Largest delegator decline",
    "ch-sec-entrants": "New entrants (entered Top 30)", "ch-sec-exits": "Exited Top 30",
    "ch-empty": "No recorded changes in this window yet.",
    "ch-dele-label": "delegators", "ch-as-of": "as of",
    "ch-feed-head": "Live feed",
    "th-ch-date": "Date", "th-ch-drep": "DRep",
    "th-ch-weight": "Δ Voting weight (ADA)", "th-ch-dele": "Δ Delegators",
    "ch-feed-empty": "No recorded changes yet.",
    "ch-load-error": "Couldn't load the change feed (changes.json).",
    "ch-foot": "Movement only — no inference of cause or intent. Top-30 DReps only; no wallet-level data. Source: Koios daily snapshots (observatory CC0 export).",
    "ch-foot-dl": "Downloads:",
  },
  ja: {
    "h-nav-changes": "変化",
    "ch-title": "ガバナンス変化フィード",
    "ch-lede": "何が変わったか — 動きのみ。日次スナップショット間の差分。推測はしません。",
    "ch-ha-snapshot": "スナップショット",
    "ch-ha-source": "Koios（日次スナップショット）",
    "tab-1d": "24時間", "tab-7d": "7日", "tab-30d": "30日", "tab-90d": "90日",
    "ch-unavailable": "この期間まで遡るスナップショットはまだありません — 履歴が蓄積されるにつれて埋まります。",
    "ch-m-gainers": "増加", "ch-m-losers": "減少", "ch-m-growth": "委任者増加",
    "ch-m-entrants": "新規参入", "ch-m-exits": "離脱",
    "ch-m-gainers-sub": "投票力が増加", "ch-m-losers-sub": "投票力が減少", "ch-m-growth-sub": "委任者が増加",
    "ch-m-entrants-sub": "上位30入り", "ch-m-exits-sub": "上位30から退出",
    "ch-sec-gains": "増加上位", "ch-sec-losses": "減少上位",
    "ch-sec-grow": "委任者増加が最大", "ch-sec-decline": "委任者減少が最大",
    "ch-sec-entrants": "新規参入（上位30入り）", "ch-sec-exits": "上位30から退出",
    "ch-empty": "この期間に記録された変化はまだありません。",
    "ch-dele-label": "委任者", "ch-as-of": "基準日",
    "ch-feed-head": "ライブフィード",
    "th-ch-date": "日付", "th-ch-drep": "DRep",
    "th-ch-weight": "Δ 投票力 (ADA)", "th-ch-dele": "Δ 委任者",
    "ch-feed-empty": "記録された変化はまだありません。",
    "ch-load-error": "変化フィード（changes.json）を読み込めませんでした。",
    "ch-foot": "動きのみ — 原因や意図の推測はしません。上位30のDRepのみ。ウォレット単位のデータはありません。出典: Koios 日次スナップショット（observatory CC0エクスポート）。",
    "ch-foot-dl": "ダウンロード:",
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

/* Small inline icon set (stroke, currentColor). */
const ICON = {
  gainers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  losers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
  growth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
  entrants: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
  exits: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
};

function renderHeroAside() {
  const el = document.getElementById("ch-hero-aside");
  if (!el) return;
  const d = state.data;
  if (!d) { el.innerHTML = ""; return; }
  const epochTxt = d.epoch != null ? `Epoch ${esc(String(d.epoch))}` : "";
  el.innerHTML =
    `<div class="ha-label">${esc(t("ch-ha-snapshot"))}</div>` +
    `<div class="ha-value">${esc(d.snapshot_date || "—")}${epochTxt ? `<span style="font-weight:500;color:var(--muted)"> · ${epochTxt}</span>` : ""}</div>` +
    `<div class="ha-sub">${esc(t("ch-ha-source"))} <span class="auth-chip auth-A" title="On-chain">A</span></div>`;
}

function metricCard(icon, value, label, sub) {
  return `<div class="metric-card">
    <div class="mc-icon">${icon}</div>
    <div class="mc-value">${esc(value)}</div>
    <div class="mc-label">${esc(label)}</div>
    <div class="mc-sub">${esc(sub)}</div>
  </div>`;
}

function renderMetrics(w) {
  const el = document.getElementById("ch-metrics");
  if (!el) return;
  if (!w) { el.innerHTML = ""; return; }
  const n = (a) => Array.isArray(a) ? a.length : 0;
  el.innerHTML = [
    metricCard(ICON.gainers, fmtInt(n(w.gainers)), t("ch-m-gainers"), t("ch-m-gainers-sub")),
    metricCard(ICON.losers, fmtInt(n(w.losers)), t("ch-m-losers"), t("ch-m-losers-sub")),
    metricCard(ICON.growth, fmtInt(n(w.delegator_growth)), t("ch-m-growth"), t("ch-m-growth-sub")),
    metricCard(ICON.entrants, fmtInt(n(w.entrants)), t("ch-m-entrants"), t("ch-m-entrants-sub")),
    metricCard(ICON.exits, fmtInt(n(w.exits)), t("ch-m-exits"), t("ch-m-exits-sub")),
  ].join("");
}

/* A movement row: name + id + reference date, with signed ADA / delegator deltas. */
function movementRow(r, opts) {
  opts = opts || {};
  const id = esc(r.drep_id || "");
  const refDate = r.reference_date ? `<div class="ch-row-when">${esc(t("ch-as-of"))} ${esc(r.reference_date)}</div>` : "";
  let deltas = "";
  if (opts.showWeight) {
    const ada = `<div class="ch-delta-ada ${deltaClass(r.weight_delta_ada)}">${esc(fmtSigned(r.weight_delta_ada))} ₳</div>`;
    const dele = (r.delegator_delta != null)
      ? `<div class="ch-delta-dele ${deltaClass(r.delegator_delta)}">${esc(fmtSigned(r.delegator_delta))} ${esc(t("ch-dele-label"))}</div>` : "";
    deltas = `<div class="ch-row-deltas">${ada}${dele}</div>`;
  } else if (opts.showDelegator) {
    const dele = `<div class="ch-delta-ada ${deltaClass(r.delegator_delta)}">${esc(fmtSigned(r.delegator_delta))} ${esc(t("ch-dele-label"))}</div>`;
    deltas = `<div class="ch-row-deltas">${dele}</div>`;
  } else if (opts.showWeightAbs) {
    const v = r.current_weight_ada;
    deltas = (v != null) ? `<div class="ch-row-deltas"><div class="ch-delta-ada">${esc(fmtInt(v))} ₳</div></div>` : "";
  }
  return `<div class="ch-row">
    <div class="ch-row-main">
      <div class="ch-row-name">${drepLink(r)}</div>
      <div class="ch-row-sub">${id}</div>
      ${refDate}
    </div>
    ${deltas}
  </div>`;
}

function sectionBlock(titleKey, rows, opts) {
  const head = `<h2 class="ch-section-head">${esc(t(titleKey))}</h2>`;
  let body;
  if (!rows || !rows.length) {
    body = `<div class="ch-card"><div class="rank-empty">${esc(t("ch-empty"))}</div></div>`;
  } else {
    body = `<div class="ch-card">${rows.map((r) => movementRow(r, opts)).join("")}</div>`;
  }
  return `<section class="ch-section">${head}${body}</section>`;
}

function renderSections(w) {
  const el = document.getElementById("ch-sections");
  if (!el) return;
  if (!w) { el.innerHTML = ""; return; }
  el.innerHTML = [
    sectionBlock("ch-sec-gains", w.gainers, { showWeight: true }),
    sectionBlock("ch-sec-losses", w.losers, { showWeight: true }),
    sectionBlock("ch-sec-grow", w.delegator_growth, { showDelegator: true }),
    sectionBlock("ch-sec-decline", w.delegator_decline, { showDelegator: true }),
    sectionBlock("ch-sec-entrants", w.entrants, { showWeightAbs: true }),
    sectionBlock("ch-sec-exits", w.exits, {}),
  ].join("");
}

function renderFeed() {
  const tbody = document.getElementById("ch-feed-tbody");
  if (!tbody) return;
  const recent = (state.data && Array.isArray(state.data.recent)) ? state.data.recent : [];
  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="rank-empty">${esc(t("ch-feed-empty"))}</td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map((r) => {
    const name = drepLink(r);
    return `<tr>
      <td>${esc(r.date || "—")}</td>
      <td class="rt-token-cell">${name}<div class="ch-row-sub">${esc(r.drep_id || "")}</div></td>
      <td class="rt-num"><span class="${deltaClass(r.weight_delta_ada)}">${esc(fmtSigned(r.weight_delta_ada))}</span></td>
      <td class="rt-num"><span class="${deltaClass(r.delegator_delta)}">${esc(fmtSigned(r.delegator_delta))}</span></td>
    </tr>`;
  }).join("");
}

function renderFoot() {
  const el = document.getElementById("ch-foot");
  if (!el) return;
  const root = DATA_ROOT();
  const files = ["changes.json", "top_gainers.json", "top_losers.json", "top_delegator_growth.json"];
  const links = files.map((f) =>
    `<a href="${esc(root)}/${f}" download>${esc(f)}</a>`).join(" · ");
  el.innerHTML = `${esc(t("ch-foot"))}<span class="ch-foot-dl"><br>${esc(t("ch-foot-dl"))} ${links}</span>`;
}

function renderActiveTab() {
  document.querySelectorAll("#ch-tabs button").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-win") === state.window);
  });
}

function renderHeaders() {
  const set = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
  set("th-ch-date", "th-ch-date");
  set("th-ch-drep", "th-ch-drep");
  set("th-ch-weight", "th-ch-weight");
  set("th-ch-dele", "th-ch-dele");
  set("ch-feed-head", "ch-feed-head");
  document.querySelectorAll("#ch-tabs button").forEach((b) => {
    b.textContent = t("tab-" + b.getAttribute("data-win"));
  });
}

/* Re-render everything from cached JSON for the current window/lang. */
function renderCurrent() {
  renderActiveTab();
  renderHeaders();
  renderHeroAside();
  renderFoot();

  if (state.error) {
    const tbody = document.getElementById("ch-feed-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="rank-empty">${esc(t("ch-load-error"))}</td></tr>`;
    renderMetrics(null);
    renderSections(null);
    const notice = document.getElementById("ch-window-notice");
    if (notice) notice.style.display = "none";
    return;
  }

  const w = state.data && state.data.windows ? state.data.windows[state.window] : null;
  const notice = document.getElementById("ch-window-notice");
  if (notice) {
    if (w && w.available === false) {
      notice.style.display = "";
      notice.textContent = t("ch-unavailable");
    } else {
      notice.style.display = "none";
    }
  }
  renderMetrics(w);
  renderSections(w);
  renderFeed();
}

function selectWindow(win) {
  if (!WINDOWS.includes(win)) return;
  state.window = win;
  renderCurrent();
}

function wireTabs() {
  document.querySelectorAll("#ch-tabs button").forEach((b) => {
    b.addEventListener("click", () => selectWindow(b.getAttribute("data-win")));
  });
}

async function boot() {
  document.addEventListener("cdo-lang", () => { renderCurrent(); });
  wireTabs();
  renderHeaders();
  try {
    state.data = await fetchJson(`${DATA_ROOT()}/changes.json`);
    state.error = false;
  } catch (err) {
    console.error("changes load failed", err);
    state.error = true;
    state.data = null;
  }
  renderCurrent();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

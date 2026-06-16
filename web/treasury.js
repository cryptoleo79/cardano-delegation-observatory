/* Cardano Treasury — public treasury observability page (Discovery Agent G).
 * Read-only. Fetches GET /treasury from the live Data Layer API and renders
 * stat cards (latest treasury / reserves / supply / snapshot), a treasury-
 * balance-over-epochs line chart (CDLChart.line; table fallback), and a
 * treasury-withdrawals table. No interpretation, no judgment. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = { data: null };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) { const l = currentLang(); return (i18n[l] && i18n[l][key]) || (i18n.en[key] || key); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/* Lovelace -> ADA with thousands separators, no fractional ada (treasury sums
 * are huge; whole-ada is the honest granularity). */
function adaFromLovelace(lovelace) {
  if (lovelace == null || lovelace === "") return null;
  return Number(lovelace) / 1e6;
}
function fmtAda(lovelace) {
  const ada = adaFromLovelace(lovelace);
  if (ada == null || !isFinite(ada)) return "—";
  return "₳" + Math.round(ada).toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
}
function fmtInt(n) {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
}

/* Page-local i18n, merged into the global dict then applied (avoids editing the
 * shared i18n.js for page-specific strings). */
const PAGE_I18N = {
  en: {
    "tr-title": "Cardano Treasury",
    "tr-lede": "The on-chain Cardano treasury balance, reserves, and total supply observed across epochs, with the record of treasury-withdrawal governance actions. Read-only; values are derived from the chain and carry their provenance. No interpretation.",
    "tr-chart-title": "Treasury balance over epochs",
    "tr-chart-note": "Treasury balance (ADA) per epoch.",
    "tr-w-title": "Treasury withdrawals",
    "tr-w-note": "Treasury-withdrawal governance actions and their outcome.",
    "th-tr-action": "Action ID", "th-tr-recipient": "Recipient", "th-tr-amount": "Amount", "th-tr-epoch": "Enacted epoch", "th-tr-outcome": "Outcome",
    "tr-hero-updated": "Last updated",
    "tr-m-treasury": "Treasury balance", "tr-m-reserves": "Reserves", "tr-m-supply": "Total supply",
    "tr-m-epochs": "Epochs tracked", "tr-m-withdrawals": "Withdrawals",
    "tr-m-treasury-sub": "current on-chain treasury", "tr-m-reserves-sub": "monetary reserves",
    "tr-m-supply-sub": "total ADA supply", "tr-m-epochs-sub": "epochs observed",
    "tr-m-withdrawals-sub": "withdrawal actions recorded",
    "tr-sub-epoch": "epoch",
    "tr-w-none": "No withdrawals recorded.", "tr-w-unavailable": "Withdrawals not available.",
    "tr-chart-fallback": "Recent epochs", "tr-chart-empty": "No epoch data.",
    "tr-load-error": "Could not load treasury data.",
    "tr-th-fb-epoch": "Epoch", "tr-th-fb-balance": "Treasury balance",
  },
  ja: {
    "tr-title": "Cardano トレジャリー",
    "tr-lede": "オンチェーンの Cardano トレジャリー残高・リザーブ・総供給量をエポックごとに観測し、トレジャリー引出しのガバナンスアクションの記録を併記します。読み取り専用。値はチェーン由来で来歴を伴います。解釈は行いません。",
    "tr-chart-title": "エポックごとのトレジャリー残高",
    "tr-chart-note": "エポックごとのトレジャリー残高（ADA）。",
    "tr-w-title": "トレジャリー引出し",
    "tr-w-note": "トレジャリー引出しのガバナンスアクションとその結果。",
    "th-tr-action": "アクション ID", "th-tr-recipient": "受取人", "th-tr-amount": "金額", "th-tr-epoch": "施行エポック", "th-tr-outcome": "結果",
    "tr-hero-updated": "最終更新",
    "tr-m-treasury": "トレジャリー残高", "tr-m-reserves": "リザーブ", "tr-m-supply": "総供給量",
    "tr-m-epochs": "対象エポック数", "tr-m-withdrawals": "引出し件数",
    "tr-m-treasury-sub": "現在のオンチェーン残高", "tr-m-reserves-sub": "通貨リザーブ",
    "tr-m-supply-sub": "ADA 総供給量", "tr-m-epochs-sub": "観測エポック数",
    "tr-m-withdrawals-sub": "記録された引出しアクション",
    "tr-sub-epoch": "エポック",
    "tr-w-none": "記録された引出しはありません。", "tr-w-unavailable": "引出しデータは利用できません。",
    "tr-chart-fallback": "直近のエポック", "tr-chart-empty": "エポックデータがありません。",
    "tr-load-error": "トレジャリーデータを読み込めませんでした。",
    "tr-th-fb-epoch": "エポック", "tr-th-fb-balance": "トレジャリー残高",
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
  treasury: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  reserves: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  supply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  epochs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  withdrawals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
};

function authChip(cls) {
  if (!cls) return "";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return ` <span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}

function epochList() {
  const e = state.data && state.data.epochs;
  return Array.isArray(e) ? e : [];
}
function withdrawalList() {
  const w = state.data && state.data.withdrawals;
  if (Array.isArray(w)) return w;                 // shape may be a bare array
  if (w && Array.isArray(w.items)) return w.items; // or {available,count,items}
  return [];
}
function withdrawalsAvailable() {
  const w = state.data && state.data.withdrawals;
  if (Array.isArray(w)) return true;
  if (w && typeof w === "object") return w.available !== false;
  return false;
}

/* ---- hero aside: last-updated / source provenance card ---- */
function renderHeroAside() {
  const el = document.getElementById("tr-hero-aside");
  if (!el) return;
  const d = state.data;
  const q = (d && d._quality) || {};
  const asOf = q.as_of || (d && d.snapshot_date);
  const asOfTxt = asOf
    ? (String(asOf).length > 10 ? new Date(asOf).toLocaleString(NUM_LOCALE[currentLang()] || "en-US") : String(asOf))
    : "—";
  const src = q.source || (d && d.source) || "—";
  el.innerHTML =
    `<div class="ha-label">${esc(t("tr-hero-updated"))}</div>` +
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

/* ---- metric cards (consolidated headline stats) ---- */
function renderMetrics() {
  const el = document.getElementById("tr-metrics");
  if (!el) return;
  const d = state.data;
  if (!d) { el.innerHTML = ""; return; }
  const epochs = epochList();
  const latest = d.latest || (epochs.length ? epochs[epochs.length - 1] : {}) || {};
  const epochSub = latest.epoch_no != null ? `${t("tr-sub-epoch")} ${fmtInt(latest.epoch_no)}` : t("tr-m-treasury-sub");
  const nEpochs = d.n_epochs != null ? d.n_epochs : epochs.length;
  el.innerHTML = [
    metricCard(ICON.treasury, fmtAda(latest.treasury_lovelace), false, t("tr-m-treasury"), epochSub),
    metricCard(ICON.reserves, fmtAda(latest.reserves_lovelace), false, t("tr-m-reserves"), epochSub),
    metricCard(ICON.supply, fmtAda(latest.supply_lovelace), false, t("tr-m-supply"), epochSub),
    metricCard(ICON.epochs, fmtInt(nEpochs), false, t("tr-m-epochs"), t("tr-m-epochs-sub")),
    metricCard(ICON.withdrawals, fmtInt(withdrawalList().length), false, t("tr-m-withdrawals"), t("tr-m-withdrawals-sub")),
  ].join("");
}

/* ---- balance-over-epochs chart (CDLChart.line) or table fallback ---- */
function renderChart() {
  const el = document.getElementById("tr-chart");
  if (!el) return;
  const epochs = epochList();
  const note = document.getElementById("tr-chart-note");
  if (note) note.textContent = t("tr-chart-note");

  if (!epochs.length) {
    el.className = "tr-chart-empty";
    el.textContent = t("tr-chart-empty");
    return;
  }

  if (window.CDLChart && typeof CDLChart.line === "function") {
    el.className = "";
    el.textContent = "";
    const points = epochs.map((e) => ({ t: e.epoch_no, v: adaFromLovelace(e.treasury_lovelace) }));
    try {
      CDLChart.line(el, points, {
        height: 260,
        valueFormat: (v) => "₳" + Math.round(v).toLocaleString(NUM_LOCALE[currentLang()] || "en-US"),
        title: t("tr-chart-title"),
      });
      return;
    } catch (err) {
      console.error("CDLChart.line failed, using fallback", err);
    }
  }

  // Fallback: small recent-epochs table.
  el.className = "";
  const recent = epochs.slice(-12).reverse();
  el.innerHTML = `<div class="table-scroll"><table class="vote-table">
    <thead><tr><th>${t("tr-th-fb-epoch")}</th><th style="text-align:right">${t("tr-th-fb-balance")}</th></tr></thead>
    <tbody>${recent.map((e) => `<tr><td>${fmtInt(e.epoch_no)}</td><td class="tr-amount">${fmtAda(e.treasury_lovelace)}</td></tr>`).join("")}</tbody>
  </table></div>`;
}

/* ---- withdrawals table ---- */
function outcomeBadge(o) {
  if (!o) return "—";
  const known = ["enacted", "ratified", "active", "expired", "dropped"];
  const cls = known.includes(o) ? `tr-outcome-${o}` : "";
  return `<span class="tr-outcome ${cls}">${esc(o)}</span>`;
}

function renderWithdrawals() {
  const tbody = document.getElementById("tr-w-tbody");
  if (!tbody) return;
  const note = document.getElementById("tr-w-note");
  if (note) note.textContent = t("tr-w-note");

  if (!withdrawalsAvailable()) {
    tbody.innerHTML = `<tr><td colspan="5" class="rank-empty">${t("tr-w-unavailable")}</td></tr>`;
    return;
  }
  const rows = withdrawalList();
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="rank-empty">${t("tr-w-none")}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((w) => `<tr>
    <td><div class="tr-id">${esc(w.action_id || "—")}</div></td>
    <td><div class="tr-addr">${esc(w.recipient_stake_address || "—")}</div></td>
    <td class="tr-amount">${fmtAda(w.amount_lovelace)}</td>
    <td>${w.enacted_epoch != null ? fmtInt(w.enacted_epoch) : "—"}</td>
    <td>${outcomeBadge(w.outcome)}</td>
  </tr>`).join("");
}

function render() {
  if (!state.data) return;
  renderHeroAside();
  renderMetrics();
  renderChart();
  renderWithdrawals();
}

async function boot() {
  document.addEventListener("cdo-lang", () => render());
  try {
    state.data = await fetchJson(`${API}/treasury`);
    render();
  } catch (err) {
    console.error("treasury load failed", err);
    const tbody = document.getElementById("tr-w-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="rank-empty">${t("tr-load-error")}</td></tr>`;
    const chart = document.getElementById("tr-chart");
    if (chart) { chart.className = "tr-chart-empty"; chart.textContent = t("tr-load-error"); }
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

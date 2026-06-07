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
    "tr-s-treasury": "Treasury balance", "tr-s-reserves": "Reserves", "tr-s-supply": "Total supply", "tr-s-snapshot": "Snapshot",
    "tr-chart-title": "Treasury balance over epochs",
    "tr-chart-note": "Treasury balance (ADA) per epoch.",
    "tr-w-title": "Treasury withdrawals",
    "tr-w-note": "Treasury-withdrawal governance actions and their outcome.",
    "th-tr-action": "Action ID", "th-tr-recipient": "Recipient", "th-tr-amount": "Amount", "th-tr-epoch": "Enacted epoch", "th-tr-outcome": "Outcome",
    "tr-m-epoch": "Latest epoch", "tr-m-epochs": "Epochs", "tr-m-snapshot": "Snapshot date",
    "tr-m-withdrawals": "Withdrawals", "tr-m-source": "Source", "tr-m-authority": "Authority", "tr-m-asof": "As of",
    "tr-sub-epoch": "epoch",
    "tr-w-none": "No withdrawals recorded.", "tr-w-unavailable": "Withdrawals not available.",
    "tr-chart-fallback": "Recent epochs", "tr-chart-empty": "No epoch data.",
    "tr-load-error": "Could not load treasury data.",
    "tr-th-fb-epoch": "Epoch", "tr-th-fb-balance": "Treasury balance",
  },
  ja: {
    "tr-title": "Cardano トレジャリー",
    "tr-lede": "オンチェーンの Cardano トレジャリー残高・リザーブ・総供給量をエポックごとに観測し、トレジャリー引出しのガバナンスアクションの記録を併記します。読み取り専用。値はチェーン由来で来歴を伴います。解釈は行いません。",
    "tr-s-treasury": "トレジャリー残高", "tr-s-reserves": "リザーブ", "tr-s-supply": "総供給量", "tr-s-snapshot": "スナップショット",
    "tr-chart-title": "エポックごとのトレジャリー残高",
    "tr-chart-note": "エポックごとのトレジャリー残高（ADA）。",
    "tr-w-title": "トレジャリー引出し",
    "tr-w-note": "トレジャリー引出しのガバナンスアクションとその結果。",
    "th-tr-action": "アクション ID", "th-tr-recipient": "受取人", "th-tr-amount": "金額", "th-tr-epoch": "施行エポック", "th-tr-outcome": "結果",
    "tr-m-epoch": "最新エポック", "tr-m-epochs": "エポック数", "tr-m-snapshot": "スナップショット日",
    "tr-m-withdrawals": "引出し件数", "tr-m-source": "出典", "tr-m-authority": "権威クラス", "tr-m-asof": "時点",
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

function authChip(cls) {
  if (!cls) return "—";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return `<span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
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

/* ---- stat cards ---- */
function renderStats() {
  const d = state.data;
  if (!d) return;
  const latest = d.latest || (epochList().length ? epochList()[epochList().length - 1] : {}) || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("tr-v-treasury", fmtAda(latest.treasury_lovelace));
  set("tr-v-reserves", fmtAda(latest.reserves_lovelace));
  set("tr-v-supply", fmtAda(latest.supply_lovelace));

  const epochSub = latest.epoch_no != null ? `${t("tr-sub-epoch")} ${fmtInt(latest.epoch_no)}` : "";
  set("tr-sub-treasury", epochSub);
  set("tr-sub-reserves", epochSub);
  set("tr-sub-supply", epochSub);

  // snapshot card: prefer epoch number as the headline, date as sub.
  set("tr-v-snapshot", latest.epoch_no != null ? fmtInt(latest.epoch_no) : (d.snapshot_date || "—"));
  set("tr-sub-snapshot", d.snapshot_date || "");
}

/* ---- meta strip (provenance / _quality) ---- */
function renderMeta() {
  const d = state.data;
  const el = document.getElementById("tr-meta");
  if (!el || !d) return;
  const q = d._quality || {};
  const items = [];
  const epochs = epochList();
  const latestEpoch = (d.latest && d.latest.epoch_no) != null ? d.latest.epoch_no : (epochs.length ? epochs[epochs.length - 1].epoch_no : null);
  if (latestEpoch != null) items.push(`<span class="meta-item"><span class="meta-label">${t("tr-m-epoch")}</span> ${fmtInt(latestEpoch)}</span>`);
  items.push(`<span class="meta-item"><span class="meta-label">${t("tr-m-epochs")}</span> ${fmtInt(d.n_epochs != null ? d.n_epochs : epochs.length)}</span>`);
  if (d.snapshot_date) items.push(`<span class="meta-item"><span class="meta-label">${t("tr-m-snapshot")}</span> ${esc(d.snapshot_date)}</span>`);
  items.push(`<span class="meta-item"><span class="meta-label">${t("tr-m-withdrawals")}</span> ${fmtInt(withdrawalList().length)}</span>`);
  if (q.source) items.push(`<span class="meta-item"><span class="meta-label">${t("tr-m-source")}</span> ${esc(q.source)}</span>`);
  if (q.authority_class) items.push(`<span class="meta-item"><span class="meta-label">${t("tr-m-authority")}</span> ${authChip(q.authority_class)}</span>`);
  if (q.as_of) items.push(`<span class="meta-item meta-item-right"><span class="meta-label">${t("tr-m-asof")}</span> ${esc(String(q.as_of).slice(0, 10))}</span>`);
  el.innerHTML = items.join("");
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
    tbody.innerHTML = `<tr><td colspan="5" class="loading">${t("tr-w-unavailable")}</td></tr>`;
    return;
  }
  const rows = withdrawalList();
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="loading">${t("tr-w-none")}</td></tr>`;
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
  renderStats();
  renderMeta();
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
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="loading">${t("tr-load-error")}</td></tr>`;
    const chart = document.getElementById("tr-chart");
    if (chart) { chart.className = "tr-chart-empty"; chart.textContent = t("tr-load-error"); }
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

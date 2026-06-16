/* Governance health — observed indicators only. No scores, no judgments.
 * Sources: /dreps, /actions, /votes, /treasury (all aggregate / published). */
"use strict";
const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const num = (n) => n == null ? "—" : Number(n).toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US");
const cards = (el, items) => { const e = document.getElementById(el); if (e) e.innerHTML = items.map(([v, l, sub]) => `<div class="stat-card"><div class="stat-value">${v}</div><div class="stat-label">${esc(l)}</div>${sub ? `<div class="stat-sub">${esc(sub)}</div>` : ""}</div>`).join(""); };
const state = { dreps: null, actions: null, votes: null, treasury: null };

const PAGE_I18N = {
  en: {
    "gh-title": "Governance health",
    "gh-lede": "Observed indicators of Cardano on-chain governance — DRep participation, delegation concentration, voting activity, and treasury activity. Numbers only.",
    "gh-conc-h": "Delegation concentration", "gh-vote-h": "Voting activity", "gh-tre-h": "Treasury activity",
    "gh-conc-link": "Full concentration breakdown →", "gh-flows-link": "Delegation flow →",
    "gh-tre-link": "Full treasury view →", "gh-act-link": "Governance actions →",
    "gh-err": "Could not load this section from the API.",
    "gh-l-tracked": "DReps tracked", "gh-s-meth": "top-30 by methodology",
    "gh-l-active": "Active DReps", "gh-s-active": "voted ≤10 epochs",
    "gh-l-rate": "Participation rate", "gh-s-rate": "active / tracked",
    "gh-l-ever": "Ever voted", "gh-s-ever": "of tracked",
    "gh-l-t1": "Top-1 weight share", "gh-l-t5": "Top-5 weight share", "gh-l-t10": "Top-10 weight share", "gh-l-hhi": "HHI (0–10,000)",
    "gh-l-actions": "Governance actions", "gh-s-alltime": "all-time",
    "gh-l-rvotes": "Recent votes", "gh-l-enacted": "Enacted", "gh-l-ratified": "Ratified",
    "gh-h-outcome": "Outcome", "gh-h-actions": "Actions",
    "gh-l-tbal": "Treasury balance", "gh-l-epochs": "Epochs recorded", "gh-l-wd": "Treasury withdrawals", "gh-l-snapdate": "Snapshot date",
    "gh-m-snapshot": "Snapshot", "gh-m-epoch": "Epoch", "gh-m-sources": "sources: /dreps /actions /votes /treasury · authority A",
    "gh-hero-updated": "Snapshot",
    "gh-mc-tracked": "DReps tracked", "gh-mc-tracked-sub": "top-30 by methodology",
    "gh-mc-active": "Active DReps", "gh-mc-active-sub": "voted ≤10 epochs",
    "gh-mc-rate": "Participation", "gh-mc-rate-sub": "active / tracked",
    "gh-mc-conc": "Top-5 share", "gh-mc-conc-sub": "of tracked weight",
    "gh-mc-tre": "Treasury", "gh-mc-tre-sub": "current balance",
    "gh-drep-h-html": "DRep participation <span class=\"pm-muted\" style=\"font-weight:400\">(tracked top-30)</span>",
    "gh-foot-html": "<strong>Observability only — no scores, no judgments.</strong> DRep-level figures are scoped to the tracked top-30 by methodology (not network-wide); governance actions and treasury are full. \"Active\" = a DRep with a recorded vote within ~10 epochs of the current snapshot. Sources: <code>api.asy.life</code> /dreps · /actions · /votes · /treasury (observatory CC0, Koios-derived) · authority A. No ranking beyond the published data.",
  },
  ja: {
    "gh-title": "ガバナンスの健全性",
    "gh-lede": "Cardano オンチェーンガバナンスの観測指標 — DRep参加、委任の集中度、投票活動、トレジャリー活動。数値のみ。",
    "gh-conc-h": "委任の集中度", "gh-vote-h": "投票活動", "gh-tre-h": "トレジャリー活動",
    "gh-conc-link": "集中度の詳細 →", "gh-flows-link": "委任フロー →",
    "gh-tre-link": "トレジャリーの詳細 →", "gh-act-link": "ガバナンスアクション →",
    "gh-err": "このセクションをAPIから読み込めませんでした。",
    "gh-l-tracked": "追跡DRep数", "gh-s-meth": "方法論による上位30",
    "gh-l-active": "活動中のDRep", "gh-s-active": "10エポック以内に投票",
    "gh-l-rate": "参加率", "gh-s-rate": "活動中 / 追跡対象",
    "gh-l-ever": "投票経験あり", "gh-s-ever": "追跡対象のうち",
    "gh-l-t1": "上位1の投票力比率", "gh-l-t5": "上位5の投票力比率", "gh-l-t10": "上位10の投票力比率", "gh-l-hhi": "HHI (0〜10,000)",
    "gh-l-actions": "ガバナンスアクション", "gh-s-alltime": "全期間",
    "gh-l-rvotes": "直近の投票", "gh-l-enacted": "施行", "gh-l-ratified": "承認",
    "gh-h-outcome": "結果", "gh-h-actions": "アクション数",
    "gh-l-tbal": "トレジャリー残高", "gh-l-epochs": "記録エポック数", "gh-l-wd": "トレジャリー引出し", "gh-l-snapdate": "スナップショット日",
    "gh-m-snapshot": "スナップショット", "gh-m-epoch": "エポック", "gh-m-sources": "出典: /dreps /actions /votes /treasury · 権威クラス A",
    "gh-hero-updated": "スナップショット",
    "gh-mc-tracked": "追跡DRep数", "gh-mc-tracked-sub": "方法論による上位30",
    "gh-mc-active": "活動中のDRep", "gh-mc-active-sub": "10エポック以内に投票",
    "gh-mc-rate": "参加率", "gh-mc-rate-sub": "活動中 / 追跡対象",
    "gh-mc-conc": "上位5の比率", "gh-mc-conc-sub": "追跡投票力のうち",
    "gh-mc-tre": "トレジャリー", "gh-mc-tre-sub": "現在残高",
    "gh-drep-h-html": "DRep参加 <span class=\"pm-muted\" style=\"font-weight:400\">(追跡対象の上位30)</span>",
    "gh-foot-html": "<strong>観測のみ — スコアも判断もありません。</strong> DRepレベルの数値は方法論による追跡対象の上位30に限定されます（ネットワーク全体ではありません）。ガバナンスアクションとトレジャリーは全件です。「活動中」=現在のスナップショットから約10エポック以内に投票記録のあるDRep。出典: <code>api.asy.life</code> /dreps · /actions · /votes · /treasury（observatory CC0、Koios由来）· 権威クラス A。公開データを超える順位付けはしません。",
  },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }

const errMsg = (el) => { const e = document.getElementById(el); if (e) e.innerHTML = `<p class="loading">${t("gh-err")}</p>`; };
async function j(p) { try { const r = await fetch(API + p, { cache: "no-cache" }); if (!r.ok) return null; return await r.json(); } catch { return null; } }

/* Small inline icon set (stroke, currentColor). */
const ICON = {
  tracked: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  active: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  rate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21H3"/><path d="M7 21V11"/><path d="M12 21V3"/><path d="M17 21v-7"/></svg>',
  conc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
  treasury: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
};

/* Compact ADA for headline figures (₳1.2B, ₳930M). */
function fmtAdaCompact(n) {
  if (n == null || !isFinite(n)) return null;
  return "₳" + Number(n).toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US", { notation: "compact", maximumFractionDigits: 2 });
}

function authChip(cls) {
  if (!cls) return "";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return ` <span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}

function renderHeroAside() {
  const el = document.getElementById("gh-hero-aside");
  if (!el) return;
  const d = state.dreps || {};
  const snap = d.snapshot_date || "—";
  const epoch = d.epoch != null ? d.epoch : null;
  const epLabel = epoch != null ? (currentLang() === "ja" ? "エポック " : "epoch ") + epoch : "";
  el.innerHTML =
    `<div class="ha-label">${esc(t("gh-hero-updated"))}</div>` +
    `<div class="ha-value">${esc(snap)}</div>` +
    `<div class="ha-sub">${esc(epLabel)}${authChip("A")}</div>`;
}

function metricCard(icon, value, isText, label, sub) {
  return `<div class="metric-card">
    <div class="mc-icon">${icon}</div>
    <div class="mc-value${isText ? " mc-text" : ""}">${value}</div>
    <div class="mc-label">${esc(label)}</div>
    <div class="mc-sub">${esc(sub)}</div>
  </div>`;
}

function renderMetrics() {
  const el = document.getElementById("gh-metrics");
  if (!el) return;
  const { dreps, treasury } = state;
  let tracked = "—", active = "—", rate = "—", top5 = "—", treBal = "—";
  if (dreps && dreps.dreps) {
    const ds = dreps.dreps, epoch = dreps.epoch || 0;
    const activeN = ds.filter((d) => d.last_vote_epoch != null && (epoch - d.last_vote_epoch) <= 10).length;
    tracked = num(ds.length);
    active = num(activeN);
    rate = ds.length ? (100 * activeN / ds.length).toFixed(0) + "%" : "—";
    const w = ds.map((d) => Number(d.voting_weight_lovelace || 0)).sort((a, b) => b - a);
    const total = w.reduce((a, b) => a + b, 0);
    top5 = total ? (100 * w.slice(0, 5).reduce((a, b) => a + b, 0) / total).toFixed(1) + "%" : "—";
  }
  if (treasury && treasury.latest && treasury.latest.treasury_lovelace != null) {
    treBal = fmtAdaCompact(Math.trunc(treasury.latest.treasury_lovelace / 1e6)) || "—";
  }
  el.innerHTML = [
    metricCard(ICON.tracked, tracked, false, t("gh-mc-tracked"), t("gh-mc-tracked-sub")),
    metricCard(ICON.active, active, false, t("gh-mc-active"), t("gh-mc-active-sub")),
    metricCard(ICON.rate, rate, false, t("gh-mc-rate"), t("gh-mc-rate-sub")),
    metricCard(ICON.conc, top5, false, t("gh-mc-conc"), t("gh-mc-conc-sub")),
    metricCard(ICON.treasury, treBal, false, t("gh-mc-tre"), t("gh-mc-tre-sub")),
  ].join("");
}

function paintStatic() {
  const h = document.getElementById("gh-drep-h"); if (h) h.innerHTML = t("gh-drep-h-html");
  const f = document.getElementById("gh-foot"); if (f) f.innerHTML = t("gh-foot-html");
}

function render() {
  const ja = currentLang() === "ja";
  const { dreps, actions, votes, treasury } = state;
  // DRep participation (tracked top-30)
  if (dreps && dreps.dreps) {
    const ds = dreps.dreps, epoch = dreps.epoch || 0;
    const active = ds.filter((d) => d.last_vote_epoch != null && (epoch - d.last_vote_epoch) <= 10).length;
    const everVoted = ds.filter((d) => d.last_vote_epoch != null).length;
    const rate = ds.length ? (100 * active / ds.length).toFixed(0) + "%" : "—";
    cards("gh-drep", [
      [num(ds.length), t("gh-l-tracked"), t("gh-s-meth")],
      [num(active), t("gh-l-active"), t("gh-s-active")],
      [rate, t("gh-l-rate"), t("gh-s-rate")],
      [num(everVoted), t("gh-l-ever"), t("gh-s-ever")],
    ]);
    // concentration (reuse weights)
    const w = ds.map((d) => Number(d.voting_weight_lovelace || 0)).sort((a, b) => b - a);
    const total = w.reduce((a, b) => a + b, 0);
    const top = (k) => total ? (100 * w.slice(0, k).reduce((a, b) => a + b, 0) / total).toFixed(1) + "%" : "—";
    const hhi = total ? Math.round(w.reduce((s, x) => s + Math.pow(100 * x / total, 2), 0)) : null;
    cards("gh-conc", [
      [top(1), t("gh-l-t1")], [top(5), t("gh-l-t5")],
      [top(10), t("gh-l-t10")], [num(hhi), t("gh-l-hhi")],
    ]);
  } else { errMsg("gh-drep"); errMsg("gh-conc"); }
  // Voting activity
  if (actions && actions.actions) {
    const a = actions.actions;
    const byOutcome = {};
    a.forEach((x) => { const o = x.outcome || "unknown"; byOutcome[o] = (byOutcome[o] || 0) + 1; });
    const last = votes ? (ja ? `直近${votes.window_hours || 24}時間` : `last ${votes.window_hours || 24}h`) : "";
    cards("gh-vote", [
      [num(actions.total ?? a.length), t("gh-l-actions"), t("gh-s-alltime")],
      [num(votes ? votes.total : null), t("gh-l-rvotes"), last],
      [num(byOutcome.enacted || 0), t("gh-l-enacted"), ""],
      [num(byOutcome.ratified || 0), t("gh-l-ratified"), ""],
    ]);
    const order = Object.entries(byOutcome).sort((x, y) => y[1] - x[1]);
    document.getElementById("gh-outcomes").innerHTML = `<div class="table-scroll"><table class="vote-table"><thead><tr><th>${esc(t("gh-h-outcome"))}</th><th>${esc(t("gh-h-actions"))}</th></tr></thead><tbody>` +
      order.map(([o, c]) => `<tr><td>${esc(o)}</td><td>${num(c)}</td></tr>`).join("") + `</tbody></table></div>`;
  } else { errMsg("gh-vote"); errMsg("gh-outcomes"); }
  // Treasury activity
  if (treasury) {
    const latest = treasury.latest || {};
    const tre = latest.treasury_lovelace != null ? Math.trunc(latest.treasury_lovelace / 1e6) : null;
    const wd = treasury.withdrawals;
    const wdCount = wd ? (wd.count != null ? wd.count : (Array.isArray(wd) ? wd.length : null)) : null;
    const epLabel = (ja ? "エポック " : "epoch ") + (latest.epoch_no ?? "—");
    cards("gh-tre", [
      [tre != null ? num(tre) + " ₳" : "—", t("gh-l-tbal"), epLabel],
      [num(treasury.n_epochs), t("gh-l-epochs"), ""],
      [num(wdCount), t("gh-l-wd"), t("gh-s-alltime")],
      [esc(treasury.snapshot_date || "—"), t("gh-l-snapdate"), ""],
    ]);
  } else { errMsg("gh-tre"); }
  renderHeroAside();
  renderMetrics();
}

async function boot() {
  document.addEventListener("cdo-lang", () => { render(); paintStatic(); });
  paintStatic();
  const [dreps, actions, votes, treasury] = await Promise.all([
    j("/dreps?limit=30"), j("/actions"), j("/votes"), j("/treasury"),
  ]);
  state.dreps = dreps; state.actions = actions; state.votes = votes; state.treasury = treasury;
  render();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

/* Delegation concentration — observed concentration of DRep voting weight.
 * Descriptive indices (top-N share, HHI, Gini) from /dreps. No judgment. */
"use strict";
const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const num = (n) => n == null ? "—" : Number(n).toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US");
const state = { dreps: [], meta: null };

const PAGE_I18N = {
  en: {
    "cn-title": "Delegation concentration",
    "cn-lede": "How concentrated voting weight is across the top-30 DReps — top-N share, the Herfindahl-Hirschman Index (HHI), and the Gini coefficient.",
    "cn-share-h": "Top-N share of top-30 voting weight", "cn-dist-h": "Voting-weight distribution (top-30)",
    "cn-c1": "Top 1 share", "cn-c3": "Top 3 share", "cn-c5": "Top 5 share", "cn-c10": "Top 10 share",
    "cn-hhi": "HHI (0–10,000)", "cn-gini": "Gini (0–1)",
    "cn-h-bucket": "Bucket", "cn-h-share": "Share of top-30 weight", "cn-h-ada": "ADA",
    "cn-top": "Top", "cn-all": "All", "cn-m-dreps": "DReps", "cn-m-snapshot": "Snapshot", "cn-m-epoch": "Epoch",
    "cn-m-source": "source: observatory · authority A",
    "cn-hero-snapshot": "Snapshot", "cn-hero-source": "Observatory DRep registry",
    "cn-foot-html": "<strong>Descriptive, not a judgment.</strong> These indices report observed concentration across the tracked top-30 DReps (which hold the large majority of registered voting weight); they are not a network-wide measure and carry no \"centralization risk\" or \"capture\" claim — the reader interprets. HHI is the sum of squared percentage shares (0–10,000). Gini is 0 (equal) to 1 (concentrated). Source: <code>api.asy.life/dreps</code> · authority A. Related: <a href=\"flows.html\">Flows</a> · <a href=\"governance-health.html\">Governance health</a>.",
  },
  ja: {
    "cn-title": "委任の集中度",
    "cn-lede": "上位30のDRepに投票力がどれだけ集中しているか — 上位N比率、ハーフィンダール・ハーシュマン指数 (HHI)、ジニ係数で示します。",
    "cn-share-h": "上位30の投票力に占める上位N比率", "cn-dist-h": "投票力の分布 (上位30)",
    "cn-c1": "上位1の比率", "cn-c3": "上位3の比率", "cn-c5": "上位5の比率", "cn-c10": "上位10の比率",
    "cn-hhi": "HHI (0〜10,000)", "cn-gini": "ジニ係数 (0〜1)",
    "cn-h-bucket": "区分", "cn-h-share": "上位30の投票力に占める比率", "cn-h-ada": "ADA",
    "cn-top": "上位", "cn-all": "全", "cn-m-dreps": "DRep数", "cn-m-snapshot": "スナップショット", "cn-m-epoch": "エポック",
    "cn-m-source": "出典: observatory · 権威クラス A",
    "cn-hero-snapshot": "スナップショット", "cn-hero-source": "Observatory DRepレジストリ",
    "cn-foot-html": "<strong>記述であり、判断ではありません。</strong> これらの指標は追跡対象の上位30 DRep（登録投票力の大半を保有）における観測された集中度を報告するものであり、ネットワーク全体の指標ではなく、「中央集権リスク」や「キャプチャ」の主張も含みません — 解釈は読者に委ねられます。HHIはパーセント比率の二乗和 (0〜10,000)。ジニ係数は0（均等）〜1（集中）。出典: <code>api.asy.life/dreps</code> · 権威クラス A。関連: <a href=\"flows.html\">フロー</a> · <a href=\"governance-health.html\">ガバナンスの健全性</a>。",
  },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }
function paintStatic() { const f = document.getElementById("cn-foot"); if (f) f.innerHTML = t("cn-foot-html"); }

function authChip(cls) {
  if (!cls) return "";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return ` <span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}

/* Hero aside — mirrors rankings.js: snapshot date + source signal from the
 * cached /dreps payload's snapshot metadata. The DRep registry is authority A. */
function renderHeroAside() {
  const el = document.getElementById("cn-hero-aside");
  if (!el) return;
  const m = state.meta || {};
  const asOfTxt = m.snapshot_date || "—";
  el.innerHTML =
    `<div class="ha-label">${esc(t("cn-hero-snapshot"))}</div>` +
    `<div class="ha-value">${esc(asOfTxt)}</div>` +
    `<div class="ha-sub">${esc(t("cn-hero-source"))}${authChip("A")}</div>`;
}

function hhi(shares) { return shares.reduce((s, p) => s + (p * 100) * (p * 100), 0); } // shares are fractions; ×100 → pct
function gini(vals) {
  const x = vals.slice().sort((a, b) => a - b); const n = x.length; if (!n) return 0;
  const sum = x.reduce((a, b) => a + b, 0); if (sum === 0) return 0;
  let cum = 0; for (let i = 0; i < n; i++) cum += (i + 1) * x[i];
  return (2 * cum) / (n * sum) - (n + 1) / n;
}
function topShare(weights, k) {
  const total = weights.reduce((a, b) => a + b, 0); if (!total) return 0;
  return weights.slice(0, k).reduce((a, b) => a + b, 0) / total;
}
function pct(x) { return (x * 100).toFixed(1) + "%"; }

function render() {
  renderHeroAside();
  if (!state.dreps.length) return;
  const sorted = state.dreps.slice().sort((a, b) => (b.voting_weight_lovelace || 0) - (a.voting_weight_lovelace || 0));
  const weights = sorted.map((d) => Number(d.voting_weight_lovelace || 0));
  const total = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map((w) => total ? w / total : 0);
  const H = hhi(shares), G = gini(weights), n = weights.length;
  document.getElementById("cn-cards").innerHTML = [
    [pct(topShare(weights, 1)), t("cn-c1")], [pct(topShare(weights, 3)), t("cn-c3")],
    [pct(topShare(weights, 5)), t("cn-c5")], [pct(topShare(weights, 10)), t("cn-c10")],
    [Math.round(H).toLocaleString(), t("cn-hhi")], [G.toFixed(3), t("cn-gini")],
  ].map(([v, l]) => `<div class="stat-card"><div class="stat-value">${v}</div><div class="stat-label">${esc(l)}</div></div>`).join("");
  // top-N share table
  const ja = currentLang() === "ja";
  document.getElementById("cn-share").innerHTML = `<div class="table-scroll"><table class="vote-table"><thead><tr><th>${esc(t("cn-h-bucket"))}</th><th>${esc(t("cn-h-share"))}</th><th>${esc(t("cn-h-ada"))}</th></tr></thead><tbody>` +
    [1, 3, 5, 10, n].map((k) => {
      const lab = k === n ? (ja ? `${t("cn-all")}${n}` : `${t("cn-all")} ${n}`) : (ja ? `${t("cn-top")}${k}` : `${t("cn-top")} ${k}`);
      const ada = Math.trunc(weights.slice(0, k).reduce((a, b) => a + b, 0) / 1e6);
      return `<tr><td>${esc(lab)}</td><td>${pct(topShare(weights, k))}</td><td>${num(ada)}</td></tr>`;
    }).join("") + `</tbody></table></div>`;
  // distribution — CSS-grid horizontal bars (fixed label / bar / value columns;
  // names wrap, never truncated; values in their own column, never on the bar).
  const max = Math.max(...weights, 1);
  document.getElementById("cn-chart").innerHTML = `<div class="bar-rows">` + sorted.map((d) => {
    const w = Number(d.voting_weight_lovelace || 0);
    const ada = Math.trunc(w / 1e6);
    const pctW = Math.max(0.5, (w / max) * 100);
    const name = (d.name && d.name.trim()) ? d.name : d.drep_id;
    return `<div class="bar-row">
      <div class="bar-label">${esc(name)}<span class="bar-sub">${esc(d.drep_id.slice(0, 18))}…</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pctW.toFixed(2)}%"></div></div>
      <div class="bar-val">${num(ada)} ₳ · ${(total ? 100 * w / total : 0).toFixed(1)}%</div>
    </div>`;
  }).join("") + `</div>`;
  const m = state.meta || {};
  document.getElementById("cn-meta").innerHTML =
    `<span class="meta-item"><span class="meta-label">${esc(t("cn-m-dreps"))}</span> ${n} (top-30)</span>` +
    `<span class="meta-item"><span class="meta-label">${esc(t("cn-m-snapshot"))}</span> ${esc(m.snapshot_date || "—")}</span>` +
    `<span class="meta-item"><span class="meta-label">${esc(t("cn-m-epoch"))}</span> ${esc(String(m.epoch || "—"))}</span>` +
    `<span class="meta-item meta-item-right">${esc(t("cn-m-source"))}</span>`;
}
async function boot() {
  document.addEventListener("cdo-lang", () => { render(); paintStatic(); renderHeroAside(); });
  paintStatic();
  renderHeroAside();
  try {
    const r = await fetch(API + "/dreps?limit=30", { cache: "no-cache" });
    const j = await r.json();
    state.dreps = j.dreps || []; state.meta = { snapshot_date: j.snapshot_date, epoch: j.epoch };
    render();
  } catch (e) { document.getElementById("cn-cards").innerHTML = `<p class="loading">Could not load /dreps.</p>`; }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

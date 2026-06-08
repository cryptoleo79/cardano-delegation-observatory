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
  en: { "cn-title": "Delegation concentration", "cn-share-h": "Top-N share of top-30 voting weight", "cn-dist-h": "Voting-weight distribution (top-30)" },
  ja: { "cn-title": "委任の集中度", "cn-share-h": "上位30の投票力に占める上位N比率", "cn-dist-h": "投票力の分布 (上位30)" },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }

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
  if (!state.dreps.length) return;
  const sorted = state.dreps.slice().sort((a, b) => (b.voting_weight_lovelace || 0) - (a.voting_weight_lovelace || 0));
  const weights = sorted.map((d) => Number(d.voting_weight_lovelace || 0));
  const total = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map((w) => total ? w / total : 0);
  const H = hhi(shares), G = gini(weights), n = weights.length;
  document.getElementById("cn-cards").innerHTML = [
    [pct(topShare(weights, 1)), "Top 1 share"], [pct(topShare(weights, 3)), "Top 3 share"],
    [pct(topShare(weights, 5)), "Top 5 share"], [pct(topShare(weights, 10)), "Top 10 share"],
    [Math.round(H).toLocaleString(), "HHI (0–10,000)"], [G.toFixed(3), "Gini (0–1)"],
  ].map(([v, l]) => `<div class="stat-card"><div class="stat-value">${v}</div><div class="stat-label">${esc(l)}</div></div>`).join("");
  // top-N share table
  document.getElementById("cn-share").innerHTML = `<div class="table-scroll"><table class="vote-table"><thead><tr><th>Bucket</th><th>Share of top-30 weight</th><th>ADA</th></tr></thead><tbody>` +
    [1, 3, 5, 10, n].map((k) => {
      const lab = k === n ? `All ${n}` : `Top ${k}`;
      const ada = Math.trunc(weights.slice(0, k).reduce((a, b) => a + b, 0) / 1e6);
      return `<tr><td>${lab}</td><td>${pct(topShare(weights, k))}</td><td>${num(ada)}</td></tr>`;
    }).join("") + `</tbody></table></div>`;
  // distribution chart
  if (window.CDLChart && CDLChart.bars) {
    CDLChart.bars("cn-chart", sorted.map((d) => ({ label: (d.name && d.name.trim()) ? d.name : d.drep_id.slice(0, 10), value: Math.trunc((d.voting_weight_lovelace || 0) / 1e6) })), { height: 360, valueFormat: (v) => num(v) + " ₳" });
  } else {
    document.getElementById("cn-chart").innerHTML = `<p class="pm-muted">chart unavailable</p>`;
  }
  const m = state.meta || {};
  document.getElementById("cn-meta").innerHTML =
    `<span class="meta-item"><span class="meta-label">DReps</span> ${n} (top-30)</span>` +
    `<span class="meta-item"><span class="meta-label">Snapshot</span> ${esc(m.snapshot_date || "—")}</span>` +
    `<span class="meta-item"><span class="meta-label">Epoch</span> ${esc(String(m.epoch || "—"))}</span>` +
    `<span class="meta-item meta-item-right">source: observatory · authority A</span>`;
}
async function boot() {
  document.addEventListener("cdo-lang", render);
  try {
    const r = await fetch(API + "/dreps?limit=30", { cache: "no-cache" });
    const j = await r.json();
    state.dreps = j.dreps || []; state.meta = { snapshot_date: j.snapshot_date, epoch: j.epoch };
    render();
  } catch (e) { document.getElementById("cn-cards").innerHTML = `<p class="loading">Could not load /dreps.</p>`; }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

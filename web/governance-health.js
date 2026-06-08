/* Governance health — observed indicators only. No scores, no judgments.
 * Sources: /dreps, /actions, /votes, /treasury (all aggregate / published). */
"use strict";
const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const num = (n) => n == null ? "—" : Number(n).toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US");
const cards = (el, items) => { const e = document.getElementById(el); if (e) e.innerHTML = items.map(([v, l, sub]) => `<div class="stat-card"><div class="stat-value">${v}</div><div class="stat-label">${esc(l)}</div>${sub ? `<div class="stat-sub">${esc(sub)}</div>` : ""}</div>`).join(""); };

const PAGE_I18N = {
  en: { "gh-title": "Governance health" },
  ja: { "gh-title": "ガバナンスの健全性" },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }

async function j(p) { try { const r = await fetch(API + p, { cache: "no-cache" }); if (!r.ok) return null; return await r.json(); } catch { return null; } }

async function boot() {
  const [dreps, actions, votes, treasury] = await Promise.all([
    j("/dreps?limit=30"), j("/actions"), j("/votes"), j("/treasury"),
  ]);
  // DRep participation (tracked top-30)
  if (dreps && dreps.dreps) {
    const ds = dreps.dreps, epoch = dreps.epoch || 0;
    const active = ds.filter((d) => d.last_vote_epoch != null && (epoch - d.last_vote_epoch) <= 10).length;
    const everVoted = ds.filter((d) => d.last_vote_epoch != null).length;
    const rate = ds.length ? (100 * active / ds.length).toFixed(0) + "%" : "—";
    cards("gh-drep", [
      [num(ds.length), "DReps tracked", "top-30 by methodology"],
      [num(active), "Active DReps", "voted ≤10 epochs"],
      [rate, "Participation rate", "active / tracked"],
      [num(everVoted), "Ever voted", "of tracked"],
    ]);
    // concentration (reuse weights)
    const w = ds.map((d) => Number(d.voting_weight_lovelace || 0)).sort((a, b) => b - a);
    const total = w.reduce((a, b) => a + b, 0);
    const top = (k) => total ? (100 * w.slice(0, k).reduce((a, b) => a + b, 0) / total).toFixed(1) + "%" : "—";
    const hhi = total ? Math.round(w.reduce((s, x) => s + Math.pow(100 * x / total, 2), 0)) : null;
    cards("gh-conc", [
      [top(1), "Top-1 weight share"], [top(5), "Top-5 weight share"],
      [top(10), "Top-10 weight share"], [num(hhi), "HHI (0–10,000)"],
    ]);
  }
  // Voting activity
  if (actions && actions.actions) {
    const a = actions.actions;
    const byOutcome = {};
    a.forEach((x) => { const o = x.outcome || "unknown"; byOutcome[o] = (byOutcome[o] || 0) + 1; });
    cards("gh-vote", [
      [num(actions.total ?? a.length), "Governance actions", "all-time"],
      [num(votes ? votes.total : null), "Recent votes", votes ? `last ${votes.window_hours || 24}h` : ""],
      [num(byOutcome.enacted || 0), "Enacted", ""],
      [num(byOutcome.ratified || 0), "Ratified", ""],
    ]);
    const order = Object.entries(byOutcome).sort((x, y) => y[1] - x[1]);
    document.getElementById("gh-outcomes").innerHTML = `<div class="table-scroll"><table class="vote-table"><thead><tr><th>Outcome</th><th>Actions</th></tr></thead><tbody>` +
      order.map(([o, c]) => `<tr><td>${esc(o)}</td><td>${num(c)}</td></tr>`).join("") + `</tbody></table></div>`;
  }
  // Treasury activity
  if (treasury) {
    const latest = treasury.latest || {};
    const tre = latest.treasury_lovelace != null ? Math.trunc(latest.treasury_lovelace / 1e6) : null;
    const wd = treasury.withdrawals;
    const wdCount = wd ? (wd.count != null ? wd.count : (Array.isArray(wd) ? wd.length : null)) : null;
    cards("gh-tre", [
      [tre != null ? num(tre) + " ₳" : "—", "Treasury balance", `epoch ${latest.epoch_no ?? "—"}`],
      [num(treasury.n_epochs), "Epochs recorded", ""],
      [num(wdCount), "Treasury withdrawals", "all-time"],
      [esc(treasury.snapshot_date || "—"), "Snapshot date", ""],
    ]);
  }
  const m = dreps || {};
  document.getElementById("gh-meta").innerHTML =
    `<span class="meta-item"><span class="meta-label">Snapshot</span> ${esc(m.snapshot_date || "—")}</span>` +
    `<span class="meta-item"><span class="meta-label">Epoch</span> ${esc(String(m.epoch || "—"))}</span>` +
    `<span class="meta-item meta-item-right">sources: /dreps /actions /votes /treasury · authority A</span>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

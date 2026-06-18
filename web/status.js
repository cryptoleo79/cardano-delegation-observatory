/* Status & coverage — live metrics from the public Data Layer API. */
"use strict";
const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const num = (n) => n == null ? "—" : Number(n).toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US");

const PAGE_I18N = {
  en: {
    "st-title": "Status & coverage", "ft-memory": "Memory",
    "st-ha-status": "live", "st-ha-offline": "offline",
    "st-ha-label": "Coverage snapshot", "st-ha-checked": "checked", "st-ha-source": "source",
  },
  ja: {
    "st-title": "ステータスとカバレッジ", "ft-memory": "メモリ",
    "st-ha-status": "稼働中", "st-ha-offline": "オフライン",
    "st-ha-label": "カバレッジスナップショット", "st-ha-checked": "確認", "st-ha-source": "出典",
  },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }

// Most-recent successful fetch state, used to (re-)render the hero aside on lang change.
const st = { health: null, checkedAt: null };

function renderHeroAside() {
  const el = document.getElementById("st-hero-aside");
  if (!el) return;
  const live = !!st.health;
  const dot = `<span class="ha-dot ${live ? "ha-dot-ok" : "ha-dot-off"}"></span>`;
  const statusTxt = live ? t("st-ha-status") : t("st-ha-offline");
  const checkedTxt = st.checkedAt
    ? new Date(st.checkedAt).toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US")
    : "—";
  el.innerHTML =
    `<div class="ha-label">${esc(t("st-ha-label"))}</div>` +
    `<div class="ha-value">${dot}${esc(statusTxt)}</div>` +
    `<div class="ha-sub">${esc(t("st-ha-checked"))} <time datetime="${esc(st.checkedAt || "")}">${esc(checkedTxt)}</time></div>` +
    `<div class="ha-sub">${esc(t("st-ha-source"))} api.asy.life</div>`;
}

async function j(path) { try { const r = await fetch(API + path, { cache: "no-cache" }); if (!r.ok) return null; return await r.json(); } catch { return null; } }

async function boot() {
  document.addEventListener("cdo-lang", renderHeroAside);
  renderHeroAside();
  const [cats, projs, markets, funds, archive, treasury, dreps, actions, health] = await Promise.all([
    j("/categories"), j("/projects?limit=1"), j("/markets"), j("/funds"), j("/archive"),
    j("/treasury"), j("/dreps?limit=1"), j("/actions?limit=1"), j("/health"),
  ]);
  st.health = health;
  st.checkedAt = new Date().toISOString();
  renderHeroAside();
  const catTotal = cats ? cats.count : null;
  const catPop = cats ? cats.categories.filter((c) => c.project_count > 0).length : null;
  const projTotal = projs ? projs.total : null;
  const tokens = markets ? markets.tracked_units : null;
  const fundN = funds ? funds.total_funds : null;
  const epochs = treasury ? treasury.n_epochs : null;
  // Market-event count, read live from the registry file so it can't go stale.
  const mev = await fetch("market-events.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const eventsN = mev && Array.isArray(mev.events) ? mev.events.length : (Array.isArray(mev) ? mev.length : null);
  const drepN = dreps ? dreps.total : null;
  const actN = actions ? actions.total : null;
  const subf = archive ? Object.keys(archive.subfolders || {}).length : null;

  // headline cards
  const routeN = health ? health.routes : null;
  const cards = [
    [projTotal, "Projects"], [catPop != null ? `${catPop}/${catTotal}` : null, "Categories populated"],
    [tokens, "Tracked tokens"], [fundN, "Catalyst funds"], [actN, "Governance actions"],
    [epochs, "Treasury epochs"], [routeN, "API routes"],
  ];
  document.getElementById("st-cards").innerHTML = cards.map(([n, l]) =>
    `<div class="st-card"><div class="st-num">${n == null ? "—" : (typeof n === "string" ? n : num(n))}</div><div class="st-lbl">${esc(l)}</div></div>`).join("");

  // coverage table: domain, coverage, source, refresh, completeness, gaps
  const rows = [
    ["Projects", projTotal != null ? num(projTotal) + " projects" : "—", "Built on Cardano + cardanocube (Project Memory)", "static (event-sourced)", "broad", "audits/launch dates not yet populated"],
    ["Categories", catTotal != null ? `${catPop}/${catTotal} populated` : "—", "cardanocube taxonomy", "static", `${catTotal ? catTotal - catPop : "?"} pending assignments`, "13 niche categories have no assignments yet"],
    ["Tokens", tokens != null ? num(tokens) + " tracked" : "—", "DexHunter/Minswap price + Koios supply", "~5m (poller)", "curated set, not whole ecosystem", "long-tail tokens untracked"],
    ["Rankings", "tracked set", "OHLCV poller + Koios", "~5m", "partial (tracked set)", "gainers/losers (no endpoint)"],
    ["Treasury", epochs != null ? num(epochs) + " epochs" : "—", "Observatory CC0 export (Koios-derived)", "daily", "full epoch series + withdrawals", "—"],
    ["Governance", (drepN != null ? num(drepN) + " DReps · " : "") + (actN != null ? num(actN) + " actions" : ""), "Observatory CC0 export", "daily (votes ~10m)", "top-30 DReps (by methodology) + all actions", "DRep set bounded to top-30 by design"],
    ["Catalyst", fundN != null ? num(fundN) + " funds archived" : "—", "projectcatalyst.io (chain-of-custody)", "static (archive)", `Funds 1-${fundN || "?"} (15/15)`, "proposal-level capture pending"],
    ["Market events", (eventsN != null ? eventsN : "—") + " markers", "EVENT_REGISTRY (curated)", "static", "major ecosystem events", "observability only; no price overlay"],
    ["API", (health ? num(health.routes) + " routes" : "—") + (health && health.version ? " · v" + health.version : ""), "api.asy.life (read-only, no key, CORS *)", health && health.uptime_s != null ? "live (up " + Math.floor(health.uptime_s / 3600) + "h)" : "live", "every response carries _quality provenance", "—"],
  ];
  document.getElementById("st-tbody").innerHTML = rows.map((r) =>
    `<tr><td><strong>${esc(r[0])}</strong></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${r[5] === "—" ? '<span class="st-ok">none</span>' : `<span class="st-pend">${esc(r[5])}</span>`}</td></tr>`).join("");
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

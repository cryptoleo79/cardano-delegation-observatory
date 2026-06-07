/* Market Reality — neutral Cardano event timeline. Observability, not attribution.
 * Renders market-events.json; no price/causal overlay, no inference. */
"use strict";
const state = { events: [], type: "all" };
function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const AUTH = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
const TYPES = ["all", "hard-fork", "governance", "treasury", "catalyst", "ecosystem", "protocol-release"];

const PAGE_I18N = {
  en: { "mr-title": "Market Reality — Cardano event timeline", "mr-lede": "A neutral, chronological record of Cardano ecosystem events as timeline markers.", "ft-memory": "Memory", "mr-none": "No events for this filter." },
  ja: { "mr-title": "マーケット・リアリティ — Cardano イベント年表", "mr-lede": "Cardano エコシステムのイベントを中立的・時系列の目印として記録します。", "ft-memory": "メモリ", "mr-none": "この絞り込みに該当するイベントはありません。" },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }

function fmtDate(e) { return e.date_precision === "month" ? e.date : e.date; }

function renderFilters() {
  const el = document.getElementById("mr-filters");
  el.innerHTML = TYPES.map((ty) => `<button data-t="${ty}" class="${state.type === ty ? "active" : ""}">${ty === "all" ? "All" : ty}</button>`).join("");
  el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { state.type = b.dataset.t; renderFilters(); renderTimeline(); }));
}
function renderTimeline() {
  const el = document.getElementById("mr-tl");
  let evs = state.events.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (state.type !== "all") evs = evs.filter((e) => e.type === state.type);
  if (!evs.length) { el.innerHTML = `<li class="loading">${t("mr-none")}</li>`; return; }
  el.innerHTML = evs.map((e) => `<li class="mr-item mr-${esc(e.type)}">
    <span class="mr-date">${esc(fmtDate(e))}${e.approx ? " (approx)" : ""}</span><span class="mr-type">${esc(e.type)}</span>
    <div class="mr-title">${esc(e.title)}</div>
    <div class="mr-desc">${esc(e.description)}</div>
    <div class="mr-src">${e.source_url ? `<a href="${esc(e.source_url)}" target="_blank" rel="noopener">source</a> · ` : ""}<span class="pm-muted" title="${esc(AUTH[e.authority_class] || "")}">authority ${esc(e.authority_class)}</span></div>
  </li>`).join("");
}
async function boot() {
  document.addEventListener("cdo-lang", () => { renderFilters(); renderTimeline(); });
  renderFilters();
  try {
    const res = await fetch("market-events.json", { cache: "no-cache" });
    const j = await res.json();
    state.events = j.events || [];
    renderTimeline();
  } catch (e) {
    document.getElementById("mr-tl").innerHTML = `<li class="loading">Could not load events.</li>`;
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

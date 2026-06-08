/* DRep delegation flow — aggregate net only. Observability, not migration/motive.
 * Reads /dreps (each entry carries d7d/d30d net deltas). No wallet-level data. */
"use strict";
const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const state = { dreps: [], window: "d7d", meta: null };
function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function fmtAda(lovelace) { if (lovelace == null) return "—"; const a = Math.trunc(Number(lovelace) / 1e6); const s = a > 0 ? "+" : ""; return s + a.toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US"); }
function fmtSigned(n) { if (n == null) return "—"; const s = n > 0 ? "+" : ""; return s + Number(n).toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US"); }
function shortId(id) { return id ? id.slice(0, 14) + "…" : "—"; }

const PAGE_I18N = {
  en: { "fl-title": "DRep delegation flow", "fl-win-label": "Window", "fl-inc-h": "Largest net increase", "fl-dec-h": "Largest net decrease", "fl-th-d1": "DRep", "fl-th-d2": "Net voting weight (ADA)", "fl-th-d3": "Net delegators", "fl-th-d4": "Since", "fl-none": "No data for this window yet." },
  ja: { "fl-title": "DRep 委任フロー", "fl-win-label": "期間", "fl-inc-h": "純増が最大", "fl-dec-h": "純減が最大", "fl-th-d1": "DRep", "fl-th-d2": "純投票力 (ADA)", "fl-th-d3": "純委任者", "fl-th-d4": "基準日", "fl-none": "この期間のデータはまだありません。" },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }

function wKey(d) { return state.window === "d7d" ? d.d7d_lovelace : d.d30d_lovelace; }
function dKey(d) { return state.window === "d7d" ? d.delegator_count_d7d : d.delegator_count_d30d; }
function refKey(d) { return state.window === "d7d" ? d.flow_reference_date_d7d : d.flow_reference_date_d30d; }

function row(d) {
  const name = d.name && d.name.trim() ? d.name : shortId(d.drep_id);
  return `<tr><td><a href="drep.html?id=${encodeURIComponent(d.drep_id)}">${esc(name)}</a><div class="pm-id">${esc(d.drep_id)}</div></td>
    <td>${fmtAda(wKey(d))}</td><td>${fmtSigned(dKey(d))}</td><td>${esc(refKey(d) || "—")}</td></tr>`;
}
function render() {
  const priced = state.dreps.filter((d) => wKey(d) != null);
  const inc = priced.filter((d) => wKey(d) > 0).sort((a, b) => wKey(b) - wKey(a)).slice(0, 15);
  const dec = priced.filter((d) => wKey(d) < 0).sort((a, b) => wKey(a) - wKey(b)).slice(0, 15);
  document.getElementById("fl-inc-b").innerHTML = inc.length ? inc.map(row).join("") : `<tr><td colspan="4" class="loading">${t("fl-none")}</td></tr>`;
  document.getElementById("fl-dec-b").innerHTML = dec.length ? dec.map(row).join("") : `<tr><td colspan="4" class="loading">${t("fl-none")}</td></tr>`;
  const m = state.meta || {};
  document.getElementById("fl-meta").innerHTML =
    `<span class="meta-item"><span class="meta-label">Tracked DReps</span> ${state.dreps.length} (top-30)</span>` +
    `<span class="meta-item"><span class="meta-label">Snapshot</span> ${esc(m.snapshot_date || "—")}</span>` +
    `<span class="meta-item"><span class="meta-label">With ${state.window} data</span> ${priced.length}</span>` +
    `<span class="meta-item meta-item-right">source: observatory · authority A</span>`;
}
async function boot() {
  document.addEventListener("cdo-lang", render);
  const sel = document.getElementById("fl-window");
  sel.addEventListener("change", () => { state.window = sel.value; render(); });
  try {
    const r = await fetch(API + "/dreps?limit=30", { cache: "no-cache" });
    const j = await r.json();
    state.dreps = j.dreps || [];
    state.meta = { snapshot_date: j.snapshot_date, epoch: j.epoch };
    render();
  } catch (e) {
    document.getElementById("fl-inc-b").innerHTML = `<tr><td colspan="4" class="loading">Could not load /dreps.</td></tr>`;
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

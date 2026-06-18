/* DRep delegation flow — aggregate net only. Observability, not migration/motive.
 * Reads /dreps (each entry carries d7d/d30d net deltas). No wallet-level data. */
"use strict";
const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const state = { dreps: [], window: "d7d", meta: null, quality: null };
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };
function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function fmtAda(lovelace) { if (lovelace == null) return "—"; const a = Math.trunc(Number(lovelace) / 1e6); const s = a > 0 ? "+" : ""; return s + a.toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US"); }
function fmtSigned(n) { if (n == null) return "—"; const s = n > 0 ? "+" : ""; return s + Number(n).toLocaleString(currentLang() === "ja" ? "ja-JP" : "en-US"); }
function shortId(id) { return id ? id.slice(0, 14) + "…" : "—"; }

const PAGE_I18N = {
  en: {
    "fl-title": "DRep delegation flow", "fl-win-label": "Window", "fl-inc-h": "Largest net increase", "fl-dec-h": "Largest net decrease",
    "fl-th-d1": "DRep", "fl-th-d2": "Net voting weight (ADA)", "fl-th-d3": "Net delegators", "fl-th-d4": "Since", "fl-none": "No data for this window yet.",
    "fl-lede": "Net change in each top-30 DRep's voting weight and delegator count over the last 7 and 30 days, from daily snapshots.",
    "fl-opt-7": "7 days", "fl-opt-30": "30 days",
    "fl-m-tracked": "Tracked DReps", "fl-m-snapshot": "Snapshot", "fl-m-with": "With", "fl-m-data": "data", "fl-m-source": "source: observatory · authority A",
    "fl-hero-snapshot": "Snapshot",
    "fl-rule-html": "<strong>Net only — not migration, not motive.</strong> These are per-DRep net deltas. They do <em>not</em> show where delegation came from or went to (that would require per-delegator tracking, which the methodology forbids — see <a href=\"https://github.com/cryptoleo79/cardano-delegation-observatory/blob/main/docs/DREP_FLOW_OBSERVATORY.md\" target=\"_blank\" rel=\"noopener\">methodology</a>). A net of ~0 can hide large offsetting moves. The two lists below are independent rankings — do not pair a \"decrease\" row with an \"increase\" row.",
    "fl-foot-html": "Source: <code>api.asy.life/dreps</code> (observatory CC0 export, Koios-derived) · authority A. Null where fewer than the window's snapshots have accumulated. Related: <a href=\"concentration.html\">Concentration</a> · <a href=\"governance-health.html\">Governance health</a>. No \"winners/losers\".",
  },
  ja: {
    "fl-title": "DRep 委任フロー", "fl-win-label": "期間", "fl-inc-h": "純増が最大", "fl-dec-h": "純減が最大",
    "fl-th-d1": "DRep", "fl-th-d2": "純投票力 (ADA)", "fl-th-d3": "純委任者", "fl-th-d4": "基準日", "fl-none": "この期間のデータはまだありません。",
    "fl-lede": "上位30の各DRepの投票力と委任者数の、直近7日・30日の純変化を日次スナップショットから示します。",
    "fl-opt-7": "7日間", "fl-opt-30": "30日間",
    "fl-m-tracked": "追跡DRep数", "fl-m-snapshot": "スナップショット", "fl-m-with": "対象", "fl-m-data": "データあり", "fl-m-source": "出典: observatory · 権威クラス A",
    "fl-hero-snapshot": "スナップショット",
    "fl-rule-html": "<strong>純変化のみ — 移動でも動機でもありません。</strong> これらはDRepごとの純差分です。委任が<em>どこから来てどこへ行ったか</em>は示しません（それには委任者ごとの追跡が必要で、方法論で禁じられています — <a href=\"https://github.com/cryptoleo79/cardano-delegation-observatory/blob/main/docs/DREP_FLOW_OBSERVATORY.md\" target=\"_blank\" rel=\"noopener\">方法論</a>を参照）。純変化が約0でも、大きな相殺の動きが隠れている場合があります。下の2つのリストは独立した順位であり、「純減」の行と「純増」の行を対応付けないでください。",
    "fl-foot-html": "出典: <code>api.asy.life/dreps</code>（observatory CC0エクスポート、Koios由来）· 権威クラス A。期間に必要なスナップショットが揃っていない場合はnull。関連: <a href=\"concentration.html\">集中度</a> · <a href=\"governance-health.html\">ガバナンスの健全性</a>。「勝者・敗者」はありません。",
  },
};
if (typeof i18n !== "undefined") { Object.assign(i18n.en, PAGE_I18N.en); Object.assign(i18n.ja, PAGE_I18N.ja); if (typeof setLang === "function") setLang(currentLang()); }
function paintStatic() {
  const r = document.getElementById("fl-rule"); if (r) r.innerHTML = t("fl-rule-html");
  const f = document.getElementById("fl-foot"); if (f) f.innerHTML = t("fl-foot-html");
  const sel = document.getElementById("fl-window");
  if (sel && sel.options.length >= 2) { sel.options[0].textContent = t("fl-opt-7"); sel.options[1].textContent = t("fl-opt-30"); }
}

function authChip(cls) {
  if (!cls) return "";
  const legend = { A: "On-chain", B: "Official", C: "At-risk platform", D: "Community", E: "Researcher" };
  return ` <span class="auth-chip auth-${esc(cls)}" title="${esc(legend[cls] || "")}">${esc(cls)}</span>`;
}
// Small hero card mirroring rankings.js — the page's snapshot signal (as_of /
// snapshot date + source) from the cached payload's _quality. No refetch.
function renderHeroAside() {
  const el = document.getElementById("fl-hero-aside");
  if (!el) return;
  const q = state.quality || {};
  const m = state.meta || {};
  const asOf = q.as_of
    ? new Date(q.as_of).toLocaleString(NUM_LOCALE[currentLang()] || "en-US")
    : (m.snapshot_date || "—");
  const src = q.source || "observatory";
  el.innerHTML =
    `<div class="ha-label">${esc(t("fl-hero-snapshot"))}</div>` +
    `<div class="ha-value">${esc(asOf)}</div>` +
    `<div class="ha-sub">${esc(src)}${authChip(q.authority_class)}</div>`;
}

function wKey(d) { return state.window === "d7d" ? d.d7d_lovelace : d.d30d_lovelace; }
function dKey(d) { return state.window === "d7d" ? d.delegator_count_d7d : d.delegator_count_d30d; }
function refKey(d) { return state.window === "d7d" ? d.flow_reference_date_d7d : d.flow_reference_date_d30d; }

function row(d) {
  const name = d.name && d.name.trim() ? d.name : shortId(d.drep_id);
  return `<tr><td><a href="drep.html?id=${encodeURIComponent(d.drep_id)}">${esc(name)}</a><div class="pm-id">${esc(d.drep_id)}</div></td>
    <td>${fmtAda(wKey(d))}</td><td>${fmtSigned(dKey(d))}</td><td>${esc(refKey(d) || "—")}</td></tr>`;
}
function render() {
  renderHeroAside();
  const priced = state.dreps.filter((d) => wKey(d) != null);
  const inc = priced.filter((d) => wKey(d) > 0).sort((a, b) => wKey(b) - wKey(a)).slice(0, 15);
  const dec = priced.filter((d) => wKey(d) < 0).sort((a, b) => wKey(a) - wKey(b)).slice(0, 15);
  document.getElementById("fl-inc-b").innerHTML = inc.length ? inc.map(row).join("") : `<tr><td colspan="4" class="loading">${t("fl-none")}</td></tr>`;
  document.getElementById("fl-dec-b").innerHTML = dec.length ? dec.map(row).join("") : `<tr><td colspan="4" class="loading">${t("fl-none")}</td></tr>`;
  const m = state.meta || {};
  const days = state.window === "d7d" ? "7" : "30";
  document.getElementById("fl-meta").innerHTML =
    `<span class="meta-item"><span class="meta-label">${esc(t("fl-m-tracked"))}</span> ${state.dreps.length} (top-30)</span>` +
    `<span class="meta-item"><span class="meta-label">${esc(t("fl-m-snapshot"))}</span> ${esc(m.snapshot_date || "—")}</span>` +
    `<span class="meta-item"><span class="meta-label">${esc(t("fl-m-with"))} ${state.window} ${esc(t("fl-m-data"))}</span> ${priced.length}</span>` +
    `<span class="meta-item meta-item-right">${esc(t("fl-m-source"))}</span>`;
  // Honest accumulating-state banner: net flow needs two snapshots a full window
  // apart; until that history exists the window is null (never faked).
  const banner = document.getElementById("fl-accum");
  if (banner) {
    banner.style.display = priced.length ? "none" : "block";
    if (!priced.length) {
      banner.innerHTML = currentLang() === "ja"
        ? `<strong>${days}日間の純フローは蓄積中です。</strong> ${days}日離れた2つの日次スナップショットが揃うと表示されます。現在のスナップショット ${esc(m.snapshot_date || "—")}（エポック ${esc(String(m.epoch || "—"))}）。それまで値は<em>null</em>です — 補間も捏造もしません。`
        : `<strong>${days}-day net flow is accumulating.</strong> It populates once two daily snapshots a full ${days} days apart exist. Current snapshot ${esc(m.snapshot_date || "—")} (epoch ${esc(String(m.epoch || "—"))}). Values are <em>null</em> until then — never interpolated, never faked.`;
    }
  }
}
async function boot() {
  document.addEventListener("cdo-lang", () => { render(); paintStatic(); });
  paintStatic();
  const sel = document.getElementById("fl-window");
  sel.addEventListener("change", () => { state.window = sel.value; render(); });
  try {
    const r = await fetch(API + "/dreps?limit=30", { cache: "no-cache" });
    const j = await r.json();
    state.dreps = j.dreps || [];
    state.meta = { snapshot_date: j.snapshot_date, epoch: j.epoch };
    state.quality = j._quality || null;
    render();
  } catch (e) {
    document.getElementById("fl-inc-b").innerHTML = `<tr><td colspan="4" class="loading">Could not load /dreps.</td></tr>`;
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

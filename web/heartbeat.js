/* System heartbeat — live freshness of every Observatory data pipeline.
 * Governance ETL (meta.json: last_run + data_through), the market poller and
 * OHLCV ticks (/health freshness), and Data Layer API liveness (/health).
 * Each pipeline is classified Fresh / Warning / Stale against cadence-appropriate
 * thresholds so a silently-dead pipeline is caught in hours, not weeks.
 * Read-only, no inference — just timestamps and how old they are. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";
const DATA_ROOT = (typeof window !== "undefined" && window.dataRoot) ? window.dataRoot() : "/data/snapshots";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = { meta: null, health: null, error: null };

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(k) { const l = currentLang(); return (i18n[l] && i18n[l][k]) || (i18n.en[k] || k); }
function esc(s) { return s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/* Governance ETL: daily cadence. Warn after a missed day, stale after two. */
const ETL_WARN_S = 24 * 3600, ETL_STALE_S = 48 * 3600;
/* Pollers: 5-minute cadence (GeckoTerminal rate-limited). Generous tolerance. */
const POLL_WARN_S = 30 * 60, POLL_STALE_S = 2 * 3600;

const PAGE_I18N = {
  en: {
    "hb-title": "System heartbeat",
    "hb-lede": "Live freshness of every data pipeline behind the Observatory. Fresh, Warning, or Stale — so a silently dead pipeline is caught in hours, not weeks.",
    "hb-overall": "Overall", "hb-updated": "Checked",
    "hb-c-etl": "Governance ETL", "hb-c-poller": "Market poller", "hb-c-api": "Data Layer API",
    "hb-c-etl-sub": "daily DRep / treasury / governance snapshot",
    "hb-c-poller-sub": "market data + price ticks (every ~5 min)",
    "hb-c-api-sub": "read-only Data Layer (api.asy.life)",
    "hb-fresh": "Fresh", "hb-warning": "Warning", "hb-stale": "Stale", "hb-unknown": "Unknown",
    "hb-l-age": "Age", "hb-l-datathrough": "Data through", "hb-l-epoch": "Epoch",
    "hb-l-lastrun": "Last run", "hb-l-result": "Last result", "hb-l-ok": "success", "hb-l-fail": "FAILED",
    "hb-l-market": "Market data", "hb-l-ohlcv": "Price ticks", "hb-l-rows": "rows",
    "hb-l-uptime": "Uptime", "hb-l-routes": "Routes", "hb-l-responding": "Responding", "hb-l-down": "Not responding",
    "hb-thresh-title": "Status thresholds",
    "hb-thresh-html": "<p><strong>Governance ETL (daily):</strong> <span style=\"color:#1d6b46\">Fresh</span> &lt; 24h · <span style=\"color:#8a5a10\">Warning</span> ≥ 24h (a daily run was missed; escalates at 36h) · <span style=\"color:#963232\">Stale</span> ≥ 48h (two+ runs missed — the pipeline is likely down; follow the recovery procedure).</p><p><strong>Market poller (~5 min):</strong> Fresh &lt; 30m · Warning ≥ 30m · Stale ≥ 2h.</p><p><strong>Data Layer API:</strong> Fresh while it responds to <code>/health</code>; Stale if unreachable.</p><p>Movement only — timestamps and their age. No inference.</p>",
    "hb-err": "Couldn't reach the heartbeat sources. The Data Layer API or the snapshot files may be unavailable — which is itself a Stale signal.",
    "hb-na": "n/a", "hb-never": "never",
  },
  ja: {
    "hb-title": "システムハートビート",
    "hb-lede": "オブザーバトリーを支える各データパイプラインの鮮度をライブ表示。Fresh／Warning／Stale で、停止したパイプラインを数週間ではなく数時間で検知します。",
    "hb-overall": "総合", "hb-updated": "確認時刻",
    "hb-c-etl": "ガバナンス ETL", "hb-c-poller": "マーケットポーラー", "hb-c-api": "データレイヤー API",
    "hb-c-etl-sub": "日次の DRep／トレジャリー／ガバナンススナップショット",
    "hb-c-poller-sub": "マーケットデータ＋価格ティック（約5分ごと）",
    "hb-c-api-sub": "読み取り専用データレイヤー（api.asy.life）",
    "hb-fresh": "最新", "hb-warning": "警告", "hb-stale": "古い", "hb-unknown": "不明",
    "hb-l-age": "経過", "hb-l-datathrough": "データ対象日", "hb-l-epoch": "エポック",
    "hb-l-lastrun": "最終実行", "hb-l-result": "結果", "hb-l-ok": "成功", "hb-l-fail": "失敗",
    "hb-l-market": "マーケットデータ", "hb-l-ohlcv": "価格ティック", "hb-l-rows": "行",
    "hb-l-uptime": "稼働時間", "hb-l-routes": "ルート", "hb-l-responding": "応答中", "hb-l-down": "応答なし",
    "hb-thresh-title": "ステータスしきい値",
    "hb-thresh-html": "<p><strong>ガバナンス ETL（日次）:</strong> <span style=\"color:#1d6b46\">最新</span> 24時間未満 · <span style=\"color:#8a5a10\">警告</span> 24時間以上（日次実行が欠落、36時間で深刻化）· <span style=\"color:#963232\">古い</span> 48時間以上（2回以上欠落＝停止の可能性、復旧手順を実施）。</p><p><strong>マーケットポーラー（約5分）:</strong> 最新 30分未満 · 警告 30分以上 · 古い 2時間以上。</p><p><strong>データレイヤー API:</strong> <code>/health</code> が応答すれば最新、到達不能なら古い。</p><p>動きのみ — タイムスタンプとその経過時間。推論なし。</p>",
    "hb-err": "ハートビートのソースに到達できませんでした。データレイヤー API またはスナップショットファイルが利用できない可能性があり、それ自体が「古い」シグナルです。",
    "hb-na": "なし", "hb-never": "なし",
  },
};
if (typeof i18n !== "undefined") {
  Object.assign(i18n.en, PAGE_I18N.en);
  Object.assign(i18n.ja, PAGE_I18N.ja);
  if (typeof setLang === "function") setLang(currentLang());
}

function fmtAge(sec) {
  if (sec == null || !isFinite(sec)) return t("hb-na");
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}
function fmtTime(iso) {
  if (!iso) return t("hb-never");
  const d = new Date(iso);
  if (isNaN(d)) return esc(iso);
  return d.toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
}
function level(ageS, warnS, staleS) {
  if (ageS == null) return "unknown";
  if (ageS >= staleS) return "stale";
  if (ageS >= warnS) return "warning";
  return "fresh";
}
function worst(levels) {
  if (levels.includes("stale")) return "stale";
  if (levels.includes("unknown")) return "warning";
  if (levels.includes("warning")) return "warning";
  return levels.length ? "fresh" : "unknown";
}

function badge(lv) {
  return `<span class="hb-badge ${lv}"><span class="dot"></span>${esc(t("hb-" + lv))}</span>`;
}

/* Build the three pipeline cards from current state. Returns {html, levels[]}. */
function buildCards() {
  const now = Date.now();
  const cards = [];
  const levels = [];

  // 1) Governance ETL
  (() => {
    const m = state.meta;
    let lv = "unknown", ageS = null, rows = "";
    if (m) {
      const lr = m.last_run || {};
      const completed = lr.run_completed_at ? new Date(lr.run_completed_at).getTime() : null;
      ageS = completed ? (now - completed) / 1000 : null;
      lv = level(ageS, ETL_WARN_S, ETL_STALE_S);
      if (lr.success !== 1 && lr.success !== true) lv = lv === "fresh" ? "warning" : "stale";
      const ok = (lr.success === 1 || lr.success === true);
      rows = [
        `<div><span class="k">${esc(t("hb-l-datathrough"))}:</span> <b>${esc(m.data_through || t("hb-na"))}</b></div>`,
        `<div><span class="k">${esc(t("hb-l-epoch"))}:</span> <b>${m.tip_epoch != null ? esc(String(m.tip_epoch)) : t("hb-na")}</b></div>`,
        `<div><span class="k">${esc(t("hb-l-lastrun"))}:</span> <b>${esc(fmtTime(lr.run_completed_at))}</b></div>`,
        `<div><span class="k">${esc(t("hb-l-result"))}:</span> <b style="color:${ok ? "#1d6b46" : "#963232"}">${esc(ok ? t("hb-l-ok") : t("hb-l-fail"))}</b></div>`,
      ].join("");
    }
    levels.push(lv);
    cards.push(card(lv, t("hb-c-etl"), t("hb-c-etl-sub"), ageS, rows));
  })();

  // 2) Market poller (token_market + ohlcv from /health.freshness)
  (() => {
    const f = state.health && state.health.freshness;
    let lv = "unknown", ageS = null, rows = "";
    if (f) {
      const tmT = f.token_market_as_of ? new Date(f.token_market_as_of).getTime() : null;
      const ohT = f.ohlcv_latest ? new Date(f.ohlcv_latest).getTime() : null;
      const newest = Math.max(tmT || 0, ohT || 0) || null;
      ageS = newest ? (now - newest) / 1000 : null;
      lv = level(ageS, POLL_WARN_S, POLL_STALE_S);
      rows = [
        `<div><span class="k">${esc(t("hb-l-market"))}:</span> <b>${esc(fmtTime(f.token_market_as_of))}</b>${f.token_market_rows != null ? ` <span class="k">(${esc(String(f.token_market_rows))} ${esc(t("hb-l-rows"))})</span>` : ""}</div>`,
        `<div><span class="k">${esc(t("hb-l-ohlcv"))}:</span> <b>${esc(fmtTime(f.ohlcv_latest))}</b></div>`,
      ].join("");
    } else if (state.health) {
      rows = `<div><span class="k">${esc(t("hb-l-market"))}:</span> <b>${esc(t("hb-na"))}</b></div>`;
    }
    levels.push(lv);
    cards.push(card(lv, t("hb-c-poller"), t("hb-c-poller-sub"), ageS, rows));
  })();

  // 3) Data Layer API liveness
  (() => {
    const h = state.health;
    let lv = "unknown", ageS = null, rows = "";
    if (h && h.ok) {
      lv = "fresh"; ageS = null;
      rows = [
        `<div><span class="k">${esc(t("hb-l-responding"))}</span></div>`,
        `<div><span class="k">${esc(t("hb-l-uptime"))}:</span> <b>${esc(fmtAge(h.uptime_s))}</b></div>`,
        `<div><span class="k">${esc(t("hb-l-routes"))}:</span> <b>${h.routes != null ? esc(String(h.routes)) : t("hb-na")}</b></div>`,
      ].join("");
    } else {
      lv = "stale";
      rows = `<div><span class="k">${esc(t("hb-l-down"))}</span></div>`;
    }
    levels.push(lv);
    // API card shows status, not an age number.
    cards.push(card(lv, t("hb-c-api"), t("hb-c-api-sub"), null, rows, true));
  })();

  return { html: cards.join(""), levels };
}

function card(lv, name, sub, ageS, rows, hideAge) {
  const ageBlock = hideAge ? "" : `<div class="hb-age">${esc(fmtAge(ageS))}</div><div class="hb-rows" style="margin-top:0"><span class="k">${esc(t("hb-l-age"))}</span></div>`;
  return `<div class="hb-card ${lv}">
    <div class="hb-head"><span class="hb-name">${esc(name)}</span>${badge(lv)}</div>
    <div class="hb-rows" style="margin-top:6px"><span class="k">${esc(sub)}</span></div>
    ${ageBlock}
    <div class="hb-rows">${rows}</div>
  </div>`;
}

function renderHeroAside(overall) {
  const el = document.getElementById("hb-hero-aside");
  if (!el) return;
  el.innerHTML =
    `<div class="ha-label">${esc(t("hb-overall"))}</div>` +
    `<div class="ha-value hb-overall">${badge(overall)}</div>` +
    `<div class="ha-sub">${esc(t("hb-updated"))}: ${esc(new Date().toLocaleTimeString(NUM_LOCALE[currentLang()] || "en-US"))}</div>`;
}

function renderThresholds() {
  const tt = document.getElementById("hb-thresh-title"); if (tt) tt.textContent = t("hb-thresh-title");
  const b = document.getElementById("hb-thresh-body"); if (b) b.innerHTML = t("hb-thresh-html");
}

function render() {
  renderThresholds();
  const grid = document.getElementById("hb-grid");
  if (!grid) return;
  if (state.error && !state.meta && !state.health) {
    grid.innerHTML = `<div class="rank-empty" style="grid-column:1/-1">${esc(t("hb-err"))}</div>`;
    renderHeroAside("stale");
    return;
  }
  const { html, levels } = buildCards();
  grid.innerHTML = html;
  renderHeroAside(worst(levels));
}

async function load() {
  const getJson = async (url) => { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) throw new Error(r.status); return r.json(); };
  const [meta, health] = await Promise.allSettled([
    getJson(`${DATA_ROOT}/meta.json`),
    getJson(`${API}/health`),
  ]);
  state.meta = meta.status === "fulfilled" ? meta.value : null;
  state.health = health.status === "fulfilled" ? health.value : null;
  state.error = (!state.meta && !state.health);
  render();
}

function boot() {
  document.addEventListener("cdo-lang", render);
  render();      // paint thresholds/labels immediately
  load();        // then fetch live signals
  setInterval(load, 60000); // auto-refresh every 60s
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

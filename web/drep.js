/* Cardano Delegation Observatory — per-DRep standalone page logic. */

"use strict";

const DATA_ROOT = "/data/snapshots";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };
const LOVELACE_PER_ADA = 1_000_000;

const state = {
  detail: null,
  drepId: null,
  showAllVotes: false,
};

function currentLang() {
  return (document.documentElement.lang === "ja") ? "ja" : "en";
}

function t(key) {
  const lang = currentLang();
  return (i18n[lang] && i18n[lang][key]) || (i18n.en[key] || key);
}

function fmtNum(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
}

function safeText(s) { return s == null ? "" : String(s); }

function drepIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return res.json();
}

/* ── chart ──────────────────────────────────────────────────────────── */

function buildChart(series) {
  const W = 720, H = 240, PAD_L = 64, PAD_R = 16, PAD_T = 16, PAD_B = 32;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const values = series.map(p => Number(p.lovelace));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = Math.max(1, maxV - minV);
  const yMin = minV - range * 0.04;
  const yMax = maxV + range * 0.04;
  const yScale = (v) => PAD_T + (innerH * (1 - (v - yMin) / (yMax - yMin || 1)));
  const xScale = (i) => PAD_L + (innerW * (series.length === 1 ? 0.5 : i / (series.length - 1)));

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const lang = currentLang();
  const adaFmt = (lovelace) => Math.round(lovelace / 1_000_000).toLocaleString(NUM_LOCALE[lang] || "en-US");
  for (const yl of [{ y: PAD_T, v: yMax }, { y: PAD_T + innerH, v: yMin }]) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", PAD_L - 8);
    text.setAttribute("y", yl.y + 4);
    text.setAttribute("text-anchor", "end");
    text.setAttribute("class", "chart-label");
    text.textContent = adaFmt(yl.v);
    svg.appendChild(text);
  }
  for (const xl of [
    { x: PAD_L, label: series[0].date, anchor: "start" },
    { x: PAD_L + innerW, label: series[series.length - 1].date, anchor: "end" },
  ]) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", xl.x);
    text.setAttribute("y", PAD_T + innerH + 20);
    text.setAttribute("text-anchor", xl.anchor);
    text.setAttribute("class", "chart-label");
    text.textContent = xl.label;
    svg.appendChild(text);
  }
  const frame = document.createElementNS("http://www.w3.org/2000/svg", "line");
  frame.setAttribute("x1", PAD_L);
  frame.setAttribute("y1", PAD_T + innerH);
  frame.setAttribute("x2", PAD_L + innerW);
  frame.setAttribute("y2", PAD_T + innerH);
  frame.setAttribute("class", "chart-axis");
  svg.appendChild(frame);

  const pts = series.map((p, i) => `${xScale(i)},${yScale(Number(p.lovelace))}`).join(" ");
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", pts);
  polyline.setAttribute("class", "chart-line");
  svg.appendChild(polyline);

  if (series.length <= 30) {
    for (let i = 0; i < series.length; i++) {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", xScale(i));
      dot.setAttribute("cy", yScale(Number(series[i].lovelace)));
      dot.setAttribute("r", 2);
      dot.setAttribute("class", "chart-dot");
      svg.appendChild(dot);
    }
  }
  return svg;
}

/* ── render ─────────────────────────────────────────────────────────── */

function render() {
  const d = state.detail;
  if (!d) {
    document.getElementById("drep-name").textContent = t("drep-not-found");
    return;
  }

  document.getElementById("drep-name").textContent = d.name || "—";
  document.getElementById("drep-id-full").textContent = state.drepId || "";

  /* Stats */
  const latestSnap = d.voting_weight_series && d.voting_weight_series.length
    ? d.voting_weight_series[d.voting_weight_series.length - 1]
    : null;
  const weightAda = latestSnap ? Math.trunc(Number(latestSnap.lovelace) / LOVELACE_PER_ADA) : null;
  document.getElementById("stat-weight").textContent = fmtNum(weightAda);
  /* delegator count + last vote epoch come from latest snapshot via top30, but
   * we don't have access here. Fall back to vote_history for last vote. */
  const lastVoteEpoch = d.vote_history && d.vote_history.length
    ? Math.max(...d.vote_history.map(v => v.vote_epoch))
    : null;
  document.getElementById("stat-lastvote").textContent = lastVoteEpoch == null ? "—" : fmtNum(lastVoteEpoch);
  document.getElementById("stat-votes").textContent = d.vote_history ? fmtNum(d.vote_history.length) : "—";
  /* Delegator count not in the per-DRep file; needs top30 cross-ref */
  document.getElementById("stat-delegators").textContent = "—";

  /* Chart */
  const chartWrap = document.getElementById("drep-chart-wrap");
  chartWrap.innerHTML = "";
  if (d.voting_weight_series && d.voting_weight_series.length >= 2) {
    chartWrap.appendChild(buildChart(d.voting_weight_series));
  } else {
    const empty = document.createElement("div");
    empty.className = "chart-empty";
    empty.textContent = t("ex-chart-empty");
    chartWrap.appendChild(empty);
  }

  /* Metadata row */
  const metaRow = document.getElementById("drep-meta-row");
  metaRow.innerHTML = "";
  if (d.metadata_url) {
    const a = document.createElement("a");
    a.href = d.metadata_url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = d.metadata_url;
    metaRow.appendChild(a);
  } else {
    metaRow.className = "delta-empty";
    metaRow.textContent = t("ex-meta-none");
  }

  /* Vote history */
  const votesWrap = document.getElementById("drep-votes-wrap");
  votesWrap.innerHTML = "";
  if (!d.vote_history || d.vote_history.length === 0) {
    const none = document.createElement("div");
    none.className = "delta-empty";
    none.textContent = t("ex-votes-none");
    votesWrap.appendChild(none);
    return;
  }

  const tbl = document.createElement("table");
  tbl.className = "vote-table";
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  for (const k of ["ex-vote-col-epoch", "ex-vote-col-vote", "ex-vote-col-action", "ex-vote-col-outcome"]) {
    const th = document.createElement("th");
    th.textContent = t(k);
    trh.appendChild(th);
  }
  thead.appendChild(trh);
  tbl.appendChild(thead);

  const tbody = document.createElement("tbody");
  const INITIAL = 20;
  const limit = state.showAllVotes ? d.vote_history.length : Math.min(INITIAL, d.vote_history.length);
  for (let i = 0; i < limit; i++) {
    const v = d.vote_history[i];
    const tr = document.createElement("tr");
    const tdE = document.createElement("td");
    tdE.textContent = v.vote_epoch == null ? "—" : String(v.vote_epoch);
    tr.appendChild(tdE);
    const tdV = document.createElement("td");
    tdV.className = "vote-cell";
    tdV.textContent = safeText(v.vote);
    tr.appendChild(tdV);
    const tdA = document.createElement("td");
    tdA.className = "vote-action-title";
    const titleNode = document.createElement("div");
    titleNode.textContent = v.title || v.action_id || "—";
    tdA.appendChild(titleNode);
    if (v.action_type) {
      const type = document.createElement("div");
      type.className = "vote-action-type";
      type.textContent = safeText(v.action_type);
      tdA.appendChild(type);
    }
    tr.appendChild(tdA);
    const tdO = document.createElement("td");
    tdO.className = "vote-cell";
    tdO.textContent = safeText(v.outcome) || "—";
    tr.appendChild(tdO);
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  votesWrap.appendChild(tbl);

  if (!state.showAllVotes && d.vote_history.length > INITIAL) {
    const more = document.createElement("div");
    more.className = "vote-show-more";
    more.textContent = t("ex-show-more") + ` (${d.vote_history.length - INITIAL})`;
    more.addEventListener("click", () => { state.showAllVotes = true; render(); });
    votesWrap.appendChild(more);
  }
}

/* ── boot ───────────────────────────────────────────────────────────── */

async function boot() {
  state.drepId = drepIdFromUrl();
  document.addEventListener("cdo-lang", () => render());
  if (!state.drepId) {
    document.getElementById("drep-name").textContent = t("drep-not-found");
    document.getElementById("drep-id-full").textContent = t("drep-no-id");
    return;
  }
  try {
    state.detail = await fetchJson(`${DATA_ROOT}/dreps/${state.drepId}.json`);
    render();
    document.title = `${state.detail.name || state.drepId.slice(0, 20)} — Cardano Delegation Observatory`;
  } catch (err) {
    console.error("drep boot failed", err);
    state.detail = null;
    document.getElementById("drep-name").textContent = t("drep-not-found");
    document.getElementById("drep-id-full").textContent = state.drepId;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

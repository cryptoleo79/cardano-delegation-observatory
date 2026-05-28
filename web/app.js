/* Cardano Delegation Observatory — frontend logic.
 * Loads top30.json + meta.json, renders sortable table,
 * lazy-loads per-DRep history on row expand, draws a small SVG chart.
 * No external libraries. No editorial fields. Numbers only. */

"use strict";

const DATA_ROOT = "/data/snapshots";
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = {
  top30: null,
  meta: null,
  sortKey: "voting_weight_ada",
  sortDir: "desc",
  expandedDrepId: null,
  drepCache: new Map(),
};

/* ── helpers ──────────────────────────────────────────────────────────── */

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

function fmtDelta(lovelace) {
  if (lovelace === null || lovelace === undefined) return null;
  const ada = Math.trunc(Number(lovelace) / 1_000_000);
  const sign = ada > 0 ? "+" : "";
  return sign + ada.toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
}

function shortId(drepId) {
  if (!drepId) return "";
  if (drepId.length <= 18) return drepId;
  return drepId.slice(0, 12) + "…" + drepId.slice(-4);
}

function safeText(s) {
  /* Defensive: any string from JSON could in principle contain HTML.
   * We never use innerHTML on data values; this helper exists so the
   * pattern is explicit at call sites. */
  return s == null ? "" : String(s);
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return res.json();
}

/* ── meta strip ───────────────────────────────────────────────────────── */

function renderMeta(meta) {
  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v == null ? "—" : String(v);
  };
  setText("m-epoch", meta && meta.tip_epoch);
  setText("m-date", meta && meta.data_through);

  const statusEl = document.getElementById("m-status");
  if (!statusEl) return;
  if (!meta || !meta.last_run) {
    statusEl.textContent = t("m-status-loading");
    return;
  }
  const lr = meta.last_run;
  if (!lr.success) {
    statusEl.textContent = t("m-status-error");
    return;
  }
  /* Staleness check: data_through older than 36h is "stale". */
  const dt = meta.data_through ? new Date(meta.data_through + "T00:00:00Z").getTime() : null;
  const ageHours = dt ? (Date.now() - dt) / 36e5 : null;
  if (ageHours !== null && ageHours > 36) {
    statusEl.textContent = t("m-status-stale");
  } else {
    statusEl.textContent = t("m-status-ok");
  }
}

/* ── table ────────────────────────────────────────────────────────────── */

function sortedEntries() {
  const entries = state.top30 ? state.top30.entries.slice() : [];
  const key = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;
  entries.sort((a, b) => {
    const av = a[key], bv = b[key];
    /* null sorts to the bottom regardless of direction */
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string" || typeof bv === "string") {
      return String(av).localeCompare(String(bv)) * dir;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    /* tie-break by drep_id ascending for determinism */
    return String(a.drep_id).localeCompare(String(b.drep_id));
  });
  return entries;
}

function renderTable() {
  const tbody = document.getElementById("dreps-tbody");
  if (!tbody) return;
  const entries = sortedEntries();
  if (entries.length === 0) {
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "loading";
    td.textContent = t("load-error");
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  tbody.innerHTML = "";
  for (const e of entries) {
    const tr = document.createElement("tr");
    tr.dataset.drepId = e.drep_id;

    const tdRank = document.createElement("td");
    tdRank.className = "col-rank";
    tdRank.textContent = e.rank;
    tr.appendChild(tdRank);

    const tdName = document.createElement("td");
    tdName.className = "name-cell";
    const nameSpan = document.createElement("span");
    nameSpan.className = "drep-name";
    nameSpan.textContent = e.name || "—";
    const idSpan = document.createElement("span");
    idSpan.className = "drep-id-short";
    idSpan.textContent = shortId(e.drep_id);
    tdName.appendChild(nameSpan);
    tdName.appendChild(idSpan);
    tr.appendChild(tdName);

    const tdWeight = document.createElement("td");
    tdWeight.className = "col-num";
    tdWeight.textContent = fmtNum(e.voting_weight_ada);
    tr.appendChild(tdWeight);

    const tdDeleg = document.createElement("td");
    tdDeleg.className = "col-num";
    tdDeleg.textContent = fmtNum(e.delegator_count);
    tr.appendChild(tdDeleg);

    const tdD7 = document.createElement("td");
    tdD7.className = "col-num delta-cell";
    const d7 = fmtDelta(e.d7d_lovelace);
    if (d7 === null) { tdD7.textContent = "—"; tdD7.classList.add("delta-empty"); }
    else tdD7.textContent = d7;
    tr.appendChild(tdD7);

    const tdD30 = document.createElement("td");
    tdD30.className = "col-num delta-cell";
    const d30 = fmtDelta(e.d30d_lovelace);
    if (d30 === null) { tdD30.textContent = "—"; tdD30.classList.add("delta-empty"); }
    else tdD30.textContent = d30;
    tr.appendChild(tdD30);

    const tdVote = document.createElement("td");
    tdVote.className = "col-num";
    tdVote.textContent = (e.last_vote_epoch == null) ? "—" : fmtNum(e.last_vote_epoch);
    tr.appendChild(tdVote);

    tr.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleExpand(e.drep_id, tr);
    });

    tbody.appendChild(tr);

    if (state.expandedDrepId === e.drep_id) {
      const expandTr = buildExpandRow(e.drep_id);
      tr.classList.add("expanded");
      tbody.appendChild(expandTr);
    }
  }
  updateSortArrows();
}

function updateSortArrows() {
  const ths = document.querySelectorAll("table.observatory thead th");
  ths.forEach((th) => {
    th.classList.remove("sorted");
    th.removeAttribute("data-arrow");
    if (th.dataset.sort === state.sortKey) {
      th.classList.add("sorted");
      th.setAttribute("data-arrow", state.sortDir === "asc" ? "↑" : "↓");
    }
  });
}

function onSortClick(ev) {
  const th = ev.currentTarget;
  const key = th.dataset.sort;
  if (!key) return;
  if (state.sortKey === key) {
    state.sortDir = (state.sortDir === "asc") ? "desc" : "asc";
  } else {
    state.sortKey = key;
    /* default direction per field type: numeric fields desc, name asc */
    state.sortDir = (key === "name") ? "asc" : "desc";
  }
  renderTable();
}

/* ── expand row ───────────────────────────────────────────────────────── */

function toggleExpand(drepId, tr) {
  const tbody = tr.parentElement;
  /* close any existing expanded row */
  if (state.expandedDrepId === drepId) {
    state.expandedDrepId = null;
    renderTable();
    return;
  }
  state.expandedDrepId = drepId;
  renderTable();
  /* lazy-load detail JSON */
  if (!state.drepCache.has(drepId)) {
    fetchJson(`${DATA_ROOT}/dreps/${drepId}.json`)
      .then((data) => {
        state.drepCache.set(drepId, data);
        if (state.expandedDrepId === drepId) renderTable();
      })
      .catch((err) => {
        console.warn("drep detail load failed", drepId, err);
        state.drepCache.set(drepId, { error: true });
        if (state.expandedDrepId === drepId) renderTable();
      });
  }
}

function buildExpandRow(drepId) {
  const tr = document.createElement("tr");
  tr.className = "expand-row";
  const td = document.createElement("td");
  td.colSpan = 7;

  const inner = document.createElement("div");
  inner.className = "expand-inner";

  const cached = state.drepCache.get(drepId);

  /* Full DRep ID + open-detail link */
  const idLabel = document.createElement("div");
  idLabel.className = "expand-section-label";
  idLabel.textContent = t("ex-id-label");
  inner.appendChild(idLabel);
  const idVal = document.createElement("div");
  idVal.className = "full-id";
  idVal.textContent = drepId;
  inner.appendChild(idVal);

  const openLink = document.createElement("a");
  openLink.href = `drep.html?id=${encodeURIComponent(drepId)}`;
  openLink.className = "vote-show-more";
  openLink.textContent = t("view-detail-link");
  inner.appendChild(openLink);

  /* Metadata source */
  const metaLabel = document.createElement("div");
  metaLabel.className = "expand-section-label";
  metaLabel.textContent = t("ex-meta-label");
  metaLabel.style.marginTop = "12px";
  inner.appendChild(metaLabel);
  const metaVal = document.createElement("div");
  if (cached && cached.metadata_url) {
    const a = document.createElement("a");
    a.href = cached.metadata_url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = cached.metadata_url;
    metaVal.appendChild(a);
  } else {
    metaVal.className = "delta-empty";
    metaVal.textContent = (cached && !cached.error) ? t("ex-meta-none") : "…";
  }
  inner.appendChild(metaVal);

  /* Chart */
  const chartSec = document.createElement("div");
  chartSec.className = "expand-section";
  const chartLabel = document.createElement("div");
  chartLabel.className = "expand-section-label";
  chartLabel.textContent = t("ex-chart-label");
  chartSec.appendChild(chartLabel);
  const chartWrap = document.createElement("div");
  chartWrap.className = "chart-wrap";
  if (cached && cached.voting_weight_series && cached.voting_weight_series.length >= 2) {
    chartWrap.appendChild(buildChart(cached.voting_weight_series));
  } else {
    const empty = document.createElement("div");
    empty.className = "chart-empty";
    empty.textContent = t("ex-chart-empty");
    chartWrap.appendChild(empty);
  }
  chartSec.appendChild(chartWrap);
  inner.appendChild(chartSec);

  /* Vote history */
  const voteSec = document.createElement("div");
  voteSec.className = "expand-section";
  const voteLabel = document.createElement("div");
  voteLabel.className = "expand-section-label";
  voteLabel.textContent = t("ex-votes-label");
  voteSec.appendChild(voteLabel);

  if (cached && cached.vote_history && cached.vote_history.length > 0) {
    voteSec.appendChild(buildVoteTable(cached.vote_history));
  } else if (cached && cached.vote_history && cached.vote_history.length === 0) {
    const none = document.createElement("div");
    none.className = "delta-empty";
    none.textContent = t("ex-votes-none");
    voteSec.appendChild(none);
  } else {
    const loading = document.createElement("div");
    loading.className = "delta-empty";
    loading.textContent = "…";
    voteSec.appendChild(loading);
  }
  inner.appendChild(voteSec);

  td.appendChild(inner);
  tr.appendChild(td);
  return tr;
}

/* ── SVG chart ────────────────────────────────────────────────────────── */

function buildChart(series) {
  /* series: [{date: "YYYY-MM-DD", lovelace: int}, ...] */
  const W = 720, H = 220, PAD_L = 56, PAD_R = 16, PAD_T = 12, PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const values = series.map(p => Number(p.lovelace));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  /* Add 4% padding to range so the line isn't pinned to edges. */
  const range = Math.max(1, maxV - minV);
  const yMin = minV - range * 0.04;
  const yMax = maxV + range * 0.04;
  const yScale = (v) => PAD_T + (innerH * (1 - (v - yMin) / (yMax - yMin || 1)));
  const xScale = (i) => PAD_L + (innerW * (series.length === 1 ? 0.5 : i / (series.length - 1)));

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  /* Y-axis labels: 2 lines (min, max in ADA) */
  const lang = currentLang();
  const adaFmt = (lovelace) => Math.round(lovelace / 1_000_000).toLocaleString(NUM_LOCALE[lang] || "en-US");
  const yLabels = [
    { y: PAD_T, value: yMax },
    { y: PAD_T + innerH, value: yMin },
  ];
  for (const yl of yLabels) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", PAD_L - 8);
    text.setAttribute("y", yl.y + 4);
    text.setAttribute("text-anchor", "end");
    text.setAttribute("class", "chart-label");
    text.textContent = adaFmt(yl.value);
    svg.appendChild(text);
  }

  /* X-axis: first + last date */
  const xLabels = [
    { x: PAD_L, label: series[0].date, anchor: "start" },
    { x: PAD_L + innerW, label: series[series.length - 1].date, anchor: "end" },
  ];
  for (const xl of xLabels) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", xl.x);
    text.setAttribute("y", PAD_T + innerH + 18);
    text.setAttribute("text-anchor", xl.anchor);
    text.setAttribute("class", "chart-label");
    text.textContent = xl.label;
    svg.appendChild(text);
  }

  /* Plot frame */
  const frame = document.createElementNS("http://www.w3.org/2000/svg", "line");
  frame.setAttribute("x1", PAD_L);
  frame.setAttribute("y1", PAD_T + innerH);
  frame.setAttribute("x2", PAD_L + innerW);
  frame.setAttribute("y2", PAD_T + innerH);
  frame.setAttribute("class", "chart-axis");
  svg.appendChild(frame);

  /* Line */
  const pts = series.map((p, i) => `${xScale(i)},${yScale(Number(p.lovelace))}`).join(" ");
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", pts);
  polyline.setAttribute("class", "chart-line");
  svg.appendChild(polyline);

  /* Dots — only if series is short, otherwise clutter */
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

/* ── vote history table ───────────────────────────────────────────────── */

function buildVoteTable(votes) {
  const wrap = document.createElement("div");
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
  const INITIAL = 10;
  const showAll = votes._showAll === true;
  const limit = showAll ? votes.length : Math.min(INITIAL, votes.length);
  for (let i = 0; i < limit; i++) {
    const v = votes[i];
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
  wrap.appendChild(tbl);

  if (!showAll && votes.length > INITIAL) {
    const more = document.createElement("div");
    more.className = "vote-show-more";
    more.textContent = t("ex-show-more") + ` (${votes.length - INITIAL})`;
    more.addEventListener("click", (ev) => {
      ev.stopPropagation();
      votes._showAll = true;
      renderTable();
    });
    wrap.appendChild(more);
  }
  return wrap;
}

/* ── boot ─────────────────────────────────────────────────────────────── */

async function boot() {
  document.querySelectorAll("table.observatory thead th").forEach((th) => {
    if (th.dataset.sort) th.addEventListener("click", onSortClick);
  });

  document.addEventListener("cdo-lang", () => {
    /* Re-render dynamic content in the new locale. */
    renderMeta(state.meta);
    renderTable();
  });

  try {
    const [top30, meta] = await Promise.all([
      fetchJson(`${DATA_ROOT}/top30.json`),
      fetchJson(`${DATA_ROOT}/meta.json`),
    ]);
    state.top30 = top30;
    state.meta = meta;
    renderMeta(meta);
    renderTable();
  } catch (err) {
    console.error("boot failed", err);
    state.top30 = { entries: [] };
    state.meta = null;
    renderMeta(null);
    renderTable();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

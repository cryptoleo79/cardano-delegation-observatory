/* Cardano Delegation Observatory — frontend logic.
 * Loads top30.json + meta.json, renders sortable table,
 * lazy-loads per-DRep history on row expand, draws a small SVG chart.
 * No external libraries. No editorial fields. Numbers only. */

"use strict";

const DATA_ROOT_DEFAULT = "/data/snapshots";
function DATA_ROOT() {
  return (typeof window !== "undefined" && window.dataRoot) ? window.dataRoot() : DATA_ROOT_DEFAULT;
}
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = {
  top30: null,
  meta: null,
  liveMeta: null,
  liveRecentVotes: null,
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

/* A leaderboard delta cell: arrow + magnitude, colored green (up) / red (down).
 * `raw` gives the direction; `formatted` is the already-signed display string. */
function deltaCell(raw, formatted) {
  const td = document.createElement("td");
  td.className = "col-num delta-cell";
  if (formatted == null || raw == null) { td.textContent = "—"; td.classList.add("delta-empty"); return td; }
  const mag = String(formatted).replace(/^[+-]/, "");
  if (raw > 0) { td.classList.add("delta-up"); td.textContent = "▲ " + mag; }
  else if (raw < 0) { td.classList.add("delta-down"); td.textContent = "▼ " + mag; }
  else { td.classList.add("delta-flat"); td.textContent = mag; }
  return td;
}

/* Signed integer delta (e.g. delegator-count change) — no lovelace scaling. */
function fmtDeltaCount(n) {
  if (n === null || n === undefined) return null;
  const v = Number(n);
  const sign = v > 0 ? "+" : "";
  return sign + v.toLocaleString(NUM_LOCALE[currentLang()] || "en-US");
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

/* ── metric cards ─────────────────────────────────────────────────────── */

const HOME_ICON = {
  dreps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  weight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M5 7l7-4 7 4"/><path d="M5 7l-3 6a4 4 0 0 0 6 0z"/><path d="M19 7l3 6a4 4 0 0 1-6 0z"/></svg>',
  delegators: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  epoch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
};

function fmtCompactAda(n) {
  if (n == null || !isFinite(n)) return "—";
  return "₳" + Number(n).toLocaleString(NUM_LOCALE[currentLang()] || "en-US", { notation: "compact", maximumFractionDigits: 2 });
}

function metricCard(icon, value, label, sub) {
  return `<div class="metric-card">
    <div class="mc-icon">${icon}</div>
    <div class="mc-value">${value}</div>
    <div class="mc-label">${label}</div>
    <div class="mc-sub">${sub}</div>
  </div>`;
}

function renderMetrics() {
  const el = document.getElementById("home-metrics");
  if (!el) return;
  const entries = (state.top30 && state.top30.entries) || [];
  if (!entries.length) { el.innerHTML = ""; return; }
  const totalWeight = entries.reduce((s, e) => s + (Number(e.voting_weight_ada) || 0), 0);
  const totalDeleg = entries.reduce((s, e) => s + (Number(e.delegator_count) || 0), 0);
  const epoch = state.meta && state.meta.tip_epoch;
  el.innerHTML = [
    metricCard(HOME_ICON.dreps, fmtNum(entries.length), t("home-m-dreps"), t("home-m-dreps-sub")),
    metricCard(HOME_ICON.weight, fmtCompactAda(totalWeight), t("home-m-weight"), t("home-m-weight-sub")),
    metricCard(HOME_ICON.delegators, fmtNum(totalDeleg), t("home-m-delegators"), t("home-m-delegators-sub")),
    metricCard(HOME_ICON.epoch, epoch == null ? "—" : fmtNum(epoch), t("home-m-epoch"), t("home-m-epoch-sub")),
  ].join("");
}

/* ── ecosystem scale band (live platform metrics) ─────────────────────── */

const SCALE_API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";

const SCALE_ICON = {
  projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/></svg>',
  categories: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  tokens: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3 3.9V15"/><line x1="12" y1="17" x2="12" y2="17.01"/></svg>',
  catalyst: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  actions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  treasury: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  api: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
};

function scaleCard(icon, value, label, href) {
  return `<a class="metric-card is-link" href="${href}">
    <div class="mc-icon">${icon}</div>
    <div class="mc-value">${value}</div>
    <div class="mc-label">${label}</div>
  </a>`;
}

async function renderScale() {
  const el = document.getElementById("home-scale");
  if (!el) return;
  const get = async (p) => { try { const r = await fetch(SCALE_API + p, { cache: "no-cache" }); return r.ok ? await r.json() : null; } catch { return null; } };
  const [proj, cats, funds, top, acts, treas, health] = await Promise.all([
    get("/projects?limit=1"), get("/categories"), get("/funds"),
    get("/tokens/top?by=mcap&limit=1"), get("/actions?limit=1"), get("/treasury"), get("/health"),
  ]);
  const n = (v) => (v == null ? "—" : fmtNum(v));
  const cards = [
    scaleCard(SCALE_ICON.projects, n(proj && proj.total), t("scale-projects"), "projects.html"),
    scaleCard(SCALE_ICON.categories, n(cats && cats.count), t("scale-categories"), "ecosystem.html"),
    scaleCard(SCALE_ICON.tokens, n(top && (top.universe ?? top.tracked_units)), t("scale-tokens"), "rankings.html"),
    scaleCard(SCALE_ICON.catalyst, n(funds && funds.total_funds), t("scale-funds"), "catalyst.html"),
    scaleCard(SCALE_ICON.actions, n(acts && acts.total), t("scale-actions"), "actions.html"),
    scaleCard(SCALE_ICON.treasury, n(treas && treas.n_epochs), t("scale-epochs"), "treasury.html"),
    scaleCard(SCALE_ICON.api, n(health && health.routes), t("scale-routes"), "https://api.asy.life/docs"),
  ];
  el.innerHTML = cards.join("");
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
    td.colSpan = 9;
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

    /* Voting-weight net change (ADA) over 7d / 30d. */
    tr.appendChild(deltaCell(e.d7d_lovelace, fmtDelta(e.d7d_lovelace)));
    tr.appendChild(deltaCell(e.d30d_lovelace, fmtDelta(e.d30d_lovelace)));

    const tdDeleg = document.createElement("td");
    tdDeleg.className = "col-num";
    tdDeleg.textContent = fmtNum(e.delegator_count);
    tr.appendChild(tdDeleg);

    /* Delegator-count net change over 7d / 30d — same treatment as voting weight. */
    tr.appendChild(deltaCell(e.delegator_count_d7d, fmtDeltaCount(e.delegator_count_d7d)));
    tr.appendChild(deltaCell(e.delegator_count_d30d, fmtDeltaCount(e.delegator_count_d30d)));

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
    fetchJson(`${DATA_ROOT()}/dreps/${drepId}.json`)
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
  td.colSpan = 9;

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
    tdV.textContent = window.cdoEnum("vote", v.vote);
    tr.appendChild(tdV);

    const tdA = document.createElement("td");
    tdA.className = "vote-action-title";
    const titleNode = document.createElement("div");
    titleNode.textContent = v.title || v.action_id || "—";
    tdA.appendChild(titleNode);
    if (v.action_type) {
      const type = document.createElement("div");
      type.className = "vote-action-type";
      type.textContent = window.cdoEnum("action_type", v.action_type);
      tdA.appendChild(type);
    }
    tr.appendChild(tdA);

    const tdO = document.createElement("td");
    tdO.className = "vote-cell";
    tdO.textContent = v.outcome ? window.cdoEnum("outcome", v.outcome) : "—";
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

/* ── live layer rendering ─────────────────────────────────────────────── */

function fmtUtcTimestamp(unix) {
  if (unix == null) return "—";
  const d = new Date(Number(unix) * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm} UTC`;
}

function fmtUtcIsoToDisplay(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return fmtUtcTimestamp(Math.floor(d.getTime() / 1000));
}

function renderLiveBadge(liveMeta) {
  const wrap = document.getElementById("live-badge-wrap");
  const refresh = document.getElementById("live-last-refresh");
  if (!wrap || !refresh) return;
  if (!liveMeta || !liveMeta.last_run_success) {
    wrap.style.display = "";
    refresh.textContent = liveMeta
      ? `last successful refresh: ${fmtUtcIsoToDisplay(liveMeta.last_run_completed_at) || "—"} (current run failed)`
      : "telemetry pending";
    return;
  }
  wrap.style.display = "";
  /* Show the absolute UTC timestamp of last successful run. */
  refresh.textContent = `last refresh ${fmtUtcIsoToDisplay(liveMeta.last_run_completed_at)}`;
}

function renderRecentActivity(payload) {
  const section = document.getElementById("recent-activity-section");
  const tbody = document.getElementById("recent-activity-tbody");
  if (!section || !tbody) return;
  if (!payload || !payload.votes || payload.votes.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  tbody.innerHTML = "";
  for (const v of payload.votes) {
    const tr = document.createElement("tr");

    const tdTime = document.createElement("td");
    tdTime.textContent = fmtUtcTimestamp(v.vote_block_time);
    tdTime.className = "col-num";
    tr.appendChild(tdTime);

    const tdEpoch = document.createElement("td");
    tdEpoch.textContent = v.vote_epoch == null ? "—" : String(v.vote_epoch);
    tdEpoch.className = "col-num";
    tr.appendChild(tdEpoch);

    const tdDrep = document.createElement("td");
    const a = document.createElement("a");
    a.href = `drep.html?id=${encodeURIComponent(v.drep_id)}`;
    a.textContent = v.drep_name || (v.drep_id ? v.drep_id.slice(0, 16) + "…" : "—");
    tdDrep.appendChild(a);
    tr.appendChild(tdDrep);

    const tdVote = document.createElement("td");
    tdVote.className = "vote-cell";
    tdVote.textContent = window.cdoEnum("vote", v.vote);
    tr.appendChild(tdVote);

    const tdAction = document.createElement("td");
    tdAction.className = "col-name vote-action-title";
    const title = document.createElement("div");
    title.textContent = v.action_title || v.action_id || "—";
    tdAction.appendChild(title);
    if (v.action_type) {
      const type = document.createElement("div");
      type.className = "vote-action-type";
      type.textContent = window.cdoEnum("action_type", v.action_type);
      tdAction.appendChild(type);
    }
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  }
}

async function loadLiveLayer() {
  try {
    const liveMeta = await fetchJson(`${DATA_ROOT_DEFAULT}/live/meta.json`);
    state.liveMeta = liveMeta;
    renderLiveBadge(liveMeta);
  } catch (err) {
    /* Live layer not present yet — render nothing, no error to user. */
    state.liveMeta = null;
    renderLiveBadge(null);
  }
  try {
    const votes = await fetchJson(`${DATA_ROOT_DEFAULT}/live/recent_votes.json`);
    state.liveRecentVotes = votes;
    renderRecentActivity(votes);
  } catch (err) {
    state.liveRecentVotes = null;
    renderRecentActivity(null);
  }
}

/* ── boot ─────────────────────────────────────────────────────────────── */

async function boot() {
  /* FLOW-4: If ?date= points to a missing snapshot, render notice and stop. */
  if (window.renderMissingDateNotice && await window.renderMissingDateNotice()) return;
  /* FLOW-4: render provenance strip in historical mode. */
  if (window.renderProvenanceStrip) window.renderProvenanceStrip();

  document.querySelectorAll("table.observatory thead th").forEach((th) => {
    if (th.dataset.sort) th.addEventListener("click", onSortClick);
  });

  document.addEventListener("cdo-lang", () => {
    /* Re-render dynamic content in the new locale. */
    renderMeta(state.meta);
    renderMetrics();
    renderScale();
    renderTable();
  });

  renderScale(); /* live ecosystem-scale band — independent of the snapshot load */

  try {
    const [top30, meta] = await Promise.all([
      fetchJson(`${DATA_ROOT()}/top30.json`),
      fetchJson(`${DATA_ROOT()}/meta.json`),
    ]);
    state.top30 = top30;
    state.meta = meta;
    renderMeta(meta);
    renderMetrics();
    renderTable();
  } catch (err) {
    console.error("boot failed", err);
    state.top30 = { entries: [] };
    state.meta = null;
    renderMeta(null);
    renderMetrics();
    renderTable();
  }
  /* Live layer loads independently; failure to load it is silent.
   * In historical mode (?date=...), skip live entirely — it's a current view. */
  if (!window.isHistorical || !window.isHistorical()) {
    await loadLiveLayer();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) loadLiveLayer();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

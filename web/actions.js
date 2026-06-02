/* Cardano Delegation Observatory — governance actions page logic. */

"use strict";

const DATA_ROOT_DEFAULT = "/data/snapshots";
function DATA_ROOT() {
  return (typeof window !== "undefined" && window.dataRoot) ? window.dataRoot() : DATA_ROOT_DEFAULT;
}
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };

const state = {
  actions: null,
  sortKey: "expires_epoch",
  sortDir: "desc",
  filterType: "",
  filterOutcome: "",
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

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return res.json();
}

function filtered() {
  const all = state.actions ? state.actions.actions : [];
  return all.filter((a) => {
    if (state.filterType && a.action_type !== state.filterType) return false;
    if (state.filterOutcome && a.outcome !== state.filterOutcome) return false;
    return true;
  });
}

function sorted() {
  const rows = filtered();
  const k = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    const av = a[k], bv = b[k];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string" || typeof bv === "string") {
      return String(av).localeCompare(String(bv)) * dir;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return String(a.action_id).localeCompare(String(b.action_id));
  });
  return rows;
}

function populateFilters() {
  const data = state.actions ? state.actions.actions : [];
  const types = Array.from(new Set(data.map(a => a.action_type).filter(Boolean))).sort();
  const outcomes = Array.from(new Set(data.map(a => a.outcome).filter(Boolean))).sort();

  const typeSel = document.getElementById("filter-type");
  const outSel = document.getElementById("filter-outcome");
  if (typeSel.options.length === 1) {
    for (const v of types) {
      const o = document.createElement("option");
      o.value = v;
      o.dataset.enum = v;
      o.textContent = window.cdoEnum("action_type", v);
      typeSel.appendChild(o);
    }
    typeSel.addEventListener("change", (ev) => { state.filterType = ev.target.value; render(); });
  }
  if (outSel.options.length === 1) {
    for (const v of outcomes) {
      const o = document.createElement("option");
      o.value = v;
      o.dataset.enum = v;
      o.textContent = window.cdoEnum("outcome", v);
      outSel.appendChild(o);
    }
    outSel.addEventListener("change", (ev) => { state.filterOutcome = ev.target.value; render(); });
  }
}

/* Re-translate filter dropdown option labels on language change. The
 * underlying `value` (and the canonical enum stashed in data-enum) stays
 * fixed so the filter logic continues to match against the data unchanged. */
function refreshFilterLabels() {
  for (const selId of ["filter-type", "filter-outcome"]) {
    const sel = document.getElementById(selId);
    if (!sel) continue;
    const category = selId === "filter-type" ? "action_type" : "outcome";
    for (const opt of sel.options) {
      const raw = opt.dataset.enum;
      if (raw) opt.textContent = window.cdoEnum(category, raw);
    }
  }
}

function render() {
  const tbody = document.getElementById("actions-tbody");
  const rows = sorted();
  tbody.innerHTML = "";
  const countEl = document.getElementById("filter-count");
  if (countEl) {
    countEl.textContent = `${rows.length} / ${state.actions ? state.actions.n_actions : 0}`;
  }
  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "loading";
    td.textContent = state.actions ? "—" : t("load-error");
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  for (const a of rows) {
    const tr = document.createElement("tr");

    const tdTitle = document.createElement("td");
    tdTitle.className = "col-name";
    const titleLink = document.createElement("a");
    titleLink.href = `action.html?id=${encodeURIComponent(a.action_id)}`;
    titleLink.className = "drep-name";
    titleLink.style.color = "var(--text)";
    titleLink.textContent = a.title || "—";
    const idDiv = document.createElement("div");
    idDiv.className = "drep-id-short";
    idDiv.textContent = a.action_id;
    tdTitle.appendChild(titleLink);
    tdTitle.appendChild(idDiv);
    tr.appendChild(tdTitle);

    const tdType = document.createElement("td");
    tdType.textContent = a.action_type ? window.cdoEnum("action_type", a.action_type) : "—";
    tr.appendChild(tdType);

    const tdOut = document.createElement("td");
    tdOut.textContent = a.outcome ? window.cdoEnum("outcome", a.outcome) : "—";
    tr.appendChild(tdOut);

    const tdExp = document.createElement("td");
    tdExp.className = "col-num";
    tdExp.textContent = (a.expires_epoch == null) ? "—" : fmtNum(a.expires_epoch);
    tr.appendChild(tdExp);

    const tdYes = document.createElement("td");
    tdYes.className = "col-num";
    tdYes.textContent = fmtNum(a.drep_yes_count);
    tr.appendChild(tdYes);

    const tdNo = document.createElement("td");
    tdNo.className = "col-num";
    tdNo.textContent = fmtNum(a.drep_no_count);
    tr.appendChild(tdNo);

    const tdAb = document.createElement("td");
    tdAb.className = "col-num";
    tdAb.textContent = fmtNum(a.drep_abstain_count);
    tr.appendChild(tdAb);

    tbody.appendChild(tr);
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
    state.sortDir = (key === "title" || key === "action_type" || key === "outcome") ? "asc" : "desc";
  }
  render();
}

async function boot() {
  if (window.renderMissingDateNotice && await window.renderMissingDateNotice()) return;
  if (window.renderProvenanceStrip) window.renderProvenanceStrip();
  document.querySelectorAll("table.observatory thead th").forEach((th) => {
    if (th.dataset.sort) th.addEventListener("click", onSortClick);
  });
  document.addEventListener("cdo-lang", () => { refreshFilterLabels(); render(); });

  try {
    state.actions = await fetchJson(`${DATA_ROOT()}/actions.json`);
    populateFilters();
    render();
  } catch (err) {
    console.error("actions boot failed", err);
    state.actions = { actions: [], n_actions: 0 };
    render();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

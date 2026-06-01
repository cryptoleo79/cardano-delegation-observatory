/* Cardano Delegation Observatory — action detail page. */

"use strict";

const DATA_ROOT_DEFAULT = "/data/snapshots";
function DATA_ROOT() {
  return (typeof window !== "undefined" && window.dataRoot) ? window.dataRoot() : DATA_ROOT_DEFAULT;
}
const NUM_LOCALE = { en: "en-US", ja: "ja-JP" };
const INITIAL_VOTES_VISIBLE = 20;
const LOVELACE_PER_ADA = 1_000_000;

const state = {
  detail: null,
  actionId: null,
  showAllVotes: false,
  sortKey: "vote_block_time",
  sortDir: "desc",
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

function actionIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return res.json();
}

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

/* ── timeline ─────────────────────────────────────────────────────────── */

function renderTimeline(d) {
  const tbody = document.getElementById("action-timeline-tbody");
  tbody.innerHTML = "";
  const events = [];
  if (d.submission_date) {
    events.push({ event: "submission", date: d.submission_date, epoch: d.submitted_epoch });
  }
  for (const [k, label] of Object.entries({
    expires:  "expires",
    expired:  "expired",
    ratified: "ratified",
    enacted:  "enacted",
    dropped:  "dropped",
  })) {
    const st = d.state_transitions && d.state_transitions[k];
    if (st) events.push({ event: label, date: st.date, epoch: st.epoch });
  }
  if (events.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.className = "delta-empty";
    td.textContent = "—";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  /* Sort chronologically by date; null dates last. */
  events.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
  for (const e of events) {
    const tr = document.createElement("tr");
    const tdE = document.createElement("td");
    tdE.className = "vote-cell";
    tdE.textContent = safeText(e.event);
    tr.appendChild(tdE);
    const tdD = document.createElement("td");
    tdD.textContent = safeText(e.date) || "—";
    tr.appendChild(tdD);
    const tdEp = document.createElement("td");
    tdEp.className = "col-num";
    tdEp.textContent = e.epoch == null ? "—" : fmtNum(e.epoch);
    tr.appendChild(tdEp);
    tbody.appendChild(tr);
  }
}

/* ── treasury withdrawals (FLOW-5) ───────────────────────────────────── */

function renderWithdrawals(d) {
  const section = document.getElementById("action-withdrawals-section");
  const tbody = document.getElementById("action-withdrawals-tbody");
  const tfoot = document.getElementById("action-withdrawals-tfoot");
  tbody.innerHTML = "";
  tfoot.innerHTML = "";
  /* §22.13 Layer 3: other action types do not display the section at all. */
  if (!d.withdrawal || d.withdrawal.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  let totalLovelace = 0n;
  for (const w of d.withdrawal) {
    const tr = document.createElement("tr");
    const tdR = document.createElement("td");
    /* §22.13 Layer 3: full address rendered, no silent truncation. */
    tdR.className = "stake-addr";
    tdR.textContent = safeText(w.recipient_stake_address);
    tr.appendChild(tdR);

    const tdAda = document.createElement("td");
    tdAda.className = "col-num";
    const lovelace = BigInt(w.amount_lovelace);
    totalLovelace += lovelace;
    tdAda.textContent = fmtNum(Number(lovelace / BigInt(LOVELACE_PER_ADA)));
    tr.appendChild(tdAda);

    const tdLov = document.createElement("td");
    tdLov.className = "col-num";
    tdLov.textContent = fmtNum(Number(lovelace));
    tr.appendChild(tdLov);

    tbody.appendChild(tr);
  }
  /* Total row — sum is mechanical, not editorial. */
  const trTotal = document.createElement("tr");
  const tdTotalLabel = document.createElement("td");
  tdTotalLabel.style.fontWeight = "600";
  tdTotalLabel.id = "action-withdrawals-total-label";
  tdTotalLabel.textContent = t("action-withdrawals-total-label");
  trTotal.appendChild(tdTotalLabel);

  const tdTotalAda = document.createElement("td");
  tdTotalAda.className = "col-num";
  tdTotalAda.style.fontWeight = "600";
  tdTotalAda.textContent = fmtNum(Number(totalLovelace / BigInt(LOVELACE_PER_ADA)));
  trTotal.appendChild(tdTotalAda);

  const tdTotalLov = document.createElement("td");
  tdTotalLov.className = "col-num";
  tdTotalLov.style.fontWeight = "600";
  tdTotalLov.textContent = fmtNum(Number(totalLovelace));
  trTotal.appendChild(tdTotalLov);

  tfoot.appendChild(trTotal);
}

/* ── votes ─────────────────────────────────────────────────────────── */

function sortedVotes() {
  const arr = state.detail.votes.slice();
  const k = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;
  arr.sort((a, b) => {
    const av = a[k], bv = b[k];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string" || typeof bv === "string") {
      return String(av).localeCompare(String(bv)) * dir;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return String(a.drep_id).localeCompare(String(b.drep_id));
  });
  return arr;
}

function renderVotes() {
  const tbody = document.getElementById("action-votes-tbody");
  const more = document.getElementById("action-votes-more");
  tbody.innerHTML = "";
  const votes = sortedVotes();
  const limit = state.showAllVotes ? votes.length : Math.min(INITIAL_VOTES_VISIBLE, votes.length);
  for (let i = 0; i < limit; i++) {
    const v = votes[i];
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    const a = document.createElement("a");
    a.href = `drep.html?id=${encodeURIComponent(v.drep_id)}`;
    a.textContent = v.drep_name || (v.drep_id ? v.drep_id.slice(0, 16) + "…" : "—");
    tdName.appendChild(a);
    tr.appendChild(tdName);

    const tdV = document.createElement("td");
    tdV.className = "vote-cell";
    tdV.textContent = safeText(v.vote);
    tr.appendChild(tdV);

    const tdE = document.createElement("td");
    tdE.className = "col-num";
    tdE.textContent = v.vote_epoch == null ? "—" : fmtNum(v.vote_epoch);
    tr.appendChild(tdE);

    const tdT = document.createElement("td");
    tdT.className = "col-num";
    tdT.textContent = fmtUtcTimestamp(v.vote_block_time);
    tr.appendChild(tdT);

    tbody.appendChild(tr);
  }
  if (!state.showAllVotes && votes.length > INITIAL_VOTES_VISIBLE) {
    const remaining = votes.length - INITIAL_VOTES_VISIBLE;
    more.textContent = `${t("action-votes-show-all")} (${remaining})`;
    more.style.display = "";
    more.onclick = () => { state.showAllVotes = true; renderVotes(); };
  } else {
    more.style.display = "none";
  }
  updateSortArrows();
}

function updateSortArrows() {
  const ths = document.querySelectorAll("#action-votes-table thead th");
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
    state.sortDir = (key === "drep_name") ? "asc" : "desc";
  }
  renderVotes();
}

/* ── boot ─────────────────────────────────────────────────────────── */

function render() {
  const d = state.detail;
  document.getElementById("action-id-full").textContent = state.actionId || "—";
  if (!d) {
    document.getElementById("action-title").textContent = t("action-not-found");
    return;
  }
  document.getElementById("action-title").textContent = d.title || "—";
  document.getElementById("action-type-line").textContent = d.action_type || "";
  document.getElementById("stat-type").textContent = d.action_type || "—";
  document.getElementById("stat-outcome").textContent = d.outcome || "—";
  document.getElementById("stat-submitted").textContent = d.submission_date || "—";
  document.getElementById("stat-votes").textContent = fmtNum(d.votes ? d.votes.length : 0);

  if (d.vote_tally) {
    document.getElementById("stat-yes").textContent = fmtNum(d.vote_tally.yes);
    document.getElementById("stat-no").textContent = fmtNum(d.vote_tally.no);
    document.getElementById("stat-abstain").textContent = fmtNum(d.vote_tally.abstain);
  }

  renderTimeline(d);
  renderWithdrawals(d);
  renderVotes();
}

async function boot() {
  if (window.renderMissingDateNotice && await window.renderMissingDateNotice()) return;
  if (window.renderProvenanceStrip) window.renderProvenanceStrip();
  state.actionId = actionIdFromUrl();
  document.querySelectorAll("#action-votes-table thead th").forEach((th) => {
    if (th.dataset.sort) th.addEventListener("click", onSortClick);
  });
  document.addEventListener("cdo-lang", () => render());
  if (!state.actionId) {
    document.getElementById("action-id-full").textContent = "—";
    document.getElementById("action-title").textContent = t("action-no-id");
    return;
  }
  try {
    state.detail = await fetchJson(`${DATA_ROOT()}/actions/${state.actionId}.json`);
    render();
    const titleSnippet = state.detail.title
      ? state.detail.title.slice(0, 40)
      : state.actionId.slice(0, 20) + "…";
    document.title = `${titleSnippet} — Cardano Delegation Observatory`;
  } catch (err) {
    console.error("action boot failed", err);
    state.detail = null;
    document.getElementById("action-title").textContent = t("action-not-found");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

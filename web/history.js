/* Cardano Delegation Observatory — historical snapshot list page (FLOW-4). */

"use strict";

const DATA_ROOT = "/data/snapshots";

const state = { index: null };

function currentLang() {
  return (document.documentElement.lang === "ja") ? "ja" : "en";
}

function t(key) {
  const lang = currentLang();
  return (i18n[lang] && i18n[lang][key]) || (i18n.en[key] || key);
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return res.json();
}

function render() {
  const idx = state.index;
  if (!idx) {
    document.getElementById("hs-first").textContent = "—";
    document.getElementById("hs-latest").textContent = "—";
    document.getElementById("hs-total").textContent = "—";
    return;
  }
  document.getElementById("hs-first").textContent = idx.first_snapshot_date || "—";
  document.getElementById("hs-latest").textContent = idx.latest_snapshot_date || "—";
  document.getElementById("hs-total").textContent = String(idx.total_archived_days || 0);

  const tbody = document.getElementById("history-tbody");
  tbody.innerHTML = "";
  const dates = (idx.available_dates || []).slice().reverse();  /* latest first */
  for (const date of dates) {
    const tr = document.createElement("tr");

    const tdDate = document.createElement("td");
    tdDate.textContent = date;
    tr.appendChild(tdDate);

    const tdLinks = document.createElement("td");
    const linkObs = document.createElement("a");
    linkObs.href = `/?date=${date}`;
    linkObs.textContent = t("hist-link-observatory");
    tdLinks.appendChild(linkObs);
    tdLinks.appendChild(document.createTextNode(" · "));
    const linkActions = document.createElement("a");
    linkActions.href = `actions.html?date=${date}`;
    linkActions.textContent = t("hist-link-actions");
    tdLinks.appendChild(linkActions);
    tr.appendChild(tdLinks);

    const tdPath = document.createElement("td");
    tdPath.className = "vote-cell";
    tdPath.style.fontFamily = "var(--mono)";
    tdPath.style.fontSize = "11px";
    tdPath.textContent = `/data/snapshots/by-date/${date}/`;
    tr.appendChild(tdPath);

    tbody.appendChild(tr);
  }
}

async function boot() {
  document.addEventListener("cdo-lang", () => render());
  try {
    state.index = await fetchJson(`${DATA_ROOT}/by-date/index.json`);
    render();
  } catch (err) {
    console.error("history boot failed", err);
    state.index = { available_dates: [], total_archived_days: 0 };
    render();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

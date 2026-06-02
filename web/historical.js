/* Cardano Delegation Observatory — historical view helpers (FLOW-4).
 * Loaded by every page that supports ?date= time-travel.
 * Per METHODOLOGY §21.3: with ?date=YYYY-MM-DD, all data fetches retarget
 * to /data/snapshots/by-date/{date}/ instead of /data/snapshots/.
 * Per METHODOLOGY §21.9: when in historical mode, a provenance strip is
 * rendered at the top of the article body.
 */

"use strict";

function historicalDate() {
  const params = new URLSearchParams(window.location.search);
  const d = params.get("date");
  if (!d) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return d;
}

function isHistorical() {
  return historicalDate() !== null;
}

/* Compute data root path. In current mode: /data/snapshots/.
 * In historical mode: /data/snapshots/by-date/{date}/. */
function dataRoot() {
  const d = historicalDate();
  return d ? `/data/snapshots/by-date/${d}` : `/data/snapshots`;
}

async function fetchIndexJson() {
  const res = await fetch(`/data/snapshots/by-date/index.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`index.json fetch failed: ${res.status}`);
  return res.json();
}

function nearestPriorDate(target, availableDates) {
  /* availableDates is ascending. Return the latest date <= target, or null. */
  let prior = null;
  for (const d of availableDates) {
    if (d <= target) prior = d;
    else break;
  }
  return prior;
}

function nearestNextDate(target, availableDates) {
  for (const d of availableDates) {
    if (d > target) return d;
  }
  return null;
}

/* Render the provenance strip at the top of the page's <main> container.
 * Only renders when historicalDate() is non-null. */
async function renderProvenanceStrip() {
  const d = historicalDate();
  if (!d) return;

  /* Locate the first container in <main>. */
  const main = document.querySelector("main");
  if (!main) return;
  /* Avoid duplicate rendering. */
  if (document.getElementById("provenance-strip")) return;

  const strip = document.createElement("div");
  strip.id = "provenance-strip";
  strip.className = "provenance-strip";

  /* Header line with view-current link. */
  const header = document.createElement("div");
  header.className = "provenance-header";
  const title = document.createElement("strong");
  const titleText = (window.cdoT ? window.cdoT("prov-title") : "HISTORICAL SNAPSHOT");
  title.textContent = `${titleText} · ${d}`;
  header.appendChild(title);
  const viewCurrent = document.createElement("a");
  viewCurrent.className = "provenance-view-current";
  /* Strip the date param to return to current. */
  const params = new URLSearchParams(window.location.search);
  params.delete("date");
  const q = params.toString();
  viewCurrent.href = window.location.pathname + (q ? "?" + q : "");
  viewCurrent.textContent = (window.cdoT ? window.cdoT("prov-view-current") : "view current →");
  header.appendChild(viewCurrent);
  strip.appendChild(header);

  /* Try to fetch the dated meta.json for provenance details. */
  let meta = null;
  try {
    const res = await fetch(`/data/snapshots/by-date/${d}/meta.json`, { cache: "no-store" });
    if (res.ok) meta = await res.json();
  } catch (e) { /* meta may not exist; archive-path line still rendered */ }

  const cdoT = window.cdoT || ((k) => k);
  const lines = [];
  lines.push({ label: cdoT("prov-label-archive"), value: `/data/snapshots/by-date/${d}/`, mono: true });
  if (meta && meta.last_run) {
    lines.push({ label: cdoT("prov-label-etl-completed"), value: meta.last_run.run_completed_at || "—" });
  }
  lines.push({ label: cdoT("prov-label-methodology"), value: (meta && meta.methodology_version) || "?" });
  lines.push({ label: cdoT("prov-label-schema"), value: (meta && meta.schema_version != null) ? String(meta.schema_version) : "?" });

  const table = document.createElement("div");
  table.className = "provenance-grid";
  for (const line of lines) {
    const cell = document.createElement("div");
    cell.className = "provenance-cell";
    const lbl = document.createElement("span");
    lbl.className = "provenance-label";
    lbl.textContent = line.label;
    const val = document.createElement("span");
    val.className = line.mono ? "provenance-value mono" : "provenance-value";
    val.textContent = line.value;
    cell.appendChild(lbl);
    cell.appendChild(val);
    table.appendChild(cell);
  }
  strip.appendChild(table);

  /* Direct download line. */
  const dl = document.createElement("div");
  dl.className = "provenance-download";
  dl.textContent = (window.cdoT ? window.cdoT("prov-download") : "download:") + " ";
  const fileLinks = ["top30.json", "actions.json", "meta.json", "epoch_info.json", "sha256.json"];
  fileLinks.forEach((f, i) => {
    const a = document.createElement("a");
    a.href = `/data/snapshots/by-date/${d}/${f}`;
    a.textContent = f;
    a.target = "_blank";
    a.rel = "noopener";
    dl.appendChild(a);
    if (i < fileLinks.length - 1) dl.appendChild(document.createTextNode(" · "));
  });
  strip.appendChild(dl);

  /* Insert at the very top of the first container in main. */
  const firstContainer = main.querySelector(".container");
  if (firstContainer && firstContainer.firstChild) {
    firstContainer.insertBefore(strip, firstContainer.firstChild);
  } else if (firstContainer) {
    firstContainer.appendChild(strip);
  } else {
    main.insertBefore(strip, main.firstChild);
  }
}

/* Render a missing-date notice when the requested historical date is not
 * in the index. Replaces the page's main content. */
async function renderMissingDateNotice() {
  const d = historicalDate();
  if (!d) return false;
  let idx = null;
  try { idx = await fetchIndexJson(); } catch (e) { return false; }
  if (!idx || !idx.available_dates) return false;
  if (idx.available_dates.indexOf(d) !== -1) return false;  /* date exists */

  const prior = nearestPriorDate(d, idx.available_dates);
  const next = nearestNextDate(d, idx.available_dates);

  const main = document.querySelector("main");
  if (!main) return true;
  main.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "container";
  const notice = document.createElement("div");
  notice.className = "missing-date-notice";

  const h = document.createElement("h1");
  h.textContent = (window.cdoT ? window.cdoT("missing-date-title") : "No snapshot for this date");
  notice.appendChild(h);

  const p1 = document.createElement("p");
  p1.textContent = `${(window.cdoT ? window.cdoT("missing-date-body") : "No snapshot was published for")} ${d}.`;
  notice.appendChild(p1);

  const grid = document.createElement("div");
  grid.className = "missing-date-grid";
  if (prior) {
    const div = document.createElement("div");
    const lbl = document.createElement("span");
    lbl.className = "provenance-label";
    lbl.textContent = (window.cdoT ? window.cdoT("missing-date-prior") : "Nearest prior date");
    const a = document.createElement("a");
    a.href = `${window.location.pathname}?date=${prior}`;
    a.textContent = prior + " →";
    div.appendChild(lbl);
    div.appendChild(document.createElement("br"));
    div.appendChild(a);
    grid.appendChild(div);
  }
  if (next) {
    const div = document.createElement("div");
    const lbl = document.createElement("span");
    lbl.className = "provenance-label";
    lbl.textContent = (window.cdoT ? window.cdoT("missing-date-next") : "Nearest next date");
    const a = document.createElement("a");
    a.href = `${window.location.pathname}?date=${next}`;
    a.textContent = next + " →";
    div.appendChild(lbl);
    div.appendChild(document.createElement("br"));
    div.appendChild(a);
    grid.appendChild(div);
  }
  notice.appendChild(grid);

  const linkAll = document.createElement("p");
  linkAll.style.marginTop = "16px";
  const a = document.createElement("a");
  a.href = "history.html";
  a.textContent = (window.cdoT ? window.cdoT("missing-date-list") : "See the full list of available dates");
  linkAll.appendChild(a);
  notice.appendChild(linkAll);

  wrap.appendChild(notice);
  main.appendChild(wrap);
  return true;
}

/* Expose. */
window.historicalDate = historicalDate;
window.isHistorical = isHistorical;
window.dataRoot = dataRoot;
window.renderProvenanceStrip = renderProvenanceStrip;
window.renderMissingDateNotice = renderMissingDateNotice;

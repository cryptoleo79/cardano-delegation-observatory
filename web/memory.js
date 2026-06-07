/* Cardano Memory Layer — front door (memory.html).
 *
 * Progressive enhancement ONLY. The page is complete and correct with no JS;
 * this script fetches a few live counts from the read-only Data Layer API and
 * fills the (initially empty) `.mem-count` spans if the spans exist and the
 * fetches succeed. Every fetch is independent and failure-silent: a dead
 * endpoint leaves its span empty, never breaks the page, never throws to the
 * console-visible top level. No interpretation, no rankings — counts only. */

"use strict";

const API = new URLSearchParams(location.search).get("api") || "https://api.asy.life";

function currentLang() { return document.documentElement.lang === "ja" ? "ja" : "en"; }
function t(key) {
  const l = currentLang();
  return (typeof i18n !== "undefined" && i18n[l] && i18n[l][key]) ||
         (typeof i18n !== "undefined" && i18n.en && i18n.en[key]) || key;
}
function fmtNum(n) {
  if (n == null || isNaN(n)) return null;
  const locale = currentLang() === "ja" ? "ja-JP" : "en-US";
  return Number(n).toLocaleString(locale);
}

/* Page-local i18n merged into the global dict (do not edit the shared i18n.js). */
const PAGE_I18N = {
  en: {
    "mem-c-dreps": "tracked",
    "mem-c-actions": "actions",
    "mem-c-treasury": "epochs",
    "mem-c-archive": "sources",
    "mem-c-projects": "projects",
    "mem-c-categories": "categories",
  },
  ja: {
    "mem-c-dreps": "件 追跡中",
    "mem-c-actions": "件のアクション",
    "mem-c-treasury": "エポック",
    "mem-c-archive": "件の出典",
    "mem-c-projects": "件のプロジェクト",
    "mem-c-categories": "件のカテゴリ",
  },
};
if (typeof i18n !== "undefined") {
  Object.assign(i18n.en, PAGE_I18N.en);
  Object.assign(i18n.ja, PAGE_I18N.ja);
  if (typeof setLang === "function") setLang(currentLang());
}

async function fetchJson(path) {
  try {
    const res = await fetch(API + path, { cache: "no-cache" });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null; // failure-silent: leave the span empty
  }
}

/* Fill one count span. `value` is a number; `labelKey` an i18n key. If value is
 * null, the span is left empty (CSS hides empty .mem-count). */
function setCount(id, value, labelKey) {
  const el = document.getElementById(id);
  if (!el) return;
  const num = fmtNum(value);
  if (num == null) return;
  el.dataset.kind = labelKey; // remember key so re-render on lang toggle works
  el.dataset.value = String(value);
  renderCount(el);
}

function renderCount(el) {
  const v = el.dataset.value;
  const key = el.dataset.kind;
  if (v == null || key == null) return;
  const num = fmtNum(Number(v));
  if (num == null) return;
  el.textContent = `${num} ${t(key)}`;
  el.setAttribute("data-filled", "1");
}

/* Re-render filled counts when the language toggles. */
document.addEventListener("cdo-lang", () => {
  document.querySelectorAll(".mem-count[data-filled]").forEach(renderCount);
});

async function boot() {
  /* Each fetch independent; results fill whichever spans are present. */
  const [archive, categories, projects, treasury, actions] = await Promise.all([
    fetchJson("/archive"),
    fetchJson("/categories"),
    fetchJson("/projects"),
    fetchJson("/treasury"),
    fetchJson("/actions").catch(() => null), // may not exist; failure-silent
  ]);

  if (archive && archive.subfolders && typeof archive.subfolders === "object") {
    setCount("c-archive", Object.keys(archive.subfolders).length, "mem-c-archive");
  }
  if (categories && categories.count != null) {
    setCount("c-categories", categories.count, "mem-c-categories");
  }
  if (projects && (projects.total != null || projects.count != null)) {
    setCount("c-projects", projects.total != null ? projects.total : projects.count, "mem-c-projects");
  }
  if (treasury && treasury.n_epochs != null) {
    setCount("c-treasury", treasury.n_epochs, "mem-c-treasury");
  }
  if (actions && Array.isArray(actions.actions)) {
    setCount("c-actions", actions.actions.length, "mem-c-actions");
  } else if (actions && actions.count != null) {
    setCount("c-actions", actions.count, "mem-c-actions");
  }
  /* c-dreps left to a dedicated endpoint if/when one is wired; intentionally
   * not faked. The span simply stays empty. */
}

boot();

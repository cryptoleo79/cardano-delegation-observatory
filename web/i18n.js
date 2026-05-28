/* Cardano Delegation Observatory — i18n strings.
 * Keys are element IDs. Values are plain text or limited markup.
 * No HTML rendered from external sources; only these literal strings. */

const i18n = {
  en: {
    /* Header / nav */
    "h-brand": "Cardano Delegation Observatory",
    "h-nav-methodology": "Methodology",
    "h-nav-source": "Source",

    /* Meta strip */
    "m-epoch-label": "Epoch",
    "m-date-label": "Data through",
    "m-lag": "Updated daily · up to ~24h lag",
    "m-source-label": "Source",
    "m-status-ok": "Last update OK",
    "m-status-stale": "Last update stale",
    "m-status-error": "Last update failed",
    "m-status-loading": "Loading…",

    /* Main */
    "page-title": "Top 30 DReps by voting weight",
    "page-lede": "Daily snapshot of voting weight, delegation, and recorded votes. The data reflects the most recent ETL run from the Cardano blockchain via Koios. Numbers only — methodology is public and reproducible.",
    "footnote-deltas": "Δ 7d and Δ 30d display as — when fewer than 7 (respectively 30) daily snapshots have accumulated since launch. They populate forward from the first deployment.",

    /* Table headers */
    "th-name": "Name / DRep ID",
    "th-weight": "Voting weight (ADA)",
    "th-delegators": "Delegators",
    "th-d7d": "Δ 7d (ADA)",
    "th-d30d": "Δ 30d (ADA)",
    "th-lastvote": "Last vote (epoch)",

    /* Expanded row labels */
    "ex-id-label": "DRep ID",
    "ex-meta-label": "Metadata source",
    "ex-meta-none": "No on-chain metadata registered.",
    "ex-chart-label": "90-day voting weight",
    "ex-chart-empty": "Chart populates as daily snapshots accumulate.",
    "ex-votes-label": "Vote history",
    "ex-votes-none": "No recorded votes yet.",
    "ex-vote-col-epoch": "Epoch",
    "ex-vote-col-vote": "Vote",
    "ex-vote-col-action": "Governance action",
    "ex-vote-col-outcome": "Outcome",
    "ex-show-more": "Show all votes",

    /* Footer */
    "ft-license": "Apache 2.0 code · CC0 data",
    "ft-methodology": "Methodology",
    "ft-source": "Source",
    "ft-observatory": "Observatory",
    "ft-repro": "Reproducible from public Koios API endpoints.",

    /* Nav (cross-page) */
    "h-nav-observatory": "Observatory",
    "h-nav-actions": "Actions",

    /* Actions page */
    "actions-title": "Governance actions",
    "actions-lede": "Every governance action recorded on the Cardano blockchain, with type, outcome, expiration epoch, and DRep vote tallies. Sorted by expiration epoch descending by default. No editorial fields.",
    "filter-type-label": "Type:",
    "filter-outcome-label": "Outcome:",
    "th-act-title": "Title",
    "th-act-type": "Type",
    "th-act-outcome": "Outcome",
    "th-act-expires": "Expires (epoch)",
    "th-act-yes": "DRep yes",
    "th-act-no": "DRep no",
    "th-act-abstain": "DRep abstain",
    "footnote-actions": "Vote counts are the most recent vote cast by each DRep on each action. When a DRep revoted on the same action, only the chronologically latest vote is counted. See Methodology §6.",

    /* Download row */
    "download-label": "Download this snapshot:",
    "download-license": "CC0 — no attribution required.",

    /* Loading + error */
    "loading-msg": "Loading…",
    "load-error": "Could not load snapshot. The data file is missing or unreachable.",
  },

  ja: {
    /* Header / nav */
    "h-brand": "Cardano Delegation Observatory",
    "h-nav-methodology": "方法論",
    "h-nav-source": "ソース",

    /* Meta strip */
    "m-epoch-label": "エポック",
    "m-date-label": "データ対象日",
    "m-lag": "毎日更新 · 最大約24時間の遅延",
    "m-source-label": "ソース",
    "m-status-ok": "最終更新成功",
    "m-status-stale": "最終更新から時間経過",
    "m-status-error": "最終更新失敗",
    "m-status-loading": "読み込み中…",

    /* Main */
    "page-title": "投票権による上位30 DRep",
    "page-lede": "投票権、委任、記録された投票の日次スナップショット。Koios経由でCardanoブロックチェーンから取得した最新のETL実行結果を表示する。数値のみ——方法論は公開・再現可能。",
    "footnote-deltas": "Δ 7日 と Δ 30日 は、ローンチ以降の日次スナップショットがそれぞれ7日分・30日分蓄積されるまでは「—」と表示する。デプロイ時点から前方累積で値が入る。",

    /* Table headers */
    "th-name": "名前 / DRep ID",
    "th-weight": "投票権 (ADA)",
    "th-delegators": "委任者数",
    "th-d7d": "Δ 7日 (ADA)",
    "th-d30d": "Δ 30日 (ADA)",
    "th-lastvote": "最終投票 (エポック)",

    /* Expanded row labels */
    "ex-id-label": "DRep ID",
    "ex-meta-label": "メタデータ・ソース",
    "ex-meta-none": "オンチェーン・メタデータは登録されていない。",
    "ex-chart-label": "90日間の投票権推移",
    "ex-chart-empty": "日次スナップショットの蓄積に応じてチャートが描画される。",
    "ex-votes-label": "投票履歴",
    "ex-votes-none": "記録された投票はまだない。",
    "ex-vote-col-epoch": "エポック",
    "ex-vote-col-vote": "投票",
    "ex-vote-col-action": "ガバナンスアクション",
    "ex-vote-col-outcome": "結果",
    "ex-show-more": "すべての投票を表示",

    /* Footer */
    "ft-license": "コードはApache 2.0、データはCC0",
    "ft-methodology": "方法論",
    "ft-source": "ソース",
    "ft-observatory": "Observatory",
    "ft-repro": "公開Koios API エンドポイントから再現可能。",

    /* Nav (cross-page) */
    "h-nav-observatory": "Observatory",
    "h-nav-actions": "ガバナンスアクション",

    /* Actions page */
    "actions-title": "ガバナンスアクション一覧",
    "actions-lede": "Cardanoブロックチェーン上に記録されたすべてのガバナンスアクションを、種別・結果・期限エポック・DRep投票集計とともに表示する。既定の並び順は期限エポックの降順。編集的フィールドは含まない。",
    "filter-type-label": "種別:",
    "filter-outcome-label": "結果:",
    "th-act-title": "タイトル",
    "th-act-type": "種別",
    "th-act-outcome": "結果",
    "th-act-expires": "期限 (エポック)",
    "th-act-yes": "DRep 賛成",
    "th-act-no": "DRep 反対",
    "th-act-abstain": "DRep 棄権",
    "footnote-actions": "投票数は、各DRepが各アクションに対して最後に投じた票に基づく。DRepが同じアクションに対して再投票した場合は、時系列上で最新の票のみが集計される。詳細は方法論 §6 を参照。",

    /* Download row */
    "download-label": "このスナップショットをダウンロード:",
    "download-license": "CC0 — 帰属表示は不要。",

    /* Loading + error */
    "loading-msg": "読み込み中…",
    "load-error": "スナップショットを読み込めなかった。データファイルが存在しないか到達できない。",
  },
};

function setLang(lang) {
  if (lang !== "en" && lang !== "ja") lang = "en";
  document.documentElement.lang = lang;
  const dict = i18n[lang];
  for (const id of Object.keys(dict)) {
    const el = document.getElementById(id);
    if (el) el.textContent = dict[id];
  }
  const enBtn = document.getElementById("btn-en");
  const jaBtn = document.getElementById("btn-ja");
  if (enBtn) enBtn.classList.toggle("active", lang === "en");
  if (jaBtn) jaBtn.classList.toggle("active", lang === "ja");
  try { localStorage.setItem("cdo-lang", lang); } catch (e) { /* ignore */ }
  /* Tell app.js to re-render dynamic content with the new dict. */
  document.dispatchEvent(new CustomEvent("cdo-lang", { detail: { lang } }));
}

function initialLang() {
  try {
    const stored = localStorage.getItem("cdo-lang");
    if (stored === "en" || stored === "ja") return stored;
  } catch (e) { /* ignore */ }
  if (navigator.language && navigator.language.toLowerCase().startsWith("ja")) return "ja";
  return "en";
}

/* Boot language as soon as the i18n script loads. */
setLang(initialLang());

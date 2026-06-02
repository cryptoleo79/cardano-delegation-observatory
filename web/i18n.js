/* Cardano Delegation Observatory — i18n strings.
 * Keys are element IDs. Values are plain text or limited markup.
 * No HTML rendered from external sources; only these literal strings. */

const i18n = {
  en: {
    /* Ecosystem strip */
    "eco-label": "Ecosystem",
    "eco-link-observatory": "Observatory",
    "eco-link-voting": "Voting",
    "eco-link-governance": "Governance",

    /* Header / nav */
    "h-brand": "Cardano Delegation Observatory",
    "h-nav-methodology": "Methodology",
    "h-nav-source": "Source",

    /* Meta strip */
    "m-epoch-label": "Epoch",
    "m-date-label": "Data through",
    "m-lag": "Canonical daily governance snapshot · up to ~24h lag",
    "m-source-label": "Source",

    /* Live telemetry strip */
    "live-badge-label": "Live telemetry",
    "live-cadence-label": "Supplemental · refreshed every ~10 min",

    /* Recent activity section */
    "recent-activity-title": "Recent governance activity",
    "recent-activity-lede": "Most recent DRep votes recorded on chain, refreshed every ~10 minutes from the live telemetry layer. Timestamps are exact UTC. See Methodology §14 for cadence and reconciliation rules.",
    "recent-activity-footnote": "Source: /data/snapshots/live/recent_votes.json · CC0.",
    "th-act-time": "Block time (UTC)",
    "th-act-epoch": "Epoch",
    "th-act-drep": "DRep",
    "th-act-vote": "Vote",
    "th-act-action": "Action",

    /* Provenance footer */
    "ft-provenance": "Telemetry derived from public Cardano governance data via Koios. No private data sources.",
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

    /* Per-DRep page */
    "back-link-observatory": "← Observatory",
    "drep-not-found": "DRep not found",
    "drep-no-id": "No DRep ID provided in URL (expected ?id=drep1…)",
    "stat-weight-label": "Voting weight",
    "stat-weight-sub": "ADA",
    "stat-delegators-label": "Delegators",
    "stat-lastvote-label": "Last vote",
    "stat-lastvote-sub": "epoch",
    "stat-votescast-label": "Votes cast",
    "drep-chart-label": "90-day voting weight",
    "drep-meta-label": "Metadata source",
    "drep-votes-label": "Vote history",
    "view-detail-link": "Open full page →",

    /* FLOW-4 — History page + provenance strip */
    "h-nav-history": "History",
    "history-title": "Historical snapshots",
    "history-lede": "Every daily snapshot archived under /data/snapshots/by-date/{YYYY-MM-DD}/. Snapshots are immutable once published. Missing dates (failed ETL runs) are not interpolated; they simply do not appear. See Methodology §21.",
    "hs-first-label": "First archived",
    "hs-latest-label": "Latest archived",
    "hs-total-label": "Total days",
    "history-list-label": "All snapshots",
    "th-h-date": "Date (UTC)",
    "th-h-links": "Views",
    "th-h-archive": "Archive path",
    "hist-link-observatory": "Observatory",
    "hist-link-actions": "Actions",
    "prov-view-current": "view current →",
    "prov-download": "download:",
    "missing-date-title": "No snapshot for this date",
    "missing-date-body": "No snapshot was published for",
    "missing-date-prior": "Nearest prior date",
    "missing-date-next": "Nearest next date",
    "missing-date-list": "See the full list of available dates",

    /* FLOW-1 — Recent net change panel */
    "drep-recent-change-label": "Recent net change",
    "drep-recent-change-help": "Net snapshot-to-snapshot deltas. See Methodology §18. Movement only; not migration; not attributable to motive.",
    "th-rc-interval": "Interval",
    "th-rc-vw": "Net voting weight (ADA)",
    "th-rc-dc": "Net delegators",
    "th-rc-ref": "Reference date",

    /* FLOW-3 — Action detail page */
    "action-id-label": "Action ID",
    "action-not-found": "Action not found",
    "action-no-id": "No action ID provided in URL (expected ?id=gov_action1…)",
    "back-link-actions": "← Governance actions",
    "stat-type-label": "Type",
    "stat-outcome-label": "Outcome",
    "stat-submitted-label": "Submitted",
    "stat-votes-label": "Total DRep votes",
    "stat-yes-label": "Yes",
    "stat-no-label": "No",
    "stat-abstain-label": "Abstain",
    "action-timeline-label": "Timeline",
    "action-timeline-help": "Protocol-observed events. Active actions show submission only until a terminal state is observed. See Methodology §20.3.",
    "th-tl-event": "Event",
    "th-tl-date": "Date (UTC)",
    "th-tl-epoch": "Epoch",
    /* FLOW-5 — Treasury withdrawal recipients (TreasuryWithdrawals actions only) */
    "action-withdrawals-label": "Treasury withdrawal recipients",
    "action-withdrawals-help": "Stake-credential recipients listed on this treasury withdrawal proposal as recorded on chain. No editorial fields — recipient identity beyond the stake address is not asserted. See Methodology §22.4.",
    "th-w-recipient": "Recipient stake address",
    "th-w-amount-ada": "Amount (ADA)",
    "th-w-amount-lovelace": "Amount (lovelace)",
    "action-withdrawals-total-label": "Total",

    "action-tally-label": "Vote tally",
    "action-tally-help": "Counts are the most recent vote cast by each DRep on this action (per §6 revote rule). No approval/rejection framing — protocol terms only.",
    "action-votes-label": "DRep votes",
    "action-votes-help": "DRep names appear only when registered in on-chain metadata. Other voters appear by truncated DRep ID.",
    "action-votes-show-all": "Show all votes",
    "th-v-name": "DRep",
    "th-v-vote": "Vote",
    "th-v-epoch": "Epoch",
    "th-v-time": "Block time (UTC)",
    "ft-actions": "Actions",

    /* Loading + error */
    "loading-msg": "Loading…",
    "load-error": "Could not load snapshot. The data file is missing or unreachable.",
  },

  ja: {
    /* Ecosystem strip */
    "eco-label": "エコシステム",
    "eco-link-observatory": "Observatory",
    "eco-link-voting": "投票",
    "eco-link-governance": "ガバナンス",

    /* Header / nav */
    "h-brand": "Cardano Delegation Observatory",
    "h-nav-methodology": "方法論",
    "h-nav-source": "ソース",

    /* Meta strip */
    "m-epoch-label": "エポック",
    "m-date-label": "データ対象日",
    "m-lag": "正準となる日次ガバナンススナップショット · 最大約24時間の遅延",
    "m-source-label": "ソース",

    /* Live telemetry strip */
    "live-badge-label": "ライブテレメトリー",
    "live-cadence-label": "補助情報 · 約10分ごとに更新",

    /* Recent activity section */
    "recent-activity-title": "最近のガバナンス・アクティビティ",
    "recent-activity-lede": "オンチェーンに記録された直近のDRep投票。ライブテレメトリー層から約10分ごとに更新される。タイムスタンプはUTCの絶対時刻。更新頻度と整合性ルールは方法論 §14 を参照。",
    "recent-activity-footnote": "ソース: /data/snapshots/live/recent_votes.json · CC0。",
    "th-act-time": "ブロック時刻 (UTC)",
    "th-act-epoch": "エポック",
    "th-act-drep": "DRep",
    "th-act-vote": "投票",
    "th-act-action": "アクション",

    /* Provenance footer */
    "ft-provenance": "公開されているCardanoガバナンス・データをKoios経由で取得している。非公開のデータソースは使用していない。",
    "m-status-ok": "最終更新成功",
    "m-status-stale": "最終更新から時間が経過しています",
    "m-status-error": "最終更新失敗",
    "m-status-loading": "読み込み中…",

    /* Main */
    "page-title": "投票権による上位30 DRep",
    "page-lede": "投票権、委任、記録された投票の日次スナップショット。Koios経由でCardanoブロックチェーンから取得した最新のETL実行結果を表示する。数値のみ。方法論は公開かつ再現可能。",
    "footnote-deltas": "Δ 7日 と Δ 30日 は、ローンチ以降の日次スナップショットがそれぞれ7日分・30日分蓄積されるまでは「—」と表示する。デプロイ時点から前方累積で値が入る。",

    /* Table headers */
    "th-name": "名前 / DRep ID",
    "th-weight": "投票権 (ADA)",
    "th-delegators": "委任者数",
    "th-d7d": "Δ 7日間 (ADA)",
    "th-d30d": "Δ 30日間 (ADA)",
    "th-lastvote": "最終投票 (エポック)",

    /* Expanded row labels */
    "ex-id-label": "DRep ID",
    "ex-meta-label": "メタデータ・ソース",
    "ex-meta-none": "オンチェーン・メタデータは登録されていません。",
    "ex-chart-label": "90日間の投票権推移",
    "ex-chart-empty": "日次スナップショットの蓄積に伴いチャートが描画されます。",
    "ex-votes-label": "投票履歴",
    "ex-votes-none": "記録された投票はまだありません。",
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

    /* Per-DRep page */
    "back-link-observatory": "← Observatory",
    "drep-not-found": "DRepが見つかりませんでした",
    "drep-no-id": "URLにDRep IDが指定されていません(?id=drep1… が必要です)",
    "stat-weight-label": "投票権",
    "stat-weight-sub": "ADA",
    "stat-delegators-label": "委任者数",
    "stat-lastvote-label": "最終投票",
    "stat-lastvote-sub": "エポック",
    "stat-votescast-label": "投票数",
    "drep-chart-label": "90日間の投票権推移",
    "drep-meta-label": "メタデータ・ソース",
    "drep-votes-label": "投票履歴",
    "view-detail-link": "詳細ページを開く →",

    /* FLOW-4 — History page + provenance strip */
    "h-nav-history": "履歴",
    "history-title": "履歴スナップショット",
    "history-lede": "/data/snapshots/by-date/{YYYY-MM-DD}/ 配下に保管された日次スナップショット一覧。公開後は不変。欠損日(ETL失敗)は補間せず、単純に表示しない。方法論 §21 を参照。",
    "hs-first-label": "最古",
    "hs-latest-label": "最新",
    "hs-total-label": "総日数",
    "history-list-label": "全スナップショット",
    "th-h-date": "日付 (UTC)",
    "th-h-links": "ビュー",
    "th-h-archive": "アーカイブパス",
    "hist-link-observatory": "Observatory",
    "hist-link-actions": "アクション",
    "prov-view-current": "現在のビューへ →",
    "prov-download": "ダウンロード:",
    "missing-date-title": "この日付のスナップショットは存在しません",
    "missing-date-body": "次の日付ではスナップショットが公開されませんでした:",
    "missing-date-prior": "直前の公開日",
    "missing-date-next": "直後の公開日",
    "missing-date-list": "公開日の一覧を見る",

    /* FLOW-1 — Recent net change panel */
    "drep-recent-change-label": "直近の純変動",
    "drep-recent-change-help": "スナップショット間の純差分。詳細は方法論 §18 を参照。表示は変動のみ。移行(migration)とは別概念であり、動機は推定しない。",
    "th-rc-interval": "期間",
    "th-rc-vw": "投票権の純差分 (ADA)",
    "th-rc-dc": "委任者数の純差分",
    "th-rc-ref": "比較基準日",

    /* FLOW-3 — Action detail page */
    "action-id-label": "アクションID",
    "action-not-found": "アクションが見つかりませんでした",
    "action-no-id": "URLにアクションIDが指定されていません(?id=gov_action1… が必要です)",
    "back-link-actions": "← ガバナンスアクション",
    "stat-type-label": "種別",
    "stat-outcome-label": "結果",
    "stat-submitted-label": "提出",
    "stat-votes-label": "DRep投票総数",
    "stat-yes-label": "賛成",
    "stat-no-label": "反対",
    "stat-abstain-label": "棄権",
    "action-timeline-label": "タイムライン",
    "action-timeline-help": "プロトコルが観測したイベント。進行中のアクションは終局状態が観測されるまで「提出」のみを表示する。詳細は方法論 §20.3 を参照。",
    "th-tl-event": "イベント",
    "th-tl-date": "日付 (UTC)",
    "th-tl-epoch": "エポック",
    /* FLOW-5 — トレジャリー引き出しの受取人 (TreasuryWithdrawals 種別のアクションのみ) */
    "action-withdrawals-label": "トレジャリー引き出しの受取人",
    "action-withdrawals-help": "本トレジャリー引き出し提案にオンチェーン上で記録された、ステーク資格による受取人の一覧。編集的なフィールドは持たない。ステークアドレス以外の受取人の身元は主張しない。詳細は方法論 §22.4 を参照。",
    "th-w-recipient": "受取人のステークアドレス",
    "th-w-amount-ada": "金額 (ADA)",
    "th-w-amount-lovelace": "金額 (lovelace)",
    "action-withdrawals-total-label": "合計",

    "action-tally-label": "投票集計",
    "action-tally-help": "集計は各DRepがこのアクションに対して最後に投じた票(§6 の再投票ルール)。承認や否決といった言い方はせず、プロトコル上の用語のみを用いる。",
    "action-votes-label": "DRep投票",
    "action-votes-help": "DRep名はオンチェーン・メタデータに登録されている場合のみ表示。それ以外はDRep IDの一部のみ。",
    "action-votes-show-all": "すべての投票を表示",
    "th-v-name": "DRep",
    "th-v-vote": "投票",
    "th-v-epoch": "エポック",
    "th-v-time": "ブロック時刻 (UTC)",
    "ft-actions": "アクション",

    /* Loading + error */
    "loading-msg": "読み込み中…",
    "load-error": "スナップショットを読み込めませんでした。データファイルが存在しないか到達できません。",
  },
};

/* String lookup against the currently active language. Defined on window so
 * dynamic-render JS (action.js timeline events, historical.js missing-date
 * notices and provenance strip, future enum renderers) can resolve a key to
 * its display string without owning their own copy of the dict.
 *
 * Returns the JA string when lang=ja, otherwise the EN string. Falls back to
 * EN if a key is missing from the active dict, and to the key itself if it
 * is missing from both — that last case surfaces typos rather than rendering
 * an empty string. */
window.cdoT = function (key) {
  const lang = (document.documentElement.lang === "ja") ? "ja" : "en";
  return (i18n[lang] && i18n[lang][key]) || (i18n.en && i18n.en[key]) || key;
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

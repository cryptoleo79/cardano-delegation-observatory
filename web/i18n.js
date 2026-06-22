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
    "eco-link-api": "API",

    /* Header / nav */
    "h-brand": "Cardano Delegation Observatory",
    "h-nav-methodology": "Methodology",
    "h-nav-source": "Source",

    /* Meta strip */
    "m-epoch-label": "Epoch",
    "m-date-label": "Data through",
    "m-lag": "Canonical daily governance snapshot · up to ~24h lag",
    "m-source-label": "Source",
    "home-m-dreps": "DReps tracked", "home-m-dreps-sub": "top by voting weight",
    "home-m-weight": "Total voting weight", "home-m-weight-sub": "ADA · top 30",
    "home-m-delegators": "Total delegators", "home-m-delegators-sub": "across the top 30",
    "home-m-epoch": "Snapshot epoch", "home-m-epoch-sub": "current daily snapshot",
    "home-scale-label": "Across the asy.life ecosystem", "home-dreps-head": "Today's governance snapshot",
    "scale-projects": "Projects", "scale-categories": "Categories", "scale-tokens": "Tokens",
    "scale-funds": "Catalyst funds", "scale-actions": "Governance actions",
    "scale-epochs": "Treasury epochs", "scale-routes": "API routes",

    /* Live telemetry strip */
    "live-badge-label": "Live telemetry",
    "live-cadence-label": "Supplemental · refreshed every ~10 min",

    /* Recent activity section */
    "recent-activity-title": "Recent governance activity",
    "recent-activity-lede": "Most recent DRep votes recorded on chain, refreshed every ~10 minutes from the live telemetry layer. Timestamps are exact UTC.",
    "cite-s14": "See Methodology §14.",
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
    "page-title": "Cardano Observatory",
    "page-lede": "One open, read-only window on the whole Cardano ecosystem — governance, projects, treasury, Catalyst, memory and data. Sourced, bilingual, CC0. The live Top-30 DRep snapshot is below.",
    "footnote-deltas": "Δ 7d and Δ 30d display as — when fewer than 7 (respectively 30) daily snapshots have accumulated since launch. They populate forward from the first deployment.",

    /* Table headers */
    "th-name": "Name / DRep ID",
    "th-weight": "Voting weight (ADA)",
    "th-delegators": "Delegators",
    "th-d7d": "Δ 7d (ADA)",
    "th-d30d": "Δ 30d (ADA)",
    "th-deleg-d7d": "Δ 7d",
    "th-deleg-d30d": "Δ 30d",
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
    "ft-about": "About",
    "ft-map": "Map",
    "ft-docs": "Docs",
    "ft-status": "Status",
    "ft-heartbeat": "Heartbeat",
    "ft-methodology": "Methodology",
    "ft-source": "Source",
    "ft-observatory": "Observatory",
    "ft-api": "API docs",
    "ft-repro": "Reproducible from public Koios API endpoints.",

    /* Nav (cross-page) */
    "h-nav-observatory": "Observatory",
    "h-nav-actions": "Actions",
    "h-nav-projects": "Projects",
    "h-nav-categories": "Categories",
    "h-nav-tokens": "Tokens",
    "h-nav-rankings": "Rankings",
    "h-nav-ecosystem": "Ecosystem",
    "h-nav-treasury": "Treasury",
    "h-nav-catalyst": "Catalyst",
    "h-nav-market": "Market",
    "h-nav-health": "Health",
    "h-nav-changes": "Changes",
    "h-nav-memory": "Memory",
    "h-nav-daily": "Daily", "h-nav-api": "API", "h-nav-search": "Search",
    "nav-grp-discover": "Discover", "nav-grp-governance": "Governance", "nav-grp-data": "Data",
    "p-sub": "Provenance-stamped project record — every field carries its source.",
    "c-sub": "Category — the projects grouped under this part of the ecosystem.",
    "drep-sub": "DRep — on-chain voting weight, recorded votes, and 90-day history.",
    "tok-sub": "Token — on-chain metadata, price, supply and holders, each sourced.",

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
    "footnote-actions": "Vote counts are the most recent vote cast by each DRep on each action. When a DRep revoted on the same action, only the chronologically latest vote is counted.",
    "cite-s6-actions": "See Methodology §6.",

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
    "history-lede": "Every daily snapshot archived under /data/snapshots/by-date/{YYYY-MM-DD}/. Snapshots are immutable once published. Missing dates (failed ETL runs) are not interpolated; they simply do not appear.",
    "cite-s21": "See Methodology §21.",
    "hs-first-label": "First archived",
    "hs-latest-label": "Latest archived",
    "hs-total-label": "Total days",
    "history-list-label": "All snapshots",
    "th-h-date": "Date (UTC)",
    "th-h-links": "Views",
    "th-h-archive": "Archive path",
    "hist-link-observatory": "Observatory",
    "hist-link-actions": "Actions",
    "prov-title": "HISTORICAL SNAPSHOT",
    "prov-view-current": "view current →",
    "prov-download": "download:",
    "prov-label-archive": "archive path",
    "prov-label-etl-completed": "ETL completed",
    "prov-label-methodology": "methodology",
    "prov-label-schema": "schema",
    "missing-date-title": "No snapshot for this date",
    "missing-date-body": "No snapshot was published for",
    "missing-date-prior": "Nearest prior date",
    "missing-date-next": "Nearest next date",
    "missing-date-list": "See the full list of available dates",

    /* FLOW-1 — Recent net change panel */
    "drep-recent-change-label": "Recent net change",
    "drep-recent-change-help": "Net snapshot-to-snapshot deltas. Movement only; not migration; not attributable to motive.",
    "cite-s18": "See Methodology §18.",
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
    "action-timeline-help": "Protocol-observed events. Active actions show submission only until a terminal state is observed.",
    "cite-s20-3": "See Methodology §20.3.",
    "th-tl-event": "Event",
    "th-tl-date": "Date (UTC)",
    "th-tl-epoch": "Epoch",
    /* FLOW-5 — Treasury withdrawal recipients (TreasuryWithdrawals actions only) */
    "action-withdrawals-label": "Treasury withdrawal recipients",
    "action-withdrawals-help": "Stake-credential recipients listed on this treasury withdrawal proposal as recorded on chain. No editorial fields — recipient identity beyond the stake address is not asserted.",
    "cite-s22-4": "See Methodology §22.4.",
    "th-w-recipient": "Recipient stake address",
    "th-w-amount-ada": "Amount (ADA)",
    "th-w-amount-lovelace": "Amount (lovelace)",
    "action-withdrawals-total-label": "Total",

    "action-tally-label": "Vote tally",
    "action-tally-help": "Counts are the most recent vote cast by each DRep on this action. Revoted positions use the chronologically latest. No approval/rejection framing — protocol terms only.",
    "cite-s6-action": "See Methodology §6.",
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
    "eco-link-api": "API",

    /* Header / nav */
    "h-brand": "Cardano Delegation Observatory",
    "h-nav-methodology": "方法論",
    "h-nav-source": "ソース",

    /* Meta strip */
    "m-epoch-label": "エポック",
    "m-date-label": "データ対象日",
    "m-lag": "正準となる日次ガバナンススナップショット · 最大約24時間の遅延",
    "m-source-label": "ソース",
    "home-m-dreps": "追跡DRep数", "home-m-dreps-sub": "投票権上位",
    "home-m-weight": "総投票権", "home-m-weight-sub": "ADA・上位30",
    "home-m-delegators": "総委任者数", "home-m-delegators-sub": "上位30の合計",
    "home-m-epoch": "スナップショットエポック", "home-m-epoch-sub": "現在の日次スナップショット",
    "home-scale-label": "asy.life エコシステム全体", "home-dreps-head": "本日のガバナンススナップショット",
    "scale-projects": "プロジェクト", "scale-categories": "カテゴリ", "scale-tokens": "トークン",
    "scale-funds": "Catalyst ファンド", "scale-actions": "ガバナンスアクション",
    "scale-epochs": "トレジャリーエポック", "scale-routes": "API ルート",

    /* Live telemetry strip */
    "live-badge-label": "ライブテレメトリー",
    "live-cadence-label": "補助情報 · 約10分ごとに更新",

    /* Recent activity section */
    "recent-activity-title": "最近のガバナンス・アクティビティ",
    "recent-activity-lede": "オンチェーンに記録された直近のDRep投票。ライブテレメトリー層から約10分ごとに更新される。タイムスタンプはUTCの絶対時刻である。",
    "cite-s14": "方法論 §14 を参照。",
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
    "page-title": "Cardano オブザバトリー",
    "page-lede": "Cardano エコシステム全体を映す、オープンで読み取り専用の窓 — ガバナンス、プロジェクト、トレジャリー、Catalyst、メモリ、データ。出典付き・二言語・CC0。ライブの上位30 DRep スナップショットは下にあります。",
    "footnote-deltas": "Δ 7日 と Δ 30日 は、ローンチ以降の日次スナップショットがそれぞれ7日分・30日分蓄積されるまでは「—」と表示する。デプロイ時点から前方累積で値が入る。",

    /* Table headers */
    "th-name": "名前 / DRep ID",
    "th-weight": "投票権 (ADA)",
    "th-delegators": "委任者数",
    "th-d7d": "Δ 7日間 (ADA)",
    "th-d30d": "Δ 30日間 (ADA)",
    "th-deleg-d7d": "Δ 7日間",
    "th-deleg-d30d": "Δ 30日間",
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
    "ft-about": "概要",
    "ft-map": "マップ",
    "ft-docs": "ドキュメント",
    "ft-status": "ステータス",
    "ft-heartbeat": "ハートビート",
    "ft-methodology": "方法論",
    "ft-source": "ソース",
    "ft-observatory": "Observatory",
    "ft-api": "API ドキュメント",
    "ft-repro": "公開Koios API エンドポイントから再現可能。",

    /* Nav (cross-page) */
    "h-nav-observatory": "Observatory",
    "h-nav-actions": "ガバナンスアクション",
    "h-nav-projects": "プロジェクト",
    "h-nav-categories": "カテゴリ",
    "h-nav-tokens": "トークン",
    "h-nav-rankings": "ランキング",
    "h-nav-ecosystem": "エコシステム",
    "h-nav-treasury": "トレジャリー",
    "h-nav-catalyst": "Catalyst",
    "h-nav-market": "マーケット",
    "h-nav-health": "健全性",
    "h-nav-changes": "変化",
    "h-nav-memory": "メモリ",
    "h-nav-daily": "日次", "h-nav-api": "API", "h-nav-search": "検索",
    "nav-grp-discover": "探索", "nav-grp-governance": "ガバナンス", "nav-grp-data": "データ",
    "p-sub": "来歴付きプロジェクト記録 — 各項目が出典を伴います。",
    "c-sub": "カテゴリ — エコシステムのこの領域にまとめられたプロジェクト。",
    "drep-sub": "DRep — オンチェーンの投票権・記録された投票・90日履歴。",
    "tok-sub": "トークン — オンチェーンのメタデータ・価格・供給・保有者（すべて出典付き）。",

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
    "footnote-actions": "投票数は、各DRepが各アクションに対して最後に投じた票に基づく。DRepが同じアクションに対して再投票した場合は、時系列上で最新の票のみが集計される。",
    "cite-s6-actions": "方法論 §6 を参照。",

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
    "history-lede": "/data/snapshots/by-date/{YYYY-MM-DD}/ 配下に保管された日次スナップショット一覧。公開後は不変。欠損日(ETL失敗)は補間せず、単純に表示しない。",
    "cite-s21": "方法論 §21 を参照。",
    "hs-first-label": "最古",
    "hs-latest-label": "最新",
    "hs-total-label": "累計日数",
    "history-list-label": "全スナップショット",
    "th-h-date": "日付 (UTC)",
    "th-h-links": "ビュー",
    "th-h-archive": "アーカイブパス",
    "hist-link-observatory": "Observatory",
    "hist-link-actions": "アクション",
    "prov-title": "履歴スナップショット",
    "prov-view-current": "現在のビューへ →",
    "prov-download": "ダウンロード:",
    "prov-label-archive": "アーカイブパス",
    "prov-label-etl-completed": "ETL 実行完了",
    "prov-label-methodology": "方法論バージョン",
    "prov-label-schema": "スキーマバージョン",
    "missing-date-title": "この日付のスナップショットは存在しません",
    "missing-date-body": "次の日付ではスナップショットが公開されませんでした:",
    "missing-date-prior": "直前の公開日",
    "missing-date-next": "直後の公開日",
    "missing-date-list": "公開日の一覧を見る",

    /* FLOW-1 — Recent net change panel */
    "drep-recent-change-label": "直近の純変動",
    "drep-recent-change-help": "スナップショット間の純差分。変動のみ。移行(migration)とは別概念であり、動機は推定しない。",
    "cite-s18": "方法論 §18 を参照。",
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
    "action-timeline-help": "プロトコルが観測したイベント。進行中のアクションは終局状態が観測されるまで「提出」のみを表示する。",
    "cite-s20-3": "方法論 §20.3 を参照。",
    "th-tl-event": "イベント",
    "th-tl-date": "日付 (UTC)",
    "th-tl-epoch": "エポック",
    /* FLOW-5 — トレジャリー引き出しの受取人 (TreasuryWithdrawals 種別のアクションのみ) */
    "action-withdrawals-label": "トレジャリー引き出しの受取人",
    "action-withdrawals-help": "本トレジャリー引き出し提案にオンチェーン上で記録された、ステーククレデンシャル (stake credential) による受取人の一覧。編集的なフィールドは持たない。ステークアドレス以外の受取人の身元は主張しない。",
    "cite-s22-4": "方法論 §22.4 を参照。",
    "th-w-recipient": "受取人のステークアドレス",
    "th-w-amount-ada": "金額 (ADA)",
    "th-w-amount-lovelace": "金額 (lovelace)",
    "action-withdrawals-total-label": "合計",

    "action-tally-label": "投票集計",
    "action-tally-help": "集計は各DRepがこのアクションに対して最後に投じた票。再投票された場合は時系列上で最新の票のみを用いる。承認や否決といった言い方はせず、プロトコル上の用語のみを用いる。",
    "cite-s6-action": "方法論 §6 を参照。",
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

/* Protocol enum translations. Keyed by category and raw value (case-sensitive,
 * matching the data values exported by the ETL — see docs/JA_STYLE_GUIDE.md
 * §1.1). The EN side renders the source value verbatim; the JA side maps to
 * the locked Japanese vocabulary. Categories: action_type, outcome, vote,
 * event (action-page timeline). */
const enum_map = {
  action_type: {
    ja: {
      "TreasuryWithdrawals": "トレジャリー引き出し",
      "ParameterChange":     "パラメータ変更",
      "HardForkInitiation":  "ハードフォーク起動",
      "NoConfidence":        "不信任",
      "NewCommittee":        "新規委員会",
      "NewConstitution":     "新規憲法",
      "InfoAction":          "情報アクション",
    },
  },
  outcome: {
    ja: {
      "active":   "進行中",
      "ratified": "批准",
      "enacted":  "施行",
      "expired":  "失効",
      "dropped":  "廃案",
    },
  },
  vote: {
    ja: {
      "yes":     "賛成",
      "no":      "反対",
      "abstain": "棄権",
    },
  },
  event: {
    /* Action-detail timeline events as emitted by action.js renderTimeline. */
    ja: {
      "submission": "提出",
      "expires":    "失効予定",
      "expired":    "失効",
      "ratified":   "批准",
      "enacted":    "施行",
      "dropped":    "廃案",
    },
  },
};

/* String lookup against the currently active language. Defined on window so
 * dynamic-render JS (action.js timeline events, historical.js missing-date
 * notices and provenance strip, enum renderers below) can resolve a key to
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

/* Enum lookup against the currently active language. Returns the locked JA
 * translation when the active lang is ja AND the value is mapped; otherwise
 * returns the source value verbatim. Unmapped values fall through unchanged
 * — that is by design, so a new enum value added by the protocol surfaces as
 * its raw protocol name rather than disappearing or rendering as something
 * misleading. When the unmapped value appears, the fix is to add the
 * translation to docs/JA_STYLE_GUIDE.md §1 and to enum_map above. */
window.cdoEnum = function (category, value) {
  if (value == null || value === "") return value;
  const lang = (document.documentElement.lang === "ja") ? "ja" : "en";
  if (lang === "en") return value;
  const cat = enum_map[category];
  if (!cat || !cat.ja) return value;
  return (value in cat.ja) ? cat.ja[value] : value;
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

/* ── Grouped navigation: dropdown behaviour + URL-driven active state ─────────
   The nav markup is identical on every page; the current section is derived from
   the URL here (not hard-coded per page), so a single canonical nav stays in sync.
   Click to open on touch; CSS handles hover on desktop. Esc / outside-click close. */
function navInit() {
  // Re-apply translations now that the nav (and any late DOM) exists.
  setLang(document.documentElement.lang === "ja" ? "ja" : "en");

  var groups = Array.prototype.slice.call(document.querySelectorAll(".nav-group"));
  function closeAll() {
    groups.forEach(function (g) {
      g.classList.remove("open");
      var b = g.querySelector(".nav-group-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  groups.forEach(function (g) {
    var btn = g.querySelector(".nav-group-btn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var wasOpen = g.classList.contains("open");
      closeAll();
      if (!wasOpen) { g.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
    });
  });
  document.addEventListener("click", closeAll);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });

  // Active state from the current URL.
  var cur = location.pathname.replace(/.*\//, "");
  var isHome = location.pathname === "/" || cur === "" || cur === "index.html";
  var matched = false;
  document.querySelectorAll(".nav-menu a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    var hrefFile = href.replace(/.*\//, "");
    var hit = isHome ? href === "/" : (href !== "/" && hrefFile === cur);
    if (hit) {
      a.classList.add("active");
      var grp = a.closest(".nav-group");
      if (grp) grp.classList.add("nav-current");
      matched = true;
    }
  });
  if (!matched && !isHome) {
    var SEC = {
      "project.html": "discover", "project-history.html": "discover", "category.html": "discover",
      "category-explorer.html": "discover", "memory-heatmap.html": "discover", "memory-map.html": "discover", "memory-insights.html": "discover", "ecosystem-pulse.html": "discover",
      "drep.html": "governance", "drep-history.html": "governance", "action.html": "governance", "actions.html": "governance",
      "treasury-timeline.html": "governance", "timeline.html": "governance", "concentration.html": "governance", "flows.html": "governance",
      "token.html": "data",
    };
    var grpName = SEC[cur];
    if (grpName) {
      var el = document.querySelector('.nav-group[data-grp="' + grpName + '"]');
      if (el) el.classList.add("nav-current");
    }
  }
}
/* ── "What next?" — cross-link every flagship page so a visitor never dead-ends.
   One curated map, injected before the footer. {id} threads the current ?id. ── */
var WHATNEXT = {
  "state.html": [["ecosystem-pulse.html", "Ecosystem Pulse", "what's active now", "エコシステム パルス", "今アクティブなもの"], ["timeline.html", "Timeline", "how it got here", "タイムライン", "ここに至るまで"], ["search.html", "Search", "find a project", "検索", "プロジェクトを探す"]],
  "timeline.html": [["ecosystem-pulse.html", "Ecosystem Pulse", "what's active now", "エコシステム パルス", "今アクティブなもの"], ["treasury-timeline.html", "Treasury Timeline", "treasury history", "トレジャリー タイムライン", "トレジャリーの歴史"], ["governance-daily.html", "Governance Daily", "today's movement", "ガバナンス日次", "本日の動き"]],
  "ecosystem-pulse.html": [["search.html", "Search", "find any project", "検索", "プロジェクトを探す"], ["memory-insights.html", "Memory Insights", "standing facts", "メモリ インサイト", "恒常的な事実"], ["timeline.html", "Timeline", "the full history", "タイムライン", "完全な歴史"]],
  "search.html": [["memory-map.html", "Memory Map", "the ecosystem visually", "メモリ マップ", "視覚的なエコシステム"], ["ecosystem-pulse.html", "Ecosystem Pulse", "what's active now", "エコシステム パルス", "今アクティブなもの"], ["memory-insights.html", "Memory Insights", "most documented & more", "メモリ インサイト", "最も文書化 ほか"]],
  "memory.html": [["state.html", "State of Cardano", "the operating picture", "Cardano の現況", "オペレーティングピクチャ"], ["ecosystem-pulse.html", "Ecosystem Pulse", "what's active now", "エコシステム パルス", "今アクティブなもの"], ["timeline.html", "Timeline", "watch it evolve", "タイムライン", "歩みを見る"]],
  "memory-insights.html": [["ecosystem-pulse.html", "Ecosystem Pulse", "recent activity", "エコシステム パルス", "最近の活動"], ["search.html", "Search", "find a project", "検索", "プロジェクトを探す"], ["memory-map.html", "Memory Map", "by category", "メモリ マップ", "カテゴリ別"]],
  "memory-map.html": [["search.html", "Search", "find a project", "検索", "プロジェクトを探す"], ["category-explorer.html", "Category Explorer", "drill into categories", "カテゴリ エクスプローラー", "カテゴリを掘り下げ"], ["memory-insights.html", "Memory Insights", "standing facts", "メモリ インサイト", "恒常的な事実"]],
  "governance-daily.html": [["drep-history.html", "DRep History", "a DRep over time", "DRep 履歴", "DRep の推移"], ["timeline.html", "Timeline", "the full history", "タイムライン", "完全な歴史"], ["changes.html", "Change feed", "per-DRep detail", "変化フィード", "DRep別の詳細"]],
  "changes.html": [["governance-daily.html", "Governance Daily", "at a glance", "ガバナンス日次", "一目で"], ["timeline.html", "Timeline", "the full history", "タイムライン", "完全な歴史"], ["concentration.html", "Concentration", "weight distribution", "集中度", "投票権の分布"]],
  "treasury.html": [["treasury-timeline.html", "Treasury Timeline", "actions & withdrawals in order", "トレジャリー タイムライン", "アクションと出金を時系列で"], ["state.html", "State of Cardano", "the operating picture", "Cardano の現況", "オペレーティングピクチャ"], ["timeline.html", "Timeline", "the full history", "タイムライン", "完全な歴史"]],
  "treasury-timeline.html": [["treasury.html", "Treasury", "balance & reserves", "トレジャリー", "残高と準備金"], ["state.html", "State of Cardano", "the operating picture", "Cardano の現況", "オペレーティングピクチャ"], ["timeline.html", "Timeline", "all domains", "タイムライン", "全領域"]],
  "project.html": [["project-history.html?id={id}", "Project History", "this project's trail", "プロジェクト履歴", "このプロジェクトの軌跡"], ["memory-insights.html", "Memory Insights", "standing facts", "メモリ インサイト", "恒常的な事実"], ["search.html", "Search", "find related projects", "検索", "関連プロジェクトを探す"]],
  "drep.html": [["drep-history.html?id={id}", "DRep History", "weight, rank & votes over time", "DRep 履歴", "投票権・順位・投票の推移"], ["governance-daily.html", "Governance Daily", "today's movement", "ガバナンス日次", "本日の動き"], ["timeline.html", "Timeline", "the full history", "タイムライン", "完全な歴史"]],
  "drep-history.html": [["governance-daily.html", "Governance Daily", "today's movement", "ガバナンス日次", "本日の動き"], ["timeline.html", "Timeline", "the full history", "タイムライン", "完全な歴史"], ["/", "Observatory", "top-30 DReps", "オブザバトリー", "上位30 DRep"]],
  "category.html": [["category-explorer.html", "Category Explorer", "all categories", "カテゴリ エクスプローラー", "全カテゴリ"], ["memory-map.html", "Memory Map", "the ecosystem visually", "メモリ マップ", "視覚的なエコシステム"], ["search.html", "Search", "find a project", "検索", "プロジェクトを探す"]],
  "projects.html": [["search.html", "Search", "search 847 projects", "検索", "847件を検索"], ["ecosystem-pulse.html", "Ecosystem Pulse", "what's active now", "エコシステム パルス", "今アクティブなもの"], ["memory-map.html", "Memory Map", "by category", "メモリ マップ", "カテゴリ別"]],
};
function whatNextInit() {
  if (document.querySelector(".whatnext")) return;
  var file = location.pathname.replace(/.*\//, "") || "index.html";
  var sug = WHATNEXT[file];
  if (!sug || !sug.length) return;
  var footer = document.querySelector(".site-footer");
  if (!footer) return;
  var id = new URLSearchParams(location.search).get("id");
  var links = sug.map(function (s) {
    var href = s[0].replace("{id}", id ? encodeURIComponent(id) : "");
    return '<a href="' + href + '"><span class="en"><strong>' + s[1] + '</strong> <span class="wn-d">· ' + s[2] + '</span></span>'
      + '<span class="ja"><strong>' + s[3] + '</strong> <span class="wn-d">· ' + s[4] + '</span></span></a>';
  }).join("");
  var sec = document.createElement("section");
  sec.className = "whatnext";
  sec.innerHTML = '<div class="container"><div class="wn-h"><span class="en">What next?</span><span class="ja">次は？</span></div>'
    + '<div class="wn-links">' + links + '</div></div>';
  footer.parentNode.insertBefore(sec, footer);
}
function omegaInit() { navInit(); whatNextInit(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", omegaInit);
else omegaInit();

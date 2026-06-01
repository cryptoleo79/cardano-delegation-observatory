# Japanese style guide — Cardano Delegation Observatory

**Date locked:** 2026-06-02
**Scope:** All user-facing Japanese text in the observatory web frontend, the methodology HTML page, and any future bilingual surfaces in this repository. This document is the canonical reference for Japanese terminology, register, and presentation; deviations require explicit operator approval and an update to this guide before shipping.

**What this is.** A reference, not a translation. It locks the vocabulary, register, and presentation choices so future Japanese work can be applied consistently without relitigating each decision. It exists because consistent natural Japanese has 10× the perceived quality of literal translation, and inconsistency between pages costs more than the individual translation choices themselves.

**What this is not.** A general Japanese style manual, nor a Cardano protocol glossary. Scope is the observatory only.

---

## 1. Locked terminology

Every term in this section is the **only** acceptable translation in this codebase. If a new context arises where one of these terms feels wrong, the answer is to update this guide first, then update the strings — not to silently use a different translation in one file.

### 1.1 Protocol enums (rendered from data)

These enums appear in `governance_actions.action_type`, `governance_actions.outcome`, `votes.vote`, and the action-detail timeline event types. They are rendered identically across `index.html` (recent activity), `actions.html` (governance actions index), `action.html` (action detail), `drep.html` (vote history), and `history.html` (archived snapshots).

**action_type:**

| Source (English) | Locked Japanese |
|---|---|
| `TreasuryWithdrawals` | トレジャリー引き出し |
| `ParameterChange` | パラメータ変更 |
| `HardForkInitiation` | ハードフォーク起動 |
| `NoConfidence` | 不信任 |
| `NewCommittee` | 新規委員会 |
| `NewConstitution` | 新規憲法 |
| `InfoAction` | 情報アクション |

**outcome:**

| Source (English) | Locked Japanese |
|---|---|
| `active` | 進行中 |
| `ratified` | 批准 |
| `enacted` | 施行 |
| `expired` | 失効 |
| `dropped` | 廃案 |

**vote:**

| Source (English) | Locked Japanese |
|---|---|
| `yes` | 賛成 |
| `no` | 反対 |
| `abstain` | 棄権 |

**timeline event type** (rendered by `action.js`):

| Source (English) | Locked Japanese |
|---|---|
| `submission` | 提出 |
| `expires` (prospective) | 失効予定 |
| `expired` | 失効 |
| `ratified` | 批准 |
| `enacted` | 施行 |
| `dropped` | 廃案 |

### 1.2 Treasury vocabulary (FLOW-5)

| Source (English) | Locked Japanese | Notes |
|---|---|---|
| Treasury | トレジャリー | Not 財務省 (= Japanese Ministry of Finance) or 国庫 (= national treasury / state coffers — political connotation). The protocol-level fund has no analogue in JP government. Cardano JP community usage has converged on the katakana. |
| Treasury balance | トレジャリー残高 | |
| Treasury withdrawal | トレジャリー引き出し | Same root as the enum. |
| Treasury withdrawal recipient | トレジャリー引き出しの受取人 | |
| Treasury action | トレジャリー関連アクション | When referring to the broader category, not the enum value. |

### 1.3 Governance vocabulary

| Source (English) | Locked Japanese |
|---|---|
| Governance action | ガバナンスアクション |
| Governance | ガバナンス |
| Constitution (on-chain) | 憲法 |
| Constitutional committee | 憲法委員会 |
| Committee | 委員会 |
| Proposal | 提案 |
| Vote tally | 投票集計 |
| Vote | 投票 |
| Voting weight | 投票権 |
| Voting power | 投票権 (same term — JP collapses the distinction) |
| Delegation | 委任 |
| Delegator | 委任者 |
| DRep | DRep (proper noun — do not translate) |
| DRep ID | DRep ID |
| Submitted | 提出 |
| Submission | 提出 |
| Ratified | 批准 |
| Enacted | 施行 |
| Expired | 失効 |
| Dropped | 廃案 |
| Outcome | 結果 |
| Type | 種別 |
| Action | アクション (in compound terms only; standalone, prefer ガバナンスアクション) |

### 1.4 Time / chain vocabulary

| Source (English) | Locked Japanese |
|---|---|
| Epoch | エポック |
| Block | ブロック |
| Block time | ブロック時刻 |
| Snapshot | スナップショット |
| Historical snapshot | 履歴スナップショット |
| Daily snapshot | 日次スナップショット |
| Archive (n.) | アーカイブ |
| Archived snapshot | アーカイブ済みスナップショット |
| Date | 日付 |
| Date (UTC) | 日付 (UTC) |
| Time (UTC) | 時刻 (UTC) |
| Lag | 遅延 |
| Cadence | 更新頻度 |

### 1.5 Data / provenance vocabulary

| Source (English) | Locked Japanese | Notes |
|---|---|---|
| Canonical | 正準 | Technical/mathematical term (e.g., 正準形 = canonical form). Avoid 正本 and 正規 — 正本 is overly archival/legal, 正規 is too generic. |
| Reproducible | 再現可能 | |
| Reproducibility | 再現性 | |
| Provenance | 来歴 | Avoid 出所 (too informal; usually applied to people). 来歴 fits the data/document context. |
| Source | ソース (in protocol context, e.g., "Source: Koios") or 出典 (in citation context) |
| Stake address | ステークアドレス |
| Telemetry | テレメトリー (long vowel ー, not テレメトリ) |
| Live telemetry | ライブテレメトリー (no nakaguro between the two katakana words) |
| Methodology | 方法論 |
| Verification | 検証 |
| Integrity | 完全性 |

### 1.6 UI chrome

| Source (English) | Locked Japanese | Notes |
|---|---|---|
| Recipient | 受取人 | |
| Amount | 金額 | |
| Total | 合計 | |
| Loading… | 読み込み中… | Trailing ellipsis is the JP three-dot 「…」 not three ASCII dots. |
| Show all | すべて表示 | |
| Filter | フィルタ | |
| All (in filter dropdown) | すべて | |
| Back to … | … に戻る | E.g., "← ガバナンスアクションに戻る" |
| First / Latest | 最初 / 最新 | |
| Total days | 累計日数 | |
| Per-row view | 行ごとの表示 | |
| Footnote | 注記 | |

### 1.7 Error and empty states (です・ます調)

| Source (English) | Locked Japanese |
|---|---|
| Loading… | 読み込み中… |
| Could not load snapshot. | スナップショットを読み込めませんでした。 |
| Action not found | アクションが見つかりませんでした |
| DRep not found | DRepが見つかりませんでした |
| No recorded votes yet. | 投票記録はまだありません。 |
| Chart populates as daily snapshots accumulate. | 日次スナップショットの蓄積に伴いチャートが描画されます。 |
| No on-chain metadata registered. | オンチェーンのメタデータは登録されていません。 |
| Snapshot missing for this date. | この日付のスナップショットは存在しません。 |

---

## 2. Proper nouns — do not translate

The following render in Latin script regardless of language. Do not katakana-ize, do not transliterate, do not translate:

- **DRep** (and **DRep ID**)
- **ADA** (the unit; never エイダ or アダ)
- **Koios** (the public Cardano API)
- **Hydra**
- **Ekklesia**
- **GitHub**
- **Cardano**
- **lovelace** (lowercase; the sub-unit name)
- **bech32**
- **Catalyst** (Project Catalyst — capital C; when the JP context calls for it, parenthesize with "プロジェクト・カタリスト" on first reference only)
- **IdeaScale** (proper-noun product name)

URLs and absolute domain names (`observatory.asy.life`, `ctf.asy.life`) are never translated and never replaced with kana spellings.

---

## 3. Style register

### 3.1 Register split

The observatory uses two registers, not one. The choice depends on **who is speaking and to whom**.

**である調 (academic / declarative form)** — used when the methodology, the data, or the observatory itself is the speaker, describing facts impersonally:

- Methodology page body
- Per-section descriptive lede paragraphs
- Footnotes, help text describing what a value means
- Provenance strip text (e.g., "このページは2026-05-28のアーカイブから描画されている。")
- Stat-card labels and table column headers (no verbs — register-neutral)

**です・ます調 (polite form)** — used when the page speaks directly to the user:

- Error messages
- Empty-state messages
- Loading messages
- Missing-date notices
- Any text that begins with an implicit subject of "the system / the page" addressing "you"

### 3.2 Why the split matters

The observatory's posture is observer, not advocate. である調 is the right register for that posture — it positions the document as a record, not a sales pitch. But error states and empty states are addressed *to* the reader and a clinical である調 there reads as cold ("DRepが見つからない" is gramatically fine but feels brusque for an error message that the user will see when they have made a small mistake). です・ます調 for those moments is a courtesy.

### 3.3 Examples

| Where | EN | JA register | JA |
|---|---|---|---|
| Methodology body | "Data is sourced from Koios." | である調 | データはKoiosから取得する。 |
| Stat card label | "Voting weight" | (label, no verb) | 投票権 |
| Help footnote | "Counts are the most recent vote cast by each DRep…" | である調 | 集計は各DRepがこのアクションに対して最後に投じた票である。 |
| Error message | "Could not load snapshot." | です・ます調 | スナップショットを読み込めませんでした。 |
| Empty state | "No recorded votes yet." | です・ます調 | 投票記録はまだありません。 |
| Loading indicator | "Loading…" | です・ます調 (implicit) | 読み込み中… |

### 3.4 First-person and second-person

- Never use 私たち / 我々 / 当方 to refer to the observatory in body text. The observatory is impersonal infrastructure.
- Operator disclosure (METHODOLOGY §10) is the only place where the operator is identified by name; do not extend this to a "we" elsewhere.
- Do not address the reader as あなた; use implicit subjects.

---

## 4. Punctuation and typography

### 4.1 Parentheses

- Inside Japanese prose: full-width 「（…）」 unless the parenthesized content is entirely Latin/ASCII (URLs, code identifiers, English proper nouns), in which case half-width `(…)` is acceptable.
- Examples:
  - 「投票記録は10件です（うち最新は2026-05-28）。」 — full-width.
  - 「Cardanoのガバナンスフレームワーク (CIP-1694)」 — half-width, both inside-content is Latin.

### 4.2 Dashes and ranges

- Use a single full-width em dash 「—」 (U+2014) for break-in-thought, not 「ーー」 or 「‒」.
- Avoid the English idiom of double-dash 「——」 in JP body — prefer a comma 「、」 or a period 「。」 to break the sentence instead.
- For numeric ranges, use a single en dash 「–」 (U+2013) without spaces: 「2026-05-28 – 2026-06-01」 with full-width spacing if surrounded by JP characters.
- For data fields shown as dashes (e.g., "—" indicating a null), keep the existing em-dash convention; the language pass does not change those.

### 4.3 Commas and periods

- Use 「、」 and 「。」 in body text (full-width Japanese punctuation).
- Use `,` and `.` in numeric strings (thousands separator, decimal point) — these are rendered by `Intl.NumberFormat` and are correct in both languages.
- Do not mix half-width and full-width punctuation in the same sentence.

### 4.4 Numbers and units

- ADA quantities: render with thousands separators, no decimal places unless required by precision (rare in observatory contexts). Both EN and JA use comma-separated thousands.
- Lovelace quantities: same treatment; no unit-internal conversion in display.
- Epoch numbers: integer, no formatting, no leading zeros, render identically in both languages.
- Dates: ISO-8601 `YYYY-MM-DD` in both languages. JP-style `2026年6月2日` is acceptable in long-form methodology prose but never in stat cards, tables, or column headers.
- Times: `HH:MM UTC` in both languages.

### 4.5 Hyperlinks in prose

`textContent` replacement in `i18n.js` strips child elements. Any translated paragraph that needs an in-prose hyperlink must use the small template helper (see CC-4 in the JA_AUDIT) that injects an `<a>` element, not embed the link text as plain text. Until that helper lands, in-prose section references (e.g., "see Methodology §22.4") are rendered as plain text but the destination link is preserved in a "see also" footer link where possible.

### 4.6 Spaces

- No space between a Japanese character and a Latin word: 「DRepID」 is wrong — write 「DRep ID」 with a half-width space, but only because both sides are Latin. 「DRepの数」 is correct (no space), 「2026年のCardano」 is correct (no space).
- Inside parenthetical Latin content, half-width spaces are normal: 「ガバナンスアクション (governance action)」.
- Between a Latin word and the following Japanese particle: no space. 「Cardanoの」 not 「Cardano の」.

---

## 5. Length and rhythm

Japanese is denser per visible character than English; a 40-character EN sentence may produce a 20-character JA sentence carrying the same information. Take advantage of this when the EN original is verbose — do not pad the JP to match length.

Conversely, JP technical prose tolerates longer sentences than the same content in English. Don't artificially split a JP sentence that flows naturally just because the EN version was three short sentences.

Default rhythm targets:

- Stat card labels: ≤ 6 JP characters; if the term is longer, accept it but never abbreviate with mid-word truncation.
- Column headers: ≤ 10 JP characters preferred; longer is acceptable when the alternative is loss of meaning.
- Lede paragraphs: 1–3 sentences. The JP version may collapse two English sentences into one when natural.
- Footnotes: as long as needed; brevity is not a virtue here, clarity is.

---

## 6. Capitalization and proper-noun handling

- Latin proper nouns retain their canonical capitalization in both languages: `Cardano`, `DRep`, `Koios`, `GitHub`, `Catalyst`, `IdeaScale`.
- `lovelace` is lowercase in both languages (it is the sub-unit, not a proper noun in the strict sense).
- `ADA` is all-caps in both languages.
- Action type enum source values render with capitalization preserved when shown as raw protocol values (e.g., debug output, methodology references). User-facing pages render the locked JP translation per §1.1 instead.
- URLs, package names, and code identifiers are never capitalized differently in JP than in EN.

---

## 7. Methodology page treatment

The methodology page (`web/methodology.html`) is the only page that follows a different bilingual pattern than the rest of the observatory:

- **Pattern:** Inline EN/JA blocks with a class toggle (`<span class="en">…</span><span class="ja">…</span>`), mirroring the voting / governance pages.
- **Register:** である調 throughout (it is the methodology speaking, not addressing a user).
- **Section numbering:** preserved across languages (§1, §2, §22.13, etc.). Never renumber.
- **Citations:** internal section references (§14, §22.4) render the section number identically in both languages. Cross-document references to METHODOLOGY.md (the Markdown source) are not translated — they point at the same source file.
- **Versioning notes** (§11 changelog): translate the language for each row but preserve commit hashes, version strings, dates, and proper-noun terms (FLOW-1, FLOW-5, schema_version) in their original Latin form.

When in doubt, the methodology should sound like a careful Japanese academic paper, not a marketing brochure.

---

## 8. Decision protocol

### 8.1 When a new term is needed

If a translation is required for a term not in §1, the order is:

1. Check whether existing Cardano JP community usage has settled on a term (IOG JP, EMURGO JP, Cardano JP Forum, Catalyst JP entries).
2. If yes, use that term and add it to §1 of this guide in the same commit that introduces the new translation.
3. If no settled community usage exists, pick the most natural translation following the principles in §3 and §4, and document the choice in §1 with a one-line rationale.
4. Never silently introduce a new term that bypasses §1. The guide is the source of truth for what is allowed in user-facing text.

### 8.2 When an existing term feels wrong

1. Open a discussion (issue, conversation with the operator) before changing the term in code.
2. If the change is approved, update §1 of this guide first.
3. Then sweep the codebase (i18n.js, methodology.html, any inline `<span class="ja">` blocks) and update every occurrence in a single commit.
4. The commit message must reference this guide section so the change is traceable.

### 8.3 Versioning this guide

This guide is versioned by date in the header. Changes are append-only in the change log below. Do not rewrite history of past terminology decisions — they are part of the project's evolution and are useful to future maintainers reading old commits.

---

## 9. Change log

| Date | Change |
|---|---|
| 2026-06-02 | Initial guide. Locks vocabulary listed in §1 (protocol enums, treasury vocabulary, governance vocabulary, time/chain vocabulary, data/provenance vocabulary, UI chrome, error/empty states), proper-noun list in §2, register split in §3, typography conventions in §4. Resolves the FLOW-5 inconsistency: 財務省引出 (used in FLOW-5 frontend commit 3923c51) is replaced with the locked term トレジャリー引き出し in the same JA-1 sweep that lands this guide. |

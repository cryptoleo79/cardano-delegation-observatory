# Japanese-first audit

**Date:** 2026-05-30
**Scope:** All user-facing English content across the observatory web frontend. Inventories what is already translated, what is missing, what is awkward, and what is long-form English-only. No translation in this document — audit only.

---

## Summary

| Category | Count | Effort |
|---|---|---|
| Pages with i18n hooks (UI chrome translated) | 6 (index, action, drep, history, actions, plus shared header/footer) | already done |
| Pages with NO Japanese at all | 1 (methodology.html, ~580 lines) | ~6 h |
| Cross-cutting hardcoded English strings | 4 (ecosystem strip, download type label, missing i18n keys, dynamic enum values) | ~2 h |
| Existing JA needing polish for natural register | 8 specific strings noted | ~1.5 h |
| JS dynamic strings missing translation | 3 categories (action_type enums, outcome enums, vote enums) | ~1 h |
| New voting / governance pages — already bilingual | live | done |
| **Total translation work estimate** | | **~10–12 h** |

---

## Translation infrastructure

**`web/i18n.js`** (366 lines, ~120 keys)

- Boot strategy: `setLang(initialLang())` runs immediately on script load. `initialLang()` honors `localStorage["cdo-lang"]`, then falls back to navigator language (Japanese detected if `navigator.language` starts with `ja`), then English.
- Mechanism: `setLang(lang)` walks every key in the chosen dictionary and assigns `document.getElementById(id).textContent = dict[id]`.
- Page boot wiring: every page includes `<script src="i18n.js"></script>` — confirmed in index/action/drep/history/actions. Methodology page does **not** include it.
- After lang change: dispatches `cdo-lang` CustomEvent so dynamic-render JS can refresh.

**Limitations of the current mechanism:**

1. `textContent` replacement strips all child elements. Any paragraph containing a hyperlink (e.g., lede paragraphs with "Methodology §14" link) loses the link on language change. Verified in `recent-activity-lede`, `history-lede`, `footnote-actions`, `action-timeline-help`, `action-tally-help`. Currently the link text appears as plain text inside the JA string and is not clickable.
2. The `cdoT(key)` helper referenced in `historical.js` (provenance strip, missing-date messages) is **not defined anywhere**. Fallback to hardcoded English fires in every case. Confirmed by grep: zero definitions, multiple call sites.
3. Duplicate i18n keys: `back-link` is defined twice (DRep page: "← Observatory"; Action page: "← Governance actions") — second definition wins per JS object semantics. The DRep page's back link is wrong in JA mode.

---

## Per-page audit

### `web/index.html` (home — top 30 DReps)

| Section | Status | Notes |
|---|---|---|
| Title / lede | ✓ translated | `page-title`, `page-lede` |
| Meta strip (Epoch, Data through, Source, lag) | ✓ translated | `m-*` keys |
| Live telemetry strip | ✓ translated | `live-*` keys |
| Recent activity table + lede + columns | ✓ translated | But `recent-activity-lede` contains hyperlink → clobbered on lang switch |
| Top-30 table headers + footnote-deltas | ✓ translated | |
| Expanded row chrome (DRep ID, metadata, chart, vote history columns) | ✓ translated | `ex-*` keys |
| Download row | ✓ translated | "JSON" label hardcoded in HTML, not in i18n.js — minor |
| Footer | ✓ translated | `ft-*` keys |
| **Ecosystem strip** ("Ecosystem", "CTF", "Observatory", "Voting", "Governance", "GitHub") | ✗ **hardcoded English** | Used on every page. No i18n keys exist for `eco-label`, `eco-link` items |
| JS-rendered "—" placeholders (Δ7d, Δ30d empty cells) | ✓ language-neutral | |
| **action_type values** in recent activity table | ✗ **English enums** (e.g., "TreasuryWithdrawals", "ParameterChange") | Rendered straight from JSON in `app.js` |
| **vote values** in recent activity table | ✗ **English enums** ("yes", "no", "abstain") | Rendered straight from JSON |

**Priority:** HIGH (homepage, first impression)
**Effort:** ~1 h (cross-cutting fixes apply here; per-page effort minor)

---

### `web/action.html` (per-action detail — FLOW-3)

| Section | Status | Notes |
|---|---|---|
| Title | ✓ translated | "ガバナンスアクション" suffix in `<title>` would need static change since title isn't i18n'd |
| Banner / back link | ✓ translated | But `back-link` key collision with drep page |
| action_id label + action_id rendering | ✓ translated | `action-id-label` |
| Stat cards (Type, Outcome, Submitted, Total/Yes/No/Abstain) | ✓ translated | `stat-*` keys |
| Timeline section + help line | ⚠ awkward link | `action-timeline-help` contains "方法論 §20.3" as plain text — link clobbered |
| Vote tally + help | ⚠ awkward link | `action-tally-help` same issue |
| DRep votes section + help | ✓ translated | `action-votes-help` |
| Table columns | ✓ translated | `th-v-*` |
| Footer | ✓ translated | |
| Ecosystem strip | ✗ hardcoded | (cross-cutting) |
| **action_type / outcome / vote values** (dynamic from JSON) | ✗ **English enums** | "TreasuryWithdrawals", "Ratified", "Enacted", "Expired", "Dropped", "Active", "yes", "no", "abstain" all render in English regardless of language |
| Timeline event labels ("Submission", "Ratification", "Enactment", "Expiration", "Drop") | ✗ **English** in action.js | No i18n keys for event types |

**Priority:** HIGH (per-action detail is the canonical citable page)
**Effort:** ~1.5 h (dynamic enum mapping is the main lift)

---

### `web/drep.html` (per-DRep detail)

| Section | Status | Notes |
|---|---|---|
| Title | partial | static `<title>` is English |
| Back link "← Observatory" | ⚠ key collision | `back-link` shared with action page; action page definition wins |
| Stat cards (Voting weight / Delegators / Last vote / Votes cast) | ✓ translated | `stat-*` keys; "epoch" sub-label hardcoded but in i18n as `stat-lastvote-sub` |
| 90-day voting weight section | ✓ translated | `drep-chart-label` |
| **FLOW-1 Recent net change panel** | ✓ translated | `drep-recent-change-*` keys; help line contains §18 link → clobbered |
| Recent net change table columns | ✓ translated | `th-rc-*` |
| Metadata source + vote history sections | ✓ translated | `drep-meta-label`, `drep-votes-label` |
| Vote history table dynamic content | ⚠ partial | action title + action_id render from JSON; action_type and outcome enums English-only |
| Footer | ✓ translated | |
| Ecosystem strip | ✗ hardcoded | (cross-cutting) |
| Empty states ("Chart populates as...", "No recorded votes yet") | ✓ translated | `ex-chart-empty`, `ex-votes-none` |

**Priority:** HIGH
**Effort:** ~1 h (mostly the back-link collision fix + dynamic enum mapping)

---

### `web/history.html` (FLOW-4 archive list)

| Section | Status | Notes |
|---|---|---|
| Title / lede | ✓ translated | `history-title`, `history-lede`; lede contains §21 link → clobbered |
| Stat cards (First / Latest / Total days) | ✓ translated | `hs-*` keys |
| All snapshots table + columns | ✓ translated | `history-list-label`, `th-h-*` |
| Per-row "Observatory" / "Actions" links in Views column | ✓ translated | `hist-link-observatory`, `hist-link-actions` |
| Archive path column | language-neutral | filesystem path |
| Footer | ✓ translated | |
| Ecosystem strip | ✗ hardcoded | (cross-cutting) |
| **Missing-date notice** (when ?date= points at a missing snapshot) | ✗ broken | calls undefined `cdoT()`, falls back to English |
| **Provenance strip** (when ?date= renders an archived snapshot) | ✗ broken | same `cdoT()` issue |

**Priority:** HIGH (history + provenance is FLOW-4's primary surface — it's the reproducibility face of the observatory)
**Effort:** ~0.5 h (mostly fixing the `cdoT` helper; strings exist in i18n.js already as `missing-date-*` and `prov-*` keys)

---

### `web/actions.html` (governance actions index)

| Section | Status | Notes |
|---|---|---|
| Title / lede | ✓ translated | `actions-title`, `actions-lede` |
| Filter labels | ✓ translated | `filter-type-label`, `filter-outcome-label` |
| Filter dropdown values ("all") | ⚠ partial | "all" hardcoded in HTML; dropdown OPTIONS populated dynamically (action_type values, outcome values — all English enums) |
| Filter count display ("X actions") | ⚠ unknown | rendered by JS, need to confirm |
| Table columns | ✓ translated | `th-act-*` |
| Footnote | ✓ translated | `footnote-actions` contains §6 link → clobbered |
| Loading message | ✓ translated | `loading-msg` |
| Footer | ✓ translated | |
| Ecosystem strip | ✗ hardcoded | (cross-cutting) |
| Per-row dynamic content (title, type, outcome, expires, vote counts) | ⚠ partial | numbers and dates fine; action_type / outcome / title rendered from JSON in English |

**Priority:** MEDIUM-HIGH
**Effort:** ~1 h

---

### `web/methodology.html` (~580 lines)

| Section | Status | Notes |
|---|---|---|
| `<html lang="en">` declaration | ✗ static EN | does not switch on language toggle |
| Page DOES NOT include `i18n.js` | ✗ structural | language toggle inactive on this page |
| §1 What this site does | ✗ English-only | 9 lines |
| §2 What this site does not do | ✗ English-only | 16 lines |
| §3 Data sources | ✗ English-only | 14 lines |
| §4 Update cadence | ✗ English-only | 7 lines |
| §5 Selection criteria | ✗ English-only | 10 lines |
| §6 Fields displayed per DRep (revote rule) | ✗ English-only | 12 lines |
| §7 Fields not displayed | ✗ English-only | 11 lines |
| §8 Metadata handling | ✗ English-only | 10 lines |
| §9 Right of reply | ✗ English-only | 5 lines |
| §10 Operator | ✗ English-only | 10 lines |
| §11 Changelog (version log table) | ✗ English-only | ~55 lines of dense version notes |
| §13 Pages and public exports | ✗ English-only | 19 lines |
| §14–§17 Live telemetry / eventual consistency / rate limits / exports | ✗ English-only | ~50 lines |
| §18 Delegation flow (FLOW-1) + 8 subsections | ✗ English-only | ~64 lines |
| §19 Governance event overlays (FLOW-2) + 8 subsections | ✗ English-only | ~52 lines |
| §20 Governance history layer (FLOW-3) + 11 subsections | ✗ English-only | ~67 lines |
| §21 Historical snapshot browser (FLOW-4) + 14 subsections | ✗ English-only | ~110 lines |
| §21.14 snapshot_date sole-authority invariant (just added) | ✗ English-only | 12 lines |

**Priority:** CRITICAL for Japanese-first audience. Methodology is the document that establishes credibility; an EN-only methodology contradicts a Japanese-facing site.
**Effort estimate by approach:**

- **Approach A (full bilingual via i18n.js):** restructure every paragraph as a translatable unit. Heavy infrastructure work; would require ~150 new i18n keys. ~6–8 h.
- **Approach B (parallel `methodology-ja.html` file):** translate the whole document once; add a top-level EN/JA switcher that swaps documents. Simpler. ~4–6 h.
- **Approach C (inline EN/JA blocks with class toggle, like the new voting/governance pages):** mirror the voting/governance pattern. Self-contained, no i18n.js dependency. ~5–7 h.

Approach C is internally consistent with the new bilingual sites and recommended.

---

## Cross-cutting gaps

### CC-1: Ecosystem strip is hardcoded English

Every page renders:
```html
<span class="eco-label">Ecosystem</span>
<a href="https://ctf.asy.life" class="eco-link">CTF</a>
…
<a href="https://observatory.asy.life" class="eco-link eco-active">Observatory</a>
…
<a href="https://voting.asy.life" class="eco-link">Voting</a>
<a href="https://governance.asy.life" class="eco-link">Governance</a>
<a href="https://github.com/cryptoleo79" class="eco-link">GitHub</a>
```

None of these have IDs, so i18n.js cannot reach them. Five pages affected.

**Priority:** HIGH (top of every page; first thing a JA user sees after lang switch)
**Effort:** ~15 min (add IDs to existing spans/anchors and add five i18n keys for `eco-label`, eco-link names except "CTF" and "GitHub")

### CC-2: `cdoT()` helper is referenced but undefined

`historical.js` has 7 call sites for `window.cdoT(key)`. The function is not defined in i18n.js or anywhere else. Every call falls through to its hardcoded English fallback. JA users see English missing-date messages and English provenance-strip labels.

**Priority:** HIGH
**Effort:** ~10 min (define `cdoT` in i18n.js as a thin wrapper over the active dict)

### CC-3: Dynamic enum values render English regardless of language

| Enum field | Source | Affected pages | Sample values |
|---|---|---|---|
| `action_type` | governance_actions table → JSON | index, action, actions, drep, history | TreasuryWithdrawals, ParameterChange, HardForkInitiation, NoConfidence, NewCommittee, NewConstitution, InfoAction |
| `outcome` | derived by ETL | action, actions, drep | Active, Ratified, Enacted, Expired, Dropped |
| `vote` | votes table → JSON | index (recent activity), action (vote table), drep (vote history) | yes, no, abstain |
| Timeline `event_type` | derived in action.js | action page timeline | Submission, Ratification, Enactment, Expiration, Drop |

None of these go through i18n.js. They are rendered directly from JSON or from JS-internal constants.

**Priority:** HIGH (these are the visible "data" of the observatory; a JA user reading the data still sees English protocol enums everywhere)
**Effort:** ~1 h to add an enum-mapping dictionary to i18n.js and refactor the four JS files to look up display strings via the active language

### CC-4: Hyperlinks inside translated paragraphs are clobbered

i18n.js uses `el.textContent = dict[id]`, which destroys child element structure. Affects:

- `index.html` `recent-activity-lede` ("See Methodology §14...")
- `actions.html` `footnote-actions` ("See Methodology §6 for details")
- `history.html` `history-lede` ("See Methodology §21")
- `drep.html` `drep-recent-change-help` (link to §18)
- `action.html` `action-timeline-help` (link to §20.3)
- `action.html` `action-tally-help` (link to §6)

Currently the link target paragraphs are translated, but the methodology section reference loses its hyperlink in both languages (because the EN dict also uses plain text). Effectively no language has working in-prose section links from these elements.

**Priority:** MEDIUM (links still exist in footers and explicit anchor tags; this is degraded UX, not lost information)
**Effort:** ~30 min (refactor those keys to use a small template helper that injects an `<a>` element)

### CC-5: Static `<title>` and `<meta description>` tags are English-only

Browser tab titles never change on lang switch. The page `<title>` is rendered before JS runs. Bookmark / share UX shows English in JA mode.

**Priority:** LOW (cosmetic; bookmarks rare)
**Effort:** ~15 min if added; ~5 lines of JS to mutate document.title on lang change

---

## Existing JA quality — polish notes

The current JA register is 「である調」 (academic plain form). It is appropriate for the methodology-flavored site, but several strings drift into awkward direct-translation territory.

| Key | Current JA | Issue | Suggestion (do not apply yet — audit only) |
|---|---|---|---|
| `drep-not-found` | "DRepが見つからない" | clinical for an error message | "DRepが見つかりませんでした" or stay でない調 but accept |
| `drep-no-id` | "URLにDRep IDが指定されていない(?id=drep1… が必要)" | mixes half-width parens with Japanese | use full-width「（…）」for consistency |
| `m-lag` | "正本となる日次ガバナンス・スナップショット" | "正本" is unusual for "canonical" in tech context | "正規の" or "公式の" reads more naturally |
| `page-lede` | "数値のみ——方法論は公開・再現可能。" | em dash + double dash mixed | use one consistent style: 「数値のみ。方法論は公開かつ再現可能。」 |
| `th-d7d` / `th-d30d` | "Δ 7日 (ADA)" / "Δ 30日 (ADA)" | "7日" should be "7日間" for an interval | "Δ 7日間 (ADA)" |
| `m-status-stale` | "最終更新から時間経過" | abrupt | "最終更新から時間が経過しています" |
| `action-tally-help` | "承認/拒否のフレーミングは行わない——プロトコル用語のみ。" | "フレーミング" is jargon-y in JA | "承認・否決という言い方はしない。プロトコル上の用語のみを用いる。" |
| `footnote-actions` | "詳細は方法論 §6 を参照。" | OK but inconsistent — see §6 used as link in EN, plain text in JA | becomes natural once CC-4 is fixed |

**Priority:** MEDIUM (existing JA is functional; polish raises perceived authorship quality)
**Effort:** ~1.5 h for a full pass on all ~120 i18n.js JA strings

---

## New voting / governance pages — already bilingual

Voting and governance pages shipped bilingual in their initial deployment (per the FINAL ORDER priority change). Both use the inline EN/JA class-toggle pattern (`<span class="en">…</span><span class="ja">…</span>`). No i18n.js dependency.

**Status:** complete, no audit gaps.

**Spot-check items for quality polish:** ~30 min total
- Verify all section headers feel natural
- Check that protocol-term katakana (デリゲーション、エポック) is consistent with the observatory's existing terminology

---

## Priority bundle recommendation

Three bundles, in order:

### Bundle 1: Cross-cutting fixes (~2.5 h, biggest perceived-quality jump per hour)

- CC-1 Ecosystem strip i18n keys
- CC-2 `cdoT()` helper definition
- CC-3 enum value mapping (action_type, outcome, vote, event_type)
- CC-4 hyperlink-preserving template helper
- back-link key collision fix (drep vs action)

After Bundle 1: every visible non-prose UI element is bilingual on every page. The "raw English data" complaint goes away.

### Bundle 2: Methodology translation (~6 h)

- Approach C (inline EN/JA blocks with class toggle, matching voting/governance pages)
- Translate sections 1–21+ in natural professional JA (である調 to match the existing register)
- Add the language toggle to methodology.html

After Bundle 2: the entire site reads natively in Japanese.

### Bundle 3: JA quality polish (~1.5 h)

- The ~8 awkward strings noted above
- Half-width vs full-width punctuation consistency
- Em-dash usage normalization

After Bundle 3: the Japanese feels authored, not translated.

---

## Out of scope for this audit

- Translation of the `docs/research/` briefs (they are internal notes, not user-facing)
- Translation of `docs/IDEASCALE_PRESERVATION.md` (internal planning)
- Translation of `METHODOLOGY.md` (the markdown source for methodology.html — separate project; the HTML is the user-facing surface)
- Translation of commit messages and PR titles
- Translation of CTF site at ctf.asy.life (separate repo, separate audit if requested)

# JP UI Audit

**Date:** 2026-06-22 (UI Elevation Sprint). Scope: every page under `web/`.
**Goal:** find untranslated text, awkward translations, mixed EN/JA labels, and JP
overflow; fix the high-impact issues.

## How translation works here (two mechanisms)

1. **Central dictionary** — `web/i18n.js` holds `en` + `ja` key maps; pages carry
   `id="key"` elements and `setLang()` swaps `textContent`. Used by the original pages
   (index, projects, tokens, rankings, treasury, catalyst, changes, drep, …).
2. **Inline per-page `P` dict** — newer pages embed an `en`/`ja` object and (for markup)
   `*-html` keys repainted on the `cdo-lang` event. Used by about, memory, methodology,
   ecosystem-map, docs, builder-journey, campaign-journey, governance-daily, and the
   three Project Memory explorers.

Both are legitimate; an audit must check the right one per page.

## Findings

### Coverage — strong
- `i18n.js`: **189 EN keys / 189 JA keys, 0 missing.** No key renders English on a
  JA page through the central path.
- New inline-`P` pages verified at **EN/JA key parity** (programmatic check): about,
  builder-journey, campaign-journey, governance-daily, project-history,
  category-explorer, memory-heatmap, memory, methodology, docs, ecosystem-map.

### Untranslated / identical-to-English keys (14) — mostly intentional
Keys whose JA value equals the EN value. Classified:

| Key | Value | Verdict |
|-----|-------|---------|
| `eco-link-observatory`, `ft-observatory`, `h-nav-observatory`, `back-link-observatory`, `hist-link-observatory` | Observatory | **Keep** — product name (proper noun) |
| `eco-link-api` | API | **Keep** — proper noun |
| `h-nav-catalyst` | Catalyst | **Keep** — program proper noun |
| `h-brand` | CDO / Cardano Delegation Observatory | **Keep** — brand |
| `th-act-drep`, `th-v-name` | DRep | **Keep** — DRep is a proper noun in JA usage |
| `stat-weight-sub` | ADA | **Keep** — currency unit |
| `h-nav-health` | Health | **FIXED → 健全性** |
| `h-nav-market` | Market | **FIXED → マーケット** |

### Overflow — the real JP UX issue
- **Language switcher** — at 11px / 54px min-width, `日本語` was cramped and the two
  options were unequal width. **FIXED** in `style.css`: a true segmented control —
  both options `62×30px` (identical width + height), labels centered, 12px, refined
  active state. One shared-CSS change → consistent on all 31 pages.
- **Main navigation** — 12 items + the switcher is crowded, and noticeably tighter in
  JA (longer labels wrap toward the scroll strip on narrow widths). **Not fixed here**
  — the proper fix is grouping into dropdowns (Discover / Governance / Data), which is
  a structural change to the nav markup on every page and deserves its own isolated,
  tested pass. Flagged as the next UI step. (Mobile already degrades to a horizontal
  swipe strip, so it is usable today, just not premium.)

### Awkward / mixed — none high-impact found
No mixed EN/JA within a single visible label was found beyond the intentional
proper-noun retentions above. On-chain enum values (vote outcomes, action types) and
sourced event names are deliberately left in their canonical form on both languages —
documented behaviour, not a defect.

## Fixes applied this sprint
1. Premium segmented language switcher (`style.css`) — equal width/height, JP uncramped.
2. `h-nav-health` JA → **健全性**.
3. `h-nav-market` JA → **マーケット**.

## Remaining (next focused step)
- **Nav grouping into dropdowns** (Discover / Governance / Data) across all pages —
  the one structural item; biggest single JP-crowding win, but a 31-page markup change.
- Optional: revisit whether `Catalyst` / `Observatory` nav labels want JA gloss
  (currently kept as proper nouns by choice).

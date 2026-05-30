# Governance timeline UI — direction for history.html evolution

**Status:** Research only. UI direction document for future history.html work. No code, no methodology edits.
**Date:** 2026-05-29
**Scope:** Pattern catalog from civic / archival / deployment timelines, three-level semantic zoom, accessibility, anti-patterns aligned to "movement, not intent."

---

## Pattern catalog — eight viable timeline models

### 1. Vertical event list with date grouping

- Events grouped by date, latest first, with inline epoch/action metadata
- Source: BBC live blogs, Statuspage.io incident timelines
- **Borrow:** Simple, scannable, respects gaps in data. Sorting latest-first matches the current snapshot table pattern. Prose-friendly for action titles.

### 2. Calendar grid with colored heatmap

- Year/month calendar showing snapshot availability and event density via cell color and circle size
- Source: Wayback Machine snapshot calendar, archive.org visual frequency indicators
- **Borrow:** at-a-glance visibility of coverage gaps. **Drawback:** implies regular coverage even when data is sparse; risks misleading readers that all-day data exists. Would require careful annotation to preserve FLOW-4 honesty.

### 3. Compact multi-row timeline with collapsed event cards

- Horizontal timeline bar at top; events as stacked rows below with expandable detail cards on click
- Source: GitHub Actions runs history, Sentry release timeline view
- **Borrow:** Scales to many events. Allows type-filtering without removing items from view.

### 4. Semantic zoom — adaptive granularity by viewport

- Zoom level determines display unit: year view at 1x, month at 2x, day at 4x
- Source: Lucent timeline research, KronoGraph, Google Maps zoom semantics
- **Borrow:** Responsive to screen size. Small zoom shows epoch boundaries and submission clusters; large zoom shows individual event types within a day.

### 5. Parallel lanes — snapshots vs events

- Two stacked horizontal timelines — top lane shows snapshot dates; bottom lane shows governance events with vertical connectors
- Source: GitHub Actions workflow visualization, construction project timelines
- **Borrow:** Separates two orthogonal streams. Makes visible that not every governance event falls on a snapshot date.

### 6. Interactive epoch-anchored spiral

- Epoch numbers spiral outward from center; events radiate from epoch marker
- Source: Timeline art installations, Our World in Data multi-scale exploration
- **Borrow:** Memorable. **Drawback:** not mobile-friendly; harder to parse exact dates. Strong for wall displays, weak for portable research reference.

### 7. Dual-mode — list tab + calendar tab

- Tabs toggle between chronological list (default) and calendar grid; same underlying data, different mental model
- Source: Teamup calendar, Mobiscroll timeline demos
- **Borrow:** Serves multiple user preferences without forcing a choice.

### 8. Progressive disclosure with breadcrumb navigation

- Starting view: all-time epoch list. Click epoch → snapshots in epoch. Click snapshot → actions within that date. Click action → full action detail page (already FLOW-3 territory).
- Source: Hierarchical archive.org navigation, Jira project timeline drill-down
- **Borrow:** Respects reproducibility commitment; each level has a citable state.

---

## Information hierarchy for governance history

### Primary (always visible)

- **Snapshot dates** — canonical grid lines. Every snapshot is a data point worth marking. Color: neutral.
- **Governance action submissions** — the seed event of every action's lifecycle. Visible at all zoom levels.

### Secondary (visible by default, collapsible)

- **Action state transitions** (ratification, enactment, expiration, drop) — mark the formal governance process. Grouped under the submission event's line when space is tight.
- **Epoch boundaries** — aid readers in relating action dates to Cardano's epoch-driven protocol. Thin vertical lines with numeric label; never as prominent as action events.

### Tertiary (on demand / expanded detail)

- **Per-action vote tallies** — defer to per-action detail page (`/action.html`). In the timeline, show action title and type, not vote results.
- **Per-snapshot statistics** — shown in hover-card, not inline.

### Explicitly not shown (per §21)

- Narrative framing ("This was a major action")
- Significance rankings
- Outcome color-coding (all outcomes same neutral color per §19.4)
- Derived "trending" or "important" labels
- Causal links between actions and delegation movement

---

## Zoom / level-of-detail model

### Level 1 — All-time overview (default landing)

- Temporal scale: entire archive
- Above-fold: summary stats (first/latest snapshot, total days), compressed 1–5 year timeline showing submission dots, faint epoch boundary lines
- CTA: "Click a date to expand"
- Sticky: epoch boundaries and era labels (e.g., "Conway era")

### Level 2 — Year / quarter view

- Temporal scale: selected year or quarter
- Visible: snapshot dates as list or column headers in a compact calendar grid; all five event types within the window
- Hover shows: action_id, action_type, event_type, date
- Click action → drill to detail
- Filtered away: per-snapshot statistics (expand to view)

### Level 3 — Single date / action detail

- Snapshot detail: top-30 as of that date, provenance strip, all actions with events in a 90-day window
- Action detail: full record (title, type, submission date, state transitions, votes) — FLOW-3 already owns this

### Zoom transitions

- Smooth zoom (CSS transform + opacity) preferable for levels 1–2
- Level 3 drill-down may be full page load
- Preserve `?date=` and `?id=` query parameters → detail pages remain citable

---

## Empty-state and missing-date handling

FLOW-4 already commits to honesty per §21.4.

- **Missing date with snapshot in nearby window:** show gap marker with tooltip: "No snapshot for 2026-04-15 (ETL run failed). Nearest prior: 2026-04-14." Display nearest prior date as a navigable link.
- **Event outside all snapshots:** show marker with note ("Action submitted before Observatory deployment"). Float at left edge without chart context to its left.
- **Direct `?date=` request for missing date:** explicit notice listing nearest snapshots before/after. Already present in current history.html; preserve in any evolved UI.
- **Sparse early history:** don't auto-hide; show sparsity honestly. Sparsity is real history.

---

## Accessibility

### Keyboard navigation

- All drill-down actions keyboard-accessible
- Tab order: event markers → action links → navigation controls
- Enter/Space to expand or navigate; Escape to collapse
- Arrow keys to move between adjacent dates or events

### Screen-reader semantics

- Natural announcement order: "2026-05-28. Snapshot published. 3 events in window: Submit TreasuryWithdrawals on 2026-05-27, Ratify on 2026-05-25, Enact on 2026-05-24."
- Semantic HTML: `<time>` for dates, `<article>` for events, `<nav>` for breadcrumbs
- Avoid aria-labels that repeat visible text
- No information conveyed by color alone

### Color independence

- Observatory uses a single accent color (§19.4)
- Use icon glyphs or text labels to distinguish event types: "⬤ Submit", "◇ Ratify", "✓ Enact", "✕ Drop", "⏱ Expire"
- Hover states use opacity or glyph animation, not color shift

### Mobile responsiveness

- Compress to vertical list on screens ≤600px wide
- Touch targets ≥44×44px
- Single-tap drill-down works equally well as pinch-zoom (zoom interaction optional)

---

## Bilingual (EN/JA)

| English | 日本語 | Context |
|---|---|---|
| Snapshot | スナップショット | Daily ETL archive |
| Submission | 提出 | Action submitted to chain |
| Ratification | 批准 | Action ratified by governance |
| Enactment | 制定 | Action enacted (implemented) |
| Expiration | 失効 | Action expired without ratification |
| Drop | 取り下げ | Action dropped by proposer |
| Epoch | エポック | Cardano epoch number |
| Governance action | ガバナンス・アクション | Proposal on chain |
| Events in window | ウィンドウ内のイベント | Actions within date range |
| Missing data | データなし | No snapshot for this date |
| All time | 全期間 | Entire archive (zoom level 1) |

Japanese prose can be longer than English for the same semantic content. Ensure hover-cards and inline labels have flex-wrapping or multiline space. Use ISO 8601 (YYYY-MM-DD) for canonical date display; localize only in prose contexts.

---

## Evolution path for history.html

### Phase 1 — Light additions to current list (weeks 1–2)

**Goal:** Surface FLOW-2 governance events alongside snapshot dates without redesigning the table.

- Keep the current three-column table (Date, Views links, Archive path)
- Add fourth column: "Events in window" — comma-separated label list, e.g. "Submit (2026-05-27), Ratify (2026-05-25)"
- Click label → action detail page
- No visual timeline yet; purely textual

### Phase 2 — Overlay event markers (weeks 3–4)

**Goal:** Add a simple visual timeline alongside the list.

- Small SVG timeline in page header: horizontal bar showing all-time axis with event markers
- Click marker → jump to row below
- Snapshot dates: thicker marks; event dates: smaller hollow circles
- Single neutral color for all events; glyph or icon to distinguish type
- Responsive: timeline compresses to a list on mobile

### Phase 3 — Zoomable timeline (weeks 5–6+)

**Goal:** Implement the zoom model.

- Level 1: year-view button; compressed all-time timeline
- Level 2: click year → month grid or list view
- Level 3: click date → snapshot detail page (in-page or full load)
- Smooth CSS transitions for desktop; snap-to-grid on mobile
- Each zoom level a distinct URL state (e.g. `?level=2&year=2026&month=5`) for bookmarking

---

## Anti-recommendations

Patterns that would violate the observatory's "movement, not intent" commitment.

### Color-coding by outcome

- **Anti:** Red for "dropped," green for "enacted," yellow for "active"
- **Why:** implies value judgment (green = good)
- **Do instead:** all events same neutral color. Text labels carry semantics.

### "Trending" or "hot" event highlighting

- **Anti:** automatic bold, size-up, or animation for high-vote-count or recent actions
- **Why:** suggests importance without methodology
- **Do instead:** all events equal visual weight. User-initiated sort/filter determines visibility.

### Showing predicted or simulated events

- **Anti:** "If voting continues at current rate, this action will be enacted by epoch X"
- **Why:** prediction is outside §20.9 scope
- **Do instead:** show only protocol-observed facts.

### Delegator flow arrows between events

- **Anti:** arrow from a delegation inflow on date A to a governance action on date A−1, implying causation
- **Why:** §19.3 rejects causal claims
- **Do instead:** independent parallel streams (Phase 2 "parallel lanes" pattern, model #5)

### Auto-generated narrative

- **Anti:** AI or template-driven prose captions on event markers
- **Why:** narrative is interpretation; the site is a reference, not a story
- **Do instead:** plain factual labels; let readers form their own interpretations

### Hiding missing periods

- **Anti:** rendering missing dates as gray cells in a calendar grid, implying unsuccessful snapshots but continuous coverage
- **Why:** violates §21.4
- **Do instead:** leave whitespace or explicit "no data" gaps. Sparsity is honest.

### Per-DRep event filtering by default

- **Anti:** only show actions each DRep voted on, hidden otherwise
- **Why:** §19.5 explicitly forbids pre-filtering by participation
- **Do instead:** show all events in window; let users filter interactively if they choose

### Floating timestamp tooltips (desktop only)

- **Anti:** tooltips that appear only on mouse hover, no keyboard equivalent
- **Why:** breaks accessibility (touch + keyboard navigators)
- **Do instead:** embed date/time in the event card, or show on focus + hover

---

## Accessibility implementation checklist

- [ ] All interactive elements keyboard accessible (tab, arrow, enter, escape)
- [ ] All date/time information uses `<time>` with `datetime` attribute
- [ ] All event markers have aria-label or visible text describing type + date
- [ ] Color is never the sole carrier of information
- [ ] Timeline compresses to list on mobile; no horizontal scrolling required
- [ ] Screen-reader test (NVDA / JAWS / VoiceOver) passes
- [ ] Font zoom to 200% does not break layout
- [ ] Language toggle updates all timeline labels
- [ ] Touch targets ≥44×44px
- [ ] Loading state and error messages i18n'd

---

## Reproducibility and citable references

Per §21.12, all historical timeline views must be reproducible and citable.

- Each zoom level has a stable URL (with `?level`, `?year`, `?month`, `?date` parameters)
- "Copy link" gives a URL reproducing the exact view for research citations
- Provenance strip (FLOW-4) shows archive path, methodology version, schema version
- No timeline view requires server-side state or cookies; all state in URL

---

## Sources

- https://ourworldindata.org/grapher/political-regime-bti
- https://github.com/vuesence/release-timeline
- https://etherscan.io/txs
- https://docs.snapshot.box/user-guides/proposals
- https://bbc.github.io/accessibility-news-and-you/accessibility-news-and-designers
- https://docs.sentry.io/product/releases/
- https://waybackmachine.mom/
- https://uxpatterns.dev/patterns/data-display/timeline
- https://venngage.com/blog/vertical-timeline/
- https://developer.statuspage.io/
- https://docs.github.com/actions/managing-workflow-runs/using-the-visualization-graph
- https://www.emergentmind.com/topics/semantic-zoom
- https://cambridge-intelligence.com/kronograph/

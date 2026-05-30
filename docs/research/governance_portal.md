# Governance portal — structure recommendation for governance.asy.life

**Status:** Research only. Intelligence for future portal structure and content decisions. No code, no methodology edits.
**Date:** 2026-05-29
**Scope:** Best practices for governance portals, observability portals, civic participation portals. Bilingual presentation. Live/planned status discipline.

---

## Pattern landscape

### Governance portal precedents

Governance portals cluster around similar information structures despite serving different constituencies. **Gitcoin's governance forum** separates DAO governance and vision discussions from operational mechanics (Steward Registry, Community Portal), with discussion threads serving as the primary organizational unit. **Polkadot's ecosystem** (Polkassembly, OpenGov.Watch) segments proposals into distinct referendum spaces, delegation management, treasury tracking, and fellowship tiers — allowing newcomers to understand governance mechanics while experts navigate analytics. **Tally.xyz** emphasizes proposal lifecycle transparency and voting power measurement, with proposals as the central navigable object. **MakerDAO's portal** splits on-chain voting (Executive Votes, Governance Polls) from community discussion, reserving the vote interface for account holders with clear prerequisites.

Common thread: governance portals order sections from "what this is" (overview, vision, mechanics) to "how to participate" (delegation, proposal submission, voting). **Snapshot's** space-based architecture inverts this — the DAO or community name becomes the primary identifier, with governance rules displayed as properties of that space rather than as a separate governance layer. **Optimism Collective** explicitly structures around two chambers (Token House, Citizens' House) to communicate that different governance roles exist.

### Observability portal precedents

Observability portals balance density against scannability by layering visualizations. **Etherscan's charts** organize blockchain metrics by category (market data, on-chain data, network data, contract data) before inviting exploration; the platform explicitly separates explorer search tools from analytics. **Cardanoscan** mirrors this: quick access to recent transactions and blocks above, deeper analytics (staking, treasury, mempool trends) below. **Dune Analytics** makes provenance visible by exposing query authorship, publication date, and data freshness; each dashboard links to the underlying SQL, signaling that the visualization is a view layer over auditable computation. **Flipside Crypto** labels data as "curated" and surfaces the refresh schedule and schema standardization process — reframing observability as "make blockchain data legible" rather than "show pretty numbers." **OpenElections** exposes precinct-level election data with both tabular and narrative formats, recognizing that some users navigate via maps while others need textual results.

All observability portals surface metadata: last-update timestamps, data source attribution, refresh frequency. None claim real-time if they update hourly. Trust emerges from specificity about staleness, not silence about it.

### Civic participation portal precedents

Civic participation platforms separate information consumption from action, though the boundary varies. **GOV.UK Design System** codifies accessibility as a design constraint, not a feature — all patterns tested against assistive technologies (WCAG 2.2 AA), and participation design explicitly casts non-experts as co-producers, not recipients. **Vote.gov** and its ecosystem (Rock the Vote, VoteOrg) layer information by size: bite-sized facts and quick status checks above fold, detailed civics education and process documentation below. **Better Reykjavik** distinguishes participation types visually (participatory budgeting vs. policymaking) but found the dual namespace confuses users; later refinements emphasized which type of action each section accepts. **Decidim's Barcelona and Helsinki instances** separate "spaces" (where participation occurs) from "components" (what participants do within spaces), but only after significant user testing. **vTaiwan** uses Polis (a deliberation visualization tool) to show the landscape of agreement-disagreement, giving participants a legible representation of the consensus state. **e-Estonia's** commitment to participatory governance includes multi-phase consultation (documents, questionnaires, discourse, AI-mediated synthesis) but organizes this as a workflow sequence, not a parallel menu.

UX pattern emerging: good civic platforms show one participation path at a time, with clear entry points for different user types, rather than exposing all mechanisms at once.

---

## Cross-cutting design principles

**Trust through specificity.** Across all three domain areas, vague claims ("powered by real data," "always live," "community-driven") erode trust. Governance portals gain trust by naming delegate identities and vote counts. Observability portals gain trust by showing last-update timestamps, data source provenance, and query authorship. Civic portals gain trust by showing decision-making timelines and explicitly stating what stage a proposal is in. The pattern: replace adjectives with facts.

**Layered entry points, not layered interfaces.** Governance and civic platforms often fail by presenting all mechanics simultaneously. Successful platforms front-load a single question — "What is this for?" or "What can I do here?" — and then reveal mechanics only when selected. The physical layout may have multiple sections, but the reading order guides users from context to action.

**Localization is not translation.** English and Japanese require different line heights, character spacing, and text lengths. Bilingual governance portals should not center on a language picker alone; they require flexible typography, responsive containers, and culturally appropriate visual hierarchy. Japanese labels should be written in native script (not romaji).

**Data lifecycle transparency.** All observability and analytics sections should surface: (a) when this number was last computed, (b) what it measures, (c) who curated it. This is the minimum viable provenance. Stale data should trigger a visual indicator (not hidden in a tooltip), and freshness SLAs should be published.

**Avoid modal paralysis.** Civic and governance interfaces often present users with too many options at the entry point. Successful portals guide toward one primary action per section before exposing secondary options.

---

## Anti-patterns: things that destroy trust

- **Mock data labeled as live.** A single unlabeled mock metric undermines all other data on the page.
- **Dead links and 404 cascades.** Better Reykjavik's problem (too many initiative types) became worse when links to past seasons led to 404s, signaling abandoned work.
- **Stale data without indicator.** The Dune Analytics pattern (show query date, allow manual refresh) is stronger than silent staleness.
- **Unclear what environment you're in.** Staging and live data should be visually distinct (color, banner, URL subdomain).
- **Marketing copy on civic surfaces.** Adjectives like "innovative" or "groundbreaking" on voting pages signal that the platform is selling something, not informing someone.
- **Ambiguous status for in-progress work.** Don't use the same visual treatment for active proposals, planned proposals, and archived proposals.
- **Non-expert exclusion through jargon.** vTaiwan and GOV.UK both use definition sidebars and progressive disclosure to introduce concepts.

---

## Recommended page structure for governance.asy.life

### Header

- Logo and site name (EN/JA bilingual, language toggle top-right)
- Breadcrumb or navigation indicator
- Single-line tagline

### Above-fold

- Headline naming what the site orients visitors to (not "innovative governance," but "The governance stack supporting Cardano delegation")
- Three-line value proposition pointing to Observatory, voting participation, planned Treasury layer
- Single primary CTA: "Start here"
- Language toggle (EN | 日本語), prominent

### Stack overview — four cards

1. **CTF — philosophy layer (Foundation)**
   - 2–3 sentences on CTF principles
   - Link to ctf.asy.life
2. **Observatory — observability layer (Active)**
   - Single key metric displayed
   - Last-updated timestamp + freshness label
   - Link to observatory.asy.life
3. **Voting — participation layer (Planned, with timeframe)**
   - Current architecture direction
   - Link to voting.asy.life
4. **Treasury — future observability layer (Planned)**
   - 1–2 sentences on what it will enable
   - Link to design docs / methodology preview

### Flow explanation

Single-column narrative with embedded visual:

- Headline: "How governance flows work"
- Three-step explanation: proposal submission → community deliberation → on-chain execution
- Each step: role, timing, success criteria
- No jargon without glossary

### Status of each layer

Tabular/card display:

| Layer | Current Status | Data Freshness | Links |
|---|---|---|---|
| CTF Philosophy | Foundation (live) | N/A | [Docs] [Rationale] |
| Observatory | Active | Updated 6h ago [Refresh] | [Dashboards] [API] |
| Voting | Planned [date] | See proposal direction | [Architecture brief] |
| Treasury | Planned [date] | Draft methodology | [Design docs] |

- Color coding: green = live, blue = stable, orange = planned, red = deprecated
- Avoid grayed-out sections (they feel abandoned); use explicit "planned" status with date.

### Future direction

- Timeline for unimplemented features (Treasury, additional delegation mechanisms)
- How visitors can contribute feedback (GitHub issues, RFC process)
- Link to governance roadmap with version control
- Explicit statement: "This governance structure is not final and evolves with community input."

### Footer

- Copyright and site owner
- Columns: About / Tools / Community / Legal
- Language toggle repeated
- "Last updated: [DATE]" with link to changelog

---

## Status label discipline (live vs planned vs deprecated)

**Live / Active (immediate interaction possible)**
- Green accent, upright type
- Label: "Live" (not "currently available")
- Obligation: show current state (active proposal count, last update timestamp)
- Example: "Voting | Live | 2 proposals active (closes 2026-06-15)"

**Planned (defined future state)**
- Blue accent, calendar icon
- Label: "Planned [Month/Quarter]" (specificity matters)
- Obligation: link to design docs / methodology preview
- Example: "Treasury Layer | Planned Q3 2026 | [View design docs]"
- Do not use: "coming soon" (undefined), "TBD"

**Deprecated / Sunset (formerly live, no longer maintained)**
- Gray accent, strikethrough or faded type
- Label: "Sunset [date]"
- Obligation: link to migration docs if users need to shift tools

**Beta / Experimental (live but subject to breaking changes)**
- Orange accent with ⚠ icon
- Label: "Beta"
- Obligation: explicit statement of what may change

**Principle:** every status label paired with a timestamp and a link to more information. No unlabeled, undated states.

---

## Bilingual presentation (EN/JA)

**Language toggle**

- Top-right corner of header (standard convention, visible on all pages)
- Explicit labels: "EN" and "日本語" (not country flags)
- Language preference persists across sessions

**Typography**

- English: 16px body, line-height 1.5
- Japanese: 16px body, line-height 1.8 (wider spacing improves readability of kanji)
- Noto Sans (or equivalent) covers Latin, Hiragana, Katakana, Kanji
- Flexible containers; allow buttons/labels to resize per text length

**Content**

- Do not translate idioms; use equivalent expressions in each language
- Bilingual glossary for technical terms (delegation = デリゲーション, etc.)
- Dates in ISO 8601 for unambiguous display
- All dashboard labels bilingual inline

---

## Summary

The governance.asy.life portal should function as an orientation layer — not a governance tool itself, but a clear entry point to the full stack (CTF, Observatory, Voting, future Treasury). Its primary job is to answer:

1. What is this?
2. What's live and what's planned?
3. How do I participate?
4. What happens next?

Success: a first-time visitor can answer those four questions in under two minutes without opening external tabs. Trust is built through specificity (timestamps, provenance, version numbers) rather than adjectives.

---

## Sources

- https://manual.gitcoin.co/
- https://gov.gitcoin.co/
- https://wiki.polkadot.com/learn/learn-polkadot-opengov/
- https://polkadot.polkassembly.io/
- https://docs.tally.xyz/tally-features/governance
- https://docs.snapshot.box/
- https://vote.makerdao.com/
- https://etherscan.io/charts
- https://cardanoscan.io/
- https://dune.com/
- https://flipsidecrypto.xyz/
- https://design-system.service.gov.uk/accessibility/accessibility-strategy/
- https://civicdesign.org/
- https://docs.decidim.org/en/develop/understand/about.html
- https://ajuntament.barcelona.cat/innovaciodemocratica/en/decidim
- https://citizens.is/portfolio_page/better_reykjavik/
- https://centreforpublicimpact.org/public-impact-fundamentals/e-estonia-the-information-society-since-1997/
- https://compdemocracy.org/case-studies/2014-vtaiwan/
- https://gov.optimism.io/t/operating-manual-of-the-optimism-collective-v0-2-0/3370
- https://boardroom.io/dashboard

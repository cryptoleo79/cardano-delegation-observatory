# Catalyst source-of-record registry

**Status:** draft scaffold. Per-fund detail populates as the source-inventory research returns.
**Owner:** observatory operator (`cryptoleo79`).
**Phase:** FLOW-6 Phase 2 (per `METHODOLOGY.md §24.12`).
**Authoritative reference:** `METHODOLOGY.md §24`. If this document contradicts §24, §24 wins.

## What this document is

A fund-by-fund register of the sources from which Cardano Catalyst's historical record can be preserved. For every Catalyst Fund — Fund 1 through the most recently closed fund — this document records the canonical primary source, fallback secondary sources, the source authority class (per §24.3), the present-day preservation status (does the URL still resolve, is content drifting, are any pages already orphaned), the capture risk band (per §24.9), an estimate of completeness, and any known gaps.

This is the mapping layer. The capture plan that follows (Phase 3, `docs/CATALYST_CAPTURE_PLAN.md`) defines *how* each source is captured. Capture itself is Phase 5 and is gated on Phase 3 and Phase 4 approval per §24.12.

**No capture has been performed under FLOW-6 as of the date on this document.** Every URL listed below has been inspected for existence and structure but not downloaded, mirrored, or stored.

## Source authority class refresher

Quoted from `METHODOLOGY.md §24.3`. The class determines preservation priority and how the source is treated in chain-of-custody.

| Class | Description | Example | Preservation needed? |
|---|---|---|---|
| A | On-chain (Cardano blockchain via Koios) | `vote_list`, `proposal_list`, treasury withdrawal transactions | No proactive capture — protocol preserves it |
| B | Official Catalyst-issued | `projectcatalyst.io`, `input-output-hk/catalyst-core` (archived) | Yes — quarterly re-fetch plus mirror |
| C | Catalyst-platform-hosted at-risk | `cardano.ideascale.com`, future Catalyst Voices archive surfaces | **Yes — highest priority** before platform sunset |
| D | Community-maintained | `catalystexplorer.com`, `lidonation.com` | Yes — corroboration capture on fund-close |
| E | Researcher capture | Individual researchers contributing with attribution | Treated as primary record only after chain-of-custody review |

## Preservation status field

Each fund's preservation status uses one of the following discrete values, recorded with the date the status was last verified (so the registry's own age is visible):

- **Live and intact** — primary URL resolves, content appears complete to spot-check
- **Live but drifting** — primary URL resolves but some sub-pages or linked artifacts return 404 / 5xx, or the page structure has changed since prior inspection
- **Partially orphaned** — some essential URLs already return 404; remaining coverage is in lower-authority classes
- **Fully orphaned** — primary URL no longer resolves; only secondary / community sources remain
- **Unknown** — status not yet verified during the Phase 2 inspection pass

The status is descriptive, not predictive. It records what is observed at inspection time. Trigger conditions for capture (§24.9 Band 1) include the first observed transition from "Live and intact" to anything else for a Class C source.

## Capture risk band refresher

Per `METHODOLOGY.md §24.9`. Each fund inherits the highest-risk band of its primary source.

- **Band 1** — at-risk Class C platforms (capture before sunset, before observed 404s, or before IO removes the `catalyst-core` archive flag).
- **Band 2** — Class B canonical sources (capture on a quarterly schedule and on observed structural changes).
- **Band 3** — Class A on-chain (no proactive capture; the canonical query record is sufficient).
- **Band 4** — Class D community (capture on fund-close and on community source updates).

A fund's overall band is the lowest number (highest risk) of any source from which the fund's record can only be reconstructed.

## Completeness field

A short qualitative tag describing how much of the canonical Catalyst record is recoverable from preservable sources today, before any FLOW-6 capture has been performed:

- **Full** — proposal text, voting tallies, milestone records, payouts all preservable from a combination of available sources.
- **Substantial** — proposal text and voting tallies preservable; milestone records or payouts incomplete or scattered.
- **Voting only** — voting tallies preservable; proposal text already lost or never had a canonical off-platform record.
- **On-chain only** — only the on-chain payout side is reconstructible; off-chain proposal record already lost.

This is an estimate based on inspection, not a measured count of recovered artifacts. The capture phase will produce the measured count.

## Per-fund entries

Each fund below is recorded as a heading followed by a small fields table. The 7 fields per fund are exactly as specified by FLOW-6 Phase 2:

```
| Field | Value |
|---|---|
| Primary source        | URL of the canonical record + Class |
| Secondary source      | URL(s) of fallback record(s) + Class |
| Preservation status   | one of: Live and intact / Live but drifting / Partially orphaned / Fully orphaned / Unknown (verified on YYYY-MM-DD) |
| Authority class       | A / B / C / D / E (per §24.3) — class of primary source |
| Capture risk          | Band 1 / 2 / 3 / 4 (per §24.9) |
| Completeness          | Full / Substantial / Voting only / On-chain only (per the legend above) |
| Known gaps            | short narrative — null if none observed |
```

Where a fund has multiple secondary sources, they are listed in authority-class order (B before C before D before E).

Where a fund has multiple URLs for the same Class (e.g., projectcatalyst.io landing page + catalyst-core path on GitHub, both Class B), both are listed.

Per-fund detail is populated in the next pass of this document as the source-inventory research returns. Funds are listed in numerical order; the most recent closed fund is at the end.

---

### Fund 1 — Catalyst Fund 1 (test pilot)

Sept 2020. Pilot event with no on-chain proposal vote and no ADA disbursement. Listed here for completeness; preservation is mostly symbolic since F1 had no proposals to lose.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/1` (Class B) |
| Secondary source | `https://drive.google.com/file/d/1UmAGBRxWbQtpWjrNnvGuybgLiWs2zFMS/view` (Class B by issuance, but hosted on a single-owner third-party service — the weakest Class B URL in the entire registry); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_1.sql` (Class B) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/B (secondaries) |
| Capture risk | Band 2 |
| Completeness | Voting only |
| Known gaps | Non-funding test event; no proposals submitted; no ADA pool. The F1 voting-results artifact lives on a Google Drive link controlled by an unnamed single owner — a real preservation fragility flagged here because no other Class B copy exists. Capture priority for F1 should include both the projectcatalyst.io page **and** an early Wayback submission of the Google Drive URL. |

### Fund 2 — Catalyst Fund 2

Late 2020. First funding event. Pre-IdeaScale era — proposal text exists in `catalyst-core` SQL but not on any external platform-hosted URL.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/2` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/2/voting-results` (Class B — in-page explorer, no public CSV export); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_2/` (Class B); `https://www.catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/B/D (secondaries) |
| Capture risk | Band 2 |
| Completeness | Substantial |
| Known gaps | Pre-IdeaScale era — full proposal long-form text exists only in `catalyst-core` SQL dumps; no Class C surface for this fund. USD-denominated era — ADA pool size is not surfaced on `projectcatalyst.io` and must be reconstructed from forum posts. Submitted ≈ 78 / Funded ≈ 11. |

### Fund 3 — Catalyst Fund 3

Early 2021. First fund with public per-proposal voting results page (Google Sheet, then later in-page explorer).

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/3` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/3/voting-results` (Class B); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_3/` (Class B); `https://www.catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/B/D (secondaries) |
| Capture risk | Band 2 |
| Completeness | Substantial |
| Known gaps | Pre-IdeaScale era for proposal long-form text — only in `catalyst-core`. Voting-results page is an in-page explorer with no published CSV export — capture method will need to scrape the rendered table rather than download a structured file. USD-denominated era. Submitted ≈ 150 / Funded ≈ 21. |

### Fund 4 — Catalyst Fund 4

Jun 2021. **First fund with IdeaScale-hosted proposal pages.** This is the boundary where Class C sources enter the preservation surface and capture risk jumps to Band 1.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/4` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/4/voting-results` (Class B); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_4/` (Class B); `cardano.ideascale.com/c/campaigns/{id}/about` for each F4 campaign (Class C — opaque per-campaign numeric IDs; enumeration is a Phase 3 task); `https://www.catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) — but Class C surface is the highest-risk component. |
| Authority class | B (primary), B/B/C/D (secondaries) |
| Capture risk | **Band 1** (IdeaScale is the only source of full proposal long-form text + comments) |
| Completeness | Substantial |
| Known gaps | IdeaScale URL structure is per-campaign with opaque numeric IDs, not per-fund — there is no clean `cardano.ideascale.com/c/c/F4` root URL. Campaign-ID enumeration per fund is deferred to Phase 3. USD-denominated era. Submitted ≈ 277 / Funded ≈ 51. |

### Fund 5 — Catalyst Fund 5

Aug–Sep 2021.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/5` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/5/voting-results` (Class B); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_5/` (Class B); `cardano.ideascale.com/c/campaigns/{id}/about` for each F5 campaign (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Substantial |
| Known gaps | IdeaScale per-campaign IDs to enumerate in Phase 3. USD-denominated era. Submitted ≈ 267 / Funded ≈ 69. |

### Fund 6 — Catalyst Fund 6

Nov–Dec 2021.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/6` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/6/voting-results` (Class B); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_6/` (Class B); `cardano.ideascale.com/c/campaigns/{id}/about` for each F6 campaign (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Substantial |
| Known gaps | IdeaScale per-campaign IDs to enumerate in Phase 3. USD-denominated era. Submitted ≈ 711 / Funded ≈ 151. |

### Fund 7 — Catalyst Fund 7

Jan–Feb 2022 (voting closed 3 Feb 2022).

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/7` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/7/voting-results` (Class B); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_7/` (Class B); `cardano.ideascale.com/c/campaigns/{id}/about` for each F7 campaign (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Substantial |
| Known gaps | IdeaScale per-campaign IDs to enumerate in Phase 3. USD-denominated era. Submitted ≈ 936 / Funded ≈ 264. |

### Fund 8 — Catalyst Fund 8

21 Apr – 5 May 2022. Last USD-denominated fund.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/8` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/8/voting-results` (Class B); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_8/` (Class B); `cardano.ideascale.com/c/campaigns/{id}/about` for each F8 campaign (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Substantial |
| Known gaps | IdeaScale per-campaign IDs to enumerate in Phase 3. **Last USD-denominated fund** — ~$16M USD pool, ~$11.2M to proposals. Submitted ≈ 1,134 / Funded ≈ 367. |

### Fund 9 — Catalyst Fund 9

5–19 Sep 2022. **First ADA-denominated fund** (12.8M ADA pool). One of F9's most-visible campaigns is "Great Migration" at IdeaScale campaign ID 332.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/9` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/9/voting-results` (Class B); `input-output-hk/catalyst-core` at `src/event-db/historic_data/fund_9/` (Class B — **last fund covered by `catalyst-core`**); `cardano.ideascale.com/c/campaigns/332/about` and other F9 campaigns (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Full |
| Known gaps | Submitted-proposal count not surfaced on the `projectcatalyst.io` summary page (Funded ≈ 207). **First ADA-denominated era** — earlier fund pool sizes need separate reconstruction. **Final fund with `catalyst-core` coverage** — F10 onward has no `catalyst-core` snapshot. |

### Fund 10 — Catalyst Fund 10

Mid-2023. **First fund NOT in `catalyst-core`** — boundary is hard, not gradual. Voting results delivered as a single styled PDF rather than the in-page explorer used elsewhere.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/10` (Class B) |
| Secondary source | `https://projectcatalyst.io/fund10-voting-results.pdf` (Class B — **anomaly: only fund whose canonical voting results are a standalone PDF**; the PDF carries an "Internal Copy – [confidential]" stamp despite being publicly linked, dated 21 Sep 2023, ~2.7 MB); `cardano.ideascale.com/c/campaigns/343/about`, `/c/campaigns/348/about`, etc. (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02); the PDF anomaly is noted but the file resolves. |
| Authority class | B (primary), B/C/D (secondaries) |
| Capture risk | **Band 1** (no `catalyst-core` coverage; off-platform record exists only as IdeaScale + the single PDF + projectcatalyst.io summary) |
| Completeness | Full |
| Known gaps | **`catalyst-core` coverage ends at F9.** F10+ depends entirely on `projectcatalyst.io` + IdeaScale for off-chain record. PDF "[confidential]" marking is an unexplained quirk — preserve the file verbatim including the stamp; do not edit. 46.58M ADA pool / Submitted ≈ 1,467 / Funded ≈ 192. |

### Fund 11 — Catalyst Fund 11

Early 2024.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/11` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/11/voting-results` (Class B — in-page explorer with CSV download); `cardano.ideascale.com/c/campaigns/{id}/about` for each F11 campaign (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Full |
| Known gaps | No `catalyst-core` coverage (F10+ boundary). 46.49M ADA pool / Submitted ≈ 920 / Funded ≈ 300. |

### Fund 12 — Catalyst Fund 12

~May–Jul 2024.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/12` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/12/voting-results` (Class B — CSV download); `cardano.ideascale.com/c/campaigns/{id}/about` for each F12 campaign (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Full |
| Known gaps | No `catalyst-core` coverage. 46.48M ADA pool / Submitted ≈ 1,205 / Funded ≈ 258. |

### Fund 13 — Catalyst Fund 13

Late 2024. F13 campaign 423 is one identified workflow page.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/13` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/13/voting-results` (Class B — CSV download); `cardano.ideascale.com/c/campaigns/423/workflow` and other F13 campaigns (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Full |
| Known gaps | No `catalyst-core` coverage. 46.48M ADA pool / Submitted ≈ 1,639 / Funded ≈ 199. |

### Fund 14 — Catalyst Fund 14

2025. **Pool drop** from ~46.5M ADA (F11–F13) to ~18.59M ADA — flag for the registry as a fund-level fact without editorializing.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/14` (Class B) |
| Secondary source | `https://projectcatalyst.io/funds/14/voting-results` (Class B — CSV download); `cardano.ideascale.com/c/campaigns/{id}/about` for each F14 campaign (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact (verified 2026-06-02) |
| Authority class | B (primary), B/C/D (secondaries) |
| Capture risk | Band 1 |
| Completeness | Substantial — most recent closed fund; milestone tracker state per-proposal not spot-checked during this inspection pass |
| Known gaps | **Pool drop** from ~46.5M ADA (F11–F13) to 18.59M ADA — note the fact, do not editorialize. No `catalyst-core` coverage. Submitted ≈ 1,283 / Funded ≈ 131. |

### Fund 15 — Catalyst Fund 15 (in progress)

In progress as of 2026-06-02. Innovation phase closed January 8 2026; voting dates not yet announced. **First fund mixing ADA and USDM** (18.5M ADA + 250K USDM pool). Per §24.1, preservation activity excludes in-progress funds — the fund's record is not yet complete and capture would generate provisional artifacts that the next phase of the fund will supersede.

| Field | Value |
|---|---|
| Primary source | `https://projectcatalyst.io/funds/15` (Class B) |
| Secondary source | not yet published — voting results URL pattern will follow the F11–F14 in-page explorer convention when issued; `cardano.ideascale.com` current active campaigns (Class C); `catalystexplorer.com/en/funds` (Class D) |
| Preservation status | Live and intact for the landing page; voting record not yet generated (verified 2026-06-02) |
| Authority class | B (primary), C/D (secondaries) |
| Capture risk | Not classified — fund is in progress; capture deferred per §24.1 until fund closes |
| Completeness | On-chain only — innovation-phase proposals visible on IdeaScale but no canonical voting record yet exists |
| Known gaps | **In-progress** — exclude from "closed funds" treatment per §24.1. Voting dates TBA. First fund with USDM stablecoin component (250K USDM in addition to 18.5M ADA). Re-classify and add to capture priority once the fund officially closes and the voting record is issued. |

## Aggregate preservation overview

At-a-glance summary across all 15 funds. The per-fund subsections above are the authoritative record; this table is for scanning.

| Fund | Voting period | Authority class (primary) | Capture risk | Preservation status | Completeness |
|---|---|---|---|---|---|
| F1  | Sep 2020          | B | Band 2 | Live and intact (fragile Drive link) | Voting only |
| F2  | Late 2020         | B | Band 2 | Live and intact | Substantial |
| F3  | Early 2021        | B | Band 2 | Live and intact | Substantial |
| F4  | Jun 2021          | B | **Band 1** | Live and intact | Substantial |
| F5  | Aug–Sep 2021      | B | **Band 1** | Live and intact | Substantial |
| F6  | Nov–Dec 2021      | B | **Band 1** | Live and intact | Substantial |
| F7  | Jan–Feb 2022      | B | **Band 1** | Live and intact | Substantial |
| F8  | Apr–May 2022      | B | **Band 1** | Live and intact | Substantial |
| F9  | Sep 2022          | B | **Band 1** | Live and intact | Full |
| F10 | Mid-2023          | B | **Band 1** | Live and intact (PDF anomaly) | Full |
| F11 | Early 2024        | B | **Band 1** | Live and intact | Full |
| F12 | May–Jul 2024      | B | **Band 1** | Live and intact | Full |
| F13 | Late 2024         | B | **Band 1** | Live and intact | Full |
| F14 | 2025              | B | **Band 1** | Live and intact | Substantial |
| F15 | In progress       | B | n/a (deferred) | Live; voting record not yet issued | On-chain only |

Eleven of fifteen funds (F4 through F14) carry Band 1 capture risk because their full proposal long-form text exists only on the Class C IdeaScale platform. These eleven funds are the highest-priority capture target.

## Cross-cutting gaps

Cross-fund observations from the Phase 2 inspection pass. These drive Phase 3 capture-plan priorities.

1. **`catalyst-core` boundary is hard at F9/F10.** The repository `input-output-hk/catalyst-core` contains `src/event-db/historic_data/` with `fund_0.sql`, `fund_1.sql`, then `fund_2/` through `fund_9/` as directories. There is no `fund_10/` or later. Fund 10 onward depends entirely on `projectcatalyst.io` + IdeaScale for its off-chain record. This boundary is not a gradient — it is a hard cutoff that the registry must record. The `METHODOLOGY.md §24.9 Band 2` description was amended in the same commit as this registry to reflect this finding.

2. **`catalyst-core` is dormant, not archived.** Despite the framing in the earlier planning artifact and the original §24 draft, the repository is not marked archived on GitHub. The last release was December 2025 and the repo retains ~16,800 commits with no archival flag. The risk is dormant-tooling-eventually-becoming-deleted, not already-archived-might-disappear. `METHODOLOGY.md §24.9 Band 1 trigger (c)` was amended to match: the trigger is "IO marks the repository as archived or deleted" rather than "IO removes the deleted flag." This is a factual correction, not a methodology change.

3. **IdeaScale uses per-campaign opaque numeric IDs, not per-fund roots.** The Class C surface for any given fund is *N* IdeaScale campaign URLs at `cardano.ideascale.com/c/campaigns/{id}/about` where `{id}` is an opaque numeric like `332` (F9 "Great Migration"), `343` and `348` (two of F10's campaigns), `423` (an F13 workflow page). There is no canonical `cardano.ideascale.com/c/c/F9` URL pattern. **Enumerating which campaign IDs belong to which fund is a Phase 3 task.** Without that enumeration, a `wget --mirror` of the IdeaScale root would either fetch too much (all campaigns across all funds) or too little (only the campaigns whose IDs we already know). This is the single largest operational unknown for Phase 3.

4. **F1 voting results live on a single-owner Google Drive link.** This is the weakest Class B URL in the entire registry. A single drive-owner takedown, account closure, or sharing-permission change would orphan F1's voting record entirely. F1 capture priority should include both the `projectcatalyst.io` landing page **and** an early Wayback Machine submission of the Google Drive URL. The capture plan in Phase 3 must specify this as a special case.

5. **F10 voting results are a single styled PDF carrying an "Internal Copy – [confidential]" marking.** F10 is the only fund whose canonical voting results are a standalone PDF — every other fund uses an in-page explorer with CSV download. The "[confidential]" stamp on a publicly-linked file is unexplained; preserve the artifact verbatim including the stamp. Do not edit the PDF. The artifact-as-found is the historical record.

6. **USD-denominated era vs ADA-denominated era boundary at F8/F9.** Funds F1–F8 report pool sizes in USD; Funds F9–F15 report in ADA. For F1–F8, ADA pool sizes are not surfaced on `projectcatalyst.io` and must be reconstructed from contemporaneous Cardano Forum posts or IO blog posts. This reconstruction work is downstream-analytical, not preservation — the registry records the USD pool sizes as captured, and any researcher who wants ADA equivalents reconstructs them from the on-chain treasury record + ADA/USD price at the relevant date.

7. **F14 pool drop from ~46.5M ADA to 18.59M ADA.** F11–F13 each had ~46.5M ADA pools; F14 dropped to 18.59M ADA. This is a fund-level fact about Catalyst funding policy in 2025. The registry records the drop without editorial framing; researchers can investigate the underlying governance decision separately. Per §24.8, the archive does not generate narrative for this drop.

8. **F15 is in-progress and excluded from closed-fund preservation activity per §24.1.** Innovation phase closed Jan 8 2026; voting dates TBA. F15 is also the first fund mixing ADA with USDM stablecoin (18.5M ADA + 250K USDM). When F15 officially closes and a canonical voting record is issued, this registry will be revised to add F15 to the Band 1 capture queue.

9. **`catalystexplorer.com` covers F1–F14 per its `/funds` index, but no public OpenAPI surface was discoverable during the Phase 2 inspection.** The community-maintained mirror is Class D — useful as corroboration but not as a primary source. The Phase 3 capture plan should treat `catalystexplorer.com` as an HTML mirror target rather than an API consumer; if an OpenAPI surface is later documented by the project, that becomes a future Phase 3 amendment.

10. **No fund has been observed to be Live but drifting, Partially orphaned, or Fully orphaned as of 2026-06-02.** Every primary URL inspected during this pass resolved successfully. This is the single most important fact in the registry: the at-risk Class C surface (IdeaScale) is still intact today. The Phase 3 capture plan should treat this as a perishable window — the window's existence is the only reason FLOW-6 can hope to preserve everything Class C.

## Next phases

- **Phase 3 — `docs/CATALYST_CAPTURE_PLAN.md`.** Per source identified in this registry: capture method, storage path convention, hash strategy, chain-of-custody wrapper, Wayback submission workflow. Methodology-and-operational; still no actual capture.
- **Phase 4 — preservation repository design.** New repository created, its README, LICENSE, INDEX.json schema, boundary contract with the observatory. Still no actual capture.
- **Phase 5 — capture.** Gated on Phases 2, 3, and 4 approval. The first artifact captured carries a fully-conforming `.custody.json` manifest per §24.4 from the very first byte onward.

## Document lifecycle

This registry is re-verified on every methodology version bump and whenever any preservation status changes for any fund. Updates are logged in a small change-log at the bottom of this document (added on first revision). The first observation of a Class C URL transitioning from "Live and intact" to anything else triggers a Phase 5 escalation review per §24.9 Band 1.

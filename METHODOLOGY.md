# Methodology

This document describes exactly what data the Cardano Delegation Observatory collects, how the values shown on the site are computed, what is deliberately not included, and how anyone can reproduce the published results from public data.

This page is the legitimacy core of the project. Every operational decision is documented here. If you find an inconsistency between this page and what the site shows, this page is the authoritative description; please open an issue.

---

## 1. What this site does

The Cardano Delegation Observatory takes a daily snapshot of voting weight delegated to active Cardano DReps and publishes:

- The 30 DReps with the highest current voting weight
- For each, the current voting weight in ADA, 7-day and 30-day change, delegator count, last vote epoch, and 90-day voting weight history
- Governance action submissions as time-anchored overlay markers on the historical chart

All data is derived from the Cardano blockchain via the Koios API. No private data sources are used.

## 2. What this site does not do

The site does not compute or display:

- Trust scores or composite ratings of any kind
- Alignment scores between stated positions and votes
- "Good DRep" / "bad DRep" classifications
- Predictions of voting behavior, delegation flow, or election outcomes
- Real names of DReps unless those names are provided by the DRep themselves in their on-chain metadata
- Wallet-level information about delegators (no whale identification, no clustering, no deanonymization, no inference of identity)
- Alerts, push notifications, RSS-of-changes, or any form of real-time feed
- User comments, ratings, tags, or any form of social layer
- Featured, highlighted, recommended, or curated DReps
- Concentration warnings, framing language, or any other text that implies a value judgment about an individual DRep

If a future version of the site is considered for any of these, this document and the project's changelog (§11) will be updated *before* the feature is shipped, and a comment period will be provided.

## 3. Data sources

**Primary:** [Koios API](https://api.koios.rest/) — a community-run REST interface over Cardano `db-sync`. Free tier is sufficient for the daily snapshot pattern this site uses.

Endpoints used (reproducible from the source at `etl/snapshot.py`):

- `GET /tip` — current epoch and block height for run metadata
- `GET /drep_list` — registered DReps, paginated
- `POST /drep_info` — registration status, voting weight, metadata URL+hash (batched, ≤50 IDs per call)
- `GET /drep_delegators` (Content-Range header) — delegator count per DRep, fetched only for top-60 candidates
- `POST /drep_metadata` — Koios-parsed metadata content with `is_valid` flag
- `GET /proposal_list` — governance actions (paginated)
- `GET /vote_list` — every recorded vote (paginated), filtered to `voter_role == 'DRep'`

DRep metadata content is consumed via Koios's `drep_metadata` endpoint and its `is_valid` flag; see §8 for the full handling chain and the v0.2 plan for independent fetch + verification.

## 4. Update cadence

The ETL job runs once daily at **02:00 UTC**.

Each run captures live DRep state at the moment of the run. The site displays the snapshot under the label **"Data through {YYYY-MM-DD}"**, where the date is the UTC date the snapshot was captured. Updates happen at most once per day, so lag from any on-chain event to its appearance on the site is **at most approximately 24 hours** — the exact lag depends on when within the daily cycle the event occurred.

If the daily ETL run fails (network outage, API error, schema mismatch), the prior snapshot remains displayed unchanged. No partial or potentially inconsistent data is ever published. The site's **"Last successful update"** timestamp signals staleness if the data is older than 36 hours.

## 5. Selection criteria

The 30 DReps shown on the main page are selected by:

1. **Active registration status** — Koios `drep_info.active = true` for the current epoch. This excludes DReps whose registration has expired or been deregistered.
2. **Exclusion of default-delegation targets** — the special identifiers `drep_always_abstain` and `drep_always_no_confidence` are never displayed. These are protocol-level default delegation options, not individual DReps; including them would dominate the ranking and mislead readers.
3. **Voting weight, descending**, computed from the most recent daily snapshot. The voting weight value is the `amount` field from Koios `drep_info`, in lovelace, displayed as ADA (lovelace ÷ 1,000,000).
4. **Ties broken by `drep_id` ascending**, deterministic across runs.

This selection is fully deterministic and reproducible from public data. There is **no manual curation, no featured selection, and no operator-influenced ranking**. The ranking criteria above are the only criteria; changes to them will be documented in §11 with rationale.

## 6. Fields displayed per DRep

For each DRep in the top 30:

- **DRep ID** — the bech32 `drep1...` identifier from the on-chain registration certificate.
- **Name** — the value of the `givenName` field in the DRep's on-chain metadata, if present and verified. If the metadata fails hash verification, contains no `givenName` field, or no metadata URL was registered, this field is empty.
- **Voting weight (ADA)** — the most recent daily snapshot of the DRep's total delegated voting power, in ADA (lovelace ÷ 1,000,000).
- **Δ 7d** — voting weight at the most recent snapshot minus voting weight at the snapshot 7 days prior, in ADA. Displayed as a signed number with no color coding.
- **Δ 30d** — voting weight at the most recent snapshot minus voting weight at the snapshot 30 days prior, in ADA. Displayed as a signed number with no color coding.
- **Delegators** — the count of distinct stake credentials currently delegated to this DRep.
- **Last vote (epoch)** — the most recent epoch in which the DRep cast a recorded vote on any governance action. Computed as `MAX(vote_epoch)` across all stored votes for that DRep. When a DRep has revoted on the same proposal, only the chronologically latest vote is stored (DReps may change their vote on an open proposal; the latest cast vote is the one that counts at tally time).
- **90-day chart** (on the per-DRep page) — the daily series of voting weight for the last 90 snapshots, with epoch boundaries shown as light vertical markers and governance action submission dates shown as labeled vertical markers.

## 7. Fields not displayed

This list is exhaustive for v0.1. Any addition requires a §11 changelog entry written *before* the change ships:

- Off-chain identity not provided by the DRep
- Delegator wallet addresses, balances, or any per-delegator detail
- Inferred relationships between DReps, between delegators, or between DReps and delegators
- Inferred motivations for any delegation movement
- Any composite score, percentile rank, badge, tier, or rating
- Any "highlights," "alerts," or "of note" framing

## 8. Metadata handling

DRep metadata URLs may return arbitrary content. In v0.1, metadata content is consumed via the Koios `drep_metadata` endpoint, which fetches the off-chain JSON, hashes it, and applies CIP-100/CIP-119 validation. The observatory uses Koios's `is_valid` flag as the validation gate.

Specifically:

- **Validation gate** — metadata flagged `is_valid = false` by Koios is ignored entirely. No name is extracted; the DRep entry shows the bech32 DRep ID only.
- **No HTML rendering** — only the `givenName` field is read from the parsed JSON. No raw metadata content is ever rendered as HTML on the site.
- **Sanitization** — extracted `givenName` is treated as plain text: control characters are stripped, the value is truncated to 200 characters, and the result is displayed only if non-empty after stripping.
- **No fallback identification** — if metadata is missing, invalid, or contains no `givenName`, the entry shows the bech32 DRep ID only. No alternative naming source is consulted.

In v0.2, the observatory may move to fetching metadata directly from the on-chain URL with independent SHA-256 verification, removing Koios from the trust path for metadata content. This is a v0.2 candidate, not a v0.1 commitment.

## 9. Right of reply

A DRep who wants to add context to their entry on this site should update their on-chain metadata. The observatory fetches the latest metadata each day and the new content will appear on the next snapshot.

There is **no operator-mediated channel** for adding text, links, badges, or commentary to any DRep's entry. This is deliberate: the moment the operator can edit per-DRep content, the site has an editorial dimension.

If a DRep believes a published number is computationally incorrect, please open an issue on the [GitHub repository](https://github.com/cryptoleo79/cardano-delegation-observatory) with the snapshot date, the field in question, and the value you expect. Computational corrections will be made publicly, with the changelog noting the affected dates.

## 10. Operator

This observatory is operated by [cryptoleo79](https://github.com/cryptoleo79), an independent Cardano stake pool operator and DRep.

**Conflicts of interest disclosure:**

- The operator is a registered DRep. The operator's DRep entry, if it appears in the top 30 by voting weight, is shown in the data with no special treatment, no exclusion, and no editorial flag.
- The operator runs a Cardano stake pool. Stake pool data is not displayed on this site; this observatory is concerned only with DReps and delegation to DReps.
- The operator authored the [Connected Treasury Framework](https://ctf.asy.life). That project advocates for treasury yield distribution that includes performance-gated DRep participation incentives. The observatory does not promote, link to, or favor the CTF proposal in its data presentation.

The source code, deployment configuration, and data schema are all public in this repository under Apache 2.0. The published data is CC0. Anyone can independently reproduce all results from the cited public endpoints.

## 11. Changelog

| Date | Version | Change |
|---|---|---|
| 2026-05-28 | v0.1.5 | Added vote ingestion: `/proposal_list` and `/vote_list` are now ingested each run. 119 governance actions and ~24k DRep votes captured locally; `last_vote_epoch` is now populated for every DRep with at least one recorded vote. Ordering fix applied: when a DRep revoted on the same proposal, the chronologically latest vote (by block_time) is the one kept. §3 endpoint list updated. §6 `last_vote_epoch` description clarified. §12 amended: vote ingestion is no longer listed as a v0.1 limitation. |
| 2026-05-27 | v0.1 (real-data adjustments) | First live ETL run completed locally: 366 active DReps detected on Koios, 60 top candidates snapshotted, top 30 ranking deterministic. §4 lag wording corrected from "minimum 24h" to "up to ~24h". §5 expanded to make exclusion of default-delegation targets explicit and to switch tie-break to deterministic drep_id ascending. §8 updated to describe the Koios-mediated metadata path actually in use, with independent fetch deferred to v0.2. §12 added to disclose v0.1 scope limitations transparently. |
| 2026-05-27 | v0.1 | Initial draft. |

## 12. v0.1 scope limitations

The site is deliberately narrow at v0.1. The following are out of scope for this version and disclosed here transparently rather than masked with synthetic or interpolated values:

- **Delegator counts** are fetched only for the top 60 candidates per daily run (to support top-30 ranking with headroom), not all active DReps. The remaining active DReps are visible via the underlying Koios API for anyone who needs them.
- **Historical backfill is not yet implemented.** The Δ7d and Δ30d fields will appear as null until daily snapshots have accumulated for 7 and 30 days respectively from first deployment. The 90-day chart will populate forward from launch.
- **Vote outcomes are not editorialized.** The `votes` table stores facts only — `(action_id, drep_id, vote ∈ {yes, no, abstain}, vote_epoch)`. No alignment scoring, no "voted with consensus" / "voted against consensus" framing, no per-vote interpretation. Governance action outcomes (`enacted`, `ratified`, `dropped`, `expired`, `active`) are derived deterministically from Koios fields and likewise carry no value judgment.
- **Per-DRep vote history page** is not yet rendered in the frontend; the data is stored and queryable but no UI exists. Frontend work begins in Phase 2.

These limitations resolve over time as v0.2 work lands. They are not concealed and are not approximated.

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

Endpoints used (full list, reproducible from the source at `etl/snapshot.py`):

- `GET /drep_list` — active DReps as of a given epoch
- `GET /drep_info` — voting weight and delegator count for a given DRep
- `GET /drep_metadata` — metadata URL and on-chain metadata hash
- `GET /proposal_list` — governance actions
- `GET /proposal_voting_summary` — votes per action, drillable per DRep
- `GET /drep_history` — historical per-epoch state, used only for backfilling at first run

DRep metadata content is fetched directly from the URL stored on-chain. The SHA-256 of the fetched response body is verified against the on-chain metadata hash. Any metadata that fails verification is discarded.

## 4. Update cadence

The ETL job runs once daily at **02:00 UTC**.

The snapshot date is the most recent full UTC calendar day. The page always displays **"Data through {YYYY-MM-DD}"** prominently. A **24-hour minimum lag** from any on-chain event to its appearance on the site is enforced by the timing of the snapshot.

If the daily ETL run fails (network outage, API error, schema mismatch), the prior snapshot remains displayed. No partial or potentially inconsistent data is ever published. The site's **"Last successful update"** timestamp signals staleness if the data is older than 36 hours.

## 5. Selection criteria

The 30 DReps shown on the main page are selected by:

1. **Active registration status** as of the snapshot epoch.
2. **Voting weight, descending**, computed from the most recent daily snapshot.
3. **Ties broken by registration epoch, oldest first.**

This selection is deterministic and reproducible from public data. There is **no manual curation, no featured selection, and no operator-influenced ranking**. The ranking criteria above are the only criteria; changes to them will be documented in §11 with rationale.

## 6. Fields displayed per DRep

For each DRep in the top 30:

- **DRep ID** — the bech32 `drep1...` identifier from the on-chain registration certificate.
- **Name** — the value of the `givenName` field in the DRep's on-chain metadata, if present and verified. If the metadata fails hash verification, contains no `givenName` field, or no metadata URL was registered, this field is empty.
- **Voting weight (ADA)** — the most recent daily snapshot of the DRep's total delegated voting power, in ADA (lovelace ÷ 1,000,000).
- **Δ 7d** — voting weight at the most recent snapshot minus voting weight at the snapshot 7 days prior, in ADA. Displayed as a signed number with no color coding.
- **Δ 30d** — voting weight at the most recent snapshot minus voting weight at the snapshot 30 days prior, in ADA. Displayed as a signed number with no color coding.
- **Delegators** — the count of distinct stake credentials currently delegated to this DRep.
- **Last vote (epoch)** — the most recent epoch in which the DRep cast a recorded vote on any governance action.
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

DRep metadata URLs may return arbitrary content. The observatory enforces:

- **Size cap** — responses larger than 100 KB are discarded.
- **Hash verification** — the SHA-256 of the response body must match the metadata hash recorded on-chain. Mismatches are discarded.
- **No HTML rendering** — metadata is parsed as JSON. No content from metadata is ever rendered as HTML on the site.
- **Sanitization** — the `givenName` field, when present, is treated as plain text. Control characters, HTML tags, and excessive whitespace are stripped before display.

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
| (pre-launch) | v0.1 | Initial draft. Not yet deployed. |

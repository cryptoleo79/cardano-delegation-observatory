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

The observatory has two cadences. The **daily layer** is canonical for everything reported as "Data through {date}"; the **live telemetry layer** (described in §14) is supplemental and refreshes more often but writes a narrower set of data.

The **daily ETL** runs once a day at **02:00 UTC**.

Each daily run captures live DRep state at the moment of the run. The site displays the daily snapshot under the label **"Data through {YYYY-MM-DD}"**, where the date is the UTC date the snapshot was captured. Daily updates happen at most once per day, so lag from any on-chain event to its appearance in the daily layer is **at most approximately 24 hours** — the exact lag depends on when within the daily cycle the event occurred.

If the daily ETL run fails (network outage, API error, schema mismatch), the prior daily snapshot remains displayed unchanged. No partial or potentially inconsistent daily data is ever published. The site's **"Last successful update"** timestamp signals staleness if the daily data is older than 36 hours.

The **live telemetry layer** runs every 10 minutes via a separate cron entry; its cadence, scope, and limitations are defined in §14.

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
| 2026-05-29 | v0.7 (addendum) | §21.14 added: explicit invariant that `snapshot_date` is the sole authority for archive placement; wall-clock UTC of the ETL run is irrelevant. Closes a real reproducibility hazard discovered during FLOW-4 verification, where two export functions (`export_epoch_info`, `export_action_detail`) silently recomputed `datetime.now(UTC)` instead of receiving `snapshot_date` as a parameter, splitting a single logical snapshot across two date directories whenever the wall-clock date differed from the requested snapshot_date (midnight-crossing runs and any backfill). Same-commit code fix: both functions now accept `snapshot_date` and never recompute it; `--snapshot-date YYYY-MM-DD` CLI flag added for backfill, archive repair, and reproducibility tests. |
| 2026-05-29 | v0.7 (methodology only — code follows after verification gate) | FLOW-4 methodology §21 added: defines the historical snapshot browser. Scope, what a historical state is, what a snapshot is, snapshot persistence and addressing (dual write to current + `/by-date/{YYYY-MM-DD}/` immutable archive), missing-period handling (gap notice, no interpolation), historical ranking derivation (preserved exactly as published, even if later developments would change interpretation), what the browser refuses to infer, immutability rules enforced by file path, navigation primitives (list — never calendar — to honor the discrete-with-gaps reality), provenance strip including stable canonical archive path as citable identifier, scope of coverage (no pre-deployment backfill), explicit non-goals, and reproducibility commitment (byte-for-byte equivalence between served JSON and archived file). Code and frontend wait for the 02:05 UTC verification gate. |
| 2026-05-29 | v0.6 | FLOW-3 methodology §20 added: defines the governance history layer. Scope, action record, action timeline, retention (permanent vs mutable), canonical sources, representation (aggregate + per-action JSON exports), what is not inferred (explicit "actions are presented in historical order; no major/minor distinction"), revision/reconciliation rules, edge cases, and reproducibility commitment. §20.7 adds the requirement that action detail pages display canonical `action_id` prominently near the top — never as an afterthought. Code and frontend follow in separate commits. |
| 2026-05-29 | v0.5 | FLOW-2 methodology §19 added: defines governance event overlays on the per-DRep voting weight chart. Five event types (submission, ratification, enactment, expiration, drop) with explicit time alignment between epoch-anchored events and date-anchored chart. §19.3 explicitly separates temporal proximity from causal claim; states that multiple events may occur without observable delegation response, and that the observatory records events and delegation state independently. §19.4 requires markers render behind the delegation series and never obscure the underlying data; single neutral color for all event types. §19.5 explicitly shows all actions in window — no editorial pre-filter. Schema addition: `epoch_info` table. Export addition: `/data/snapshots/epoch_info.json`. Code and frontend implementation follow in separate commits. |
| 2026-05-29 | v0.4 | FLOW-1 methodology §18 added: defines net voting-weight movement and net delegator-count movement; explicitly separates measured movement from inferred meaning. §18.3 states that net movement is not migration. §18.8 enumerates what flow data does NOT imply, including the explicit case that large movements may originate from wallet software defaults, custodial infrastructure, exchange operations, stake-key changes, or delegation decisions, none of which the observatory can attribute. Δ1d intentionally not surfaced on main table — per-DRep page and JSON exports only. Code and frontend implementation follow in separate commits. |
| 2026-05-28 | v0.3 | Live telemetry layer added (`etl/live.py`, 10-minute cadence). Daily layer remains canonical. New methodology §14–§17 describe the live layer, eventual consistency between layers, Koios rate-limit discipline, and live-only data exports. Schema migration: `vote_block_time` column added to `votes` table; new `live_state` key/value table for cross-run state. All JSON exports now stamp `schema_version` (integer) and `methodology_version` (string) at the top of the payload to support reproducibility and downstream stability. Frontend gains explicit "daily snapshot" vs "live telemetry" distinction wording, recent-activity section with absolute UTC timestamps, and a data-provenance line in the footer. |
| 2026-05-28 | v0.2 | Deployment + scope expansion. Site live at https://observatory.asy.life via nginx + Let's Encrypt. Daily ETL cron at 02:00 UTC, git-pull deploy cron every 5 min. Added: governance actions index page (`/actions.html`) with DRep vote tally per action; public CSV export of top-30 snapshot (`/data/snapshots/top30.csv`); permalinkable per-DRep page (`/drep.html?id=...`) with full vote history and 90-day chart. New §13 documents pages and exports. |
| 2026-05-28 | v0.1.5 | Added vote ingestion: `/proposal_list` and `/vote_list` are now ingested each run. 119 governance actions and ~24k DRep votes captured locally; `last_vote_epoch` is now populated for every DRep with at least one recorded vote. Ordering fix applied: when a DRep revoted on the same proposal, the chronologically latest vote (by block_time) is the one kept. §3 endpoint list updated. §6 `last_vote_epoch` description clarified. §12 amended: vote ingestion is no longer listed as a v0.1 limitation. |
| 2026-05-27 | v0.1 (real-data adjustments) | First live ETL run completed locally: 366 active DReps detected on Koios, 60 top candidates snapshotted, top 30 ranking deterministic. §4 lag wording corrected from "minimum 24h" to "up to ~24h". §5 expanded to make exclusion of default-delegation targets explicit and to switch tie-break to deterministic drep_id ascending. §8 updated to describe the Koios-mediated metadata path actually in use, with independent fetch deferred to v0.2. §12 added to disclose v0.1 scope limitations transparently. |
| 2026-05-27 | v0.1 | Initial draft. |

## 13. Pages and public exports

The observatory comprises four pages:

1. **Observatory** (`/`) — top-30 DReps by current voting weight, with Δ7d, Δ30d, delegator count, last vote epoch. Daily snapshot. Click any row to expand inline detail, or follow the "open full page" link to the per-DRep permalink page.
2. **Governance actions** (`/actions.html`) — every governance action recorded on-chain with type (TreasuryWithdrawals, InfoAction, ParameterChange, NewConstitution, NewCommittee, HardForkInitiation), outcome (enacted, ratified, dropped, expired, active — derivation per §6), expiration epoch, and per-action DRep vote tally (yes / no / abstain counts). Sortable; filterable by type and outcome.
3. **Per-DRep page** (`/drep.html?id=drep1...`) — permalinkable page for any DRep currently in the snapshot. Shows current voting weight, last vote epoch, full vote history (paginated), 90-day voting weight chart, and on-chain metadata source. Generated daily for every DRep in the top 30.
4. **Methodology** (`/methodology.html`) — this page.

**Public data exports** (all CC0, regenerated by the daily ETL at 02:00 UTC):

- `GET /data/snapshots/top30.json` — current snapshot in JSON
- `GET /data/snapshots/top30.csv` — same in CSV (header + 30 rows; lovelace and ADA columns both included for verification)
- `GET /data/snapshots/actions.json` — governance actions index with per-action vote tallies
- `GET /data/snapshots/meta.json` — ETL run metadata
- `GET /data/snapshots/dreps/{drep_id}.json` — per-DRep history + vote record (top 30 only)

The format is stable within a major version. Any field additions or removals are recorded in the §11 changelog before the change ships.

**Vote tally semantics (in `actions.json`):** the counts `drep_yes_count`, `drep_no_count`, `drep_abstain_count` for each action represent the most recent vote each DRep has cast on that action. When a DRep has revoted on the same action, only their chronologically latest vote is counted (see §6 for the revote-ordering rule). The counts are facts, not interpretations; they do not constitute approval or rejection signals.

## 14. Live telemetry layer

In addition to the daily snapshot, the observatory runs a **live telemetry** ETL every **10 minutes** to surface near-real-time governance pulse. This layer is deliberately narrow.

**What the live layer fetches each run:**

- `/tip` — current epoch and block height (1 call)
- `/vote_list?block_height=gt.{last_seen}` — only DRep votes recorded since the previous live run (typically 0–1 pages)
- `/proposal_list` — full action list, but only every 6th run (≈ hourly)

**What the live layer does NOT fetch or change:**

- It does not refresh voting weight, delegator counts, or DRep ranking. Those remain pinned to the daily snapshot and to the epoch-boundary stake snapshots the Cardano protocol itself uses.
- It does not refresh DRep metadata.
- It does not modify any row written by the daily ETL.

**What the live layer writes:**

- New `votes` rows into the shared SQLite table (with `INSERT OR REPLACE` on `(action_id, drep_id)`; the revote-ordering rule from §6 applies identically).
- Conditionally new or updated `governance_actions` rows (hourly).
- JSON files under `/data/snapshots/live/` (see §17).

**What the live layer never writes:**

- It never modifies the daily `top30.json`, `top30.csv`, `actions.json`, `meta.json`, or `dreps/{drep_id}.json` files.
- It never modifies historical rows in the `snapshots` table.

The daily ETL at 02:00 UTC is the source of truth and reconciles any divergence on its next run.

## 15. Eventual consistency

Because two ETL processes share the same SQLite database, brief inconsistencies are possible:

- A vote captured by the live layer at 10:07 UTC may appear on the site at 10:08, before the next daily ETL run codifies it into the daily snapshot.
- A new governance action submitted between two live runs is captured at the next live run (max ~10 min lag) or, failing that, the next daily run.
- If a live run fails partway through, no live JSON files are written for that cycle. The prior live files remain in place. The freshness timestamp in `live/meta.json` makes the staleness visible to the UI.

**Reconciliation rule:** the daily layer is canonical. If a discrepancy is observed between live and daily reports of the same fact, the daily value is the one to cite. The live layer exists to shorten the visibility lag, not to replace the daily layer.

The site UI labels live-layer-sourced fields with an explicit "Live" indicator. Daily-layer fields have no such indicator; absence of label = canonical daily data.

## 16. Koios rate-limit discipline

The observatory is a polite consumer of the Koios free tier. Estimated combined load with the live layer at 10-minute cadence:

- Daily ETL: ~136 calls/day
- Live ETL: ~316 calls/day (144 tip + 144 vote_list + ~24 proposal_list + ~4 occasional drep_info refreshes)
- **Combined: ~452 calls/day**

This is well under typical free-tier limits. If Koios returns a 429 or persistent 5xx error:

- Individual call retries with exponential backoff up to 2 retries (same as daily layer).
- If retries fail, the run aborts cleanly, writes a failure record to `etl_runs`, leaves all existing files in place.
- The next 10-minute cron tick is independent and will retry.

There is no behavior in the observatory that polls more aggressively under failure. Backoff is monotonic.

## 17. Live-only data exports

All paths below are under `/data/snapshots/live/` on the deployed site, are CC0 licensed, and are regenerated by each successful live ETL run (every ~10 minutes). The format is stable within a major version; additions or removals are recorded in §11 before they ship.

- `GET /data/snapshots/live/tip.json` — current epoch, block height, block time, last-fetched timestamp.
- `GET /data/snapshots/live/recent_votes.json` — most recent DRep votes (sorted by block_time descending), with DRep name and action title joined in. Bounded to a small recent window (default: most recent 20 votes, limited to the last 24 hours).
- `GET /data/snapshots/live/meta.json` — last live-run start/complete timestamps, success flag, count of new votes in last run, and the cadence in minutes. This is the file the UI reads to compute the "Live · N min" freshness indicator.

The live exports do not duplicate any field that the daily layer publishes. They complement, never replace.

## 18. Delegation flow (FLOW-1)

This section defines exactly what "delegation movement" means within the observatory. The boundary is sharp: the observatory measures *what changed* between two snapshots; it does not infer *why* the change happened. Every flow metric below is computed directly from the daily snapshot record (§5) and carries no editorial dimension.

### 18.1 Quantities measured

Two independent quantities are tracked for each DRep:

- **Voting weight (lovelace).** The `amount` field from Koios `drep_info` at snapshot time, in lovelace. Captures the total delegated stake voting through the DRep.
- **Delegator count.** The number of distinct stake credentials currently delegated to the DRep, fetched via Koios `drep_delegators` (Content-Range header).

These quantities are tracked separately. They can move in opposite directions in the same interval — for example, one large delegator leaving while many small delegators join produces a negative voting-weight change and a positive delegator-count change. The observatory reports both, never reconciles them into a single "movement" number.

### 18.2 Net movement

For a DRep `D` and interval length `n` days, **net movement** is defined as:

```
  net_voting_weight_delta(D, t, n) = voting_weight(D, t) − voting_weight(D, t')
  net_delegator_count_delta(D, t, n) = delegator_count(D, t) − delegator_count(D, t')
```

where `t` is the most recent snapshot date and `t'` is the most recent snapshot date at or before `t − n days`. If no snapshot exists at or before `t − n days`, the flow is undefined and the value is reported as `null` (never zero, never interpolated).

### 18.3 Net movement is not migration

Net movement values are independent per DRep. The observatory makes no claim that a positive net movement at DRep A and a negative net movement at DRep B during the same interval represent the same delegators having moved from A to B. **Even when the magnitudes match exactly, this is not evidence of migration.**

Example: in a given week, DRep A shows +100M ADA and DRep B shows −100M ADA. The observatory reports both values. It does **not** report "ADA moved from B to A." Such a migration claim would require per-delegator event tracking, which FLOW-1 does not provide. The two movements may have been driven by completely independent delegators making unrelated decisions.

Migration tracking, if it is added in a future phase, will be documented in its own methodology section before any "A → B" claim appears anywhere on the site.

### 18.4 What is not measured by FLOW-1

The observatory does **not** measure, and the published data does **not** support claims about:

- **Gross inflow** (total ADA newly delegated to a DRep during an interval, ignoring departures).
- **Gross outflow** (total ADA un-delegated from a DRep during an interval, ignoring arrivals).
- **Migration** ("ADA moved from DRep A to DRep B"), per §18.3.

Gross inflow, gross outflow, and migration each require tracking per-delegator events — stake credential additions and removals per DRep, with attribution across DReps. The observatory currently records only DRep-level aggregates. Adding per-delegator event tracking is a candidate for a future phase (tentatively FLOW-1.5) and would require new ETL and a new methodology subsection before it ships.

Until then, **all flow values published are net only.** A reader cannot infer gross movement or migration from a net number.

### 18.5 Canonical comparison interval

Two intervals are exposed in the top-30 view:

- **7 days (Δ7d).** Snapshot-to-snapshot diff in calendar days.
- **30 days (Δ30d).** Same, over 30 days.

A third interval, **1 day (Δ1d)**, is computed and exposed in per-DRep JSON exports and on the per-DRep page only. It is intentionally not surfaced on the main table because day-over-day voting-weight changes within an epoch (5-day cadence in the Cardano protocol) are often not governance-meaningful and crowd the table visually.

The Cardano protocol pins voting power at epoch boundaries; within-epoch voting weight changes do not affect governance votes in progress. The daily-cadence diff is still the value the observatory reports because daily snapshots are the unit of record. Readers analyzing protocol-relevant changes should use the epoch boundary at or before the relevant proposal submission (see §4 and §5).

Each published flow value carries an explicit `flow_reference_date` field naming the snapshot date that was used as the prior reference. This is a reproducibility commitment: anyone who downloads the daily snapshots can recompute the published flow value.

### 18.6 Missing-data handling

The observatory does not interpolate. If a daily ETL run failed, the gap is preserved:

- If the prior snapshot at or before `t − n days` is missing, the flow value is `null`.
- If both the current and the reference snapshots exist but a snapshot between them is missing, the flow is still defined and computed from the two endpoints; the intermediate gap is invisible in the flow value, but visible in the underlying snapshot record.
- A DRep that entered the top-30 within the last `n` days has `null` flows for `n`-day intervals until enough snapshots have accumulated.
- For dates before the first deployment of the observatory, no value is ever reported — the observatory does not claim knowledge of pre-launch state.

### 18.7 Edge cases that cannot be resolved from snapshot data

These conditions can produce snapshot-level flow values that look meaningful but are not directly attributable from the available data. The methodology acknowledges them and reports raw numbers anyway, without editorial framing:

| Condition | What the observatory sees | What it cannot tell |
|---|---|---|
| Stake holder rotates to a new stake key (e.g., wallet restored from backup) | One delegator disappears, one new delegator appears | Whether it's the same person |
| Exchange shifts custody between cold/hot wallets | Delegator count and weight movements | Whether the same custodian is involved |
| Holder consolidates multiple stake keys | Multiple delegators disappear, one appears | Whether it's one person consolidating |
| DRep metadata changes (name update) | Display name changes; `drep_id` stable | (no flow implication — identity stable) |
| DRep deregisters | Voting weight goes to 0 in the next snapshot; delegators' stake is unassigned | Whether delegators will re-delegate elsewhere |
| Delegators inactive (no transactions) | No movement | Whether the delegator still exists or cares |

### 18.8 What flow data does NOT mean

Flow data is a record of *what changed*, not *why*. The observatory cannot resolve motive from snapshot deltas. In particular:

- **A DRep gaining ADA does not imply approval, trust, endorsement, or agreement.** The new ADA may come from a single delegator's strategy change, an exchange's rebalance, an inactive holder finally choosing a DRep, a wallet being restored from backup, or any other reason invisible to this site.
- **A DRep losing ADA does not imply rejection, disagreement, failure, or decline.** The lost ADA may have moved to another DRep, been moved to a new wallet by its holder, been spent, or have been part of an exchange custody change.
- **Large movements may originate from wallet software defaults, custodial infrastructure, exchange operations, stake-key changes, or delegation decisions.** The observatory records the movement itself and does not attribute motive. The mechanism behind a delegation change is invisible from snapshot data.
- **Coordinated-looking movement is not evidence of coordination.** Multiple delegators moving in the same direction within a short window may reflect a single holder splitting across multiple addresses, an exchange's batch operations, or independent decisions in response to public information.
- **Movement near a governance event is not evidence of voting motive.** Delegation can move at any time for any reason. The observatory shows *that* movement happened; it does not claim to know *because of what*.
- **The largest movers are not "winners" or "losers."** Magnitude reflects the scale of delegation activity, not its quality or normative direction.

Readers — researchers, journalists, DReps themselves — interpret what they see. The site does not.

## 19. Governance event overlays (FLOW-2)

This section defines how governance actions are displayed in time alongside delegation movement on the per-DRep voting weight chart. The boundary is sharp: the observatory shows *temporal proximity* between delegation movement and governance events; it makes no claim about *causation*.

### 19.1 Event types overlaid

For each governance action, up to five events may be drawn on the chart, depending on which fields are populated in the underlying record:

- **Submission** — when the proposal transaction was included on chain. Pinned to the UTC date of `block_time` from Koios `/proposal_list`.
- **Ratification** — when the protocol marked the action as ratified. Pinned to the start date of `ratified_epoch`.
- **Enactment** — when the protocol applied the action's effect. Pinned to the start date of `enacted_epoch`.
- **Expiration** — when the voting period closed without resolution. Pinned to the start date of `expires_epoch`.
- **Drop** — when the action was dropped. Pinned to the start date of `dropped_epoch`.

Each event for each action is sourced from Koios fields and is reproducible from the underlying `governance_actions` row and `epoch_info` mapping.

### 19.2 Time alignment between epochs and snapshot dates

The per-DRep voting weight chart is indexed by daily snapshot date (UTC calendar day). Governance state transitions resolve at epoch boundaries every five days. To overlay an epoch-anchored event on a date-indexed chart, the observatory uses:

- For **submission**: the exact UTC date of the submission `block_time`.
- For **ratification, enactment, expiration, drop**: the UTC date on which the relevant epoch began.

Epoch boundary dates are derived from Koios `/epoch_info`, which is canonical. When neither this nor a derived value is available (an epoch far in the past that has not been ingested), the overlay is omitted rather than approximated.

### 19.3 What an overlay marker means — and does not mean

An overlay marker on a chart at date *D* for event *E* concerning action *A* means exactly this:

> *Event E for action A occurred on date D (approximately, at epoch granularity for state transitions).*

The marker does **not** mean:

- That any delegation movement on or near *D* was caused by *A*.
- That delegation movement near *D* was a reaction to *A*.
- That voters on *A* coordinated their delegation choices.
- That *A* is more or less important than other actions on the chart.
- That any DRep voted on *A* in any particular way (vote history is a separate dataset on the per-DRep page; the overlay does not encode votes).

**Multiple governance events may occur within the same visual window without any observable delegation response. The observatory records both the events and the delegation state independently.** Proximity on the same time axis does not imply influence in either direction.

These claims would require attribution beyond what proximity-on-a-timeline provides. The observatory does not generate them.

### 19.4 Visual conventions

Overlays appear as subtle vertical markers on the 90-day voting weight chart, in a single calm neutral color, with **no outcome-based color coding** (enacted is the same color as dropped; ratified is the same color as expired). Markers are background context, not foreground.

**Overlay markers are rendered behind the delegation series and never obscure the underlying governance data.** The delegation line and its data points are always drawn on top of the marker layer.

Hovering or tapping a marker reveals plain text: action ID, action type, event type, event date. No commentary is generated.

Markers for the same action at different events (e.g., submission → enactment) appear at their respective dates and are **not** connected by lines or arrows on the chart. The chart does not draw "lifecycle paths" or anything that could suggest a causal narrative.

### 19.5 Scope of which actions appear on which charts

On a given per-DRep chart, the observatory overlays **all governance actions whose any event date falls within the chart's visible 90-day window.** It does not pre-filter by whether the DRep voted on the action.

This is deliberate: pre-filtering ("show only actions this DRep voted on") is itself an editorial choice — it implies actions this DRep ignored are not relevant context. By showing all actions in window, the observatory presents the governance environment the DRep was operating in, regardless of their participation.

If a 90-day window contains too many event markers to read clearly, the observatory may clip to the most recent N actions; the clipping rule is documented in code and reproducible. This is a display constraint, not editorial selection.

### 19.6 What FLOW-2 does NOT do

- **No causal claims.** The observatory does not compute "delegation movement X% correlated with action Y" or similar quantities.
- **No highlighting** of actions near large delegation movements.
- **No ranking** of actions by proximity to flow events.
- **No color signaling** by outcome on the chart axis.
- **No forecasts.** The observatory does not predict that an action will be enacted, ratified, dropped, or expire based on delegation flow.
- **No per-DRep filtering.** All actions in window appear regardless of whether the DRep voted.

### 19.7 Edge cases

- **Action submitted before observatory deployment.** Submission overlay placed at submission date even when that date precedes the chart's first snapshot. The marker sits on the date axis with no chart context to its left; this is honest, not hidden.
- **Multiple events on the same date for the same action.** Drawn as separate markers with small horizontal offset for legibility. Tooltip lists all events at that date.
- **Action with `block_time` precision but all state-transition epochs null** (still active). Only the submission marker is drawn.
- **Epoch boundary fell on a day with no successful daily ETL run.** Boundary date derived from Koios `/epoch_info` directly. The epoch boundary itself is precisely known regardless of whether the observatory captured a snapshot that day.
- **Action in the chart window but the DRep was not yet in the top-30 at the time.** The marker still appears; the DRep's voting weight series may be null for early dates in the window.
- **DRep's chart window has fewer than 90 days of snapshots** (early days post-deploy). Overlay window matches the actual available snapshot range, not a synthetic 90 days.

### 19.8 Reproducibility commitment

Every overlay marker is derivable from:

- `governance_actions.action_id` and the epoch fields (`expires_epoch`, `ratified_epoch`, `enacted_epoch`, `dropped_epoch`)
- Koios `proposal_list.block_time` for submissions
- The `epoch_info` mapping (epoch → start date)

All three are published in CC0 form (the first two are already in `actions.json`; FLOW-2 adds the epoch_info export at `/data/snapshots/epoch_info.json`).

## 20. Governance history layer (FLOW-3)

This section defines how the observatory retains, organizes, and presents historical governance data. The boundary is sharp: the observatory records *what happened* (actions, votes, dates, state transitions) without claiming what was important, significant, successful, or popular.

### 20.1 Scope of the history layer

The history layer encompasses:

- Every governance action observed on chain, indexed by canonical `action_id` (bech32 `gov_action1...`).
- Every DRep vote on every action (yes / no / abstain), with chronologically-latest semantics from §6.
- Every state transition observed: submission, ratification, enactment, expiration, drop.
- Every epoch boundary referenced by an action.

Actions and votes occurring after deployment are captured by the daily ETL within ~24 hours and by the live ETL within ~10 minutes. Actions submitted before deployment are captured when Koios still serves them via `/proposal_list`, which it does for the full Conway era.

### 20.2 The action record

An action record is a stable representation of a single governance action, keyed on `action_id`. It contains:

- `action_id` — canonical bech32 identifier; never changes.
- `action_type` — Koios `proposal_type` value; display-only.
- `title` — display name from on-chain metadata, if present and valid; may change if a DRep updates their metadata.
- `submission_block_time` — UTC unix timestamp of the proposal transaction; immutable.
- `submitted_epoch` — derived from `block_time` (or null in older records).
- `expires_epoch`, `expired_epoch`, `ratified_epoch`, `enacted_epoch`, `dropped_epoch` — state-transition epochs; each immutable once set.
- `outcome` — deterministically derived from the above per §6 (`enacted` / `ratified` / `dropped` / `expired` / `active`).
- Vote rows from the `votes` table joined on `action_id`.

### 20.3 Action timeline

For each action, the timeline is the chronologically-ordered sequence of observable events:

1. **Submission** (date from `submission_block_time`)
2. **Voting period** (between submission and a terminal state)
3. **Terminal state** (ratification, enactment, expiration, or drop — exactly one per action once finalized)

Active actions have no terminal state until one is observed.

The timeline shows protocol-observed facts. It does not annotate events with "importance," mark outcomes as "successful" or "failed," or rank actions by anything except their canonical date order.

### 20.4 Retention

Once captured, the following are **permanent**:

- `action_id`
- `submission_block_time`
- Each state-transition epoch (once set; epochs are immutable on chain)
- Vote rows, except for the revote replacement rule documented in §6

The following are **mutable** across ETL runs (re-derived each daily run):

- `title` (off-chain metadata can change if a DRep updates their URL)
- `outcome` derivation (can change only if a new state transition is observed for a previously-active action — by definition this is forward progress, never rewriting)

No previously-captured row is ever deleted or replaced by a less-complete row.

### 20.5 Canonical sources

- Action identity: `action_id` from Koios `/proposal_list`.
- State transitions: epoch fields from `/proposal_list`.
- Submission timestamp: `block_time` from `/proposal_list`.
- Vote facts: `/vote_list` filtered to `voter_role='DRep'`.
- Epoch start dates: `/epoch_info`.

Anyone running an independent observatory against these endpoints would produce identical action records (modulo metadata re-fetch timing differences for `title`).

### 20.6 Representation

Each action is published in two places:

1. **Aggregate:** `actions.json` — list of all actions with vote tallies (added in v0.2).
2. **Per-action:** `/data/snapshots/actions/{action_id}.json` — full record with timeline, joined vote list, and DRep names where available (added in FLOW-3).

The action detail page at `/action.html?id=gov_action1...` reads the per-action file.

### 20.7 What is not inferred

The history layer surfaces only protocol-observed facts. It does not generate:

- "Importance," "significance," "major," or "watched" classifications.
- "Successful" / "failed" / "rejected" framings — only protocol terms (`enacted` / `ratified` / `dropped` / `expired` / `active`).
- "Support" or "opposition" labels on DRep votes — only `yes` / `no` / `abstain`.
- Participation-rate framings as "high" or "low."
- Outcome leaderboards or rank-by-anything.
- Retrospective scoring of actions or DReps.
- Causal links between an action and any other action's outcome.
- "Trending" or "popular" derivation.

**Actions are presented in historical order. The observatory does not distinguish between "major" and "minor" governance actions.** Vote tallies and submission dates determine order; nothing else.

The canonical action identity is `action_id`. Titles and types are display conveniences derived from on-chain metadata and protocol fields; they do not change the identity of an action. **Action detail pages display the canonical `action_id` prominently near the top of the page — never as an afterthought — so the underlying identity is always visible regardless of any title-rendering choice.**

### 20.8 Revisions and reconciliation

State-transition epochs are immutable on chain, so reclassifying outcomes is not expected. If Koios were to revise a previously-reported state transition (extremely unusual), the new value would be persisted; the v0.5 schema does not log the prior value. A future schema migration would add an action history log if community demand emerges.

Metadata-derived fields (`title`) can change between ETL runs if a DRep updates their metadata. The current value is shown; prior titles are not retained in v0.5.

Vote rows can be replaced per the revote rule (§6). The current displayed vote is the chronologically latest one; superseded votes are not retained.

### 20.9 What FLOW-3 does NOT do

- Does NOT publish "top N actions" or "most-engaged actions" rankings.
- Does NOT compute action similarity, sentiment, or alignment.
- Does NOT predict outcomes.
- Does NOT highlight actions for which delegation moved.
- Does NOT cluster actions by topic, era, or any derived category.
- Does NOT generate any commentary on action content.
- Does NOT compare DRep voting patterns across actions.

These are deferred indefinitely; they are listed here so the boundary is explicit.

### 20.10 Edge cases

- **Action with no metadata title:** displayed as the truncated `action_id` with `action_type`. No fallback name is fabricated.
- **Action with title that fails validation:** same — no display name; only `action_id` and `action_type`.
- **Active action with no state-transition events:** timeline shows submission only; terminal state displays as `active`.
- **Action referenced by votes but missing from `governance_actions`:** vote rows are preserved but no detail page renders. Each daily ETL re-fetches `proposal_list` to minimize this case.
- **Vote from a DRep not in our `dreps` table (i.e., outside top-60 candidates):** vote appears in the action's vote list; DRep is shown by truncated `drep_id` only. The observatory does not fabricate names.

### 20.11 Reproducibility commitment

Every action detail page is derivable from `actions.json` plus the `votes` records (which themselves re-derive from Koios `/vote_list`). For DRep names of voters outside the top-30, the page shows the truncated `drep_id` only (per §10 disclosure — the operator has no special data access; this constraint applies equally to anyone running an independent observatory).

## 21. Historical snapshot browser (FLOW-4)

This section defines how the observatory exposes its accumulated daily snapshots as a navigable historical record. The boundary is sharp: the browser surfaces *the state that existed* at a given date or epoch; it does not interpret, narrate, or contextualize that state.

### 21.1 What a historical state is

A historical state, for the purposes of this section, is the **published snapshot record** for a specific UTC date. It consists of:

- The set of `snapshots` rows with `snapshot_date = D`
- The `dreps` rows referenced by those snapshots, **as their metadata was resolved on that date**
- The `governance_actions` and `votes` records as they stood when that snapshot was written
- The `epoch_info` mapping known at that date

Historical state is reconstructable from the daily snapshot files alone. The browser does not invent or interpolate fields that were absent at the time. If a field is null in the historical record, it is shown as null.

### 21.2 What a snapshot is

A snapshot is the **canonical published output** of a single daily ETL run, as the daily layer (§4 / §5) defines it. For date `D`:

- `top30.json` published on `D` is the canonical top-30 ranking for that date.
- `actions.json` published on `D` is the canonical action list for that date.
- `dreps/{drep_id}.json` published on `D` is the canonical per-DRep record for that date for each top-30 DRep.
- `actions/{action_id}.json` published on `D` is the canonical per-action record for that date.
- `epoch_info.json` published on `D` is the canonical epoch boundary table at that date.

Snapshots are **immutable once published**. The same snapshot retrieved on a different day must yield identical content. To preserve this guarantee, the publication pipeline writes snapshots to a date-named path and never modifies a path after its date has passed.

### 21.3 Snapshot persistence and addressing

Beginning at FLOW-4, the daily ETL writes its outputs in two parallel locations:

- **Current:** `/data/snapshots/{top30, actions, meta, epoch_info}.json` and `dreps/*`, `actions/*` — the latest values, overwritten each run (current behavior).
- **Dated archive:** `/data/snapshots/by-date/{YYYY-MM-DD}/{top30, actions, meta, epoch_info}.json` and the per-DRep / per-action subfolders — the immutable record for that date.

URLs:

- `/?date=YYYY-MM-DD` — homepage showing top-30 as of that snapshot date.
- `/drep.html?id=...&date=YYYY-MM-DD` — per-DRep view as of that snapshot date.
- `/action.html?id=...&date=YYYY-MM-DD` — per-action view as of that snapshot date.
- `/actions.html?date=YYYY-MM-DD` — governance actions index as of that date.

Without the `date` query parameter, the URL serves the current snapshot, unchanged from current behavior.

### 21.4 Missing periods

If a daily ETL run failed, no archive entry exists for that date. The browser does **not interpolate** between adjacent successful runs. A request for a missing date returns an explicit gap notice: *"No snapshot was published for {date}. See {nearest prior date} for the most recent prior state."*

The list of missing dates is published at `/data/snapshots/by-date/index.json` alongside the list of available dates. This index is itself a published artifact: anyone can verify which snapshots exist without crawling.

### 21.5 Historical ranking derivation

The top-30 ranking for date `D` is **the ranking that was published on date `D`**. It is not retroactively recomputed from current data, and it is not adjusted for DReps who deregistered later.

If a DRep was in the top-30 on a past date and has since been deregistered, the historical view shows them in the historical ranking. The historical view does not annotate this with "this DRep has since deregistered" — that annotation would be editorial inference about the historical state. The current view shows the current state, which is the appropriate place to learn that.

**Historical rankings are preserved exactly as published on the snapshot date, even if later governance developments would change how a reader interprets them.** The observatory's role is to retain what was; readers reason about what it meant.

Cross-references between historical and current views (e.g., clicking a historical DRep entry) navigate to the **current** detail page by default. A separate query parameter (`?date=...`) is required to navigate to the historical detail. This prevents accidental confusion between "as-of" views.

### 21.6 What the browser refuses to infer

The historical browser surfaces only the published artifacts. It does not generate:

- Trends between historical states ("DRep X grew Y% from date A to date B").
- Comparison framings ("more delegators than before," "fewer active actions than typical").
- Significance annotations on past events ("the era when X happened").
- Synthetic "state at epoch X" for epochs the observatory did not snapshot.
- Backfill of fields that were null at the time.
- Retrospective re-ranking using current data.
- "Notable moments" or "key dates" curation.

Trends, comparisons, and aggregate metrics across snapshots are a separate methodology subject (FLOW-8 concentration analytics, FLOW-10 cross-layer observability) with their own sections. They do not appear in the historical browser.

### 21.7 What is immutable

Once a date has passed and its snapshot was successfully published:

- The `top30.json` content for that date is immutable.
- The `dreps/*.json` contents for that date are immutable.
- The `actions/*.json` contents for that date are immutable.
- The `meta.json` for that date is immutable (including the `methodology_version` and `schema_version` stamps).

Immutability is **enforced by file path**: a snapshot lives at `by-date/{date}/`, and once written, the ETL never overwrites a past date's path. Operational mistakes that violate this rule are reported in §11 changelog with the affected dates and corrective action.

If methodology changes after a snapshot was published, the snapshot retains its original `methodology_version` stamp. A reader inspecting a historical snapshot can verify the methodology version that produced it and consult that version of `METHODOLOGY.md` from the repository's git history.

### 21.8 Historical navigation

The browser offers two navigation primitives:

1. **Date jump** — a simple chronological list of all dates with published snapshots, latest first, paginated. Missing dates are visibly absent from the list (a calendar widget is deliberately not used because it implies continuous coverage; the snapshot record is discrete and may have gaps).
2. **Adjacent navigation** — previous/next snapshot date relative to the currently viewed date. Skips missing dates explicitly with a brief note.

No "history feed," no "what changed since last snapshot" narrative, no aggregated highlights. Just navigation between published artifacts.

### 21.9 Snapshot provenance

Every historical view displays a small provenance strip:

- **Snapshot date**
- **Snapshot archive path** — the canonical filesystem path under `/data/snapshots/by-date/{YYYY-MM-DD}/` for that snapshot, displayed in monospace as a stable, citable reference. This is the identifier a researcher would cite when referring to this exact published artifact.
- **ETL run completion timestamp** (from that date's `meta.json`)
- **Methodology version** active when the snapshot was published
- **Schema version** active when the snapshot was published
- **Link to the canonical archive path** of that snapshot (direct JSON download)
- **Link to the methodology version's git tag** (when methodology becomes git-tagged in a future revision)

The provenance strip is visible on every page rendered with a `date` query parameter. It does not appear when viewing the current state — current views already display layer/freshness in the existing meta strip.

### 21.10 Scope of historical coverage

The browser exposes only snapshots **published by this observatory**. It does not back-fill snapshots for dates before deployment, even if the underlying chain data would support reconstruction. Pre-deployment state is outside the observatory's evidentiary scope: §15's "the observatory does not claim knowledge of pre-launch state" rule applies to FLOW-4 just as it applies to flow values.

If a community contributor publishes an independent observatory that begins observation earlier, that record stands on its own methodology; this observatory does not import or merge it.

### 21.11 What FLOW-4 does NOT do

- Does NOT generate "evolution charts" of DReps over time except via the existing per-DRep 90-day chart, which is a current view, not a historical browser.
- Does NOT compute "DRep X's rank on every past date" as a derived series — that's an aggregate-over-snapshots view, FLOW-8 territory.
- Does NOT label past dates as "milestones" or "key events."
- Does NOT compare historical snapshots side-by-side beyond rendering them on separate pages.
- Does NOT publish "the most active date" or any ranking-of-dates.

### 21.12 Reproducibility

Every historical snapshot served by the browser is identical to the file published at `by-date/{date}/...` and is reproducible by any third party who archived the original snapshots when they were current. The browser does not transform the served artifacts beyond what the user-agent receives; the JSON returned for a historical date matches the file in the dated archive byte-for-byte (subject only to nginx compression negotiation).

### 21.13 Archive integrity hashing

Each dated snapshot archive includes a `sha256.json` file listing the SHA-256 hash of every other file in that archive. Written last, after all other archive files are in place.

**Path:** `/data/snapshots/by-date/{YYYY-MM-DD}/sha256.json`

**Shape:**

```json
{
  "schema_version": 1,
  "methodology_version": "0.7",
  "snapshot_date": "2026-05-30",
  "algorithm": "sha256",
  "files": {
    "top30.json": "a1b2c3…",
    "actions.json": "d4e5f6…",
    "meta.json": "…",
    "epoch_info.json": "…",
    "top30.csv": "…",
    "dreps/drep1…json": "…",
    "actions/gov_action1…json": "…"
  }
}
```

The hashed files include every file in the dated archive **except** `sha256.json` itself (self-reference paradox). The hash digest covers raw file bytes as written, before any HTTP-layer compression negotiation.

**Verification protocol.** Any third party who has downloaded a dated archive can:

1. Compute SHA-256 of each file in the archive (excluding `sha256.json`).
2. Compare against the corresponding entry in `sha256.json`.
3. A mismatch is evidence that one of the files has been modified after the date's snapshot was sealed.

If the operator (this observatory) ever modified a past-date archive in violation of §21.7's immutability rule, the `sha256.json` for that date would also need to be regenerated, which would itself be an audit trail in the git history of the deployment.

Hashes are not cryptographically signed in v0.7. Signing the hash file with the operator's key (binding the operator's identity to the published archive) is a v0.8+ candidate; the public-key infrastructure to support it is not currently in scope.

### 21.14 snapshot_date is the sole authority for archive placement

All artifacts belonging to a `snapshot_date` are written beneath `by-date/{snapshot_date}/`. ETL wall-clock execution time has no bearing on archive placement. Specifically:

- The `snapshot_date` value used by any given ETL run is determined once at the start of the run (default: today's UTC date; override: `--snapshot-date YYYY-MM-DD` for backfill, archive repair, or reproducibility testing).
- Every archive-writing export receives that `snapshot_date` as an explicit parameter and writes only to `by-date/{snapshot_date}/...`.
- No export function may recompute the date internally from wall-clock UTC. A run that begins at 23:59 UTC and finishes at 00:01 UTC the next day produces a single, complete archive under the date chosen at start, not a split.
- A backfill run with `--snapshot-date 2026-05-15` writes every artifact to `by-date/2026-05-15/`, regardless of when the run executes.

This invariant exists because the alternative (each export computing its own "today") silently splits a single logical snapshot across two date directories whenever a UTC boundary crosses or a past date is replayed, producing dated archives that are neither complete nor reproducible.

## 12. v0.1 scope limitations

The site is deliberately narrow at v0.1. The following are out of scope for this version and disclosed here transparently rather than masked with synthetic or interpolated values:

- **Delegator counts** are fetched only for the top 60 candidates per daily run (to support top-30 ranking with headroom), not all active DReps. The remaining active DReps are visible via the underlying Koios API for anyone who needs them.
- **Historical backfill is not yet implemented.** The Δ7d and Δ30d fields will appear as null until daily snapshots have accumulated for 7 and 30 days respectively from first deployment. The 90-day chart will populate forward from launch.
- **Vote outcomes are not editorialized.** The `votes` table stores facts only — `(action_id, drep_id, vote ∈ {yes, no, abstain}, vote_epoch)`. No alignment scoring, no "voted with consensus" / "voted against consensus" framing, no per-vote interpretation. Governance action outcomes (`enacted`, `ratified`, `dropped`, `expired`, `active`) are derived deterministically from Koios fields and likewise carry no value judgment.
- **Per-DRep vote history page** is not yet rendered in the frontend; the data is stored and queryable but no UI exists. Frontend work begins in Phase 2.

These limitations resolve over time as v0.2 work lands. They are not concealed and are not approximated.

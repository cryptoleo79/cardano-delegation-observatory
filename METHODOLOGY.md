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
| 2026-06-02 | v0.9 (Phase 4 deliverable, no methodology change) | FLOW-6 Phase 4 design specification shipped as `docs/CATALYST_ARCHIVE_REPOSITORY_DESIGN.md` (775 lines). Ten deliverables specified: repository structure, README content, LICENSE+NOTICE multi-layer model, INDEX.json schemas (top-level and per-subfolder), chain-of-custody layout, custody-v1 JSON Schema for `.custody.json` manifests, hash conventions, directory hierarchy conventions, update policy, observatory boundary contract. The Phase 4 design closes two open questions explicitly: the IdeaScale REST API token path and the catalyst-core decryption-key request path are both **not pursued under FLOW-6** because they require private-access arrangements that violate the archive's commitment to be reproducible by ordinary researchers. The Wayback Machine becomes the canonical IdeaScale source. Encrypted F2–F9 catalyst-core bytes are preserved verbatim; interior content remains gated on key availability without active pursuit. `docs/CATALYST_CAPTURE_PLAN.md §3.5` and §11 updated in the same commit to reflect this resolution. No methodology version bump — Phase 4 is operational design downstream of §24. No archive repository created; no capture performed. |
| 2026-06-02 | v0.9 (Phase 3 corrections to §24, no version bump) | Two factual corrections to §24 from the Phase 3 capture-plan research: (1) Repository relocation — `input-output-hk/catalyst-core` was relocated to `cardano-foundation/catalyst-core` prior to FLOW-6 capture; §24.3 Class B description updated to reflect the canonical URL and note the historical alias. (2) Encrypted SQLite for F2–F9 — the `cardano-foundation/catalyst-core` historic-data directories for F2–F9 contain `fundN_database_encrypted.sqlite3` sealed databases rather than plain SQL; no decryption key has been published; FLOW-6 preserves the bytes verbatim but the interior content is gated on key availability. §24.3 Class B description updated. (3) IdeaScale SPA reality — `cardano.ideascale.com` today returns an 852-byte empty React shell for every URL regardless of validity; effective IdeaScale preservation routes through the Wayback Machine (which holds 238 server-rendered snapshots from before the SPA conversion). §24.9 Band 1 trigger expanded to note this; the operational detail is in `docs/CATALYST_CAPTURE_PLAN.md §3.2`. No version bump — these are factual corrections that align §24 with the actual shape of the source ecosystem; methodology commitments are unchanged. Phase 3 capture plan (`docs/CATALYST_CAPTURE_PLAN.md`) and the registry (`docs/CATALYST_SOURCE_REGISTRY.md`) updated in the same commit. |
| 2026-06-02 | v0.9 (methodology only — Phase 1 of FLOW-6, no implementation) | FLOW-6 methodology §24 added: defines the Catalyst preservation methodology. §24.1 scope (proposal text, voting tallies, milestone records, on-chain payouts, fund metadata; explicit non-scope items including private drafts, deanonymization, editorial commentary). §24.2 preservation ≠ endorsement — the load-bearing framing, applied symmetrically to funded/unfunded, delivered/undelivered, prominent/non-prominent recipients. §24.3 source authority hierarchy (Class A on-chain, B official Catalyst, C platform-hosted at-risk, D community, E researcher capture). §24.4 chain-of-custody requirements: sidecar `.custody.json` manifest with `source_url`, `capture_date`, `capture_method`, `capture_operator`, `sha256`, `content_type`, `http_status`, `source_authority_class`, `notes`; bulk-capture wrapper emits `CAPTURE_LOG.json`. §24.5 provenance retention via Wayback Machine submission (belt-and-suspenders). §24.6 verifiability chain (file integrity, provenance, authority, capture transparency). §24.7 separate-repository rule (the Catalyst archive is NOT in this observatory repo; footprint, lifecycle, license, and trust-boundary reasons). §24.8 explicit non-goals: no NLP/sentiment/topic modeling, no rankings, no milestone scoring, no off-chain identity linkage, no editorial trigger conditions, no proposer deduplication across funds. §24.9 lifecycle and trigger conditions (Bands 1–4 by source authority and sunset risk; re-captures produce dated artifacts, never overwrite — mirrors §21.7). §24.10 versioning: schema_version stays 2 (no observatory tables added); methodology_version bumps 0.8 → 0.9. §24.11 relationship to existing methodology (§2/§10/§13/§20/§21/§22). §24.12 enumerates the remaining FLOW-6 phases (Phase 2 fund-by-fund source registry, Phase 3 IdeaScale capture strategy, Phase 4 preservation repository design, Phase 5 capture itself — gated on Phases 2-4 approval). No scraping, no `wget --mirror`, no `git clone --mirror` before Phases 2-4 are in place and approved. The gate is non-negotiable. |
| 2026-05-31 | v0.8 (methodology only — code follows after approval) | FLOW-5 methodology §22 added: defines treasury observability. Records the on-chain treasury balance at each epoch boundary (per Koios `/totals`) and the governance-action-driven withdrawals from that treasury (per `/proposal_list` filtered to `TreasuryWithdrawals`), joined to the governance actions and DRep votes the observatory already captures under §6 and §20. **Important source-model correction:** Koios `/treasury_withdrawals`, despite the name, returns stake-credential reward withdrawals with no governance linkage (no `action_id`, no `proposal_id`, no governance fields of any kind — verified by direct probe on 2026-05-30). FLOW-5 explicitly excludes it and uses `/proposal_list?proposal_type=eq.TreasuryWithdrawals` as the canonical source. Two schema additions: `treasury_snapshot` (per-epoch tokenomics) and `treasury_withdrawals` (normalized per-recipient withdrawal rows keyed by `action_id`). §22.5 defines the observed-vs-governance-attributed reconciliation rule and explicitly disclaims interpretation of the residual (deposit refunds, protocol-level transfers, pre-Conway MIR movements are legitimate non-governance reasons treasury changes). No code, no schema changes, no frontend yet — methodology-only commit per discipline. schema_version → 2, methodology_version → 0.8 when FLOW-5 code lands. |
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

## 22. Treasury observability (FLOW-5)

FLOW-5 extends the observatory to the Cardano treasury. It records the on-chain treasury balance at every epoch boundary and the governance-action-driven withdrawals from that treasury, joined to the governance actions and DRep votes the observatory already captures. It does not score, rank, judge, or recommend any recipient or any withdrawal.

### 22.1 Scope

A treasury flow, for the purposes of this section, is the movement of lovelace out of the Cardano on-chain treasury account that is enacted by a governance action of type `TreasuryWithdrawals` under CIP-1694. The observatory records:

- The treasury balance at each epoch boundary (per Koios `/totals`), back to the earliest epoch the endpoint exposes.
- Every governance action of type `TreasuryWithdrawals` recorded on chain — the same record already indexed under §20, with its withdrawal-recipient details normalized.
- The relationship between an enacted withdrawal and the observed treasury balance change at the epoch in which it took effect.

What this section does not include:

- Reserves balance and reserves withdrawals. The reserves account is a distinct on-chain entity; pre-Conway reserve movement was MIR-certificate-driven. Reserves are reported by `/totals` and may be added to a later FLOW-5 expansion; v0.8 scope is treasury only.
- Stake-credential reward withdrawals returned by Koios `/treasury_withdrawals`. That endpoint, despite its name, returns ITN-era and stake-reward withdrawal events with no governance linkage (no `action_id`, no `proposal_id`, no `gov_action_*` field of any kind). FLOW-5 explicitly excludes it from the governance-driven treasury layer. The naming collision is acknowledged here so future readers can distinguish the two.

### 22.2 Canonical source model

The corrected source model, validated by direct probe against the Koios mainnet API on 2026-05-30:

| Datum | Endpoint | Filter | Cadence |
|---|---|---|---|
| Treasury balance, reserves, supply, fees, deposits per epoch | `/totals` | none — returns full epoch series | once per ETL run; idempotent upsert by `epoch_no` |
| Treasury withdrawal actions (governance-driven) | `/proposal_list` | `proposal_type=eq.TreasuryWithdrawals` | once per ETL run |
| Recipient addresses and lovelace amounts per action | inline `withdrawal` array within the same `/proposal_list` response | n/a — already attached to the proposal row | once per ETL run |
| DRep votes on each treasury action | `/vote_list` filtered to action_id | already in §6 scope | already in §6 cadence |

There is exactly one source of truth for governance-driven treasury withdrawals: the `withdrawal` array attached to a `proposal_type = TreasuryWithdrawals` row in `/proposal_list`. No other endpoint or join produces this information.

### 22.3 Schema additions

Two tables are added. Both are forward-only migrations under §13's general rule (existing schema unchanged, columns added via `ALTER TABLE ADD COLUMN`; new tables created idempotently via `CREATE TABLE IF NOT EXISTS`).

**`treasury_snapshot`** — one row per Cardano epoch:

| Column | Type | Notes |
|---|---|---|
| `epoch_no` | INTEGER PRIMARY KEY | Cardano epoch number, joinable to `epoch_info` |
| `circulation_lovelace` | INTEGER | from `/totals.circulation` |
| `treasury_lovelace` | INTEGER | from `/totals.treasury` |
| `reward_lovelace` | INTEGER | from `/totals.reward` |
| `supply_lovelace` | INTEGER | from `/totals.supply` |
| `reserves_lovelace` | INTEGER | from `/totals.reserves` |
| `fees_lovelace` | INTEGER | from `/totals.fees` |
| `deposits_stake` | INTEGER | from `/totals.deposits_stake` |
| `deposits_drep` | INTEGER | from `/totals.deposits_drep` |
| `deposits_proposal` | INTEGER | from `/totals.deposits_proposal` |
| `treasury_donation` | INTEGER NULL | from `/totals.treasury_donation` |
| `treasury_withdrawal_epoch_total` | INTEGER NULL | from `/totals.treasury_withdrawal`; net treasury withdrawals enacted in that epoch as published by the endpoint |
| `reserves_withdrawal_epoch_total` | INTEGER NULL | from `/totals.reserves_withdrawal` |
| `fetched_at` | TIMESTAMP | UTC ISO 8601, when this row was last upserted |

The `treasury_withdrawal_epoch_total` field is the published epoch-level net withdrawal as reported by Koios. It is **not** the sum of FLOW-5's per-action withdrawal records and is not required to equal that sum (see §22.6 on reconciliation).

**`treasury_withdrawals`** — one row per (action_id, recipient) pair:

| Column | Type | Notes |
|---|---|---|
| `action_id` | TEXT NOT NULL | FK to `governance_actions.action_id` |
| `withdrawal_index` | INTEGER NOT NULL | 0-indexed position in the source `withdrawal` array; preserves stated order |
| `recipient_stake_address` | TEXT NOT NULL | bech32 stake address from `withdrawal[i].stake_address` |
| `amount_lovelace` | INTEGER NOT NULL | from `withdrawal[i].amount` |
| `enacted_epoch` | INTEGER NULL | denormalized from `governance_actions.enacted_epoch` for fast epoch-keyed aggregation; updated when the parent action's enacted_epoch is observed |

Primary key: `(action_id, withdrawal_index)`. Foreign key: `action_id` → `governance_actions(action_id)`. The denormalization of `enacted_epoch` is for query efficiency only; the canonical value lives on `governance_actions`. ETL idempotently re-syncs `enacted_epoch` on every run.

No other tables are added in FLOW-5. The existing `governance_actions` and `votes` tables already carry every treasury action and every DRep vote on it.

### 22.4 What a treasury action record contains

Every record exposed by FLOW-5 inherits the full governance action record from §20 (action_id, action_type, title, submission_block_time, submitted_epoch, state-transition epochs, outcome, vote tally, individual DRep votes). FLOW-5 adds, per action:

- The list of `(recipient_stake_address, amount_lovelace)` tuples — the withdrawal beneficiaries and the lovelace each is to receive if the action is enacted.
- The denormalized `enacted_epoch` for fast filtering by "what was paid out in epoch E".

FLOW-5 does **not** add: recipient name, recipient category, recipient project, recipient evaluation, "justification" field, "impact" estimate, or any prose interpretation of what a withdrawal funds. Recipient addresses are bech32 stake addresses, as recorded on chain, full string.

### 22.5 The reconciliation rule (observed vs governance-attributed)

For any epoch `E` in which one or more treasury actions have `enacted_epoch = E`, two quantities exist:

- `observed_delta(E)` = `treasury_snapshot.treasury_lovelace[E]` − `treasury_snapshot.treasury_lovelace[E−1]`
- `governance_attributed(E)` = sum over all `treasury_withdrawals` rows where `enacted_epoch = E` of `amount_lovelace`, sign-flipped (withdrawals reduce treasury)

The reconciliation residual is `observed_delta(E) − governance_attributed(E)`. This residual is **not** an error term. Treasury balance changes for reasons that are not governance-action-driven, including but not limited to:

- Refunds of unrefunded governance proposal deposits when an action terminates.
- Refunds of DRep registration deposits on deregistration.
- Refunds of stake-credential deposits.
- Block-production reward flows in and out per epoch protocol mechanics.
- Protocol-level adjustments that are not exposed through any `/proposal_list` row.

The observatory publishes both numbers and the residual. It does not interpret the residual as anomalous, suspicious, or fraudulent. A non-zero residual is the expected state of a complex ledger; reporting it transparently is the point.

### 22.6 Pre-Conway treasury

The Cardano treasury account predates Conway (it existed in Shelley, populated via protocol parameters and block production). Treasury movement before epoch 432 (the Conway-era cutover) was driven by Move Instantaneous Reward (MIR) certificates, not by CIP-1694 governance actions. MIR was a protocol mechanism, not a community-governed flow.

FLOW-5 ingests the full `/totals` history available (back to the earliest epoch the endpoint exposes — currently observed to be around epoch 209). For epochs `< 432`, the `treasury_lovelace` field is reported as-is; `treasury_withdrawals` has no rows (no governance actions existed); the reconciliation residual is, by construction, the entire observed delta. Pre-Conway treasury changes are recorded but are not attributed to governance.

### 22.7 What FLOW-5 explicitly does NOT do

- It does not rank or score recipients. Stake addresses are presented in the order the chain recorded them.
- It does not categorize withdrawals by purpose. The chain does not record purpose; assigning one would be editorial.
- It does not derive "net treasury health," "burn rate," "runway months," or any forward projection. Such derivations require assumptions the observatory does not make.
- It does not flag "anomalous" withdrawals. An unusual withdrawal pattern is still on-chain fact; surfacing it as anomaly would be interpretation.
- It does not link withdrawals to off-chain identities (proposal author, funded project, Catalyst fund, organization). Such linkage requires external data sources the observatory does not maintain.
- It does not modify or extend `governance_actions` semantics. The action record stays exactly as §20 defines it.
- It does not retroactively alter past `treasury_snapshot` rows. Per `/totals` semantics, epoch rows are stable once published; if Koios revises a value, the observatory upserts the new value and the change is visible in the git history of the deployed snapshots.

### 22.8 Edge cases

- **Action enacted but withdrawal partially observed.** A `TreasuryWithdrawals` action with `enacted_epoch = E` is expected to apply at the start of epoch `E`. If the published `treasury_snapshot[E].treasury_lovelace` reflects only part of the action's `amount_lovelace`, the observatory reports both numbers and the residual. It does not split, fabricate, or annotate. Interpretation is left to the reader.
- **Action ratified but not yet enacted.** A ratified action with `enacted_epoch = null` does not appear in any epoch's `governance_attributed` sum. Its expected effect is documented on the per-action page as a pending withdrawal; no projection is made about when it will enact.
- **Action with multiple recipients of equal amount.** Each `(action_id, withdrawal_index)` pair is its own row. Order is preserved per the chain's recorded `withdrawal` array; no deduplication on (recipient, amount) is performed (recipients may legitimately appear multiple times in one action).
- **Recipient stake address reuse across actions.** A stake address may receive funds from multiple distinct governance actions. Each is its own `treasury_withdrawals` row; no implicit aggregation is performed at storage. Aggregations are computable at query time; the observatory's published exports stay at the (action, recipient) grain.
- **Koios revises a past `/totals` row.** Treated as a normal upsert. If a revision changes a historical `treasury_lovelace`, the new value is written and `fetched_at` updated. The dated archive at `by-date/{D}/` contains the value as known on date `D`; the live current snapshot reflects the latest known value. Researchers tracking revisions diff successive dated archives.
- **A new `TreasuryWithdrawals` action appears in the Koios response that was not present in the prior ETL run.** Normal idempotent insert; vote rows accrete as DReps cast votes over subsequent epochs.

### 22.9 Cross-link to existing layers

FLOW-5 inherits, not re-implements, every cross-link the observatory already provides:

- The DRep vote tally on each treasury action is the same vote data §6 defines.
- The action timeline (submission → ratification → enactment | expiration | drop) is the same timeline §20.3 defines.
- The per-action JSON export at `/data/snapshots/actions/{action_id}.json` (§13) is extended with the `withdrawal` array and the `enacted_epoch` for that action, when those fields apply.
- The historical archive at `by-date/{YYYY-MM-DD}/` (§21) includes `treasury_snapshot.json` and treasury fields under each affected action's per-action JSON.

The frontend rendering and JSON export structure for treasury actions follows §13 and §20's existing patterns. No new top-level page is required by methodology; whether a standalone treasury index page is added is a separate frontend decision documented under §13 when implemented.

### 22.10 Published exports

FLOW-5 adds the following CC0 published exports:

- `/data/snapshots/treasury_snapshot.json` — the full `treasury_snapshot` table as of the current ETL run, one entry per epoch.
- `/data/snapshots/treasury_withdrawals.json` — the full `treasury_withdrawals` table, one entry per (action_id, withdrawal_index) row. Each entry includes `action_id`, `withdrawal_index`, `recipient_stake_address`, `amount_lovelace`, `enacted_epoch`, and the action's `outcome` (joined for convenience; the canonical outcome remains on `governance_actions`).
- Extension of `/data/snapshots/actions/{action_id}.json` (§20.6): for `action_type = TreasuryWithdrawals`, a `withdrawal` array is added with the recipient list.
- Extension of `/data/snapshots/by-date/{YYYY-MM-DD}/` (§21.3, §21.13): the dated archive includes `treasury_snapshot.json` and `treasury_withdrawals.json`. Both are covered by `sha256.json` per §21.13.

Each export carries `schema_version` and `methodology_version` per §13.

### 22.11 Reproducibility commitment

A third party can reproduce every FLOW-5 number from the same Koios endpoints the observatory uses:

1. `GET /totals` returns the per-epoch series; compare to `treasury_snapshot.json`.
2. `GET /proposal_list?proposal_type=eq.TreasuryWithdrawals` returns the action set; the `withdrawal` array on each row equals the (action_id, withdrawal_index → recipient + amount) rows in `treasury_withdrawals.json`.
3. The dated archive at `by-date/{D}/` is byte-equal to what was served on date `D` (§21.12), and `sha256.json` covers both treasury files (§21.13).

The reconciliation residual (§22.5) is itself computable from the published exports alone, without re-querying Koios. A researcher can audit any past epoch's residual entirely from the dated archive.

### 22.12 Versioning

This section ships with `methodology_version = "0.8"`. The version bump reflects the schema additions in §22.3 and the new exports in §22.10. The schema_version increments to 2 to reflect the table additions. Existing v0.7 consumers continue to receive every field they already had; FLOW-5 fields are additive.

### 22.13 Verification protocol

FLOW-5 inherits the five-layer verification structure used for earlier FLOWs (ETL, Data, Frontend, Semantics, Researcher Reproducibility) but with treasury-specific checks. Verification runs against the snapshot produced by the daily ETL after FLOW-5 code is deployed; each layer is independently passable, and a failure at any layer blocks promotion of that day's archive from "candidate" to "verified."

**Layer 1 — ETL correctness**

- Probe `/totals` returns a non-empty list of per-epoch rows; the latest row's `epoch_no` matches the current chain tip's epoch within one.
- Probe `/proposal_list?proposal_type=eq.TreasuryWithdrawals` returns a list of action rows; every row carries a non-null `withdrawal` array of at least one element.
- Pagination of `/proposal_list` is exhaustive — no result row is dropped because the loop terminated early. The total count returned equals `SELECT COUNT(*) FROM governance_actions WHERE action_type='TreasuryWithdrawals'` after the run.
- Re-running the ETL against the same chain state produces a byte-equal `treasury_snapshot.json` and `treasury_withdrawals.json`. Idempotency is required, not optional.
- Network-level error paths (429, 500, timeout) do not corrupt partial state. The `etl_runs` row records the failure; the next successful run reconciles.
- Schema migration via `CREATE TABLE IF NOT EXISTS` does not destroy any existing row; a deployment that had FLOW-4 tables and gains FLOW-5 tables retains all FLOW-4 data verbatim.

**Layer 2 — Data integrity**

- Row count check: `treasury_snapshot` count is non-decreasing across consecutive successful runs (epochs are append-only; in-place updates of an existing row are allowed when Koios revises a `/totals` value, but rows are never deleted).
- No duplicate `epoch_no` in `treasury_snapshot`. Enforced by primary key.
- No duplicate `(action_id, withdrawal_index)` in `treasury_withdrawals`. Enforced by primary key.
- Every `treasury_withdrawals.action_id` exists in `governance_actions`. Foreign key constraint, validated by query.
- For every action with at least one `treasury_withdrawals` row, the count of those rows equals the length of the `withdrawal` array in the latest `/proposal_list` response for that action.
- `treasury_withdrawals.enacted_epoch` denormalization matches `governance_actions.enacted_epoch` for the same `action_id`. The ETL re-syncs this on every run; a divergence indicates a missed sync.
- `amount_lovelace` values are positive integers. Zero or negative is a parse failure.
- `recipient_stake_address` values match the bech32 prefix expected on mainnet (`stake1`) or testnet (`stake_test1`) depending on deployment.

**Layer 3 — Frontend**

- A page rendering an action with `action_type = TreasuryWithdrawals` displays the recipient list and per-recipient amount. Total displayed matches the sum of amounts in the underlying `treasury_withdrawals.json` for that `action_id`.
- A page rendering any other `action_type` does not display a withdrawal section at all (no empty headers, no "N/A" placeholders that imply a missing value where none should exist).
- Recipient stake addresses are rendered in full or with a clearly-marked truncation toggle. No silent truncation that loses bytes.
- No color, icon, or styling on the withdrawal display implies recipient quality, urgency, or any value judgment. Single neutral color, same as the rest of the action detail page.
- Language toggle (EN/JA) updates every static label introduced by FLOW-5; recipient stake addresses and amount values themselves are language-neutral.

**Layer 4 — Semantics**

- The reconciliation residual (§22.5) is computable from the dated archive alone, with no external API call. A worked example for at least one past epoch with enacted withdrawals is verifiable by hand.
- Pre-Conway epochs (`< 432`) appear in `treasury_snapshot.json` with their actual `treasury_lovelace` values from `/totals`. They have zero corresponding `treasury_withdrawals` rows. The reconciliation residual for those epochs equals the entire observed delta — this is the expected, methodology-correct state.
- `treasury_withdrawal_epoch_total` (published by `/totals`) is stored as-is in `treasury_snapshot`. It is NOT synthesized as a sum of `treasury_withdrawals` rows. The methodology's definition (§22.3) and the data layer's storage are bit-for-bit aligned.
- All exports carry `schema_version` and `methodology_version` per §13. The values at the time of FLOW-5 deployment are `schema_version=2`, `methodology_version="0.8"`.
- §22.7's non-goals are visibly absent from every exported field. There is no `recipient_name`, `recipient_category`, `purpose`, `impact_estimate`, `runway_months`, `is_anomalous`, or any equivalent editorial column anywhere in the schema or exports. Verified by inspection of the exported JSON structure.

**Layer 5 — Researcher reproducibility**

- A third party who downloads `by-date/{D}/treasury_snapshot.json` can fetch `/totals` from Koios and produce the same per-epoch series (modulo epochs added after `D`).
- A third party who downloads `by-date/{D}/treasury_withdrawals.json` can fetch `/proposal_list?proposal_type=eq.TreasuryWithdrawals` from Koios and reconstruct the same `(action_id, withdrawal_index, recipient_stake_address, amount_lovelace)` rows (modulo actions added after `D`).
- `sha256.json` in `by-date/{D}/` covers both `treasury_snapshot.json` and `treasury_withdrawals.json` (per §21.13). Recomputing the SHA-256 of each file yields the value stored in `sha256.json`.
- The reconciliation residual for any past epoch in the archive is computable from the archive alone, without re-querying Koios. A researcher tracking treasury health over time can do so entirely from the published dated archives.
- Re-running the ETL with `--snapshot-date {past-D}` against current Koios data does NOT overwrite `by-date/{past-D}/` files (§21.7 immutability). Backfill of a never-archived date IS allowed; overwrite of a past date is refused.

A FLOW-5 run that fails any check at any layer is flagged in the daily verification log. Failure does not silently degrade — the affected file stays in the archive in its existing state and the next successful run reconciles forward.

### 22.14 Koios field availability addendum

This addendum records a finding from the FLOW-5 verification run on 2026-06-01 and clarifies the reconciliation basis given the actual shape of the data Koios publishes today. No schema or code changes follow from it — only methodology language is adjusted.

**Finding.** Three fields in the Koios `/totals` response — `treasury_withdrawal`, `treasury_donation`, and `reserves_withdrawal` — are present in the response schema but were observed as `null` for every one of the 426 epochs in the chain history at the time of verification (Cardano epochs 209–634, probed 2026-06-01). The fields are documented in the upstream API as per-epoch totals, but Koios does not currently populate them. This was discovered during the §22.13 Layer 4.3 check and confirmed by direct probe of `/totals?epoch_no=eq.{N}` for several epochs (notably 571, 575, 576, 577, 578 — all of which had enacted TreasuryWithdrawals governance actions on chain) and by a full-corpus scan that found zero non-null values across all three fields.

**Implication for §22.5 reconciliation.** The reconciliation rule in §22.5 is unchanged in spirit but its reference series is restated explicitly here to avoid ambiguity: the **observed treasury movement** for an epoch `N` is

`observed_Δ(N) = treasury_lovelace(N) − treasury_lovelace(N−1)`

computed from successive rows of `treasury_snapshot`. It is **not** derived from `treasury_withdrawal_epoch_total`, which is currently always `null` from Koios. The governance-attributed sum for the same epoch is

`governance_attributed(N) = SUM(treasury_withdrawals.amount_lovelace WHERE enacted_epoch = N)`

The reconciliation residual is `observed_Δ(N) − governance_attributed(N)`, adjusted for the protocol inflow side of the epoch (fees paid into treasury, reserves-to-treasury transfers driven by the monetary expansion mechanism, deposit refunds from declined proposals). Per §22.5 the residual is not interpreted as error.

**Implication for §22.13 Layer 4.3.** The check as originally written verifies that the always-null Koios field is stored as-is. That check still passes by being trivially true (null in, null out) but offers little assurance. The substantive check is: the governance-attributed sum for an epoch is computable from `treasury_withdrawals` alone, and the observed Δ for that epoch is computable from successive `treasury_snapshot` rows alone. Both are now part of the verification corpus and were confirmed on 2026-06-01 (epoch 571: governance-attributed 1,500,000,000,000 lovelace = 1.5M ADA across 5 recipient rows; observed Δ derivable from `treasury_lovelace(571) − treasury_lovelace(570)`).

**Why the three fields remain in the schema.** The defensive capture is intentional. If Koios begins populating any of these fields in a future release, the next daily ETL run captures them automatically with no code change, no schema migration, and no risk of silent omission. Removing the columns now would require a schema change *plus* a re-deployment if Koios ever started publishing them. Storing a always-null column has trivial cost (an `INTEGER NULL` adds one byte per row of overhead in SQLite); discarding the option to capture future values would be a real loss. Honest reporting of current Koios behavior in the methodology is sufficient — the schema does not need to mirror Koios's current sparsity.

**Verification date for this addendum.** 2026-06-01. The finding will be re-verified by inspection on each future methodology version bump; if Koios begins populating these fields, this addendum will be revised in place rather than removed (the historical observation that the fields *were* null through 2026-06-01 is itself a fact about the chain explorer ecosystem and worth preserving).

`methodology_version` remains `0.8`. This addendum is a clarification of the existing §22.5 and §22.13 language, not a new methodological commitment, so no version bump is warranted. `schema_version` remains `2`.

## 24. Catalyst preservation methodology (FLOW-6)

FLOW-6 extends the observatory's "preserve governance memory" posture to the Cardano Catalyst funding program. It commits the project to the preservation, provenance, and chain-of-custody of Catalyst's historical record before that record disappears with the sunset of `cardano.ideascale.com`. It does not analyze, rank, score, or interpret what is preserved. It is an archival commitment, not an analytical one.

This section defines the principles, requirements, and boundaries of the preservation effort. Operational specifics — the fund-by-fund source registry, the IdeaScale capture strategy, and the preservation repository design — are documented in companion planning artifacts (`docs/IDEASCALE_PRESERVATION.md` today; further fund-registry and capture-strategy artifacts in subsequent phases). The methodology in this section governs all of them. If a planning artifact specifies a behavior that contradicts §24, this section is the authoritative description and the planning artifact must be revised.

### 24.1 Scope

FLOW-6 preserves the following classes of Catalyst record, in priority order:

- **Proposal text and content.** The full submitted text of every Catalyst proposal as it appeared in the Catalyst voting record, including the proposal title, the problem statement, the solution description, the requested funding amount, and the proposer-supplied metadata (links, team members, milestones as proposed).
- **Voting tallies.** The on-chain or platform-reported vote counts for each proposal, by fund and round. Includes yes / no / abstain (or the equivalent for the relevant fund's voting model), and the funded / not-funded outcome.
- **Milestone records.** The status of each funded proposal's delivery milestones as recorded by `milestones.projectcatalyst.io` or any successor tool: planned milestones, claimed completions, signoff status, and any milestone-level revisions.
- **Catalyst payout transactions.** On-chain ADA transfers from the Catalyst-fund-controlled accounts to recipient stake addresses. These are independently reconstructible from the Cardano blockchain via Koios; preservation of the on-chain transaction record is therefore lower priority than the off-chain content above, but the linkage between an on-chain payout and the off-chain proposal it funded is in scope.
- **Fund-level metadata.** Per-fund landing page content, vote-result CSVs and PDFs, fund-level timeline information, and any IO- or Catalyst-Voices-published canonical record about how the fund operated.

The preservation covers Funds 1 through the latest closed fund at the time of capture, including funds whose IdeaScale entries are already partially orphaned and including funds for which the on-chain record is the only intact source.

What §24 does **not** preserve:

- **Catalyst Voices governance content** (the successor platform). Once Catalyst Voices is the canonical surface, FLOW-6 may extend to it, but that is an extension that requires its own scope clarification at that time.
- **Private proposal drafts** or workspace content not published in a fund's voting record.
- **Personal information about proposers or voters** beyond what appears in the public Catalyst record (stake address, proposer-supplied team listing, public ideascale username, etc.). The observatory does not deanonymize or attempt off-chain identity linkage; §24's preservation surface inherits the §10 / §7 / §18.8 non-goals of the observatory at large.
- **Editorial commentary about Catalyst funds**, whether community-authored or operator-authored.

### 24.2 Preservation is not endorsement

This is the load-bearing framing of FLOW-6, and it inherits from the planning artifact at `docs/IDEASCALE_PRESERVATION.md`:

> The purpose of this preservation effort is **historical continuity, reproducibility, and governance memory.** It is **not** validation, promotion, or endorsement of any proposal, recipient, fund, or methodology.

The archive surfaces every captured record without ranking, framing, commentary, classification, or value judgment. This applies symmetrically to:

- Successfully funded proposals **and** unfunded proposals.
- Proposals that delivered their milestones **and** those that did not.
- Recipients who later became prominent ecosystem participants **and** those who did not.
- Funds the community considers successes **and** those it considers failures.
- Proposals that align with the operator's views **and** proposals that do not.

The archive does not score recipients, does not flag "failed" milestones as failures, does not categorize proposals by quality, and does not connect proposals to off-chain identity. Capturing a record is the act of recording. Reasoning about what a record *means* is the reader's job, not the archive's.

This rule is identical in spirit to §20.7 ("no major/minor distinction"), §22.7 ("no recipient evaluation"), and §18.8 ("flow data does not mean approval"). FLOW-6 extends the same posture to a new corpus.

### 24.3 Source authority hierarchy

For every captured artifact, the archive identifies the source's authority class. The classes are ordered by preference; when more than one source is available for the same datum, the higher-authority source is the canonical reference and the lower-authority sources are preserved as corroboration.

- **Class A — On-chain.** The Cardano blockchain itself, accessed via Koios or an equivalent open API. This is the only class of source for which the observatory does not require an independent capture: the chain is already preserved by the protocol, and any reproducer can re-query Koios to verify. The archive records the canonical query (endpoint + parameters + a snapshot date) rather than the response bytes.
- **Class B — Official Catalyst-issued.** Published artifacts from `projectcatalyst.io`, Catalyst-issued GitHub repositories (notably `cardano-foundation/catalyst-core`, relocated from its original location at `input-output-hk/catalyst-core`), and any successor official Catalyst publication channel. These are the highest-authority off-chain sources. The archive captures the bytes plus full chain-of-custody manifest per §24.4. Note that catalyst-core's per-fund data for F2–F9 is stored as encrypted SQLite databases whose decryption key is not currently published; the bytes are preserved verbatim under FLOW-6 but the interior content of those databases is not extractable without the key.
- **Class C — Catalyst-platform-hosted.** Content hosted on `cardano.ideascale.com` while IdeaScale remains live, and on Catalyst Voices once it is the active platform. This is the highest-risk class because the platforms themselves may sunset. Capture priority is highest here.
- **Class D — Community-maintained.** Mirrors and aggregations from `catalystexplorer.com`, `lidonation.com`, and similar community-run sources. These are preserved as corroboration when they cover the same record as a Class B or C source, and as a primary record when no higher-authority source exists for a given datum.
- **Class E — Researcher capture.** Captures performed by individual researchers, contributed to the archive with attribution. Used when no other source is available. Treated as a primary record only after a chain-of-custody review per §24.4.

When a datum exists in multiple classes, the archive cites the highest-authority class as canonical and records the others as supporting. The fund-by-fund source registry (Phase 2 of FLOW-6) makes the authority assignment explicit per fund.

### 24.4 Chain-of-custody requirements

Every captured artifact has a chain-of-custody manifest. No artifact enters the archive without one. The manifest format is the JSON sidecar specified in `docs/IDEASCALE_PRESERVATION.md` and is canonicalized here:

For an artifact stored at relative path `{P}`, a sidecar at `{P}.custody.json` records, at minimum:

| Field | Required | Description |
|---|---|---|
| `source_url` | yes | The exact URL the artifact was fetched from, including query parameters. |
| `capture_date` | yes | UTC timestamp of the fetch, ISO 8601, second precision or better. |
| `capture_method` | yes | The tool and flags used (`wget --mirror --convert-links --adjust-extension`, `curl -sL`, `git clone --mirror`, `browser-save-as`, `manual-screenshot`, etc.). |
| `capture_operator` | yes | Who performed the capture. The operator's GitHub handle, or an attribution string for community-contributed captures, or `anonymous` if the contributor requested anonymity (still recorded so the *fact* of anonymity is transparent). |
| `sha256` | yes | SHA-256 hash of the raw captured bytes, as written to disk, before any post-processing. |
| `content_type` | yes | The HTTP `Content-Type` header value (or, for non-HTTP captures, the equivalent — `application/json`, `text/html`, `application/pdf`, etc.). |
| `http_status` | when applicable | The HTTP response status code (`200`, `301→200`, etc.). |
| `source_authority_class` | yes | One of `A` / `B` / `C` / `D` / `E` per §24.3. |
| `notes` | optional | Operationally relevant context: retries needed, partial fetches, encoding peculiarities, etc. Never editorial. |

A bulk capture operation (e.g., `wget --mirror` of a fund's IdeaScale section) generates per-file custody manifests automatically via a wrapper script. The wrapper additionally writes a `CAPTURE_LOG.json` for that session recording the parent capture command, total bytes, file count, and start/end timestamps. The per-file manifests reference the session log by `capture_session_id`.

When the same artifact is captured by multiple methods (e.g., direct `wget` AND a Wayback Machine submission of the same URL on the same date), each capture has its own manifest. The archive does not deduplicate at the manifest layer; researchers can compare hashes to confirm independence.

### 24.5 Provenance retention

For every URL captured under Class B or Class C, the archive also submits the URL to a public web archival service (Wayback Machine, `archive.today`, or both, per the contributor's discretion) within 24 hours of the capture. The capture manifest records the resulting archive URL in a `wayback_url` field. This is the belt-and-suspenders for cases where:

- The captured bytes are later challenged on authenticity grounds.
- The captured file is corrupted at rest.
- The local archive's continued accessibility is in doubt.

A future researcher can verify the captured artifact's content matches the Wayback Machine snapshot taken at the same `capture_date`. If they match, the bytes are authentic regardless of whether the original `source_url` still resolves.

The archive does not depend on the Wayback Machine being available. The local capture is canonical; the Wayback submission is supplementary. If the Wayback submission fails, the manifest records the attempt with a null `wayback_url` and the capture still enters the archive.

### 24.6 Reproducibility and verifiability

The archive is designed so that an independent researcher can perform the following verification chain without operator cooperation:

1. **File integrity.** Compute SHA-256 of the artifact at path `{P}` in their local copy and compare to `sha256` in `{P}.custody.json`. If they match, the file has not been corrupted at rest.
2. **Provenance integrity.** Fetch the artifact from `wayback_url` (or, if available, from `source_url` if still live). Verify the content matches the local file. If they match, the local file is what was captured.
3. **Authority integrity.** Cross-reference the `source_url` against the source authority hierarchy in §24.3. Confirm the assigned `source_authority_class` matches the URL's actual authority.
4. **Capture transparency.** The `capture_method`, `capture_operator`, and `capture_date` fields disclose how, by whom, and when. A researcher can replicate the capture (modulo content drift since `capture_date`) to confirm the method produces output consistent with the archive.

Any researcher publication that cites a captured Catalyst proposal can include the artifact's SHA-256 hash and `wayback_url` as the canonical reference. Subsequent readers can verify the same file is what was cited. This makes the archive citable, auditable, and durable.

### 24.7 Repository separation

The Catalyst preservation archive is **a separate repository** from the observatory at `~/observatory/`. It is not committed to the observatory's git history, is not deployed by the observatory's nginx, and is not consumed by the observatory's ETL.

Reasons:

- **Footprint.** A full IdeaScale mirror is hundreds of megabytes to gigabytes. The observatory's repo is intentionally lean (current `data/snapshots/` excluded; code only). Mixing them is operationally hostile.
- **Lifecycle.** The observatory updates daily and is high-tempo. The Catalyst archive is mostly write-once-then-read; its commit cadence is bursty (during capture phases) and then near-zero (during steady-state).
- **License surface.** The observatory is Apache 2.0 (code) and CC0 (data). The Catalyst archive contains third-party content whose licensing varies by source; the archive's storage repo carries its own LICENSE statement clarifying that the captured content is preserved under fair-use / archival-preservation grounds and that downstream use must follow each captured artifact's own license terms. Co-locating with observatory CC0 would create confusion about what is and is not CC0.
- **Trust boundary.** The observatory is a numerical data layer. The Catalyst archive is a content-preservation layer. Their failure modes are different and their reviewers will be different.

The Catalyst archive's repository is the canonical home for the artifacts. The observatory may, in a future FLOW-6 surfacing phase (the analytical phase, explicitly NOT part of §24 itself), index *into* the archive's URLs and surface limited cross-references. That surfacing is out of scope for this section.

### 24.8 What §24 explicitly does NOT do

- It does not analyze proposal content. No NLP, no topic modeling, no sentiment classification, no automated categorization. The archive is bytes plus manifests; interpretation is downstream.
- It does not rank funds, proposals, or recipients. No "top funded," no "most controversial," no "successful fund." Rank framings are exactly the kind of editorial dimension §20.7 already prohibits in the observatory; the archive inherits the same prohibition.
- It does not score milestone completion. A proposal whose milestones were not signed off is preserved as-is, with whatever milestone tracker state existed at capture date. No "missed" / "delivered" / "stalled" flags are computed by the archive.
- It does not link proposals to off-chain identities beyond what the proposer themselves recorded in the on-platform record. Catalyst is full of public-figure proposers; the archive does not add Wikipedia links, X/Twitter handles, or any other off-platform identity hint.
- It does not editorialize trigger conditions for capture beyond the operational signals documented in the planning artifact (sunset announcements, observed 404s, repo archival flags).
- It does not deduplicate proposers across funds. If a single proposer submitted to multiple funds, each submission is a separate archived record. Identity-linking is a downstream analytical task that the archive deliberately leaves to researchers.
- It does not interpret missing records as evidence of anything. If a fund's IdeaScale section is incomplete at capture time, the archive records what it could capture and flags the gap honestly in the manifest. No claims are made about why a record is missing.

### 24.9 Lifecycle and trigger conditions

Capture proceeds in priority bands defined by source authority class and platform-sunset risk:

- **Band 1 — At-risk Class C platforms.** Capture before any of (a) IdeaScale announces a sunset date, (b) the first observed 404 on a previously-working `cardano.ideascale.com` URL, (c) the `cardano-foundation/catalyst-core` repository is marked archived or deleted on GitHub (currently dormant-but-browsable, last release December 2025, last activity recent enough that the repo is best characterized as "dormant" rather than "archived"). Note that `cardano.ideascale.com` itself is, at the time of this writing, a JavaScript-rendered SPA — direct fetches return an empty 852-byte shell regardless of URL validity. Effective preservation of IdeaScale content requires the Wayback Machine path (per `docs/CATALYST_CAPTURE_PLAN.md §3.2`) rather than direct mirror, because the live IdeaScale surface no longer carries server-rendered content. The "first observed 404" trigger remains valid because a 404 still indicates the URL has been actively removed, distinct from the SPA's universally-empty body. The first signal is the most likely; the second is the hard deadline.
- **Band 2 — Class B canonical sources.** Capture on a schedule that re-fetches each Class B source quarterly or on any observed structural change. Includes per-fund landing pages, voting result PDFs and CSVs, and `catalyst-core` historic-data snapshots (currently covering Fund 0 through Fund 9; the F9/F10 boundary is hard — Fund 10 and later are not represented in `catalyst-core` at all and depend entirely on `projectcatalyst.io` plus IdeaScale).
- **Band 3 — Class A on-chain.** Reconstructed on demand from Koios; no proactive capture beyond the canonical query record. Re-reconstructible by any third party with Koios access.
- **Band 4 — Class D community.** Mirrored when a new fund closes and when the community source publishes a new full-dump; otherwise tracked by the source's own update cadence.

The archive's `INDEX.json` at each subfolder level records the last capture date per artifact. Re-captures of the same `source_url` produce a new dated artifact (`{date}/path/file.html`) rather than overwriting the prior capture; the prior capture remains in place as a historical record of what the source looked like at that date. This is the same immutability rule that §21.7 enforces on observatory snapshots, applied to the Catalyst archive.

### 24.10 Versioning

This section ships with `methodology_version = "0.9"`. The bump from `0.8` to `0.9` reflects the new commitment to the Catalyst preservation surface; the observatory's existing schema and code paths are unchanged by §24 (the preservation archive lives in its own repository per §24.7).

`schema_version` remains `2`. No tables are added to the observatory's SQLite database; no exports are added under `/data/snapshots/`. If a future analytical phase surfaces archive cross-references in the observatory, that phase will define its own schema additions and bump `schema_version` at that time.

### 24.11 Relationship to existing methodology sections

§24 inherits from and respects the existing methodology framework:

- §2 (what this site does not do): the §2 list extends to "scoring or ranking Catalyst proposals" implicitly via §24.8.
- §10 (operator disclosure): the operator's COI disclosure already covers stake pool, DRep registration, and CTF authorship. The operator is also a Catalyst voter and may have submitted to past funds; this is a class-of-COI that exists for many ecosystem participants. The archive's content-neutrality (§24.2) is the structural guarantee that operator involvement does not bias the archive. No additional per-fund disclosure is required so long as the operator is acting as archive operator only, not as commentator.
- §13 (pages and public exports): §24 adds no public export under the observatory's data URLs. The archive's own publication channel is documented in its own repository's README.
- §20 (governance history layer): §24 is the off-chain governance history complement to §20's on-chain governance history. The two are conceptually parallel: one preserves what the protocol recorded about governance, the other preserves what the off-chain Catalyst process recorded about proposals.
- §21 (historical snapshot browser): §24's "re-captures produce new dated artifacts, never overwrite" rule mirrors §21.7's immutability rule.
- §22 (treasury observability): §24 has no direct treasury connection in v0.9. A future phase may link Catalyst payout transactions to treasury events, but that linkage is downstream analysis and explicitly out of scope here.

### 24.12 Phases beyond §24

Phase 2 of FLOW-6 produces the **fund-by-fund source registry**, listing per-fund (Fund 1 through Current) the primary source, secondary source(s), preservation status (planned / in-progress / captured / verified), and authority class assignment. This artifact is `docs/CATALYST_SOURCE_REGISTRY.md` once drafted.

Phase 3 of FLOW-6 produces the **IdeaScale capture strategy** with explicit answers to: what gets captured (URL set + per-fund extent), what format (HTML mirror via `wget --mirror`, JSON via `catalystexplorer.com` OpenAPI, PDFs verbatim), where stored (path conventions in the separate archive repo), hash strategy (per §24.4), and chain-of-custody specifics (the wrapper script for bulk captures, the Wayback submission workflow). This artifact is `docs/IDEASCALE_CAPTURE_STRATEGY.md` once drafted.

Phase 4 of FLOW-6 produces the **preservation repository design**: the new repository's layout, README, LICENSE handling, INDEX.json schema, and the boundary contract between it and the observatory repository. This is documented in the new repository's own `README.md` when created.

Phase 5 — **capture itself** — is gated on Phases 2, 3, and 4 being complete and approved. No scraping, no `wget --mirror`, no `git clone --mirror`, no manual capture happens before the methodology in §24 plus the operational artifacts in Phases 2–4 are in place. This gate is non-negotiable; it exists to ensure that the very first byte ever captured under the archive carries a chain-of-custody manifest that satisfies §24.4 from artifact zero onward.

## 12. v0.1 scope limitations

The site is deliberately narrow at v0.1. The following are out of scope for this version and disclosed here transparently rather than masked with synthetic or interpolated values:

- **Delegator counts** are fetched only for the top 60 candidates per daily run (to support top-30 ranking with headroom), not all active DReps. The remaining active DReps are visible via the underlying Koios API for anyone who needs them.
- **Historical backfill is not yet implemented.** The Δ7d and Δ30d fields will appear as null until daily snapshots have accumulated for 7 and 30 days respectively from first deployment. The 90-day chart will populate forward from launch.
- **Vote outcomes are not editorialized.** The `votes` table stores facts only — `(action_id, drep_id, vote ∈ {yes, no, abstain}, vote_epoch)`. No alignment scoring, no "voted with consensus" / "voted against consensus" framing, no per-vote interpretation. Governance action outcomes (`enacted`, `ratified`, `dropped`, `expired`, `active`) are derived deterministically from Koios fields and likewise carry no value judgment.
- **Per-DRep vote history page** is not yet rendered in the frontend; the data is stored and queryable but no UI exists. Frontend work begins in Phase 2.

These limitations resolve over time as v0.2 work lands. They are not concealed and are not approximated.

# Catalyst capture plan

**Status:** draft. The IdeaScale campaign-enumeration section awaits the parallel research return; everything else is the operational design.
**Owner:** observatory operator (`cryptoleo79`).
**Phase:** FLOW-6 Phase 3 (per `METHODOLOGY.md §24.12`).
**Authoritative reference:** `METHODOLOGY.md §24`. If this document contradicts §24, §24 wins.
**Prerequisite reference:** `docs/CATALYST_SOURCE_REGISTRY.md` — Phase 2 source mapping. Every capture target in this plan corresponds to a fund-and-source entry there.

## What this document is

A per-source operational blueprint for preserving Catalyst's historical record. For every source identified in the Phase 2 registry, this document defines:

- **Capture method** — the tool and approach (HTTP `GET` + manifest, `wget --mirror`, JSON API consumer, on-chain query record, etc.).
- **Storage format** — what gets written to the archive and in what shape.
- **Chain-of-custody specifics** — how the `§24.4` manifest is generated for that source, what fields are populated automatically vs manually.
- **Hash strategy** — what bytes are hashed, when, and how the hash is verified later.
- **Verification process** — how a third party can verify the capture without operator cooperation.
- **Re-capture policy** — when re-fetches happen, how prior captures are preserved (immutability rule from `§21.7` / `§24.9`).
- **Preservation risk** — what could go wrong for that source, and how this plan mitigates it.

The plan does not include code. Scripts referenced here are specified by behavior, not implementation. Implementation lives in the separate Catalyst archive repository defined in Phase 4.

## Capture readiness gate

Per `METHODOLOGY.md §24.12`, **no capture happens until Phase 3 (this document) and Phase 4 (preservation repository design) are both drafted and approved.** This document is the Phase 3 candidate; its approval is one of the two prerequisites for Phase 5 (capture itself).

The gate is enforced by the simple fact that no capture tooling exists yet. The wrapper script specified in §3.7 below has not been written; the Catalyst archive repository specified by Phase 4 has not been created; no `.custody.json` manifest has been generated for any artifact under FLOW-6's authority. When the gate clears, the first artifact captured carries a fully-conforming manifest from byte zero onward.

## 1. Capture pipeline overview

Every artifact passes through the same five-stage pipeline. The stages are designed so that any researcher reproducing the pipeline produces byte-equal output:

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │  STAGE 1 — FETCH                                                     │
  │  HTTP GET (or git clone, or Koios query) against a registered URL.   │
  │  Bytes-as-received saved to disk. No transformation.                 │
  └──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  STAGE 2 — HASH                                                      │
  │  SHA-256 of the raw bytes written in stage 1.                        │
  └──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  STAGE 3 — MANIFEST                                                  │
  │  Per-artifact `.custody.json` sidecar emitted with all §24.4 fields. │
  │  No artifact enters the archive without a manifest.                  │
  └──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  STAGE 4 — WAYBACK SUBMISSION                                        │
  │  For Class B and Class C sources, POST to Wayback Machine save API.  │
  │  Resulting `wayback_url` recorded back into the manifest.            │
  └──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  STAGE 5 — INDEX UPDATE                                              │
  │  The archive's `INDEX.json` at the enclosing subfolder is updated    │
  │  to reference the new artifact + manifest.                           │
  └──────────────────────────────────────────────────────────────────────┘
```

Stages 1–3 are mandatory for every artifact. Stage 4 is mandatory for Class B and C; optional for Class D and E. Stage 5 is bulk-updated at the end of a capture session via the wrapper script's `CAPTURE_LOG.json` rollup, not per-artifact (avoids the cost of rewriting `INDEX.json` thousands of times during a `wget --mirror`).

The pipeline is single-direction. Once an artifact is in the archive, it is never modified (§24.9 immutability). Re-captures of the same source URL produce a new dated artifact at `{date}/...` and a new manifest; the prior is preserved unchanged.

## 2. Per-source capture blueprints

### 2.1 `projectcatalyst.io` (Class B)

Per-fund landing pages, voting-results pages, occasional standalone PDFs.

| Field | Value |
|---|---|
| Capture method | HTTP `GET` per URL using a polite client (`curl -sL --user-agent "cdo-preserve/1.0"`); rate-limited to ≤ 2 req/s. Per-fund landing page captured as one `index.html`; voting-results page captured as one `voting-results.html`; F10's PDF captured verbatim as `fund10-voting-results.pdf`. |
| Storage format | One file per URL, stored at `projectcatalyst-io/funds/{N}/{filename}`. The in-page voting-results explorer is captured as the rendered HTML; if the explorer's data is fetched via XHR/fetch from a JSON endpoint, that endpoint is captured as a separate artifact alongside the HTML. |
| Chain-of-custody | `.custody.json` sidecar per artifact with `source_authority_class = "B"`, `capture_method = "curl -sL --user-agent cdo-preserve/1.0"`, `http_status` recorded. |
| Hash strategy | SHA-256 of the file bytes as written to disk (pre-compression, pre-transformation). |
| Verification process | (1) Re-compute SHA-256, compare to manifest. (2) Re-fetch from `source_url`; verify content matches (modulo content drift since `capture_date`). (3) Fetch `wayback_url`; verify content matches. |
| Re-capture policy | Quarterly re-fetch per `§24.9` Band 2. Plus: re-fetch on any observed structural change. Re-captures are stored at `projectcatalyst-io/by-date/{YYYY-MM-DD}/funds/{N}/...` — the prior capture is preserved unchanged. |
| Preservation risk | Low day-to-day. Medium across multi-year horizon — a Catalyst Voices migration could orphan the per-fund URL pattern. Mitigated by Wayback submission and by quarterly re-capture. F10's PDF anomaly is a per-fund risk: the PDF carries an "Internal Copy – [confidential]" stamp; preserve verbatim. |

### 2.2 `cardano-foundation/catalyst-core` (Class B)

The dormant-but-not-archived GitHub repository carrying historical Catalyst snapshot data for F0–F9. **The repo was relocated** from `input-output-hk/catalyst-core` to `cardano-foundation/catalyst-core` per Phase 3 research; capture configuration must use the current canonical URL. The relocation also signals shared custody between IO and Cardano Foundation, which is positive for long-term preservation but means historical references to the old URL must be either updated or accepted as redirects.

A second Phase 3 finding affects this source's preservation value: the F2–F9 fund data is stored as **`fundN_database_encrypted.sqlite3`** files, not plain SQL. The encryption is undocumented in the repo itself; the historic-data SQL generator scripts (`mk_fundN_sql.py`) are present but the SQLite databases are sealed. Without a decryption key — which has not been published — the proposal URL fields and other per-proposal metadata in those databases are not extractable. F0 and F1 remain as plain `.sql` (predating IdeaScale).

| Field | Value |
|---|---|
| Capture method | `git clone --mirror https://github.com/cardano-foundation/catalyst-core.git` once. This pulls every commit, every tag, every branch — the entire repo history in a compact form. Re-clone weekly while the repo remains active; the clone is incremental after the first run. The wrapper records both the current canonical URL and the legacy `input-output-hk/catalyst-core` URL as `source_url_aliases` for historical citation matching. |
| Storage format | The bare mirror clone at `catalyst-core/repo.git/`. **No working tree** — the repo contains hundreds of MB of historic data and encrypted databases that are not useful unless decrypted. Researchers run `git clone catalyst-core/repo.git` locally to materialize a working tree when needed. The `block0.bin` files and the encrypted SQLite files are preserved verbatim regardless of decryptability — they are bytes-on-record. |
| Chain-of-custody | A single `.custody.json` at `catalyst-core/repo.git.custody.json` recording the clone operation. Fields: `source_url = "https://github.com/cardano-foundation/catalyst-core.git"`, `capture_method = "git clone --mirror"`, `sha256` = SHA-256 of `git bundle create archive.bundle --all` output (a single deterministic byte-stream representing the entire repo state). A `notes` field records the relocation history: "Repository relocated from `input-output-hk/catalyst-core` to `cardano-foundation/catalyst-core` prior to first FLOW-6 capture; both URLs are valid historical references." |
| Hash strategy | The git mirror has its own per-object SHA-1 hashing (git's native). The chain-of-custody hash for the archive is a single SHA-256 of `git bundle create --all` output — this provides a single number that uniquely identifies the entire repo state at capture time. Re-bundling later and re-hashing produces the same SHA-256 iff no history has been added or rewritten. |
| Verification process | (1) Re-bundle the mirror with `git bundle create new.bundle --all`; SHA-256 of `new.bundle` matches the manifest's `sha256`. (2) `git ls-remote https://github.com/cardano-foundation/catalyst-core.git` returns the same refs at the same commits as the mirror. |
| Re-capture policy | Weekly `git fetch --all` against the mirror. Each weekly bundle's SHA-256 is recorded with its capture date in `catalyst-core/bundles/{date}.sha256`; the bundle itself is not stored (it would duplicate the mirror); the hash record is sufficient to prove "what the repo looked like on date D". |
| Preservation risk | Low while the repo remains accessible. Medium if Cardano Foundation marks the repo as archived (still accessible, capture not impacted). High if Cardano Foundation deletes the repo — the bare clone is the only copy. **The encrypted SQLite databases represent a known-but-unresolvable preservation gap** for F2–F9 proposal URL metadata: the bytes are preserved but their interior content is sealed. If a decryption key is published by Cardano Foundation in the future, the gap closes; until then, the F2–F9 IdeaScale URL mapping for those funds must come from the Wayback enumeration (per §3.2), not from catalyst-core. |

### 2.3 `cardano.ideascale.com` (Class C) — captured via Wayback Machine

The original Phase 3 draft assumed direct `wget --mirror` against `cardano.ideascale.com`. The Phase 3 research pass invalidated that assumption: today's `cardano.ideascale.com` is a JavaScript-rendered SPA that returns an 852-byte empty shell for every URL regardless of validity. Direct capture would archive useless artifacts.

The corrected capture method uses **Wayback Machine snapshots as the canonical source** for IdeaScale content. Wayback archived `cardano.ideascale.com` while it still server-rendered HTML, so the snapshots contain the actual campaign content. The Wayback Machine has effectively performed the preservation already; FLOW-6's archive becomes a downstream mirror of that preservation with our own chain-of-custody manifests pointing at both the original IdeaScale URL and the Wayback snapshot URL.

| Field | Value |
|---|---|
| Capture method | Per-campaign fetch of the most recent server-rendered Wayback snapshot of `cardano.ideascale.com/c/campaigns/{id}/about` for each enumerated campaign ID (per §3.2). Polite client: `curl -sL --user-agent "cdo-preserve/1.0"` with a 2-second sleep between requests. The Wayback URL pattern is `https://web.archive.org/web/{timestamp}/cardano.ideascale.com/c/campaigns/{id}/about`; the `2*` timestamp wildcard selects the most recent snapshot, and the resulting redirect URL is the canonical archive URL recorded in the manifest. |
| Storage format | One directory per campaign at `ideascale/campaigns/{campaign_id}/`. Contains: `about.html` (the about page), `idea/{idea_id}.html` (per-proposal pages discovered by following links within the snapshot), plus any page-requisite assets (CSS/JS/images that the snapshot inlines or references via Wayback URLs). The wrapper script writes a `CAPTURE_LOG.json` per campaign session. |
| Chain-of-custody | `.custody.json` per file with two load-bearing fields specific to Wayback-sourced captures: `source_url` is the original `cardano.ideascale.com/c/campaigns/{id}/about` URL (recording what the artifact represents); `wayback_url` is the specific Wayback snapshot URL fetched (the canonical fetch target — for Class C captures, `wayback_url` is **mandatory**, not supplementary as it is for Class B). `source_authority_class = "C"`. `capture_method` records both the curl invocation and the Wayback timestamp the snapshot was taken from. |
| Hash strategy | Per-file SHA-256 of the bytes as received from the Wayback Machine. Campaign-level rollup SHA-256 of the sorted per-file hash list in `CAPTURE_LOG.json`. Note: the Wayback Machine wraps archived pages with its own toolbar/iframe; the wrapper script strips the Wayback toolbar from the saved HTML and hashes the **post-strip bytes** so the hash reflects the IdeaScale content alone. The strip operation is deterministic and documented in the wrapper specification. |
| Verification process | (1) Per-file SHA-256 check. (2) Re-fetch the Wayback snapshot URL; verify (post-strip) bytes match the manifest. (3) Re-issue the Wayback CDX query for the same campaign ID; verify the snapshot is still in Wayback's index. (4) Cross-validate the campaign's fund mapping against `catalystexplorer.com/api/campaigns` by name. |
| Re-capture policy | **Capture once per snapshot.** The Wayback snapshot itself is immutable — Wayback does not modify archived bytes. A later Wayback snapshot of the same campaign is a different artifact and would be captured separately under a new dated subdirectory if added. If a campaign was never archived by Wayback (a known-missing per §3.4), the gap is flagged and reviewed; no re-fetch from the live SPA can recover the content. |
| Preservation risk | **Still the highest risk in the FLOW-6 surface, but now bounded.** Wayback Machine's own continued operation is the load-bearing assumption — Internet Archive funding and legal challenges are non-zero risks. Mitigation: (a) our local archive holds the bytes once captured from Wayback, so even if Wayback later restricts access we retain the snapshots; (b) we record both `source_url` and `wayback_url` so researchers can find the artifact in our archive even if both Wayback and IdeaScale become unavailable; (c) we submit our own re-archival back to Wayback after capture (per §4.4) — a two-hop preservation. The 238 campaigns Wayback already has are effectively preserved by Wayback today; FLOW-6's job is to mirror that preservation with proper chain-of-custody. |

### 2.4 `catalystexplorer.com` (Class D)

Community-maintained mirror. Useful as corroboration; not a primary record.

| Field | Value |
|---|---|
| Capture method | HTTP `GET` per per-fund detail page using polite client. The site's `/funds` index plus each `/funds/{N}` detail page captured as separate HTML files. If catalystexplorer publishes an OpenAPI surface (not confirmed in Phase 2 inspection), the JSON dump is captured alongside HTML. |
| Storage format | `catalyst-explorer/funds/{N}.html` + any associated JSON at `catalyst-explorer/api/funds/{N}.json`. Mirrors the catalystexplorer URL structure 1:1 for easy researcher lookup. |
| Chain-of-custody | `.custody.json` per file with `source_authority_class = "D"`. |
| Hash strategy | Standard SHA-256 per file. |
| Verification process | Same three-step as `projectcatalyst.io`: re-hash → re-fetch → Wayback. |
| Re-capture policy | On fund close (when each fund's data stabilizes), re-fetch the per-fund page. Plus: opportunistic re-capture if catalystexplorer announces a substantive content update. |
| Preservation risk | Low — site is community-maintained, Apache 2.0 licensed per the planning artifact, mirror-friendly. The corroboration value is the main contribution; if the primary `projectcatalyst.io` source preserves successfully, catalystexplorer adds confidence rather than load-bearing coverage. |

### 2.5 `milestones.projectcatalyst.io` (Class B)

Per-funded-proposal milestone tracker. State per milestone: planned, claimed-complete, signed-off, revised. Per `§24.1`, milestone records are in FLOW-6 scope.

| Field | Value |
|---|---|
| Capture method | HTTP `GET` per per-proposal milestone URL. The URL pattern is `milestones.projectcatalyst.io/projects/{proposal_id}` (or equivalent — verify during Phase 5 dry-run). |
| Storage format | One file per proposal at `milestones/proposals/{proposal_id}.html`. If the page is a JS-rendered SPA that does not deliver milestone state in the initial HTML, the capture method escalates to a headless-browser snapshot (Playwright or equivalent) — but **this escalation is itself a Phase 5 decision, not pre-approved here.** The plan as written captures whatever the polite-client GET delivers; if that is insufficient, Phase 5 produces a documented amendment to this section. |
| Chain-of-custody | `.custody.json` per file. If headless-browser capture is used, the manifest's `capture_method` records the headless tool + version + flags so the capture is reproducible. |
| Hash strategy | Standard SHA-256. For headless captures, hash the post-render HTML, not the JS bundle — the post-render HTML is the artifact, the JS is the rendering layer. |
| Verification process | Standard re-hash → re-fetch → Wayback. Plus: for headless captures, a second-headless-snapshot may be required during verification (the rendered output is the canonical artifact, but it may differ across browser versions). |
| Re-capture policy | Per funded proposal, re-fetch quarterly while the fund's milestones remain open; freeze at "last capture before fund-close + 6 months" once the fund's milestone window closes. |
| Preservation risk | Medium. The tool is operated by Catalyst and linked from IdeaScale; uncertain post-Catalyst-Voices status. Capture during the IdeaScale-sunset window (alongside the IdeaScale captures) is the safe play. |

### 2.6 On-chain Catalyst payouts (Class A)

The on-chain ADA transfers from Catalyst-controlled accounts to recipient stake addresses. Already preserved by the Cardano protocol.

| Field | Value |
|---|---|
| Capture method | **Query record, not artifact capture.** The archive stores the canonical Koios query (endpoint, parameters, snapshot date) for each fund's payout transactions; a researcher reproducing the archive issues the recorded query against Koios at any later date to retrieve the same transactions. The on-chain ledger preserves the transactions themselves. |
| Storage format | `on-chain/funds/{N}/payouts.queryspec.json` — a JSON document recording the Koios endpoint, parameter set, response field schema expected, snapshot date for which the query was recorded, and a `notes` field explaining the fund→payout mapping (e.g., "F11 payouts identified by treasury-withdrawal action_ids X, Y, Z enacted in epoch E"). |
| Chain-of-custody | `.custody.json` per `queryspec.json` recording the recording event itself — when the query was specified, by whom, and the SHA-256 of the queryspec file. |
| Hash strategy | SHA-256 of the queryspec JSON. The on-chain transactions themselves have their own protocol-level hashes (`tx_hash`) recorded in the queryspec's response schema. |
| Verification process | (1) Issue the recorded query against Koios. (2) Verify the returned transactions match the queryspec's expected response schema. (3) Per-transaction `tx_hash` is the protocol's own integrity stamp. |
| Re-capture policy | None — the chain itself preserves the transactions. The queryspec is updated only when Koios's API contract changes (e.g., endpoint rename); old queryspecs are kept and the new one is added with a `supersedes` field referencing the prior. |
| Preservation risk | Very low. Koios is community-run; if it disappears, alternatives (Blockfrost, Cardano-Foundation node, self-hosted db-sync) all expose the same on-chain data. The recorded queryspec is portable to any compatible Cardano explorer. |

## 3. IdeaScale campaign enumeration strategy

This is the load-bearing operational question of FLOW-6. The Phase 2 registry flagged "per-campaign opaque numeric IDs, no per-fund root URL" as the single largest operational unknown. A Phase 3 research pass investigated seven enumeration approaches; the findings reshape this strategy section, and they also reshape the §2.3 capture blueprint.

### 3.1 What the research found

Investigated approaches (full investigation in research transcript; summary here):

| Approach | Result | Why |
|---|---|---|
| IdeaScale HTML index page | **No** | `cardano.ideascale.com/c/cardano` and `/c/cardano/campaigns` return a 852-byte React SPA shell with `<div id="root"></div>` — no server-rendered content. Every campaign URL returns the **identical bytes** regardless of ID (verified by md5: valid ID 332, valid ID 343, and bogus ID 99999 all return byte-identical shells). No `sitemap.xml`. |
| IdeaScale public REST API | **Partially — gated** | The endpoint `GET /a/rest/v1/campaigns/groups/{fund_group_id}` exists and returns the full campaign list, documented in the (now archived) `input-output-hk/fund10-ideascale-importer` repository. Unauthenticated requests return `{"key":"NO_AUTHENTICATION_HEADER"}`. Authenticated access requires a token historically held by IOG; per the importer's archived status, that token appears to be burned. **`robots.txt` explicitly disallows `/a/rest/` for `User-agent: *`.** This path is closed without explicit Catalyst Foundation arrangement. |
| `catalystexplorer.com` cross-reference | **Partially — useful** | The site exposes its own JSON API at `https://catalystexplorer.com/api/campaigns?page=N` returning **140 campaigns across 6 pages**, with the fund-mapping carried in the title field (e.g., `"F9: Fund10 challenge setting"`). Per-fund distribution roughly: F3:3, F4:7, F5:9, F6:19, F7:25, F8:23, F9:13, F10:13, F11:7, F12:6, F13:6, F14:4, F15:4. However, `catalystexplorer`'s `ideascale_id` field is `null` for every proposal sampled — the schema is wired but never populated. So this gives us campaign **names** per fund, not IdeaScale **IDs**. |
| `cardano-foundation/catalyst-core` SQL dumps | **No** | The F2–F9 directories contain **encrypted SQLite databases** (`fundN_database_encrypted.sqlite3`) plus generator scripts, not plain SQL. The proposal URL fields are inside the encrypted blob. Without a documented decryption key, the IdeaScale URLs in those databases are not extractable. |
| `projectcatalyst.io` fund-page link harvest | **No** | The fund landing pages are Next.js-prerendered HTML; string search for `ideascale.com` returns zero matches. The word "ideascale" appears only as a CSS class name. The Catalyst website does not link to IdeaScale at all from its public fund pages. |
| Community-published mappings | **Partially — sparse** | No comprehensive published per-fund→IdeaScale-ID list found. The (now archived) `input-output-hk/fund10-ideascale-importer` documents the API path and `fund_group_id 8104` for Fund 9. `input-output-hk/catalyst-toolbox` PR #30 carries an older importer. Useful for cross-checking known IDs but not for full enumeration. |
| Brute-force numeric scan | **No — no signal channel** | Valid and invalid IDs return byte-identical SPA shells. No 403/429/CAPTCHA observed during probes of IDs 1, 100, 200, 332, 343, 348, 400, 423, 500, 1000, 99999. Without a body-diff or status-code signal, brute-force enumeration cannot distinguish live campaigns from non-existent ones. Skip entirely. |
| **Wayback Machine CDX index** | **Yes — primary channel** | `https://web.archive.org/cdx/search/cdx?url=cardano.ideascale.com/c/campaigns/*&output=json&fl=original&collapse=urlkey` returns **238 distinct campaign IDs** that the Wayback Machine has archived. The IDs cluster in ranges: 35, 230–303, 308–355, 379–381, 404–427, plus 25604–26605. All four IDs mentioned in the Phase 2 registry (332, 343, 348, 423) are present. **Crucially, the archived snapshots contain server-rendered content** — they were captured before IdeaScale converted to a JS-rendered SPA, so the bytes Wayback holds include the actual campaign HTML with titles, descriptions, and breadcrumbs. The fund→campaign mapping can be parsed from each snapshot. |

### 3.2 Primary enumeration strategy: Wayback CDX → snapshot-parse

The chosen primary path:

1. **Issue the Wayback CDX query once** to enumerate the 238 archived campaign IDs:

   ```
   GET https://web.archive.org/cdx/search/cdx
       ?url=cardano.ideascale.com/c/campaigns/*
       &output=json
       &fl=original
       &collapse=urlkey
   ```

   Result is a JSON array of `[original_url]` rows. Extract the numeric ID from each URL. Output: `ideascale/wayback-campaign-ids.txt` — one ID per line, sorted, with a header comment recording the CDX query and the fetch date.

2. **For each campaign ID, fetch the latest Wayback snapshot** of `/c/campaigns/{id}/about`:

   ```
   GET https://web.archive.org/web/2*/cardano.ideascale.com/c/campaigns/{id}/about
   ```

   (The `2*` timestamp wildcard selects the most recent snapshot; if Wayback returns a redirect to the actual snapshot URL, that is the canonical archive URL recorded in the manifest.)

3. **Parse the snapshot's HTML to derive the fund mapping.** Server-rendered Wayback snapshots include the campaign title and breadcrumb. The campaign title typically encodes the fund (e.g., "Great Migration" is an F9 campaign; the breadcrumb shows `Home > Fund9 > ...`). A simple parser reads the `<title>` tag plus the breadcrumb `<nav>` element; the fund number is the first integer that follows `Fund` or `F` in those locations.

4. **Cross-validate the fund mapping against `catalystexplorer.com/api/campaigns`.** The catalystexplorer JSON gives 140 campaigns with fund-prefixed titles. Match each Wayback-parsed campaign by **name** against the catalystexplorer list; the catalystexplorer fund prefix is the authoritative fund mapping. Wayback's parsed mapping is the working draft; catalystexplorer's name-match is the verification. Mismatches are flagged for manual review.

5. **Emit `ideascale/fund-mapping.json`** — the canonical `{campaign_id → fund_N}` table that the §2.3 capture blueprint reads. Per fund: list of campaign IDs, count, source ("wayback-parsed + catalystexplorer-verified"), capture date.

This strategy works entirely from publicly-accessible, robots.txt-compliant sources. It does not require an IdeaScale API token. It does not touch `cardano.ideascale.com` directly (where the bytes would be useless anyway).

### 3.3 Completeness verification

Completeness for the enumeration is verified by intersection with the catalystexplorer.com per-fund campaign-name list:

- **Hit:** a Wayback-enumerated campaign matches a catalystexplorer campaign by fund + name. Confidence: high.
- **Wayback-only:** a Wayback ID has no matching catalystexplorer entry. Possible reasons: campaign was deleted from catalystexplorer's coverage; campaign predates catalystexplorer's coverage; name mismatch (parser miss). Confidence: medium — investigate manually.
- **Catalystexplorer-only:** a catalystexplorer campaign name has no matching Wayback ID. **This is the gap signal.** It means the campaign exists per catalystexplorer's record but Wayback never archived it. Confidence: gap.

The aggregate gap count drives whether the IdeaScale API-token path (§3.5 below) needs to be activated.

### 3.4 Missing-campaign detection

A campaign present in catalystexplorer but absent from Wayback is a **known-missing-from-archive campaign**. The plan records these in `ideascale/known-missing.json`:

```json
{
  "ideascale-known-missing": [
    {
      "fund": "F11",
      "name": "Open Source Development Ecosystem",
      "expected_id_range": "ID enumeration not possible without API token",
      "detected_via": "catalystexplorer-cross-reference",
      "detected_date": "2026-06-15"
    }
  ]
}
```

The presence of known-missing campaigns triggers a Phase 5 escalation: either (a) the operator requests an IdeaScale API token from Catalyst Foundation via formal channels to capture the missing campaigns, or (b) those campaigns are recorded as lost in the archive's documentation and FLOW-6 proceeds with the Wayback-known subset. The escalation decision is made *after* the Wayback enumeration is complete and the gap is quantified, not pre-decided here.

### 3.5 Path explicitly not pursued: IdeaScale API token

The endpoint `GET /a/rest/v1/campaigns/groups/{fund_group_id}` exists. It returns the authoritative campaign list per fund. Known `fund_group_id` mappings observed during research: F9 = 8104; F11 = 91 (in the `temp-cardano-sandbox.ideascale.com` workspace). Other fund_group_ids would need to be discovered separately.

**FLOW-6 does not pursue this path.** Reasons:

- The endpoint is `robots.txt`-disallowed for `User-agent: *`.
- Access requires a token historically held by IOG that appears to be burned.
- Obtaining a new token would require explicit arrangement with Catalyst Foundation — a private-access dependency that runs counter to the archive's commitment to be reproducible by ordinary researchers (per `METHODOLOGY.md §24` and `docs/CATALYST_ARCHIVE_REPOSITORY_DESIGN.md` "Architectural facts" item 4).

The path is documented here as a factual observation about IdeaScale's API surface, not as part of the FLOW-6 capture plan. If Catalyst Foundation independently publishes a structured Catalyst dataset that supersedes the IdeaScale API path (without per-researcher token gating), the archive can add it as a new Class B source at that time. Until then, the Wayback CDX → snapshot-parse path (§3.2) is the canonical IdeaScale source under FLOW-6.

Known-missing campaigns identified by the §3.4 gap detection are recorded in `ideascale/known-missing.json` and remain known-missing. They are not pursued via API.

### 3.6 What this strategy implies for §2.3

The §2.3 capture blueprint as originally drafted assumed `wget --mirror` against `cardano.ideascale.com/c/campaigns/{id}/`. That assumption is invalidated by the research: against the live IdeaScale today, `wget` returns the SPA shell only, not the campaign content. The §2.3 blueprint is rewritten in the next edit to this file to use Wayback snapshot URLs instead. The local archive becomes a downstream mirror of Wayback's preservation, with full chain-of-custody manifests pointing at both the original IdeaScale URL (`source_url`) and the Wayback snapshot URL (`wayback_url` — which becomes load-bearing rather than supplementary for Class C).

### 3.7 Operational caveats

- **robots.txt compliance.** The plan respects `cardano.ideascale.com`'s `robots.txt`: `/a/rest/` is disallowed without token; `Crawl-delay: 10` applies to other paths if they are accessed. The Wayback Machine has its own robots.txt that does not restrict access to its CDX or snapshot URLs for the relevant queries.
- **No UA spoofing.** `robots.txt` allows `/community-library/` for `Twitterbot` while disallowing it for `*`. Spoofing the user-agent to harvest content the wildcard UA cannot reach would violate the chain-of-custody integrity: the manifest's `capture_method` would describe one tool while the actual identity presented to the server was a deception. FLOW-6 declines this path explicitly.
- **CDX rate behavior.** Wayback CDX has no published rate limit but throttles at large query depth (research observed a 30 KB query in ~1s and a follow-up in ~10s). The plan inserts a 1-second sleep between CDX queries and a 2-second sleep between snapshot fetches. Well within polite-client behavior.
- **catalystexplorer API.** Undocumented (its `/docs.openapi` returns HTTP 500) but unauthenticated, paginated 24/page, no observed rate limit during 6 sequential page fetches. Treat as a Class D source per `§24.3`; its corroboration value is high but its long-term stability is not guaranteed.

## 4. Chain-of-custody design

The pipeline of §1 specifies the abstract stages; this section specifies the concrete artifacts produced at each stage.

### 4.1 Per-artifact manifest (`.custody.json`)

Reaffirms `METHODOLOGY.md §24.4`. For artifact at path `{P}`, sidecar at `{P}.custody.json` carries:

```json
{
  "source_url": "https://cardano.ideascale.com/c/campaigns/332/about",
  "capture_date": "2026-06-15T14:30:00Z",
  "capture_method": "wget --mirror --convert-links --adjust-extension --page-requisites --no-parent --wait=1 --random-wait --user-agent=cdo-preserve/1.0",
  "capture_operator": "cryptoleo79",
  "sha256": "a1b2c3...",
  "content_type": "text/html; charset=utf-8",
  "http_status": 200,
  "source_authority_class": "C",
  "capture_session_id": "2026-06-15T14:00:00Z-ideascale-c332",
  "wayback_url": "https://web.archive.org/web/20260615143015/https://cardano.ideascale.com/c/campaigns/332/about",
  "notes": null
}
```

All fields except `wayback_url` are populated at capture time. `wayback_url` is populated by Stage 4 of the pipeline — initially `null` if the Wayback submission has not yet been confirmed, then updated when the Wayback Machine returns the submission URL. The field is allowed to remain `null` if the Wayback submission fails permanently (per `§24.5`'s rule that the local capture is canonical).

### 4.2 Per-session capture log (`CAPTURE_LOG.json`)

For any bulk operation (one `wget --mirror` session, one `git clone --mirror`, one batch of curl fetches), the wrapper script writes a single session log:

```json
{
  "capture_session_id": "2026-06-15T14:00:00Z-ideascale-c332",
  "session_start": "2026-06-15T14:00:12Z",
  "session_end": "2026-06-15T14:28:45Z",
  "capture_operator": "cryptoleo79",
  "capture_command": "wget --mirror --convert-links --adjust-extension --page-requisites --no-parent --wait=1 --random-wait --user-agent=cdo-preserve/1.0 https://cardano.ideascale.com/c/campaigns/332/",
  "session_target_root_url": "https://cardano.ideascale.com/c/campaigns/332/",
  "session_target_authority_class": "C",
  "artifact_count": 184,
  "byte_total": 23548273,
  "per_file_manifest_count": 184,
  "rollup_sha256": "f3e2d1...",
  "errors": [],
  "notes": "Polite-rate-limited; one 503 retry on /c/campaigns/332/idea/82746 succeeded second attempt."
}
```

`rollup_sha256` is the SHA-256 of a sorted list of all per-file SHA-256 values for the session — a single integrity number for the whole session. Verifying any single file requires that file's own `.custody.json`; verifying the entire session requires only the rollup hash.

### 4.3 Wrapper script specification

A capture wrapper exists in the Catalyst archive repo (built in Phase 4). The wrapper's behavior — specified here, implemented later:

- **Input:** a capture configuration declaring the source URL(s), authority class, output path root, and capture method.
- **Behavior:** runs the capture command; computes per-file SHA-256; emits per-file `.custody.json` manifests with the §4.1 schema; emits the session `CAPTURE_LOG.json` with the §4.2 schema; queues Wayback submissions and back-fills `wayback_url` into per-file manifests as submissions confirm.
- **Output:** the artifact tree, the manifests, the session log. Idempotent on identical inputs (running again on the same input does not produce a duplicate session log — instead it logs a "session-skipped, prior artifact present" note).
- **Atomicity:** if any stage fails for an artifact, that artifact is removed from the output tree before exit. Partial sessions never leave the archive in an inconsistent state. The session log records the failure with `errors[]` entries.
- **Politeness:** rate-limit defaults of ≤ 2 req/s per host; configurable per source. Robots.txt is respected unless explicitly overridden in the capture configuration (override is logged as `notes`).
- **Operator identity:** the wrapper reads `CAPTURE_OPERATOR` from environment; refuses to run if unset. Anonymous community captures use `CAPTURE_OPERATOR=anonymous` — the *fact* of anonymity is still recorded.

The wrapper is the chokepoint that guarantees `§24.4` compliance. No capture happens outside the wrapper.

### 4.4 Wayback Machine submission workflow

Per `§24.5`, every Class B and Class C capture is also submitted to the Wayback Machine within 24 hours.

- **Submission mechanism:** `https://web.archive.org/save/{url}` accepts a POST and returns a redirect to the Wayback snapshot URL within ~60s.
- **Submission cadence:** the wrapper submits asynchronously after the per-file capture completes; submission failures are retried up to 3 times with exponential backoff (10s, 60s, 300s) and then deferred to a daily Wayback-backlog job.
- **Backlog job:** a separate scheduled job reads the archive's manifests, finds entries with `wayback_url = null` and `source_authority_class ∈ {B, C}`, attempts re-submission, and updates the manifests.
- **Failure handling:** if a Wayback submission cannot be completed after the backlog retries, the manifest's `wayback_url` stays `null` and the manifest's `notes` field records the attempt history. Per `§24.5`, this is acceptable — the local capture is canonical; Wayback is supplementary.
- **Race condition:** if Wayback rate-limits the submission (HTTP 429 from `web.archive.org/save/`), the wrapper backs off and respects the limit; the §24.5 rule is "within 24 hours" specifically to allow for rate-limited submission completion.

## 5. Storage strategy

Reaffirms `METHODOLOGY.md §24.7`: the Catalyst archive lives in a **separate repository** from the observatory. The repository's directory layout, defined here, becomes the basis of the Phase 4 repo design:

```
catalyst-archive/
├── README.md                         ← Phase 4 deliverable
├── LICENSE                           ← Phase 4 deliverable; per-source attribution
├── INDEX.json                        ← top-level enumeration of subfolders + counts
├── CHANGELOG.md                      ← capture-session-level changelog
│
├── projectcatalyst-io/
│   ├── funds/
│   │   ├── 1/index.html
│   │   ├── 1/index.html.custody.json
│   │   ├── 1/voting-results.html
│   │   ├── 1/voting-results.html.custody.json
│   │   ├── 1/fund1-voting-results-google-drive-mirror.pdf
│   │   ├── 1/fund1-voting-results-google-drive-mirror.pdf.custody.json
│   │   ├── 2/...
│   │   ├── ...
│   │   ├── 10/fund10-voting-results.pdf
│   │   ├── 10/fund10-voting-results.pdf.custody.json
│   │   └── ...
│   ├── by-date/{YYYY-MM-DD}/funds/{N}/...   ← quarterly re-capture snapshots
│   └── INDEX.json
│
├── catalyst-core/
│   ├── repo.git/                     ← bare mirror clone, no working tree
│   ├── repo.git.custody.json
│   ├── bundles/                      ← weekly bundle hashes (not the bundles themselves)
│   │   ├── 2026-06-15.sha256
│   │   ├── 2026-06-22.sha256
│   │   └── ...
│   └── INDEX.json
│
├── ideascale/
│   ├── campaigns/
│   │   ├── 332/                      ← F9 "Great Migration"
│   │   │   ├── index.html
│   │   │   ├── index.html.custody.json
│   │   │   ├── idea/82746.html
│   │   │   ├── idea/82746.html.custody.json
│   │   │   └── ...
│   │   ├── 343/                      ← F10 campaign
│   │   ├── 348/                      ← F10 campaign
│   │   └── ...
│   ├── fund-mapping.json             ← campaign_id → fund_N derived from §3 enumeration
│   ├── CAPTURE_LOG/                  ← one log per campaign session
│   │   ├── 2026-06-15T14:00:00Z-ideascale-c332.json
│   │   └── ...
│   └── INDEX.json
│
├── catalyst-explorer/
│   ├── funds/{N}.html
│   ├── funds/{N}.html.custody.json
│   ├── api/funds/{N}.json            ← if OpenAPI surface exists
│   └── INDEX.json
│
├── milestones/
│   ├── proposals/{proposal_id}.html
│   ├── proposals/{proposal_id}.html.custody.json
│   └── INDEX.json
│
└── on-chain/
    ├── funds/{N}/payouts.queryspec.json
    ├── funds/{N}/payouts.queryspec.json.custody.json
    └── INDEX.json
```

The top-level `INDEX.json` lists subfolders and per-source artifact counts. Per-subfolder `INDEX.json` enumerates artifacts within that subfolder.

This layout mirrors the source's own URL structure where practical (e.g., `projectcatalyst-io/funds/{N}/` parallels `projectcatalyst.io/funds/{N}/`) so researchers can predict file paths from source URLs without consulting the index.

## 6. Hash strategy summary

| Artifact class | Hash | When computed | Stored in |
|---|---|---|---|
| Single file (HTML, PDF, JSON) | SHA-256 of raw bytes as written to disk | Pipeline Stage 2 | The artifact's `.custody.json` |
| Bulk capture session (wget/curl batch) | SHA-256 of sorted `find . -type f -exec sha256sum` output (rollup) | End of session | The session's `CAPTURE_LOG.json` `rollup_sha256` field |
| git mirror | SHA-256 of `git bundle create --all` output | Capture time + each re-bundle | `repo.git.custody.json` + `bundles/{date}.sha256` |
| On-chain query record | SHA-256 of the queryspec JSON bytes | At spec creation | The queryspec's `.custody.json` |

SHA-256 is the only hash function used. No SHA-1, no MD5, no truncation. This matches `METHODOLOGY.md §21.13` for observatory snapshots; the Catalyst archive uses the same primitive.

## 7. Re-capture policy summary

| Source | Re-capture cadence | Immutability |
|---|---|---|
| `projectcatalyst.io` | Quarterly + on observed structural change | Re-captures live at `by-date/{D}/funds/{N}/...`; original captures preserved |
| `input-output-hk/catalyst-core` | Weekly `git fetch`; new bundle SHA-256 recorded | Each weekly bundle hash preserved in `bundles/{date}.sha256` |
| `cardano.ideascale.com` | **Capture once.** Re-fetch only to fill documented gaps within the perishable window. After IdeaScale sunset, no further fetches possible. | Mandatory — Class C is perishable; re-fetching consumes the perishable window |
| `catalystexplorer.com` | On fund close + opportunistic | Same dated-snapshot rule as `projectcatalyst.io` |
| `milestones.projectcatalyst.io` | Quarterly while fund is open; freeze at fund-close + 6 months | Same dated-snapshot rule |
| On-chain Koios | None — the chain preserves itself | Queryspecs are versioned only when Koios's API contract changes |

The immutability rule echoes `METHODOLOGY.md §21.7` and `§24.9`: re-captures **never overwrite** prior captures. A new dated directory is created; the prior remains unchanged. This makes the archive itself a historical record of how each source evolved over time.

## 8. Verification process

A third-party researcher can verify the entire archive without operator cooperation:

1. **Clone the archive repo.** No special access required; the repo is public.
2. **Walk the directory tree.** For every `.custody.json` sidecar, locate the corresponding artifact.
3. **Recompute SHA-256 of each artifact.** Compare to the manifest's `sha256`. Mismatch ⇒ file corrupted in transit or in storage; archive failed file integrity.
4. **Fetch each `wayback_url`.** Compare to the local artifact. Mismatch ⇒ either the local file or the Wayback snapshot has drifted from the capture-time bytes; archive failed provenance integrity.
5. **Cross-reference `source_url` against the source authority hierarchy** in `METHODOLOGY.md §24.3`. Mismatch ⇒ archive misclassified a source.
6. **Replay any capture session.** Using the `CAPTURE_LOG.json` and the recorded `capture_command`, replay the same wget/curl/git operation. Compare the rollup hash to the session's recorded `rollup_sha256` (modulo content drift since `capture_date`).
7. **For on-chain queries:** issue the recorded queryspec against Koios; verify the response schema matches the queryspec's expectation.

A researcher publication citing a captured Catalyst proposal can include the artifact's SHA-256 hash and `wayback_url` as the canonical reference. Anyone reading the publication can run steps 3 and 4 above to verify they are reading what was originally captured.

## 9. Preservation risk per source

| Source | Risk class | Specific failure modes | Mitigations in this plan |
|---|---|---|---|
| `projectcatalyst.io` | Low/Medium | Domain migration to Catalyst Voices URLs; per-fund URL pattern change | Quarterly re-capture; Wayback submission per page; dated-snapshot immutability |
| `input-output-hk/catalyst-core` | Low (now); High (if deleted) | Repo marked archived → eventually deleted; bare clone is then the only copy | Bare mirror exists in archive; git bundle hash records weekly state |
| `cardano.ideascale.com` | **Highest** | Platform sunset; URLs return 404 | Single-pass capture during perishable window; Wayback submission; `--convert-links` makes captures self-contained |
| `catalystexplorer.com` | Low | Community-maintained; if maintainer steps back, content may stale | Treated as corroboration, not primary; on-fund-close capture preserves fund-state-at-close |
| `milestones.projectcatalyst.io` | Medium | Linked to IdeaScale tooling; uncertain post-Voices status | Quarterly capture; headless-browser escalation reserved for Phase 5 amendment if JS-rendered |
| On-chain Koios | Very Low | Koios maintainer steps back; API contract change | Multiple compatible explorers; queryspec is portable; chain itself preserves transactions |

Per `METHODOLOGY.md §24.9`, the lowest-risk source determines the fund's overall risk band. Eleven funds (F4–F14) carry Band 1 risk because their full proposal text exists only on Class C IdeaScale. F1–F3 are Band 2 (no IdeaScale dependency). F15 is deferred.

## 10. Dependencies on Phase 4

The capture plan is operational; Phase 4 (the preservation repository design) provides the physical home for everything specified here. Phase 4 must define:

- The Catalyst archive repository's URL (GitHub org + repo name).
- The repository's LICENSE statement clarifying per-source attribution (per `§24.7`'s license-surface note).
- The repository's README explaining what the archive is, how to use it, how to verify, and how to contribute Class E researcher captures.
- The top-level `INDEX.json` schema concrete shape.
- The repository's relationship to the observatory: linked from `methodology.html` §24, but not consumed by ETL.
- Branch protection / capture-session commit conventions (e.g., one capture session = one commit, message includes `capture_session_id`).
- The first-byte commit policy: who runs the first capture, when, against which fund's Band 1 sources first.

Until Phase 4 is drafted and approved, no Catalyst archive repository exists. Phase 5 capture is blocked.

## 11. Open questions for Phase 4

- **Catalyst Voices availability.** If Catalyst Voices ships a documented API for accessing legacy IdeaScale-era data, does FLOW-6 add a Class B Catalyst-Voices source and downgrade the Class C IdeaScale source? Provisional answer: yes if Catalyst Voices provides equivalent coverage; the §24.3 hierarchy permits it.
- **Headless-browser escalation policy.** If a milestone-tracker page is JS-rendered to the point where polite-client GET captures meaningless HTML, the plan as written says "Phase 5 produces a documented amendment." Phase 4 may want to pre-approve a headless-browser escalation policy so Phase 5 has clear permission.
- **Researcher contribution workflow.** Class E (researcher capture) requires a contribution path. Phase 4 defines the PR template, chain-of-custody review checklist, and the gating for accepting a Class E capture as a primary record (per `§24.3`).
- **Repository size budget.** Now revised downward given the Phase 3 finding that IdeaScale is preserved via Wayback (which already holds the archived bytes) and that the local archive holds only the post-strip Wayback snapshots: estimated size is in the tens-to-low-hundreds of megabytes per fund's IdeaScale content rather than gigabytes. Still — the catalyst-core bare mirror plus all of `projectcatalyst.io` plus 238 IdeaScale campaigns × ~50 KB per snapshot × multiple snapshots over time is non-trivial. Phase 4 decides: git LFS, separate object-storage host with manifests-in-repo + objects-out-of-repo, or full in-repo storage. Each has trade-offs.
- **IdeaScale API token request.** Resolved by Phase 4: NOT pursued under FLOW-6. The archive's commitment to remain reproducible by ordinary researchers excludes private-access dependencies. The Wayback CDX path (§3.2) is the canonical IdeaScale source. Known-missing campaigns remain known-missing; they are not chased via API.
- **catalyst-core decryption key.** Resolved by Phase 4: NOT requested under FLOW-6. Same reasoning — building on a special-arrangement dependency runs counter to the archive's reproducibility commitment. The encrypted bytes are preserved verbatim; if a key is later published openly by IO or Cardano Foundation, the archive's verify tooling can decrypt at that time and surface the interior content. Until then, the F2–F9 catalyst-core data is preserved as bytes-on-record, with the interior content gated on key availability.

## 12. Change log

| Date | Change |
|---|---|
| 2026-06-02 | Initial draft + Phase 3 research integration. §3 IdeaScale campaign enumeration strategy populated from research: primary path is Wayback CDX → snapshot-parse → catalystexplorer name-match; brute-force scan ruled out (no signal channel against the SPA); IdeaScale API token path documented but gated externally. §2.3 IdeaScale capture blueprint rewritten — direct `wget --mirror` invalidated by the SPA conversion finding; replaced with Wayback snapshot fetch + post-strip hash. §2.2 catalyst-core updated for repo relocation (`input-output-hk` → `cardano-foundation`) and encrypted SQLite finding for F2–F9. §11 open questions extended with IdeaScale API token request and catalyst-core decryption key request. No capture performed. |

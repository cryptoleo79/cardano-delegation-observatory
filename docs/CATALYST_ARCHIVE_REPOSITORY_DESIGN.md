# Catalyst archive repository design

**Status:** design specification.
**Owner:** observatory operator (`cryptoleo79`).
**Phase:** FLOW-6 Phase 4 (per `METHODOLOGY.md §24.12`).
**Authoritative references:** `METHODOLOGY.md §24` (preservation methodology). `docs/CATALYST_SOURCE_REGISTRY.md` (per-fund source mapping). `docs/CATALYST_CAPTURE_PLAN.md` (per-source capture blueprint). This document is downstream of all three; if it contradicts any of them, the upstream document wins and this design must be revised.

## What this document is

The design specification for the Catalyst preservation archive's separate repository. It defines every structural decision that the repository must reflect on its first commit: directory layout, license model, manifest schema, hash conventions, update policy, contributor pathway, and the contract by which it relates to the observatory.

The repository itself is not created in this commit. Its creation is the first step of Phase 5; this document is the blueprint that creation follows. The repository will be at `github.com/cryptoleo79/cardano-catalyst-archive` (proposed name; subject to confirmation when Phase 5 starts).

## Architectural facts that drive this design

Four facts established in Phases 1–3 are load-bearing for the design and are surfaced here so they cannot be lost behind layout decisions:

1. **The Wayback Machine is the canonical source for IdeaScale content under FLOW-6.** Today's `cardano.ideascale.com` is a JavaScript-rendered SPA returning an 852-byte empty shell for every URL regardless of validity. The Wayback Machine holds 238 server-rendered campaign snapshots from before the SPA conversion. **The archive does not fetch from live IdeaScale.** It fetches from Wayback. This is a major architectural fact recorded in `METHODOLOGY.md §24.9` and `docs/CATALYST_CAPTURE_PLAN.md §2.3 + §3.2`. The README must state this clearly to future readers.

2. **The archive is separate from the observatory in every dimension that can be made separate.** Different repository, different trust boundary, different lifecycle, different storage model, different license profile, different contributor pool. The two are linked only by reference in documentation (the archive's README points at `METHODOLOGY.md §24`; the observatory's methodology page points at the archive's URL). They do not share data, code, or deployment infrastructure. This is `METHODOLOGY.md §24.7`.

3. **`catalyst-core` was relocated** from `input-output-hk/catalyst-core` to `cardano-foundation/catalyst-core`, and its F2–F9 historic-data directories contain encrypted SQLite databases (`fundN_database_encrypted.sqlite3`) whose decryption key has not been published. The archive preserves the encrypted bytes verbatim; the interior content is gated on key availability — which is not pursued by FLOW-6 (see "Paths explicitly not pursued" below).

4. **The archive must remain reproducible by ordinary researchers.** No paid services, no private API tokens, no special arrangements, no authentication-gated endpoints, no captured-content access that requires the operator's relationship with any third party. A graduate student with a laptop and a network connection must be able to clone this archive and verify every artifact. This commitment is binding on every design decision below.

## Paths explicitly not pursued

Per the Phase 4 guidance ("Do not chase. Do not build dependencies around unavailable access."), the following paths are documented for completeness as factual observations but are **not part of the FLOW-6 capture plan and require no operator action**:

- **IdeaScale REST API at `/a/rest/v1/campaigns/groups/{fund_group_id}`.** The endpoint exists; the path is `robots.txt`-disallowed for the wildcard user agent; access requires a token historically held by IOG that appears to be burned. FLOW-6 does not request a token from Catalyst Foundation. If Catalyst Foundation independently publishes a structured dataset that supersedes the IdeaScale API path, the archive can add it as a Class B source at that time; until then, the Wayback path is the canonical source.
- **`catalyst-core` decryption key.** F2–F9 historic-data SQLite databases are encrypted; the key is not published. FLOW-6 does not request the key from IO or Cardano Foundation. If a key is later published openly, the archive's verify tooling can decrypt and surface the interior content at that time; until then, the encrypted bytes are preserved verbatim and the proposal-URL data within them is recorded as a known gap.

These paths are listed once here and removed from the "open questions" sections of the Phase 3 plan in the same commit as this design document. The archive is designed assuming neither path will become available.

## 1. Repository structure

The archive's top-level directory layout. Folder names are lowercase with hyphens; paths mirror source URL structure where practical to give researchers predictable lookup paths.

```
cardano-catalyst-archive/
├── README.md
├── LICENSE
├── NOTICE
├── CONTRIBUTING.md
├── METHODOLOGY.md                     ← thin pointer-only file; see §10
├── CHANGELOG.md
├── INDEX.json
│
├── projectcatalyst-io/                ← Class B source
│   ├── README.md                      ← per-source README
│   ├── INDEX.json
│   ├── funds/
│   │   ├── 1/
│   │   ├── 2/
│   │   ├── ...
│   │   ├── 15/
│   │   └── ...
│   └── by-date/{YYYY-MM-DD}/funds/{N}/   ← quarterly re-capture snapshots
│
├── catalyst-core/                     ← Class B source
│   ├── README.md
│   ├── INDEX.json
│   ├── repo.git/                      ← bare mirror clone, no working tree
│   ├── repo.git.custody.json
│   └── bundles/
│       └── {YYYY-MM-DD}.sha256        ← weekly bundle hash records
│
├── ideascale/                         ← Class C source, captured via Wayback
│   ├── README.md                      ← documents the Wayback canonical-source decision
│   ├── INDEX.json
│   ├── wayback-campaign-ids.txt       ← enumeration output from §3.2 of capture plan
│   ├── fund-mapping.json              ← canonical {campaign_id → fund_N} table
│   ├── known-missing.json             ← campaigns catalystexplorer knows but Wayback does not
│   ├── campaigns/
│   │   ├── 332/                       ← F9 "Great Migration"
│   │   │   ├── about.html             ← Wayback-fetched + post-strip
│   │   │   ├── about.html.custody.json
│   │   │   └── idea/{idea_id}.html
│   │   ├── 343/
│   │   ├── 348/
│   │   └── ...
│   └── CAPTURE_LOG/
│       └── {capture_session_id}.json
│
├── catalyst-explorer/                 ← Class D source
│   ├── README.md
│   ├── INDEX.json
│   ├── funds/{N}.html
│   └── api/
│       └── campaigns/page-{N}.json    ← from catalystexplorer's undocumented API
│
├── milestones/                        ← Class B source
│   ├── README.md
│   ├── INDEX.json
│   └── proposals/{proposal_id}.html
│
├── on-chain/                          ← Class A source (query records only)
│   ├── README.md
│   ├── INDEX.json
│   └── funds/{N}/
│       └── payouts.queryspec.json
│
└── _verify/                           ← researcher-runnable verification tooling
    ├── README.md
    ├── verify-artifact.sh             ← per-file SHA-256 + Wayback check
    ├── verify-session.sh              ← per-session rollup hash check
    ├── verify-archive.sh              ← full archive walk
    └── replay-capture.sh              ← replay a recorded capture command
```

The top-level files (`README.md`, `LICENSE`, `NOTICE`, `CONTRIBUTING.md`, `METHODOLOGY.md`, `CHANGELOG.md`, `INDEX.json`) are explained in subsequent sections. The per-source subfolders each carry their own `README.md` and `INDEX.json` for source-specific orientation; the top-level files describe the archive as a whole.

The `_verify/` folder leads with an underscore so it sorts at the top of directory listings (preceding the source subfolders alphabetically). Verification scripts are bash + `sha256sum` + `curl` only — no Python or Node dependencies. A researcher with a stock Linux/macOS box must be able to run them with no `pip install`.

## 2. README.md

The archive's top-level README, drafted here as the actual file content. Bracketed placeholders `[…]` will be filled in at first-commit time when concrete values exist.

```markdown
# Cardano Catalyst archive

Preservation archive for Cardano Catalyst's historical record — proposal text,
voting tallies, milestone status, on-chain payouts — across Fund 1 through the
most recent closed fund.

**This archive preserves. It does not curate, interpret, score, or rank.**

## What this is

A community-runnable, byte-verifiable, chain-of-custody-documented mirror of
the off-chain Catalyst record. Built to remain useful when the live sources
disappear.

## Why this exists

Cardano Catalyst's off-chain governance record has lived primarily on
`cardano.ideascale.com`. That platform is in transition; its content is
already inaccessible from the live URL (the site is a JavaScript SPA that
returns an empty shell). The Wayback Machine archived the platform before
its SPA conversion; this archive mirrors the Wayback snapshots with
chain-of-custody manifests so the captured bytes are byte-verifiable and
citable for research.

The same preservation discipline extends to `projectcatalyst.io` per-fund
landing pages, the `cardano-foundation/catalyst-core` repository,
`catalystexplorer.com` community data, the `milestones.projectcatalyst.io`
tracker, and on-chain Catalyst payout transactions reconstructible from
Koios.

## Architectural facts every reader should know

1. **IdeaScale content is preserved via the Wayback Machine, not from
   `cardano.ideascale.com` directly.** The live IdeaScale surface is a
   JavaScript SPA returning an 852-byte empty shell for every URL. The
   Wayback Machine holds server-rendered snapshots from before that
   conversion. This archive's `ideascale/campaigns/` folder is a mirror of
   those snapshots, not a mirror of the live site.
2. **`catalyst-core/repo.git/` is a bare git mirror clone**, not a working
   tree. `git clone` it locally to materialize files.
3. **`catalyst-core` F2–F9 per-fund data is stored as encrypted SQLite
   databases.** The decryption key has not been published. The archive
   preserves the encrypted bytes verbatim; their interior content is not
   extractable without the key.
4. **The archive does not pursue API tokens, special access, or
   authenticated endpoints.** Every byte in this archive was fetched from
   a publicly-accessible URL using a polite client. A graduate student
   with a stock laptop must be able to reproduce every capture from
   scratch.

## What is preserved

Per fund, the archive holds (subject to source availability):

- Per-fund landing page and voting-results page from `projectcatalyst.io`.
- IdeaScale campaign-about pages and per-proposal pages, fetched via the
  Wayback Machine, for every campaign in the Wayback CDX index for that
  fund.
- `cardano-foundation/catalyst-core` bare git mirror (covers F0–F9; F10+
  not in this repository upstream).
- `catalystexplorer.com` per-fund detail pages and the
  `catalystexplorer.com/api/campaigns` JSON dump.
- Per-funded-proposal milestone tracker pages from
  `milestones.projectcatalyst.io`.
- On-chain Catalyst payout transaction queries (Koios endpoint specifications),
  reconstructible on demand from the Cardano blockchain.

Each captured artifact carries a `.custody.json` sidecar with source URL,
capture date, capture method, capture operator, SHA-256 hash, content type,
HTTP status, source authority class, capture session ID, and Wayback URL.
See `METHODOLOGY.md` at the observatory repository, section §24.4, for the
full specification.

## What is not preserved

- Catalyst Voices governance content (the successor platform). Once
  Catalyst Voices is the canonical surface, the archive will extend; today
  it does not.
- Private proposal drafts or workspace content not published in a fund's
  voting record.
- Personal information about proposers or voters beyond what appears in
  the public Catalyst record.
- Editorial commentary on Catalyst funds, whether community-authored or
  operator-authored.

## How to use

Browse: each per-source subfolder mirrors the source URL structure. To find
a known proposal, navigate by fund and then by campaign or proposal ID.

Verify: run `_verify/verify-artifact.sh {path}` to check a single file's
SHA-256 against its manifest. Run `_verify/verify-archive.sh` to walk the
whole archive and report any integrity failures.

Cite: every captured artifact is citable via its SHA-256 hash plus its
`wayback_url` (where applicable). A publication citing a Catalyst proposal
can include the hash as the canonical reference; subsequent readers can
verify they are reading what was originally captured.

## How to contribute

Class E (researcher capture) contributions are welcomed. See
`CONTRIBUTING.md` for the chain-of-custody manifest schema your capture
must satisfy and the review checklist.

## Methodology

The full preservation methodology lives at the Cardano Delegation
Observatory repository:
[METHODOLOGY.md §24](https://github.com/cryptoleo79/cardano-delegation-observatory/blob/main/METHODOLOGY.md#24-catalyst-preservation-methodology-flow-6).

The methodology defines: source authority hierarchy, chain-of-custody
requirements, provenance retention, repository separation rule, what the
archive explicitly does NOT do, capture lifecycle, and trigger conditions.
This archive is operated in conformance with that methodology.

## License

See `LICENSE` for the archive's code and our authored manifests.
See `NOTICE` for the multi-layer license model that applies to captured
third-party content.

## Acknowledgements

This archive's existence depends on the Wayback Machine
(`web.archive.org`), the `catalystexplorer.com` community project, and the
public-data ethos of `projectcatalyst.io` and `cardano-foundation/catalyst-core`.
None of these endorse this archive; all are gratefully cited.
```

The README is intentionally readable end-to-end — not a wiki, not a checklist. A researcher arriving at the archive for the first time should be able to read the README, understand what the archive is, what it isn't, why the IdeaScale-via-Wayback structure looks the way it does, and where to start. About 700 words total in the rendered file.

## 3. LICENSE / NOTICE

The archive contains a mix of:

- **Code** we wrote (the wrapper scripts referenced in the capture plan, plus the `_verify/*.sh` scripts).
- **Authored metadata** we generated (the `.custody.json` manifests, `CAPTURE_LOG.json` session logs, `INDEX.json` enumerations, `fund-mapping.json`, `known-missing.json`, etc.).
- **Captured third-party content** preserved from external sources (proposal text, voting results, milestone records, etc.), which retains its source-of-origin license terms.

The multi-layer license is encoded in two files:

### LICENSE (Apache License 2.0)

The standard Apache 2.0 text applies to:

- All code in `_verify/`
- All authored metadata files (manifests, logs, indices) at the operator's choice — Apache 2.0 covers these, but they are simultaneously released under CC0 per the NOTICE so downstream users can choose either license. Authored metadata is brief, factual, and the dual-release removes any redistribution friction.

### NOTICE (license clarifications)

A NOTICE file in the repository root documents:

> ```
> This repository contains:
>
> (1) Code (under _verify/ and any future tooling):
>     Licensed under the Apache License, Version 2.0. See LICENSE.
>
> (2) Authored metadata (.custody.json, CAPTURE_LOG.json, INDEX.json,
>     fund-mapping.json, known-missing.json, and similar files
>     produced by this archive's tooling or by its operator):
>     Released under CC0 1.0 Universal (Creative Commons Zero) AND
>     simultaneously under the Apache License 2.0. Downstream users
>     may use either license at their option.
>
> (3) Captured third-party content (HTML, PDF, JSON, binary files
>     mirrored from cardano.ideascale.com, projectcatalyst.io,
>     catalystexplorer.com, milestones.projectcatalyst.io,
>     cardano-foundation/catalyst-core, the Wayback Machine, and
>     similar sources):
>
>     These files are preserved here under archival-preservation
>     principles. Each artifact's .custody.json sidecar records the
>     source URL from which downstream users can determine the
>     applicable license. Specifically:
>
>     - Content from cardano-foundation/catalyst-core is generally
>       licensed by its repository; consult the upstream LICENSE in
>       that repository for the specific terms.
>     - Content from projectcatalyst.io is subject to the website's
>       terms of service; archival preservation of publicly-published
>       content is the basis for inclusion here.
>     - Content from cardano.ideascale.com (captured via the Wayback
>       Machine) consists of proposal text authored by individual
>       proposers, who retain their copyrights; archival preservation
>       is the basis for inclusion here.
>     - Content from catalystexplorer.com is licensed by the
>       catalystexplorer project (Apache 2.0 per the planning
>       artifact).
>     - On-chain transaction queries are CC0 by virtue of being
>       references to public-ledger data.
>
>     Downstream re-use of any captured artifact must respect the
>     source-of-origin license. The .custody.json sidecar is the
>     canonical reference for determining that license.
>
> The archive operator does not assert copyright over captured
> third-party content. The archive holds the content under fair-use /
> archival-preservation grounds, with chain-of-custody manifests
> documenting how, when, and from where each artifact was captured.
> ```

This is not legal advice; it is the operator's good-faith disclosure of the license layering. A future legal review may produce refinements; if it does, NOTICE is updated and the change is recorded in CHANGELOG.md.

## 4. INDEX.json schema

Two distinct INDEX.json schemas: the top-level archive index and the per-subfolder source index.

### 4.1 Top-level `INDEX.json`

```json
{
  "schema": "cardano-catalyst-archive-index-v1",
  "archive_version": "1.0.0",
  "methodology_reference": "https://github.com/cryptoleo79/cardano-delegation-observatory/blob/main/METHODOLOGY.md#24-catalyst-preservation-methodology-flow-6",
  "methodology_version_at_index_emission": "0.9",
  "last_updated": "2026-06-15T18:42:11Z",
  "last_session_id": "2026-06-15T14:00:00Z-ideascale-c332",
  "subfolders": {
    "projectcatalyst-io": {
      "source_authority_class": "B",
      "artifact_count": 47,
      "last_capture_date": "2026-06-12",
      "subfolder_index": "projectcatalyst-io/INDEX.json"
    },
    "catalyst-core": {
      "source_authority_class": "B",
      "artifact_count": 1,
      "last_capture_date": "2026-06-14",
      "subfolder_index": "catalyst-core/INDEX.json",
      "notes": "Single bare git mirror; per-week bundle hashes listed in subfolder index."
    },
    "ideascale": {
      "source_authority_class": "C",
      "artifact_count": 1843,
      "last_capture_date": "2026-06-15",
      "subfolder_index": "ideascale/INDEX.json",
      "notes": "Captured via Wayback Machine; live IdeaScale not fetched."
    },
    "catalyst-explorer": {
      "source_authority_class": "D",
      "artifact_count": 28,
      "last_capture_date": "2026-06-10",
      "subfolder_index": "catalyst-explorer/INDEX.json"
    },
    "milestones": {
      "source_authority_class": "B",
      "artifact_count": 1247,
      "last_capture_date": "2026-06-13",
      "subfolder_index": "milestones/INDEX.json"
    },
    "on-chain": {
      "source_authority_class": "A",
      "artifact_count": 14,
      "last_capture_date": "2026-06-14",
      "subfolder_index": "on-chain/INDEX.json",
      "notes": "Query specs only; the chain itself preserves the transactions."
    }
  }
}
```

### 4.2 Per-subfolder `INDEX.json`

Each per-source subfolder carries its own INDEX.json enumerating that source's artifacts. The shape is source-specific but follows a common skeleton:

```json
{
  "schema": "cardano-catalyst-archive-source-index-v1",
  "source": "ideascale",
  "source_authority_class": "C",
  "source_root_url": "https://cardano.ideascale.com/",
  "capture_mode": "via-wayback-machine",
  "last_updated": "2026-06-15T18:42:11Z",
  "artifact_count": 1843,
  "fund_coverage": {
    "F4": { "campaign_count": 7, "artifact_count": 124 },
    "F5": { "campaign_count": 9, "artifact_count": 156 },
    "F9": { "campaign_count": 13, "artifact_count": 215, "anchor_campaign_id": 332 }
  },
  "session_log_paths": [
    "CAPTURE_LOG/2026-06-15T14:00:00Z-ideascale-c332.json",
    "CAPTURE_LOG/2026-06-15T14:30:00Z-ideascale-c343.json"
  ]
}
```

The subfolder index does not enumerate every artifact path (that would duplicate the filesystem). It enumerates the structural metadata that a researcher needs to navigate: fund coverage, campaign counts, session logs. Per-artifact lookup is by filesystem path; per-artifact integrity is via the artifact's `.custody.json`.

The two INDEX.json layers are designed for low-cost updates: appending a single artifact updates the per-subfolder INDEX.json's counts and the top-level INDEX.json's `last_capture_date`. Neither requires re-walking the archive.

## 5. Chain-of-custody layout

Reaffirms `METHODOLOGY.md §24.4` and `docs/CATALYST_CAPTURE_PLAN.md §4.1`. The chain-of-custody at every level:

```
For artifact at path {P}:
  - Artifact bytes at {P}
  - Sidecar manifest at {P}.custody.json

For a bulk capture session producing N artifacts:
  - N per-artifact pairs as above
  - Per-session log at {SOURCE}/CAPTURE_LOG/{session_id}.json
  - All per-artifact manifests reference the session log by capture_session_id

For each source subfolder:
  - Per-source INDEX.json enumerating fund/campaign coverage and session logs

For the archive as a whole:
  - Top-level INDEX.json enumerating subfolders and counts
  - CHANGELOG.md recording every capture session at the archive level
```

No artifact enters the archive without a sidecar. No session completes without a session log. No commit lands without an INDEX.json update. The wrapper script (specified in `docs/CATALYST_CAPTURE_PLAN.md §4.3`) is the only mechanism that writes to the archive; manual edits are prohibited by convention and would fail the verification chain.

## 6. Manifest structure (`.custody.json` JSON Schema)

The canonical JSON Schema for per-artifact custody manifests, drawn from `METHODOLOGY.md §24.4` and finalized here:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://github.com/cryptoleo79/cardano-catalyst-archive/schema/custody-v1.json",
  "title": "Catalyst artifact chain-of-custody manifest",
  "type": "object",
  "required": [
    "schema",
    "source_url",
    "capture_date",
    "capture_method",
    "capture_operator",
    "sha256",
    "content_type",
    "source_authority_class"
  ],
  "properties": {
    "schema": {
      "type": "string",
      "const": "custody-v1"
    },
    "source_url": {
      "type": "string",
      "format": "uri",
      "description": "The exact URL the artifact represents, including query parameters."
    },
    "source_url_aliases": {
      "type": "array",
      "items": { "type": "string", "format": "uri" },
      "description": "Optional. Historical URLs that previously resolved to the same content (e.g., a relocated GitHub repo's old URL)."
    },
    "capture_date": {
      "type": "string",
      "format": "date-time",
      "description": "UTC timestamp of the fetch, ISO 8601, second precision or better."
    },
    "capture_method": {
      "type": "string",
      "description": "Tool and flags used. Examples: 'curl -sL --user-agent cdo-preserve/1.0', 'wget --mirror --convert-links ...', 'git clone --mirror'."
    },
    "capture_operator": {
      "type": "string",
      "description": "Who performed the capture. GitHub handle, attribution string, or 'anonymous' (the fact of anonymity is still recorded)."
    },
    "capture_session_id": {
      "type": "string",
      "description": "Optional. References the per-session CAPTURE_LOG.json for bulk captures."
    },
    "sha256": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$",
      "description": "SHA-256 of the raw bytes as written to disk, lowercase hex."
    },
    "content_type": {
      "type": "string",
      "description": "HTTP Content-Type header, or equivalent for non-HTTP captures."
    },
    "http_status": {
      "type": ["integer", "null"],
      "description": "HTTP response status code. Null for non-HTTP captures."
    },
    "source_authority_class": {
      "type": "string",
      "enum": ["A", "B", "C", "D", "E"],
      "description": "Per METHODOLOGY.md §24.3. A=on-chain, B=official, C=at-risk platform, D=community, E=researcher."
    },
    "wayback_url": {
      "type": ["string", "null"],
      "format": "uri",
      "description": "Wayback Machine snapshot URL. Mandatory for Class C captures (the canonical fetch target). Supplementary for Class B; null if Wayback submission has not yet been confirmed or has failed permanently. Null is permitted only if notes documents the failure."
    },
    "post_strip_applied": {
      "type": "boolean",
      "description": "Optional. True for Wayback-sourced HTML where the Wayback toolbar was stripped before hashing. Default false."
    },
    "notes": {
      "type": ["string", "null"],
      "description": "Operationally relevant context. Never editorial."
    }
  }
}
```

The schema is committed at `_verify/schema/custody-v1.json` in the archive repo so manifests can be validated automatically. Manifest violations (missing required fields, malformed SHA-256, invalid authority class) fail the per-artifact verification.

## 7. Hash conventions

SHA-256 is the only hash function used in the archive. No SHA-1, no MD5, no truncation. Same primitive as the observatory's `METHODOLOGY.md §21.13`.

| Artifact kind | What is hashed | When |
|---|---|---|
| Single file from an HTTP/curl fetch | Raw bytes as written to disk, pre-compression, pre-transformation | At capture time, in pipeline Stage 2 |
| Wayback-sourced HTML | Bytes after the Wayback toolbar strip (the IdeaScale content alone) | At capture time, after the strip operation |
| `wget --mirror` session | Per-file SHA-256 plus a rollup SHA-256 of the sorted per-file hash list | Per-file at capture; rollup at session end |
| Git mirror clone | SHA-256 of `git bundle create archive.bundle --all` output | At capture time and at each re-bundle |
| On-chain query record | SHA-256 of the queryspec JSON bytes | At spec creation |
| Authored metadata file (INDEX.json, fund-mapping.json) | Not separately hashed — it is itself an index | n/a |

Hashes are hex-encoded lowercase, no separators, 64 characters. Verification scripts use `sha256sum`'s default output format.

Re-computation must produce identical hashes. If a manifest's recorded hash does not match a fresh `sha256sum` of the artifact bytes, the archive's integrity has failed for that artifact. The verify script's exit code distinguishes "file missing" (exit 1) from "hash mismatch" (exit 2) from "ok" (exit 0).

## 8. Directory hierarchy conventions

The archive's filesystem path conventions:

- **Top-level subfolders are one per source.** Names match the source's hostname or canonical identifier with hyphens (`projectcatalyst-io/`, `catalyst-core/`, `ideascale/`, `catalyst-explorer/`, `milestones/`, `on-chain/`). Lowercase.
- **Within a subfolder, paths mirror the source's own URL structure as closely as filesystem semantics allow.** Example: `projectcatalyst.io/funds/9/voting-results` becomes `projectcatalyst-io/funds/9/voting-results.html`. The mirroring is a navigation affordance; a researcher who knows the source URL can predict the archive path without consulting the index.
- **Dated re-captures live under `by-date/{YYYY-MM-DD}/`** within their source subfolder. Example: a 2026-09-15 re-fetch of fund 9's landing page goes to `projectcatalyst-io/by-date/2026-09-15/funds/9/index.html`. The original first-capture lives at `projectcatalyst-io/funds/9/index.html` and is never overwritten.
- **Sidecar manifests are colocated with their artifact.** Pattern: `{artifact}.custody.json` immediately next to `{artifact}`. No separate `manifests/` directory — researchers walking the tree see them together.
- **Per-session CAPTURE_LOGs are at the source subfolder root in `CAPTURE_LOG/`** (uppercase folder name to distinguish from any potential lowercased operational paths). Filename: `{session_id}.json`. Session IDs use the convention `{YYYY-MM-DDTHH:MM:SSZ}-{source}-{descriptor}` (e.g., `2026-06-15T14:00:00Z-ideascale-c332`).
- **`_verify/` is the only top-level folder with a leading underscore** — sorts to the top of directory listings, distinguishes operator-tooling from captured-content.
- **File names are conservative.** ASCII, lowercase, hyphenated, no spaces, no special characters except `.` and `-`. Source content that uses other characters in its URL path is escaped via URL-encoding conventions in the local filename, with the original URL preserved in the manifest.

The conventions are documented in `CONTRIBUTING.md` so Class E contributors follow them.

## 9. Update policy

The archive's update discipline:

### 9.1 One capture session = one commit

Each successful capture session produces one commit. The commit message includes the `capture_session_id` so it is searchable from `git log`. Format:

```
Capture session {session_id}: {source} ({fund_or_target}), {artifact_count} artifacts

Per docs/CATALYST_CAPTURE_PLAN.md §{section}.
Session log: {source}/CAPTURE_LOG/{session_id}.json.
Rollup SHA-256: {rollup_hash_first_16_chars}…
```

A session that fails partway through produces no commit; the wrapper script (per `docs/CATALYST_CAPTURE_PLAN.md §4.3`) leaves the archive untouched and writes the failure to a session log only.

### 9.2 Branch protection

The `main` branch is protected on GitHub:

- Direct pushes disabled (except by the repository administrator for repository configuration changes; never for capture sessions).
- PRs required for all capture sessions and Class E contributions.
- A PR check (GitHub Actions workflow or equivalent) runs the verification scripts against the new artifacts and blocks merge on failure.
- No squash-on-merge — each commit is preserved so `git log` records the full session history. (Squashing would collapse the per-session granularity that makes the archive's history searchable.)

### 9.3 Re-captures never overwrite

Same rule as `METHODOLOGY.md §21.7` (observatory snapshots) and `docs/CATALYST_CAPTURE_PLAN.md §7`. A re-capture of an already-captured URL produces a new dated artifact at `{source}/by-date/{D}/{path}/`. The original capture at `{source}/{path}/` is preserved unchanged.

The first capture of any URL goes to the canonical path; subsequent re-captures go to `by-date/`. This is asymmetric (the first capture does not get a `by-date/` entry) for operational simplicity — most artifacts are captured once and never re-captured, and a `by-date/2026-06-15/funds/9/index.html` mirror of every first capture would double the directory tree without preservation benefit.

### 9.4 Authored-metadata updates

`INDEX.json`, `fund-mapping.json`, `known-missing.json`, and similar authored-metadata files are updated in the same commit as the capture session that triggers the change. The update is atomic with the artifact additions. A capture session that adds new artifacts but fails to update the relevant INDEX.json files is rejected by the PR check.

### 9.5 No backfill of capture metadata

If a `.custody.json` manifest was emitted with incomplete fields (e.g., `wayback_url: null` because the Wayback submission did not complete in the original session), the field is updated later by the Wayback-backlog job per `docs/CATALYST_CAPTURE_PLAN.md §4.4`. The update is recorded as a separate commit by the backlog job, with a commit message that references the original `capture_session_id` so the history shows the back-fill.

The manifest's `capture_date` is never modified. The capture date is the date of the original fetch; any later update to fields like `wayback_url` reflects that later state, not a re-capture.

## 10. Boundary contract with the observatory

The archive and the observatory are linked by reference only.

### 10.1 What the observatory references about the archive

- The observatory's `METHODOLOGY.md §24` is the methodological authority over the archive's preservation discipline. The archive's `METHODOLOGY.md` is a thin pointer file containing only:
  ```markdown
  # Methodology
  This archive is governed by METHODOLOGY.md §24 at the Cardano Delegation
  Observatory repository:
  https://github.com/cryptoleo79/cardano-delegation-observatory/blob/main/METHODOLOGY.md#24-catalyst-preservation-methodology-flow-6
  
  This file exists so the archive's repository carries a copy of the
  methodology reference for offline citation. The observatory's
  METHODOLOGY.md is the authoritative version.
  ```
- The observatory's `methodology.html` may link to the archive's URL in a future commit (currently the observatory does not consume the archive's data).

### 10.2 What the archive does NOT reference about the observatory

- The archive does not depend on the observatory's deployment, ETL, or database.
- The archive's verification scripts do not call out to observatory URLs.
- The archive does not import data from `data/snapshots/`.
- A researcher cloning the archive does not need the observatory repo cloned or available to verify or use the archive.

### 10.3 What flows between the two

Only documentation cross-references. Specifically:

```
┌──────────────────────────────┐       references         ┌──────────────────────────────┐
│  Observatory                 │ ───────────────────────▶ │  Catalyst archive            │
│  METHODOLOGY.md §24          │                          │  Repository URL              │
│                              │                          │                              │
│  methodology.html §24 (if    │                          │  Top-level README.md         │
│  the archive's URL is added  │                          │  (links back to              │
│  there in a future commit)   │                          │  METHODOLOGY.md §24)         │
└──────────────────────────────┘ ◀─────────────────────── └──────────────────────────────┘
                                  references back
```

That is the entire boundary contract. No data flow, no code dependency, no shared deployment. They are two independent artifacts that happen to share an operator and a methodology authority.

### 10.4 Why the separation is preserved

Per `METHODOLOGY.md §24.7`'s four reasons (footprint, lifecycle, license surface, trust boundary), conflating the two would create operational and license confusion that benefits no one. The observatory is a numerical observability layer with daily-tempo updates and a lean Apache-2.0 + CC0 license profile. The archive is a content-preservation layer with bursty-write-then-mostly-read lifecycle and a multi-layer license profile (Apache 2.0 + CC0 + per-source-of-origin). Each is best served by its own repository.

If, in a distant future phase, the observatory wants to surface limited cross-references to archive artifacts (e.g., on a per-DRep page, link to any Catalyst proposals the DRep authored), that surfacing has its own methodology section at that time. Phase 4 does not pre-bless any such integration.

## Open questions

The Phase 3 plan listed four open questions for Phase 4. After the Phase 4 design pass, the questions are resolved as follows:

1. **Catalyst Voices availability for legacy IdeaScale-era data.** Resolved as deferred. If Catalyst Voices publishes a structured legacy dataset, the archive can add it as a Class B source at that time. No design accommodation needed in advance — the source authority hierarchy already permits adding a new Class B source whenever one appears.
2. **Headless-browser escalation policy for JS-rendered milestone pages.** Resolved as Phase 5 amendment. If polite-client capture of `milestones.projectcatalyst.io` returns insufficient content, Phase 5 produces a documented amendment to `docs/CATALYST_CAPTURE_PLAN.md §2.5` specifying the headless-browser tool (Playwright or equivalent) and the chain-of-custody implications. Pre-approval not granted; the amendment must be reviewed at the time.
3. **Researcher contribution workflow.** Resolved by `CONTRIBUTING.md` (drafted as part of Phase 5 first-commit). Class E contributors submit PRs against `main` with their captured artifacts + `.custody.json` manifests. The operator reviews chain-of-custody compliance; the PR check runs the verification scripts; approval and merge are gated on both passing.
4. **Repository size budget.** Resolved as in-repo storage for the initial archive. Phase 3 revised the estimate downward (Wayback-based IdeaScale is tens-to-low-hundreds of MB rather than GBs); the catalyst-core bare mirror is a single repo's bytes; the other sources are MBs each. Total estimated initial archive size: 1–3 GB. GitHub's standard repository limits accommodate this; git LFS not required at the start. If the archive grows beyond GitHub's soft limits in a future capture cycle, the design is revisited then.

The Phase 3 plan also listed two additional open questions (IdeaScale API token request, catalyst-core decryption key request). Both are now resolved as **not pursued under FLOW-6**, per the Phase 4 guidance ("Do not chase. Do not build dependencies around unavailable access."). The corresponding entries in `docs/CATALYST_CAPTURE_PLAN.md §11` are revised to reflect this resolution in the same commit as this design document.

## Implementation order (when Phase 5 starts)

When the gate clears and Phase 5 begins, the archive repository is created in this order:

1. **Create the repository** at `github.com/cryptoleo79/cardano-catalyst-archive` (or chosen name). Public, no Catalyst-Foundation-controlled access required.
2. **Commit the first six files**: `README.md`, `LICENSE` (Apache 2.0), `NOTICE`, `CONTRIBUTING.md`, `METHODOLOGY.md` (the pointer file), `CHANGELOG.md` (empty entry stub). No captured artifacts yet.
3. **Commit the empty top-level `INDEX.json`** with all subfolder entries at `artifact_count: 0` and `last_capture_date: null`.
4. **Commit the `_verify/` scripts.** `verify-artifact.sh`, `verify-session.sh`, `verify-archive.sh`, `replay-capture.sh`, plus the `_verify/schema/custody-v1.json` JSON Schema. Test on synthetic input — no real captures yet.
5. **Commit the empty per-source `README.md` and `INDEX.json` files** for each subfolder.
6. **Enable branch protection on `main`** and write the PR-check GitHub Actions workflow that runs the verification scripts on new artifacts.
7. **First real capture session.** The first artifact ever captured is the lowest-risk highest-value target: re-capture of `projectcatalyst.io/funds/9/` (Class B, Band 2, full coverage, no Wayback dependency). This exercises the full pipeline end-to-end on a benign artifact before the Class C IdeaScale captures begin.
8. **First Class C capture session.** With the pipeline verified on Class B, begin the IdeaScale-via-Wayback enumeration: fetch the Wayback CDX, write `ideascale/wayback-campaign-ids.txt`, parse fund mappings, write `ideascale/fund-mapping.json`. Then per-campaign Wayback snapshot fetches in order.
9. **Subsequent sessions** by descending priority per `docs/CATALYST_CAPTURE_PLAN.md §9` (preservation risk per source).

Phase 5 is a multi-week effort. The implementation order ensures that:
- Verification tooling is tested before any real artifact depends on it.
- The pipeline is exercised on Class B before Class C — failures are easier to debug on the lower-risk path.
- The first IdeaScale capture is preceded by a complete enumeration so the operator knows the full scope before committing to the bulk capture.

## Change log

| Date | Change |
|---|---|
| 2026-06-02 | Initial design specification for the separate Catalyst preservation archive repository. Ten deliverables specified: repository structure, README content, LICENSE+NOTICE model, INDEX.json schemas (top-level and per-subfolder), chain-of-custody layout, custody-v1 JSON Schema for `.custody.json` manifests, hash conventions, directory hierarchy conventions, update policy, observatory boundary contract. Open questions resolved or explicitly deferred. Implementation order specified for Phase 5. No repository created; no capture performed. |

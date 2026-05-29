# Cardano Catalyst / IdeaScale preservation plan

**Status:** planning document. No capture has begun.
**Owner:** observatory operator (`cryptoleo79`).
**Scope:** separate from observatory.asy.life; precondition for any future FLOW-6 Catalyst archive feature.

## Why this exists

The observatory's design philosophy is "preserve governance memory." The most at-risk historical governance corpus in the Cardano ecosystem is Catalyst's IdeaScale data: the proposal text, voting tallies, and milestone status for Funds 1 through current.

Catalyst Voices is rolling out as IdeaScale's replacement. When IdeaScale is fully sunset, all `cardano.ideascale.com` URLs will orphan. The earliest funds (Fund1–Fund8) already have inconsistent coverage on `projectcatalyst.io` — the IdeaScale entries are often the most complete record.

**If we wait until FLOW-6 implementation is ready, the data we'd want to ingest may no longer exist.**

## Preservation is not endorsement

The purpose of this preservation effort is **historical continuity, reproducibility, and governance memory.** It is **not** validation, promotion, or endorsement of any proposal, recipient, fund, or methodology.

Capturing a proposal page does not mean the observatory or its operator endorses the proposal's content, agrees with its outcome, or believes it deserved funding. Capturing a milestone tracker entry does not mean the observatory takes a position on whether the milestone was met. Capturing a voting result does not mean the observatory endorses the tally as just or unjust.

The act of preserving is the act of recording. What was recorded must be retrievable later so that researchers, historians, and the community can reason about Cardano governance without the data having disappeared. **Reasoning is the reader's job; preservation is the observatory's job.**

This rule applies equally to:

- Successfully funded proposals and unfunded proposals.
- Proposals that delivered their milestones and those that did not.
- Recipients who later became prominent ecosystem participants and those who did not.
- Funds that the community considers successes and those it considers failures.

The archive surfaces them all without ranking, framing, or commentary.

## Risk inventory

| Source | Risk | Time to act |
|---|---|---|
| `cardano.ideascale.com` proposal pages | **Highest.** Will orphan at IdeaScale sunset. Timeline uncertain but moving. | Immediate (≤ 30 days) |
| `input-output-hk/catalyst-core` archived repo | Moderate. IO could remove the archive flag → cleanup → deletion. | Soon (≤ 60 days) |
| `projectcatalyst.io/funds/{N}` landing pages | Lower. Likely to migrate to new domain rather than disappear. | Routine |
| `milestones.projectcatalyst.io` per-proposal pages | Moderate. Linked to IdeaScale tooling; uncertain post-Voices. | Soon |
| `catalystexplorer.com` | Lower. Community-maintained, Apache 2.0, mirror-friendly. | Routine |

## Source inventory

Compiled from a prior research pass.

**Official:**

- `projectcatalyst.io/funds/{N}/` — per-fund landing pages, F1–F14+
- `projectcatalyst.io/funds/{N}/voting-results` — per-fund voting CSVs via Google Sheets (F3, F9, F11, F12, F13, F14)
- `projectcatalyst.io/fund10-voting-results.pdf` — Fund10 is PDF-only
- `milestones.projectcatalyst.io/` — official milestone status tool
- `input-output-hk/catalyst-core` (GitHub, archived) — Fund4–Fund10 snapshot tables, BROTLI-compressed JSON
- `input-output-hk/voting-tools` (GitHub) — snapshot reproduction

**Community-maintained:**

- `catalystexplorer.com` — Lido Nation, Apache 2.0, OpenAPI-backed
- `lidonation.com/en/project-catalyst/projects` — same corpus, alternate view

**At-risk:**

- `cardano.ideascale.com/c/cardano/idea/*` — IdeaScale-hosted; no public API; sunset risk

## Capture strategy

**Priority 1 — at-risk archives (capture within 30 days):**

- [ ] `wget --mirror` or `httrack` against `cardano.ideascale.com/c/cardano/idea/*` URLs by fund. Tens of thousands of pages.
- [ ] Wayback Machine submissions (`web.archive.org/save/`) for the same URLs. Belt-and-suspenders.
- [ ] `git clone --mirror github.com/input-output-hk/catalyst-core` — guarantees local copy.

**Priority 2 — fund-level data (capture within 60 days):**

- [ ] Per-fund landing pages (HTML + PDF) for F1–F14+.
- [ ] Per-fund voting-results CSVs (Google Sheets download) for every fund that publishes one.
- [ ] Fund10 voting results PDF.
- [ ] `catalystexplorer.com` OpenAPI dump.

**Priority 3 — milestone and on-chain data (capture within 90 days):**

- [ ] `milestones.projectcatalyst.io` per-proposal status pages.
- [ ] Catalyst payout transactions on-chain — reconstructible via Koios; less time-critical because the chain itself preserves these.
- [ ] Catalyst Voices early-access documentation once available.

## Chain-of-custody

Every archived artifact carries a chain-of-custody record documenting how, when, and from where it was captured. This is essential for researchers using the archive to verify authenticity and provenance.

For each captured artifact, record:

- **Source URL** — the exact URL the artifact was fetched from.
- **Capture date** — UTC timestamp of the capture (ISO 8601 format).
- **Capture method** — the tool used (`wget`, `httrack`, `curl`, `git clone`, browser save, manual screenshot).
- **Capture operator** — who performed the capture (operator identity, or "anonymous community contribution" for non-attributable sources).
- **SHA-256 hash** — of the raw captured bytes.
- **Source content-type** — e.g., `text/html`, `application/json`, `application/pdf`.
- **HTTP response headers** (if applicable) — preserved as a sidecar `.headers.txt` file.
- **Notes** — any operationally relevant context (e.g., "URL returned 200 after retry; first attempt timed out").

### Storage convention

For each artifact at path `{relative_path}`, store a sidecar manifest at `{relative_path}.custody.json`:

```json
{
  "source_url": "https://cardano.ideascale.com/c/cardano/idea/123456",
  "capture_date": "2026-06-01T14:30:00Z",
  "capture_method": "wget --mirror --convert-links --adjust-extension",
  "capture_operator": "cryptoleo79",
  "sha256": "abc123…",
  "content_type": "text/html",
  "notes": ""
}
```

A top-level `INDEX.json` in each archive subfolder lists all artifacts with pointers to their custody manifests for one-call enumeration.

If a single capture operation produces many artifacts (e.g., `wget --mirror` of a fund's IdeaScale section), the per-file custody manifests are generated automatically by a small wrapper script. The wrapper records the parent capture operation in a `CAPTURE_LOG.json` for that session.

### Verifiability

Future researchers can verify:

- That the captured file's SHA-256 matches the recorded hash (file integrity).
- That the source URL is intact, or — if dead — that the Wayback Machine holds the same content at the recorded capture date (provenance retention).
- That the capture method and operator are documented (process transparency).

This makes the archive **citable, auditable, and durable.** A paper or talk that cites a captured Catalyst proposal can include the sidecar manifest hash as the canonical reference; subsequent readers can verify the same file is what was originally captured.

## Storage strategy

**Separate filesystem area from the observatory repo.** The capture footprint is hundreds of MB to GBs; not appropriate for the observatory's lean repo profile.

Suggested layout:

```
ideascale-archive/
├── README.md         (what this is, capture method overview, link to this plan)
├── INDEX.json        (master enumeration of all captured artifacts + manifests)
├── projectcatalyst/  (landing pages, voting CSVs, milestone screenshots)
├── ideascale/        (HTML mirror by fund/proposal)
├── catalyst-core/    (git clone --mirror)
└── catalystexplorer/ (API dump JSON, timestamped)
```

Hosted in a separate repo (private OK initially). Periodic mirror to long-term archival storage (IPFS / Arweave / a researcher-friendly host) once the capture stabilizes.

## Timeline

| Window | Activity |
|---|---|
| Days 1–30 | Priority 1 captures (highest at-risk). |
| Days 30–60 | Priority 2 captures. |
| Days 60–90 | Priority 3 captures. |
| Days 90+ | Maintenance: re-fetch on Catalyst Voices launch, when official APIs ship. |

## Trigger conditions

Start capture **before** any of:

- Catalyst Voices announces a formal IdeaScale shutdown date.
- `cardano.ideascale.com` returns first 404 on a previously-working URL.
- IO archives the `catalyst-core` repo with a "deleted" mark (currently still browsable).

Each is a different signal. The first is the most likely; the second is the hard deadline.

## When this becomes FLOW-6 implementation

FLOW-6 methodology drafting waits for the capture to be substantially complete. **The capture is not FLOW-6 — it is a precondition.**

When enough archive exists, the FLOW-6 methodology will need to decide which captured source is canonical for each fund. That decision is held until enough capture exists to make the comparison.

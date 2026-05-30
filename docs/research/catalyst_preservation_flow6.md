# Catalyst preservation — FLOW-6 plan extension

**Status:** Research only. Extends `docs/IDEASCALE_PRESERVATION.md` with primary-source risk assessment, archival method comparison, and concrete capture methodology. No code, no methodology edits to the existing doc.
**Date:** 2026-05-29
**Scope:** IdeaScale sunset risk, Catalyst Voices completeness, archival method selection, GDPR/copyright considerations, trigger conditions.

---

## Executive summary

No formal IdeaScale sunset date has been publicly announced as of 2026-05-29. However, **Catalyst Voices development is advanced** (4 of 6 milestones complete; voting & delegation targeted January 2026), and **stewardship of Project Catalyst transferred from IOG to the Cardano Foundation in March 2026** ([Cardano Foundation, Feb 2026 activities](https://cardanofoundation.org/blog/february-2026-activities); [Cardano Forum, March 2026 Digest](https://forum.cardano.org/t/digest-march-03-2026-)). Fund15 and Fund16 are paused pending reassessment. The risk window for IdeaScale archival is **now**, before either platform stabilizes or operational policies are published.

Recommended action: begin minimum viable preservation by 2026-06-15 (within 14 days), using **catalyst-toolbox** for IdeaScale API extraction + **Wayback Machine** batch submission for redundancy. Comprehensive Browsertrix Cloud crawl of top-funded proposals follows within 30 days.

---

## Part 1 — Sunset risk assessment

### Catalyst Voices milestones (Fund10 project)

- Open Source Setup — Nov 2023 — completed
- Architectural Updates — Apr 2024 — completed
- Backend & Wallet Integration — Jul 2024 — completed
- Proposal Submission in Production — Mar 2025 — completed
- Voting & Delegation — Jan 2026 — status as of May 2026: not yet reported complete
- Demonstration — Feb 2026 — not yet reported

Budget: 840,000 ADA. 714,000 distributed across the first 5 milestones.

### Governance transition signals

- Project Catalyst stewardship: IOG → Cardano Foundation, effective March 2026.
- Fund15 / Fund16 paused.
- This increases uncertainty about IdeaScale lifecycle decisions, since the new steward inherits policy and may revise timelines.

### Risk interpretation

- The Catalyst Voices project is mature for *submission* but not yet feature-complete for *voting*.
- Absence of a shutdown date does not mean low risk; it means the decision is not yet public.
- IdeaScale.com may continue as a commercial service for other customers; the at-risk artifact is the Cardano-specific instance at `cardano.ideascale.com`.
- Historical proposal URLs (`cardano.ideascale.com/c/cardano/idea/*`) have no public preservation guarantee.

### Trigger conditions (extending IDEASCALE_PRESERVATION.md)

| Signal | Action | Urgency |
|---|---|---|
| Catalyst Voices announces formal IdeaScale shutdown date | Begin MVP immediately; escalate Browsertrix budget | CRITICAL |
| First 404 on a previously-working `cardano.ideascale.com` proposal URL | Begin emergency crawl within 24h | CRITICAL |
| `catalyst-core` GitHub repo archived/deletion-marked | Clone immediately | HIGH |
| Voting milestone completes on Catalyst Voices | Capture Voices API schema + first production data dump | HIGH |
| IdeaScale announces sunset 60+ days in advance | Proceed to comprehensive archive phase | MEDIUM |
| GDPR right-to-be-forgotten request received | Pause archive release; consult legal | MEDIUM |

**Current urgency: IMMEDIATE** (begin MVP within 14 days, by 2026-06-15).

---

## Part 2 — Catalyst Voices completeness vs IdeaScale (gap matrix)

| Artifact | IdeaScale source | Catalyst Voices equivalent | Preservation status |
|---|---|---|---|
| Proposal text (title, problem, solution, metrics) | HTML + IdeaScale API | Yes, persists in Voices schema | **High confidence** — will transfer or be available via Voices API |
| Proposal comments | Nested thread comments on proposal pages | **Unknown** — no published Voices comment feature as of 2026-05 | **GAP** — must capture immediately |
| Assessment scores | Community review scores on IdeaScale stages | Not yet defined in Voices; liquid democracy may replace scoring | **GAP** — scoring model is changing; archive separately |
| Vote tallies (YES/NO) | projectcatalyst.io voting-results CSVs + IdeaScale result pages | Per-proposal vote counts in Voices; historical votes on-chain | **Medium confidence** — on-chain reduces risk |
| Author/proposer metadata | Username, optional profile | Voices will have proposer identity; username mapping unclear | **Medium gap** — archive with URL mapping |

**Conclusion:** comment threads and historical assessment scores are at direct risk of loss. These must be captured from IdeaScale before any sunset.

---

## Part 3 — Archival method comparison

Criterion: *"Could a researcher in 2030 reproduce a 2024 Catalyst Fund vote tally and access the top 20 comment threads on a specific proposal from our archive?"*

### Method A — Wayback Machine (Save Page Now + CDX API)

- WARC format (ISO 28500); legally defensible
- CDX API for bulk URL queries
- Public, long-term preservation (Internet Archive, 30+ years)
- **Weakness:** JavaScript / lazy-loaded comments are partially missed; rate limits on bulk submissions
- **Verdict:** suitable as shallow capture redundancy, insufficient as primary

### Method B — Browsertrix Cloud (browser-based crawl service)

- Full JS execution via headless Chromium
- SPA-aware (`page-spa` crawl scope)
- WARC output; ReplayWeb.page compatible
- Configurable rate limiting and behaviors (click, scroll-for-comment-load)
- **Weakness:** paid service; ~500+ browser-hours for full Cardano IdeaScale corpus = $5,000–$15,000
- **Verdict:** **best fit** for full proposal + comment thread preservation, costly but operationally manageable

### Method C — Conifer (Webrecorder interactive)

- Manual capture via cloud remote browser
- WARC output
- **Weakness:** manual labor; not feasible for 10k+ proposals
- **Verdict:** spot-check fallback only

### Method D — Direct API extraction (catalyst-toolbox)

- IdeaScale REST API → JSON via catalyst-toolbox `ideascale import` command
- Structured, reproducible, fast
- **Weakness:** no comments endpoint; API tokens member-scoped; post-sunset = total access loss
- **Verdict:** **essential for structured data** (proposals, scores, fund metadata) but must be paired with web archival for comments

### Hybrid recommendation (blended approach)

| Artifact | Method | Rationale |
|---|---|---|
| Proposal text, fund metadata | catalyst-toolbox API | structured, fast, reproducible |
| Assessment scores | catalyst-toolbox API | same |
| Vote tallies | projectcatalyst.io CSVs + on-chain Koios | authoritative; lower risk |
| Comment threads | Browsertrix top 500 + Wayback all (shallow) | full depth + redundancy |
| Proposal pages (full HTML) | Wayback + Browsertrix WARC | dual mirror |

**Combined cost & timeline:**
- catalyst-toolbox: ~$0 + 40 hours operator
- Browsertrix top 500: $2,000–$5,000 + ~4 weeks calendar
- Wayback all ~10k URLs: ~$0 + ~80 hours
- **Total:** ~$2,000–$5,000 + ~150 hours operator, 4–6 weeks

---

## Part 4 — Concrete capture plan

### Source priority list

**Priority 1A — next 7 days**
- IdeaScale proposal pages: `cardano.ideascale.com/c/cardano/idea/*` (~10k pages), via Browsertrix or Wayback
- IdeaScale proposal metadata: via catalyst-toolbox `ideascale import`

**Priority 1B — within 30 days**
- Wayback batch submission of all IdeaScale proposal URLs
- projectcatalyst.io per-fund voting CSVs (Funds 3, 9, 11, 12, 13, 14)
- catalystexplorer.com API snapshot

**Priority 2 — within 60 days**
- milestones.projectcatalyst.io per-proposal milestone pages
- projectcatalyst.io fund landing pages (HTML + PDF)
- input-output-hk/catalyst-core git mirror

**Priority 3 — within 90 days**
- Catalyst Voices API schema + documentation (when launched)
- On-chain Catalyst voting transactions via Koios

### Capture workflow (catalyst-toolbox)

```bash
# Per fund (F1-F14+):
catalyst-toolbox ideascale import \
  --api-token <TOKEN> \
  --chain-vote-type public \
  --fund <N> \
  --fund-goal "Fund N goal text" \
  --output-dir ./ideascale-export/fund-<N> \
  --tags ./tags.json \
  --threshold 1 \
  --stage-label "Assess" \
  --stages-filters "Governance phase;Assess QA"
```

Output per fund: `fund.json`, `challenges.json`, `proposals.json`.

### Chain-of-custody sidecar manifest

Per artifact:
```json
{
  "source_url": "https://cardano.ideascale.com/c/cardano/idea/123456",
  "capture_date": "2026-06-01T14:30:00Z",
  "capture_method": "browsertrix_cloud_20260601_fund01",
  "capture_method_version": "4.5.0",
  "capture_operator": "cryptoleo79",
  "sha256": "abc123def456...",
  "file_size_bytes": 245678,
  "http_status": 200,
  "archive_format": "WARC",
  "archive_file": "browsertrix-crawl-2026-06-01.warc.gz",
  "cross_reference_urls": [
    "https://web.archive.org/web/20260601143000*/cardano.ideascale.com/c/cardano/idea/123456"
  ],
  "tags": ["fund-01", "proposal", "priority-1a"]
}
```

### Integrity hashing (compatible with §21.13)

Follow the existing observatory `sha256.json` pattern:
```json
{
  "ideascale-archive/ideascale-html/fund-01/idea-001.html": {
    "sha256": "abc123def456...",
    "size_bytes": 245678,
    "custody_manifest": "idea-001.html.custody.json"
  }
}
```

---

## Part 5 — Legal and ethical considerations

### Copyright

IdeaScale proposal text is authored by proposers. The Cardano project does not assert copyright; authors retain it. Preservation is defensible as **fair use for archival and research** under US copyright ([Stanford Copyright/Fair Use Center](https://fairuse.stanford.edu/2003/11/10/digital_preservation_and_copyr/)) and **GDPR Article 89** (research and archival exceptions) for EU-resident proposers.

Preserve proposals with attribution intact. Do not modify or redact text unless legally required.

### Comments

Authored by community members. Same fair-use and archival exemptions apply. On GDPR right-to-be-forgotten request:

1. Document the request (date, proposer handle, comment ID)
2. Assess whether removal is legally required (GDPR applies to EU residents)
3. If needed: redact comment text but preserve metadata (timestamp, author handle, vote count) for historical continuity

### Consent

Catalyst community members have implicitly consented to public visibility on `cardano.ideascale.com`. Archival for research does not require re-consent. **Explicitly state** in archive documentation: this is a **preservation archive, not endorsement**. Carry the IDEASCALE_PRESERVATION.md §2 disclaimer through.

---

## Part 6 — Phasing

### MVP — by 2026-06-30

- IdeaScale API export via catalyst-toolbox (all funds, JSON)
- projectcatalyst.io voting CSVs (Funds 3, 9, 11, 12, 13, 14)
- Wayback batch submission (shallow capture, no comment expansion)
- ~$500 + 40 hours operator
- ~15 GB local

### Comprehensive — by 2026-09-30

MVP + Browsertrix Cloud crawl of top 500 proposals (full comments) + milestone tracker + fund landing pages + catalystexplorer.com
- ~$3,000–$5,000 + 120 hours operator
- ~100 GB

### Integration into FLOW-6 export — by 2026-12-31

Comprehensive + FLOW-6 methodology document + observatory export integration (READMEs, cross-references, data dictionaries)
- 200 hours methodology + 100 hours integration

---

## Part 7 — Long-term stewardship

### Replication

- **IPFS or Arweave**: immutable, decentralized; $500–$2,000 depending on size
- **Internet Archive donation**: institutional backup, indefinite retention
- **Community mirror**: read-only GitHub mirror within file-size limits

### Integration into observatory exports

- README references preservation archive
- FLOW-6 data exports include metadata pointers to custody manifests
- Observatory docs explain why Catalyst Voices data may differ from archived IdeaScale data and recommend the archive for historical analysis

---

## Cross-references to existing IDEASCALE_PRESERVATION.md

| Existing doc section | This plan extends with |
|---|---|
| §1 (Why) | Primary-source confirmation of risk window |
| §2 (Preservation ≠ endorsement) | GDPR/copyright integration |
| §3 (Risk inventory) | Catalyst governance transition signal |
| §4 (Source inventory) | Catalyst Voices schema details |
| §4 (Capture strategy) | Tool selection, costs, rate limits |
| §5 (Chain-of-custody) | Sidecar examples + integrity hashing |
| §6 (Storage strategy) | Directory layout + INDEX.json |
| §7 (Timeline) | MVP / Comprehensive / Integration phases |
| §8 (Triggers) | Monitoring schedule + escalation path |

**Key changes from precursor:**
- Sunset timeline: acknowledged as undated (not a firm 30-day window)
- Catalyst Voices role: incomplete; comment threads are at direct risk
- Archival method: hybrid (Browsertrix + Wayback + API) replacing simple wget/httrack
- Cost realism: budget + operator-hour estimates introduced
- Legal framework: GDPR/copyright/fair-use guidance added

---

## Conclusion

The window to act is **now**. No formal IdeaScale shutdown has been announced, but Catalyst Voices' advanced development + governance transition + Fund15/16 pause suggest decisions will be made within 60–90 days. Begin MVP capture by 2026-06-15.

Estimated cost: $2,000–$5,000 + 150–200 hours over 6 months. Success criterion: a researcher in 2030 can reproduce voting tallies and access proposal text + comment threads from the archive.

---

## Sources

- https://projectcatalyst.io/funds/10/catalyst-systems-improvements/iog-catalyst-team-ideascale-replacement-and-web-browser-based-voting-centre-with-liquid-democracy-aka-catalyst-voices
- https://cardanofoundation.org/blog/february-2026-activities
- https://forum.cardano.org/t/digest-march-03-2026-
- https://github.com/input-output-hk/catalyst-voices
- https://input-output-hk.github.io/catalyst-voices/api/cat-gateway/
- https://help.ideascale.com/ideascale-rest-api-library
- https://github.com/input-output-hk/catalyst-toolbox/pull/30/files
- https://archive.org/help/wayback_api.php
- https://blog.archive.org/2019/10/23/the-wayback-machines-save-page-now-is-new-and-improved/
- https://docs.browsertrix.com/user-guide/workflow-setup/
- https://crawler.docs.browsertrix.com/
- https://conifer.rhizome.org/
- https://fairuse.stanford.edu/2003/11/10/digital_preservation_and_copyr/
- https://gdpr.eu/article-89-processing-for-archiving-purposes-scientific-or-historical-research-purposes-or-statistical-purposes/
- https://www.loc.gov/preservation/digital/formats/fdd/fdd000236.shtml

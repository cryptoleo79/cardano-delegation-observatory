# The TSUNAGI Engineering Standard

*The engineering constitution of the TSUNAGI ecosystem. Extracted from the lifecycle
that produced the Cardano Observatory (the reference implementation) so that every
future project reaches the same engineering maturity faster — and earns trust the same
way: by being verifiable, not by being asserted.*

This is process, not a feature list. It is intended to be copied into, or referenced
by, every TSUNAGI repository. The Observatory's `docs/` (COMPLETION_REPORT, AUTHORITY_REPORT,
PRESERVATION, RECOVERY, OPERATIONS, STEWARDSHIP, STEWARDS_OATH) are the worked example.

---

## First Principle

Every proposed change must improve at least one of:

**Truth · Preservation · Verifiability · Reproducibility · Citability · Operator
Independence · Long-term Survivability · Research Value.**

If it improves none of these, do not build it.

## The Throttle (meta-principle)

Build because reality demands it — not because you can. Reality's triggers are: usage
evidence, a verified bug, research/builder/user feedback, an operational failure, or a
protocol/ecosystem change. Absent a trigger, **silence is the correct engineering
decision.** Novelty is not a trigger. A finished system that does its job is finished.

## Absolute rules (invariant across all stages)

Never fabricate · never infer provenance · never invent relationships · never overwrite
history · never remove historical truth · never automate editorial judgment without
evidence · never trade truth for convenience. Unknown values are `null`, never invented.

## The stage order matters

Foundation → Verification → Truth → Measurement → Recovery → Preservation → Authority →
Stewardship. Each stage's exit criteria are the next stage's entry criteria. **Do not
chase Authority before the record is Verifiable. Do not chase growth before you can
Measure. Do not claim Preservation before Recovery is proven.** Skipping a stage
produces a system that looks mature and isn't.

---

## Stage 1 — Foundation

- **Purpose:** build the minimal *correct, coherent* product that does one real thing
  with integrity — not the largest one.
- **Entry criteria:** a real problem; an authoritative data source; the provenance model
  decided *before* code (what is a claim, what carries a source, what "unknown" means).
- **Exit criteria:** the product is coherent — one obvious operating picture, navigation
  that reflects the platform, no dead ends, no orphan pages, every value sourced.
- **Required evidence:** real data flowing end-to-end; a methodology document; zero
  fabricated values.
- **Common mistakes:** feature sprawl; building "destination" pages nobody visits
  (the Observatory's Categories-as-destination drew 0 traffic for 4 weeks); shipping
  before the provenance model exists; confusing "more pages" with "more value."
- **Deliverables:** the working platform, `METHODOLOGY.md`, i18n/accessibility baseline
  if user-facing.
- **Operational gates:** every displayed value traces to a source; unknown → `null` + a
  note, never a guess.
- **Success condition:** a newcomer understands what it is and why, quickly — coherence,
  not coverage.

## Stage 2 — Verification

- **Purpose:** make the core record *independently* checkable, so trust is never required.
- **Entry criteria:** a canonical data structure exists (e.g., an append-only event log).
- **Exit criteria:** anyone can verify the record with **no running service, no Node, no
  database** — from public artifacts and documented steps alone.
- **Required evidence:** a standard-library verifier that (a) reproduces a published
  head/digest, (b) detects a single altered record, (c) rejects a wrong head. All three
  tested.
- **Common mistakes:** verification logic locked inside the running service; never
  publishing the verifiable artifact (so only the operator can check it); a verifier with
  heavy dependencies that will rot in five years.
- **Deliverables:** a hash chain (or equivalent), a *published* chain head, the full
  ordered record as a durable public artifact, a standalone verifier, a "Verify it
  yourself" page.
- **Operational gates:** verification must run from public artifacts alone, in a language
  that will still run in 20 years (prefer the standard library).
- **Success condition:** "Don't trust — verify" is literally, demonstrably true.

## Stage 3 — Truth

- **Purpose:** every public sentence is defensible; tone is archive, not product.
- **Entry criteria:** public-facing content exists.
- **Exit criteria:** every claim is provable, current, and precise; partial coverage is
  stated as partial; no sentence implies something unprovable.
- **Required evidence:** a truth audit with specific corrections logged.
- **Common mistakes:** marketing tone; superlatives without a backing number; aspirational
  status stated as fact ("the place people start"); *stale* claims (a README saying
  "pre-launch" after launch); claiming "whole ecosystem" while admitting "seed set"
  elsewhere — internal contradiction is the most common overclaim.
- **Deliverables:** corrected copy; explicit honesty notes on coverage; a de-marketing pass.
- **Operational gates:** would this sentence survive a hostile fact-check? If not, fix it.
- **Success condition:** the platform reads like a reference an archivist wrote.

## Stage 4 — Measurement

- **Purpose:** select the roadmap by evidence, not opinion or enthusiasm.
- **Entry criteria:** real usage exists, and an instrument to observe it.
- **Exit criteria:** a *trustworthy* measurement instrument; a recurring evidence verdict;
  building only on what the evidence supports.
- **Required evidence:** usage reports; a winner/loser scoreboard that lists **every**
  surface explicitly.
- **Common mistakes — the most dangerous stage:** the **blind dashboard** — a measurement
  instrument with a stale hard-coded candidate list, silent top-N truncation, or pointing
  at a redirect, so whole surfaces are invisible and "0 traffic" is an *omission*, not a
  fact. A blind instrument produces *false* roadmap decisions. Also: vanity metrics
  (clicks over citations); comparing numbers across a methodology change without resetting
  the baseline.
- **Deliverables:** a log/usage parser that surfaces every surface by exact identifier; a
  weekly/periodic report; explicit baseline-reset discipline when the instrument changes.
- **Operational gates:** a measured zero must be a *real* zero, never an omission — verify
  the instrument can see a thing before concluding the thing is unused.
- **Success condition:** every roadmap decision traces to recorded evidence.

## Stage 5 — Recovery

- **Purpose:** survive losing a file, then losing a server.
- **Entry criteria:** the data has value worth protecting.
- **Exit criteria:** automated, integrity-checked, **restore-proven** backups; a runbook a
  stranger can follow; a disaster-recovery drill actually executed.
- **Required evidence:** a self-test that restores a backup, runs `integrity_check`,
  asserts row counts, and exercises failure modes; a recorded DR drill.
- **Common mistakes:** a backup that is never restore-tested; the *canonical* asset
  git-ignored and unbacked (the Observatory's event-log DB was one disk failure from total
  loss before this was caught); mistaking a local-only backup for durability; backups that
  fail silently.
- **Deliverables:** backup script (WAL-safe, integrity-checked, rotated), self-test,
  status report, `RECOVERY.md` runbook.
- **Operational gates:** *a backup you have not restored is not a backup.* Prove it.
- **Success condition:** a new operator recovers the system from documentation alone.

## Stage 6 — Preservation

- **Purpose:** the historical record outlives the infrastructure and is never rewritten.
- **Entry criteria:** a historical record accrues over time.
- **Exit criteria:** append-only is *enforced* (not merely convention); the *verifiable*
  record survives total infrastructure loss (distributed, e.g. git-tracked); encrypted
  offsite replication exists.
- **Required evidence:** enforcement (e.g. DB triggers) **plus** a hash chain; the full
  record published as a durable artifact; a preservation-readiness assessment answering
  "could someone reconstruct this in 20 years from public artifacts alone?"
- **Common mistakes:** append-only by convention only (no enforcement); the verifiable
  artifact not distributed beyond one server; assuming local backups equal survivability;
  *backfilling history you never recorded* (that is fabrication — the past you didn't
  capture is honestly unrecoverable).
- **Deliverables:** append-only enforcement, the public ordered record, `PRESERVATION.md`,
  offsite replication tooling.
- **Operational gates:** if the server died today, does the *verifiable* record still
  survive somewhere independent?
- **Success condition:** the memory survives the machine it lived on.

## Stage 7 — Authority

- **Purpose:** be citable; earn trust by being open to question, not by asserting status.
- **Entry criteria:** the record is verifiable (Stage 2) and truthful (Stage 3).
- **Exit criteria:** every significant page is citation-ready — title, canonical URL,
  snapshot date, epoch/version, license, verification path, as-of timestamp; archival tone
  throughout.
- **Required evidence:** a citation affordance present on every page; an authority review
  answering "would a researcher cite this, a builder trust it, an engineer reproduce it?"
- **Common mistakes:** strong claim-level provenance but no *page-level* as-of date (so a
  citation can't be pinned to a moment); no citation affordance at all (every researcher
  reinvents one); authority *claimed* rather than *earned*.
- **Deliverables:** a site-wide citation component, methodology link from every page, an
  `AUTHORITY_REPORT.md`.
- **Operational gates:** could a researcher cite any page without inventing the citation?
- **Success condition:** the work is *cited*, not merely clicked.

## Stage 8 — Stewardship

- **Purpose:** the institution runs without its founders; engineering proceeds only on
  triggers.
- **Entry criteria:** Stages 1–7 exit criteria all met; engineering declared complete.
- **Exit criteria:** the ongoing cadence is documented (weekly curation, monthly
  measurement, quarterly audits, yearly value question); the division of labor is written
  down; the default posture is silence.
- **Required evidence:** a stewardship doctrine; a charter of principles; demonstrated
  restraint (observation mode, no speculative building).
- **Common mistakes:** building because you can (novelty loops); manufacturing adoption
  from the keyboard (citations are earned through real use, not generated); leaving the
  operating rhythm as tribal knowledge instead of documentation.
- **Deliverables:** `STEWARDSHIP.md`, a charter (`STEWARDS_OATH.md`), an explicit trigger
  list.
- **Operational gates:** does this change improve a First-Principle dimension **and** is it
  demanded by reality? Both, or don't.
- **Success condition:** if the creators vanished tomorrow, the record continues — and the
  process to maintain it is written down for a stranger.

---

## The Quality Gate (applies before every commit, every stage)

Run every verification: no regression, no broken links, no broken recovery, no broken
verification, no broken exports, no broken docs. Maintain EN/JA (or i18n) parity. Commit
only verified improvements; one logical change per commit; messages state what and why.

## The Final Standard

Do not try to build the largest platform in your domain. Build the one people trust when
truth matters — and make that trust *checkable* by anyone, forever. A TSUNAGI project has
succeeded when, decades later, someone can reconstruct what happened because the project
existed, and can verify it without asking permission from anyone.

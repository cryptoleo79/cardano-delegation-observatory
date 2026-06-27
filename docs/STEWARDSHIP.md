# Stewardship — the Living Observatory

*Engineering is complete; the mission is not. This is the institutional layer: how the
Observatory is curated, measured, and kept trustworthy over years — written down so the
rhythm survives any single steward. The technical operating cadence lives in
[`OPERATIONS.md`](./OPERATIONS.md); this doc is the librarian/archivist layer.*

**Mission:** become the historical memory and research reference for Cardano — not by
claiming authority, but by earning it. Success is not commits, pages, or traffic. It is
being **referenced, cited, depended on, and verified** by builders, researchers, DReps,
developers, and journalists. The Observatory becomes more valuable each year simply
because another year of Cardano history has been preserved.

---

## What "done" means here

Engineering, preservation, verification, and authority are complete (see
`COMPLETION_REPORT.md`, `PRESERVATION.md`, `AUTHORITY_REPORT.md`). The instruments that
make indispensability *possible* already exist:

- A record anyone can **independently verify** — `verify.html` + `events.ndjson` +
  `scripts/verify-memory-chain.py` (stdlib Python, no service).
- A **citation** on every page (`citeInit` in `i18n.js`): title · URL · snapshot · epoch
  · CC0 · access date.
- A **usage-measurement** parser — `scripts/analyze-access-logs.mjs` (who actually uses
  what; runs with sudo over nginx logs).
- An **outreach/feedback** ledger — `OUTREACH_TRACKER.md`, `FEEDBACK_PIPELINE.md`.

What remains is not code. It is **use, relationships, and time** — largely owner- and
community-led. Citations cannot be manufactured from the keyboard.

---

## The cadence

### Weekly — tiny curation, forever (no rush)
Pick **one** small, sourced improvement. Quality over volume; never invent data, never
infer provenance, never guess a source (the standing enrichment rule).
- Improve one project's historical record from an **authoritative** source.
- Add one missing source / strengthen one provenance chain.
- Fix one verified factual error (record the correction as a new event — never overwrite).
- Make one page clearer, or improve one citation.

*Agent's role:* execute a specific curation task when handed one (with the source). The
agent does **not** mass-enrich or best-effort-guess; a real, citable source is required.

### Monthly — measure what's earned (not vanity)
Who **cited / linked / referenced / verified** the Observatory? Which pages became
trusted? Sources: the access-log parser (`usage.md`), inbound links/mentions,
`OUTREACH_TRACKER.md`, feedback. Record signal, not clicks. *Owner-led* (sudo + social).

### Quarterly — re-earn trust (never assume it)
Re-run the audits that keep the record defensible: **Truth · Recovery · Security ·
Citation · Research**. The Completion/Authority sprints are the templates. The agent can
run these on request; nothing is assumed correct just because it was correct last quarter.

### Yearly — the one question
*Has the Observatory become more valuable simply because another year of Cardano history
has been preserved?* If yes, continue. If no, understand why before doing anything else.

---

## Division of labor (honest)

| Work | Who |
|------|-----|
| Curation tasks **with a source provided** | Agent, on request |
| Quarterly technical audits | Agent, on request |
| Recovery / verification / docs upkeep | Agent, on request |
| Earning citations, relationships, outreach | **Owner / community** |
| Usage measurement (sudo nginx logs) | **Owner** |
| The four survivability steps (offsite, DR drill, nginx, alert webhook) | **Owner** — fully specified, implementation-ready |

The agent stays in **observation mode** and acts only on a real trigger: a specific
curation task, usage evidence, a bug, research/builder/DRep feedback, an operational
failure, or a Cardano protocol change. Everything else waits.

---

## The standard (the finish line that never quite arrives)

Optimize for being **cited**, not clicked; for becoming **irreplaceable**, not biggest.

> Twenty years from now, someone rebuilding the history of Cardano should discover the
> Observatory and think: *"I'm glad someone cared enough to preserve all of this."*

That is success — not because the software survived, but because the **memory** survived,
and anyone can verify it.

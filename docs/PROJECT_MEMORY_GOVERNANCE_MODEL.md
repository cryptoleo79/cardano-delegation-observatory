# Project Memory governance model

**Status:** design, v1. **Design only — no code.**
**Date:** 2026-06-03.
**Owner:** observatory operator (`cryptoleo79`), stewarding pending a broader maintainer set.
**Authoritative reference:** `docs/CARDANO_MEMORY_LAYER.md` (meta-methodology). Where this document and the meta-methodology conflict, the meta-methodology wins.
**Companion documents:** `docs/PROJECT_MEMORY_REGISTRY.md` (sources), `~/cardano-data-layer/CARDANO_DATA_LAYER.md` (the live layer this governs), `~/cardano-data-layer/MVP_REPLACEMENT_BLUEPRINT.md`.

---

## 0. What this document governs — and what it does not

There are two systems, and this distinction is load-bearing for every rule below.

- **The preservation archive** (`cardano-project-memory-archive`, the Memory Layer) is **immutable and append-only**. It is not curated and not governed by editorial decisions — it records what a source published, with chain-of-custody. Nobody "adds a project" or "updates metadata" here; they capture an artifact. The archive is out of scope for editorial governance by design (`CARDANO_MEMORY_LAYER.md` → *Preservation, not curation*).
- **The curated layer** (the project + category store in the Data Layer "moat") **is** curated: it holds project identities, editorial fields, and category assignments that involve judgment. This is what needs a governance model, because curation without governance is exactly what decays.

This document governs the **curated layer only**. Its relationship to the archive is one-directional and preservative: the curated layer's full state is periodically snapshotted *into* the archive under chain-of-custody, so the mutable editorial layer always has an immutable audit trail living behind a **separate trust boundary** (`CARDANO_MEMORY_LAYER.md` → *Separate trust boundaries*). The archive can seed the curated layer; the curated layer never mutates the archive.

The governance is **preservation-compatible**: nothing in the curated layer is ever hard-deleted, every change is versioned, and disputes are recorded rather than resolved-away. Curation here means *attaching sourced claims with provenance and confidence*, not *declaring truth*.

---

## 1. Principles

1. **Provenance over authority.** A record's standing comes from its evidence, not from who submitted it. Any value carries `source`, `as_of`, and an authority class. A claim from a stranger with on-chain proof outranks a claim from a maintainer with none.
2. **Append-only.** Every add, update, challenge, and resolution is a new dated record. Superseded values are flagged, never erased. The history *is* the asset (project/category data is UNIQUE + PERISHABLE).
3. **Self-description is privileged, not absolute.** A project team controlling the on-chain identifier (CIP-72 / policy / script key) is authoritative over its *self-describing* fields (name, links, description) — but not over third-party-observable facts (category disputes, defunct status) and not over claims it cannot prove.
4. **Neutrality on subjective fields.** Where a field is genuinely a judgment call (classification, "is this a DEX or an aggregator"), the system preserves multiple sourced claims rather than electing one winner. No arbiter declares subjective truth. (`CARDANO_MEMORY_LAYER.md` → *Preservation, not interpretation / not ranking*.)
5. **Per-source taxonomy preservation.** Each source's taxonomy is kept as-found; the canonical taxonomy is a separate, explicitly versioned artifact — never a silent merge.
6. **Reproducibility.** Any researcher can reconstruct the state of any record as of any date from the history + archive snapshots, with no privileged access.
7. **Disclosed conflicts.** The operator is a DRep + SPO + author of related projects; this is disclosed (mirrors `METHODOLOGY.md` conflict-disclosure posture). The operator is bound by the same rules and holds no special editorial power over content.

---

## 2. Roles

Roles are about *process permission*, not *truth authority* (truth comes from evidence, §1.1).

| Role | Who | Can do | Cannot do |
|---|---|---|---|
| **Public / anonymous** | anyone | read everything; propose adds/updates; file challenges | apply changes directly; resolve disputes |
| **Verified contributor** | a contributor with a track record (≥N accepted, provenance-sound submissions) | proposals fast-tracked; lower friction | override others; decide subjective truth |
| **Project owner** | holder of the project's on-chain control key (CIP-72 / policy / script) | authoritatively set/update its **self-describing** fields via signed/on-chain attestation; mark its own status | overrule third-party-observable facts; set its own category as canonical against contrary evidence |
| **Curator / maintainer** | ≥2 independent, named individuals | review submissions for **provenance and process** (not merit); apply changes; tend the taxonomy; triage challenges | unilaterally decide subjective truth; delete history; act on a record where they have an undisclosed conflict |
| **Operator / steward** | `cryptoleo79` (today) | run infrastructure; break **process** ties; publish snapshots to the archive | exercise editorial control beyond the rules; suppress a sourced claim; edit history |
| **Automated agent** | import/seed jobs | bulk-import from open sources and the archive, flagged `machine-imported` with source | resolve disputes; create canonical category assignments; act without a recorded source |

**Sustainability note.** Today this is operator-stewarded. The explicit goal is to move to a multi-maintainer / standards-aligned / Catalyst-funded steward model, precisely to avoid the single-point sustainability failure that ended TapTools (`CARDANO_DATA_LAYER.md` → open questions). Governance that depends on one person is a known failure mode, not a destination.

---

## 3. The six questions

### 3.1 Who can add projects?

**Anyone can propose; addition is gated by provenance, never by notability.** There is no "is this project important enough" bar — that would be ranking/curation, which is barred. A defunct project is as addable as a flagship one (the 20 archived "graveyard" projects prove the point).

A project record may be added when it clears a **provenance threshold**: at least one verifiable source establishing existence + identity. Paths, in descending authority:

- **Self-add (Class B/self):** a project team submits via CIP-72 self-attestation or a signed message proving control of its on-chain identifier → eligible immediately, marked `self_attested`.
- **On-chain evidence (Class A):** a record anchored to a policy ID / script address / token → eligible immediately, marked with the identifier.
- **Open-directory / community import (Class D):** imported from a directory (cardanocube, builtoncardano, DefiLlama) or seeded from the preservation archive → marked `machine-imported` + source.
- **Researcher submission (Class E):** an individual submission with cited evidence → enters **pending/unverified**, visible but flagged, until a second independent source or a maintainer confirms provenance.

**Anti-Sybil:** records from unestablished contributors enter `pending` and are rate-limited; promotion to `verified` requires a second independent source or maintainer provenance-check (not a merit judgment).

### 3.2 Who can update metadata?

Updates are **per-field, append-only, and provenance-scoped.** Each field value carries its own `source`, `as_of`, and authority class; "updating" means **adding a new dated claim** that may supersede the prior one, which is retained in history.

- **Self-describing fields** (name, description, links, logo): the **project owner** (on-chain key) is authoritative and can update directly via attestation. Others may *propose*; a maintainer applies after a provenance check.
- **Factual / on-chain fields** (policy ID, script address, mint date): **Class A, effectively immutable** — anyone can verify them; they are corrected only against the chain, never by assertion.
- **Third-party-observable fields** (defunct status, audit existence, category): updated by **proposal + provenance review**; the project owner does *not* get unilateral control (a team cannot un-declare itself defunct without evidence of activity).

No field is ever overwritten in place. The previous value becomes a superseded history entry.

### 3.3 Who can challenge metadata?

**Anyone can challenge any field or record**, with stated grounds and evidence. A challenge:

- **does not delete or hide** the contested value — it attaches a `dispute` record and flags the field `contested`;
- is itself **preserved append-only** (the challenge survives even if it loses);
- carries **standing rules**: open to all, but repeat/frivolous challenges from one party are rate-limited; a challenge backed by Class A (on-chain) or controlling-key evidence **auto-escalates** to fast resolution.

Challenging is a first-class, low-friction action by design — it is how a curated layer self-corrects without a gatekeeper.

### 3.4 How are disputes handled?

By an **evidence ladder**, not by an arbiter's opinion:

1. **On-chain / Class A evidence wins automatically.** Objective facts are settled by the chain.
2. **Controlling-key self-attestation wins for self-describing fields.** A CIP-72-proven owner's name/links/description supersede third-party claims *about those fields*.
3. **Genuinely editorial disputes** (e.g. category, subjective descriptors) are **not** decided by declaring one side right. The field preserves **all sourced claims** with their provenance; if irreconcilable, it displays multiple sourced values or reverts to `unclassified / contested`. (§1.4.)
4. **Process disputes** ("was the procedure followed", "was provenance sufficient") are decided by a **maintainer panel of ≥2 independent** members — about process, never about subjective truth.

Every resolution records: the evidence, who decided, the rationale, and the timestamp. The **losing claim is preserved as superseded** with the resolution attached — the dispute's existence is permanent record. Operator/maintainer conflicts of interest are disclosed; a conflicted party recuses from that resolution.

### 3.5 How do taxonomy changes happen?

The taxonomy is a **versioned artifact** (`taxonomy_version`) with a changelog, and changes are **additive-first and migration-safe**:

- **Per-source taxonomies are preserved as-found** (cardanocube's ~74, builtoncardano's tags, DefiLlama's categories). The canonical taxonomy is separate and never a silent merge of them (§1.5).
- **Add a category:** proposal → maintainer review for *coherence and non-redundancy* (not merit) → `taxonomy_version` bump + changelog entry.
- **Rename / merge / split:** requires a **migration record** mapping old→new, keeps the old slug as an **alias/redirect**, and re-tags affected projects with `project_history` entries. A historical category assignment is **never orphaned**.
- **Deprecate, don't delete:** a retired category is flagged `deprecated:true` and kept, so historical assignments referencing it stay valid and resolvable.
- **Changelog before shipping:** every taxonomy change is logged *before* it takes effect (mirrors `METHODOLOGY.md` changelog discipline).

Category *assignments* themselves follow the evidence/dispute rules (§3.2–3.4): self-attested or evidenced assignments are recorded with provenance; unverified ones are surfaced as `unclassified`, never guessed.

### 3.6 How is history preserved?

Five overlapping mechanisms, so no single failure loses the record:

1. **Append-only `project_history`** — every field change records old value, new value, source, actor, timestamp, and reason. Already implemented in the moat store as the audit spine.
2. **Dispute & challenge records** — preserved as data, not resolved-away; the losing side of any dispute remains queryable.
3. **No hard deletes** — removal is a `tombstone` / `superseded` flag; the bytes stay.
4. **Immutable archive snapshots** — the full curated store is periodically captured into `cardano-project-memory-archive` under chain-of-custody (SHA-256, dated), giving the mutable layer an immutable audit trail behind a separate trust boundary.
5. **Git-versioned seeds & exports** — the repository history is itself a tamper-evident record of the curated dataset over time.

Together these guarantee the reproducibility property (§1.6): the state of any project or category **as of any date** can be reconstructed from history + snapshots, by anyone, without privileged access.

---

## 4. Authority class framework (reused)

Per `METHODOLOGY.md §24.3` / the Project Memory registry, every claim is tagged:

| Class | Meaning here |
|---|---|
| A | On-chain — reproducible from the chain (identifiers, mint dates, script addresses) |
| B | Official — project's own CIP-72 / signed self-attestation, or a Cardano-Foundation source |
| C | At-risk commercial platform (e.g. archived TapTools data) |
| D | Community-maintained (cardanocube, DefiLlama, directories) |
| E | Individual researcher submission, accepted under provenance review |

Authority class is what makes the evidence ladder (§3.4) objective rather than political.

## 5. Abuse, neutrality, and conflict safeguards

- **No notability gate, no ranking, no editorializing** — the system records sourced claims; it does not rate, rank, or interpret projects (`CARDANO_MEMORY_LAYER.md` principles).
- **Sybil resistance** via the pending/verified tiers and the second-independent-source requirement, not via identity gatekeeping.
- **Conflict disclosure & recusal** for operator and maintainers; the operator's own related projects appear in the data with no special treatment.
- **Transparency:** all process decisions and their rationale are public and append-only.

## 6. Lifecycle

This model is re-verified on every taxonomy version bump and whenever a role or process changes. Changes land in a change log at the bottom of this document (added on first revision), and material changes are logged *before* they take effect.

## 7. Open questions

- **Maintainer recruitment & legitimacy** — how the ≥2-independent-maintainer set is constituted and kept genuinely independent.
- **Funding** — Catalyst, foundation grant, or thin paid tier over a free open core; required so governance does not depend on one unpaid operator (the TapTools failure mode).
- **CIP-72 adoption dependency** — self-attestation is strongest if projects actually anchor on-chain; coverage is early. Fallbacks (signed messages, directory imports) must carry until adoption grows.
- **On-chain anchoring of the governance record itself** — whether snapshots/decisions should be hash-anchored on-chain for stronger tamper-evidence than git + archive provides.
- **Boundary with Governance Memory** — DRep/SPO metadata overlaps project identity; cross-reference, do not merge (separate trust boundaries).

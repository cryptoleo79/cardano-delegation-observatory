# Project Memory implementation plan

**Status:** architecture, v1. **No code. Nothing is built from this document.**
**Date:** 2026-06-03.
**Purpose:** Translate `docs/PROJECT_MEMORY_GOVERNANCE_MODEL.md` from philosophy into implementation architecture — the data structures, workflow states, moderation events, challenge lifecycle, and history model a future build would follow.
**Authoritative references:** `docs/PROJECT_MEMORY_GOVERNANCE_MODEL.md` (the rules this realizes), `docs/CARDANO_MEMORY_LAYER.md` (meta-principles), `~/cardano-data-layer/service/src/modules/project.js` (the existing minimal moat schema this evolves).

## 0. Scope and non-goals

This is the architecture for the **curated layer** (the Data Layer moat). It does **not** govern or touch the immutable preservation archive.

**Explicitly deferred — do NOT build from this document:** production moderation, a project-editing UI, user accounts, a taxonomy editor. This plan defines the shapes those would target; it does not stand them up. Schemas below are expressed conceptually (entity + field lists, state machines, event tables), **not** as runnable code or DDL.

## 1. Architectural approach: event-sourced, claim-based

The governance model has three non-negotiables — **append-only**, **provenance per value**, and **reconstruct-state-as-of-any-date**. One architecture gives all three for free: **event sourcing with a claim-based state model.**

- **The event log is the source of truth.** Every governance action (add, attest, import, review, challenge, resolve, taxonomy change, snapshot) is an immutable, append-only **event**. Nothing is ever updated or deleted in place.
- **Current state is a projection.** The "current" view of a project/category is a materialized read-model derived by replaying events. Reproducibility = replay events up to timestamp `T`. History preservation = the log itself. Dispute preservation = the challenge/resolution events stay in the log forever.
- **Values are claims, not fields.** A project does not have a mutable `description` column; it has a set of **field claims** (`description` asserted by source X, as_of D, authority class B). "Updating" appends a new claim; "challenging" appends a challenge against a claim; the current value is whichever active claim wins by the evidence ladder. This is what makes per-field provenance, supersession, and multi-claim subjective fields all fall out of one model.

This is the clean translation: the governance principles *are* an event-sourced claim ledger.

## 2. Identity and actors (without accounts)

No user-account system is built (per non-goals). Actor identity is **cryptographic / pseudonymous**, so every event is attributable without a login system:

| Actor kind | Identity primitive | Used for |
|---|---|---|
| Project owner | on-chain control key (CIP-72 anchor / policy / script signing key) | authoritative self-describing claims (§gov 3.2) |
| Contributor | ed25519 keypair or DID; events are signed | proposals, challenges; track record accrues to the pubkey |
| Maintainer | named keypair listed in a published, versioned maintainer set | reviews, process-dispute resolutions |
| Operator/steward | named keypair | snapshots, process tie-breaks |
| Automated agent | service key | machine imports/seeds |
| Anonymous | rate-limited capability token (no key) | low-trust proposals/challenges → land in `pending` |

`actor` is an entity (pubkey, kind, display_label, first_seen, track_record_counter, maintainer_set_version_if_any, disclosed_conflicts[]). **No passwords, no sessions, no PII.** "Verified contributor" is a derived status from the track-record counter, not an account tier.

## 3. Data structures

Conceptual entities (a future build maps these to tables; types are indicative).

### 3.1 Core subject entities (projection / read-model)
- **project** — `id (slug)`, `current_status`, `current_name`, `unclassified (bool)`, `created_event_id`, `last_event_id`. A thin projection; authoritative data is in claims/events.
- **category** — `slug`, `name`, `taxonomy_version_introduced`, `deprecated (bool)`, `alias_of (nullable slug)`.
- **taxonomy_version** — `version`, `created_at`, `changelog_ref`, `parent_version`.

### 3.2 Claim entities (the substance)
- **field_claim** — `id`, `project_id`, `field` (name|description|links|logo|status|audit|launch_date|…), `value`, `source`, `source_url`, `authority_class (A–E)`, `as_of`, `asserted_by (actor)`, `asserted_event_id`, `state (active|superseded|contested|rejected)`, `superseded_by (nullable claim_id)`.
- **category_assignment** — like a field_claim but for membership: `id`, `project_id`, `category_slug`, `taxonomy_version`, `source`, `authority_class`, `state`, provenance fields. Unverified/absent → project is `unclassified` (never guessed).

### 3.3 Process entities
- **submission** — a proposed add/update bundle: `id`, `actor`, `kind (add|update)`, `payload (proposed claims)`, `state` (see §4), `provenance_refs[]`, `created_at`.
- **challenge** — `id`, `target_claim_id` (or `target_project_id`), `actor`, `grounds`, `evidence_refs[]`, `state` (see §6), `auto_escalated (bool)`.
- **dispute** — formed when a challenge is contested: `id`, `challenge_id`, `claims_involved[]`, `evidence_ladder_rung_reached`, `resolution (nullable)`, `resolver(s)`, `recusals[]`.
- **resolution** — `id`, `dispute_id`, `outcome (upheld|rejected|partial|multi-claim-preserved|unclassified)`, `rationale`, `evidence_cited[]`, `decided_by[]`, `decided_at`. **Never deletes the losing claim** — sets its state to `superseded`/`rejected` and links the resolution.

### 3.4 Audit / preservation entities
- **event** — the append-only log (see §5). The spine; everything else is derivable.
- **snapshot** — `id`, `taken_at`, `content_sha256`, `archive_wayback_or_path_ref`, `event_id_high_watermark`. A chain-of-custody checkpoint pushed into the preservation archive (separate trust boundary).

### 3.5 Relationships (summary)
`project 1—* field_claim`, `project *—* category` via `category_assignment` (both claim-shaped); `submission → produces → events → produce → claims`; `challenge → target → claim`; `challenge → may form → dispute → resolved by → resolution → emits → events`; `snapshot → checkpoints → event log`.

This replaces today's flat `project / category / project_category / project_history` moat tables (§8 maps the evolution).

## 4. Workflow states

### 4.1 Project record lifecycle
```
proposed ──(provenance ok / 2nd source / owner attest)──▶ verified
   │                                                         │
   └──(insufficient provenance)──▶ pending ──(evidence)──────┘
verified ──(open challenge upheld on existence/identity)──▶ contested
verified ──(no activity + evidenced defunct)──▶ verified[status=defunct]   (still verified; "defunct" is a status claim, not a lifecycle death)
any ──(superseded by merge / proven non-existent)──▶ tombstoned (kept, never deleted)
```
`pending` records are visible but flagged; `tombstoned` records are retained (no hard delete).

### 4.2 Field-claim states
```
submitted ──(review pass / auto for Class A & owner-attested)──▶ active
active ──(newer winning claim)──▶ superseded
active ──(challenge opened)──▶ contested ──(resolution)──▶ active | superseded | rejected
submitted ──(review fail)──▶ rejected
```
Multiple `active` claims may co-exist on a subjective field (the read-model surfaces all, per §gov 1.4).

### 4.3 Submission states
```
open ──▶ under_review ──▶ applied        (emits claim events)
                       └─▶ rejected      (recorded with reason; never silently dropped)
open ──(anonymous / unestablished actor)──▶ pending  (awaits 2nd source or maintainer)
```

## 5. Moderation events

The append-only event taxonomy. Every event: `event_id`, `ts`, `actor`, `type`, `payload`, `refs[]`, `signature (where applicable)`, `prev_event_hash` (tamper-evident chain).

| Event type | Emitted when | Key payload |
|---|---|---|
| `project.proposed` | someone proposes a new project | slug, initial claims, provenance |
| `project.imported` | machine import/seed | source, batch ref |
| `claim.asserted` | a field/category claim is added | field, value, source, authority_class |
| `claim.attested` | owner signs a self-describing claim | claim ref, on-chain proof |
| `submission.review_passed` / `submission.review_failed` | maintainer provenance/process check | submission ref, reason |
| `claim.activated` / `claim.superseded` / `claim.rejected` | claim state transitions | claim ref, cause |
| `challenge.opened` | a challenge is filed | target, grounds, evidence |
| `challenge.escalated` | Class A / controlling-key evidence present | challenge ref |
| `challenge.evidence_added` | new evidence on an open challenge | challenge ref, evidence |
| `dispute.formed` | challenge contested → dispute | dispute ref, claims involved |
| `dispute.resolved` | resolution reached | outcome, rationale, deciders, recusals |
| `taxonomy.category_added` | additive taxonomy change | slug, version bump |
| `taxonomy.category_migrated` | rename/merge/split | old→new map, alias, retag refs |
| `taxonomy.category_deprecated` | category retired | slug (kept, flagged) |
| `taxonomy.version_bumped` | any taxonomy change ships | version, changelog ref |
| `actor.recused` | conflicted party steps back | actor, dispute ref |
| `actor.rate_limited` | abuse control triggers | actor, reason |
| `snapshot.published` | state checkpoint pushed to archive | sha256, archive ref, watermark |

Events are **never** edited or removed. A "mistake" is corrected by a compensating event, leaving both in the log.

## 6. Challenge lifecycle

```
            ┌─────────── auto-escalate (Class A / controlling-key evidence) ───────────┐
            ▼                                                                           │
opened ──▶ triage ──▶ under_review ──▶ dispute_formed ──▶ resolved ──▶ archived
   │          │                              │                 │
   │          └─(out of scope/dup)─▶ rejected│                 ├─ outcome: upheld  (target claim → superseded/rejected)
   │                                          │                 ├─ outcome: rejected (target claim stays active; challenge kept)
   └─(frivolous/repeat from actor)─▶ rate_limited                ├─ outcome: partial (some claims change)
                                                                 └─ outcome: multi_claim_preserved | unclassified (subjective field)
```
Effects, always append-only: opening a challenge sets the target claim `contested` (visible, not hidden); resolution emits `dispute.resolved` + the appropriate `claim.*` events; the challenge, all its evidence, and the resolution remain permanently queryable regardless of outcome. Evidence ladder (§gov 3.4) determines the rung at which a dispute resolves; conflicted resolvers must emit `actor.recused`.

## 7. History model

**Event sourcing makes history a property of the architecture, not a feature bolted on.**

- **Source of truth:** the `event` log (append-only, hash-chained via `prev_event_hash`).
- **Current state:** a projection materialized from the log (the read-model entities in §3.1–3.2). Rebuildable at any time by replay; can be discarded and regenerated.
- **State as of date `T`:** replay events with `ts ≤ T`. This is the reproducibility guarantee (§gov 1.6) — any researcher reconstructs any past state with no privileged access.
- **Dispute & challenge history:** preserved inherently — those are events, never removed.
- **No hard deletes:** "deletion" is a `tombstone`/`superseded` state transition event; the data stays.
- **Cross-boundary durability:** `snapshot.published` events checkpoint the full state's `sha256` into the **preservation archive** under chain-of-custody — so the mutable curated layer always has an immutable, independently-verifiable audit trail behind a separate trust boundary. The archive holds checkpoints; it is never mutated by the curated layer.

The existing `project_history` table in the moat (`project.js`) is the embryonic version of this — a per-field change log. The target is to **promote that log to the primary store** (event-sourced) rather than keep it as a side-effect of mutable tables.

## 8. Evolution from the existing moat (no migration built here)

Today (`cardano-data-layer/service/src/modules/project.js`): mutable `project` / `category` / `project_category` tables + an append-only `project_history` side table; seeded from the archive; one `upsertProject` that writes history rows on change.

Target (this plan): the **event log is primary**; `project`/`category`/assignments become **projections**; `field_claim`/`category_assignment` carry provenance; `submission`/`challenge`/`dispute`/`resolution` formalize the workflow; `snapshot` ties to the archive.

The current schema is a valid v0 read-model — the evolution is additive (introduce the event log + claims, rebuild projections from it), not a rewrite. **This migration is described, not implemented.**

## 9. What this enables later (still deferred)

The deferred non-goals map cleanly onto the architecture when/if approved to build: a moderation queue = a view over `submission` + `challenge` states; an editing UI = a client that emits `claim.asserted`/`challenge.opened` events; accounts = optional, since identity is already key-based; a taxonomy editor = a client over the `taxonomy.*` events. None are built now; the shapes are ready for them.

## 10. Open questions

- **Read-model store vs event store** — same SQLite for both (simple) vs separate (cleaner) when/if scale demands.
- **Signature scheme & key custody** for contributor/maintainer events (ed25519 vs DID vs CIP-8/CIP-30 wallet signatures).
- **Hash-anchoring** snapshots (and possibly the event-chain head) on-chain for tamper-evidence stronger than git + archive.
- **Projection rebuild cost** at volume — checkpointing strategy so replay isn't full-history every time.
- **Conflict between two owner-attested claims** (key rotation / disputed control) — how the evidence ladder breaks ties when both sides present on-chain proof.

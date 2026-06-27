# Preservation Readiness — Cardano Observatory, Era III

*The Century Loop's central test: **"Could someone reconstruct Cardano history from
the Observatory alone in 2036?"** This is the honest answer — what is preserved, what
is independently verifiable, what is recorded for which dates, and the one gap that
stands between "almost" and "yes." Assessed 2026-06-26.*

---

## Verdict

**Partially — and the gap is one owner action.**

- **Truth & verifiability:** ✅ strong and now *independently* checkable.
- **Time depth:** ✅ within the recorded window (and the window only grows); ⚠️ history
  predating recording cannot be reconstructed (no archive exists — by honesty, not
  oversight).
- **Survivability:** ⚠️ **the canonical memory (`cdl.sqlite`) is local-backup-only and
  git-ignored.** A total server loss *today* would lose the full hash-chained event
  log. Configuring offsite replication (Phase 3, prepared) flips this test to **yes.**

---

## What IS preserved and verifiable (the strengths)

### Two independent layers of append-only integrity
1. **Database-level:** `pm_event` carries triggers `pm_event_no_update` and
   `pm_event_no_delete` — SQLite itself refuses to alter or remove a recorded event.
   (Verified: an `UPDATE` is rejected with *"pm_event is append-only: UPDATE forbidden."*)
2. **Cryptographic:** every event is hash-chained — `hash = sha256(prev_hash ‖ ts ‖
   type ‖ subject ‖ actor ‖ payload)`, genesis = 64 zeros. Altering any historical
   event breaks every hash after it.

### The chain is now verifiable by ANYONE, without the service
The chain head is **published** in `data/snapshots/projectmemory/index.json` →
`meta.chain_head`. `scripts/verify-memory-chain.py` re-walks the entire chain using
**only the Python 3 standard library** (sqlite3 + hashlib), independent of the
data-layer code, and confirms it matches the published head:

```
$ python3 scripts/verify-memory-chain.py <cdl.sqlite> --expect-head <published>
chain OK — 5728 events, head f2e4fbc47154c486…
head MATCHES published chain_head (f2e4fbc47154c486…)
```
Proven to (a) reproduce the live head exactly, (b) detect a single altered event
("CHAIN BROKEN at seq N: content hash mismatch"), (c) reject a wrong expected head.
This is the Pillar X / "another researcher can verify" guarantee, made concrete and
durable: stdlib-only Python will still run in 2036.

### Provenance (Pillar I)
Every claim carries source + authority class (A on-chain / B official / C at-risk /
D community / E researcher) + as-of date; the authority legend ships in the export;
unknowns are `null`, never fabricated. The values are *derived from* the event log, so
provenance is reproducible from first principles, not asserted.

---

## What is recorded, and for which dates (Pillar III — Time)

| Domain | Recorded back to | Point-in-time reconstructable? |
|--------|------------------|-------------------------------|
| Treasury / epochs (`observatory.db`) | 2024-09-06 (epoch 508) | ✅ per-epoch rows |
| DRep / governance snapshots | 2024-09-06 (113k+ rows, +60/day) | ✅ per-day rows |
| Project Memory (`pm_event`) | 2026-06-03 (~3 weeks at first assessment) | ✅ per-event ts + seq |

"What existed, when?" is answerable **within the recorded window**, and the window
extends every day the ETL runs. The honest limit: the Observatory began recording
project state on 2026-06-03; it cannot reconstruct what a project looked like before
that — no archive exists to backfill, and inventing one would violate the absolute
rules. Governance/treasury reach back to the Conway era (2024-09).

---

## The one gap that decides the 2036 test (Pillar VII — Survivability)

**`cdl.sqlite` — the canonical, hash-chained memory — is git-ignored and currently
backed up only locally.** Consequences for "reconstruct from the Observatory alone":

- `observatory.db` (snapshots) **is** git-tracked → preserved on GitHub.
- The static export (`index.json`, per-project history, `chain_head`) **is** git-tracked
  → preserved on GitHub. From it you can recover most *facts* and the *expected* head.
- **But the full ordered event log (every event with its `prev_hash`/`hash`) lives only
  in `cdl.sqlite`.** The per-project files hold per-subject history, not the global
  chain ordering. So GitHub alone preserves the facts and the head, **but not the
  artifact needed to independently re-verify the chain.**

Therefore, *today*, a total server loss with offsite not yet configured would lose the
canonically verifiable memory. This is the gap between "almost" and "yes."

### Closing it (priority order)
1. **Configure offsite replication** (owner; prepared). `scripts/backup-offsite.sh`
   encrypts `cdl.sqlite` + `observatory.db` and pushes them off-box; set a key +
   `OFFSITE_PUSH_CMD` + cron. Tested round-trip. **This is the last step for full
   server-loss survivability.**
2. **Run one clean-machine disaster-recovery drill** (Phase 4b, `RECOVERY.md §3`).

### Update (2026-06-27): the canonical event log is now a public artifact ✅
The git-tracked **`data/snapshots/projectmemory/events.ndjson`** is the complete,
ordered event log (every event with `prev_hash`/`hash`, payload as exact stored text,
~3.7 MB — smaller than the already-tracked 11 MB per-project export). Generated by
`scripts/export-event-log.py`; **verified to reproduce the published `chain_head`**.

This closes the gap two ways:
- **Independent verification from exported artifacts alone** (Part 2): anyone can run
  `verify-memory-chain.py events.ndjson --expect-head <published>` — no DB, no service,
  stdlib Python only. Proven to detect a single altered event and a wrong head.
- **Survives total infrastructure loss:** because `events.ndjson` is git-tracked, the
  complete *verifiable* chain now lives in every repo clone — not only in the
  git-ignored `cdl.sqlite`. Even if the server and all backups vanish, the canonical
  memory and its proof survive anywhere the repo was cloned.

**Regeneration:** run `export-event-log.py` whenever the memory export is refreshed,
then verify against `index.json`'s `chain_head` and commit. (Engineering recommendation
for Part 6 was evaluated as *clearly positive* — ~3.7 MB, slow growth, large benefit —
and therefore implemented.)

---

## Recovery now includes chain verification

`RECOVERY.md §5` verification checklist now asserts not just that `pm_event` rows are
present after a restore, but that the **hash chain re-verifies and matches the
published head** — proving the history came back *unaltered*, not merely *present*.

---

## Longevity (Pillar VI) — what actually grows over 10 years

Audited the real growth drivers (not assumptions):
- **The canonical memory barely grows.** `pm_event` is **3.4 MB** (5,728 events); the
  event log is the durable asset and is tiny.
- **`cdl.sqlite` is 183 MB, but ~96% is market data** (`ohlcv` candles: 564 k rows +
  indexes ≈ 186 MB). **`ohlcv` is the only unbounded grower** (5-min poller). This is
  the 10-year watch item — it inflates the DB and every backup.
  - *Mitigated for now:* gzip compresses it ~6.5× (183 MB → 28 MB per backup); 92 GB
    free; 14-day retention ≈ <600 MB steady state.
  - *If it ever matters:* split `ohlcv` into its own DB so memory backups stay ~3 MB,
    or downsample/prune candles older than N years. Not needed yet — documented so a
    future operator sees it coming.
- **Snapshots** grow ~60 rows/day → ~219 k rows over 10 years (trivial).
- **`events.ndjson`** grows with events only (slow); git delta-compresses appended
  lines well.
- **WAL** healthy (autocheckpoint 1000; cdl-wal ~4 MB, bounded). **`poller.log`**
  truncation is on weekly cron (was the one unbounded log).

Verdict: storage/longevity is comfortable for 10+ years; the single thing to watch is
`ohlcv` growth, with clear mitigations documented above.

## Disaster-recovery drill — executed 2026-06-27 (from local backups)

Ran the full path in a clean temp environment: restore both DBs from the latest local
backups → `integrity_check` ok (both) → **hash chain re-verifies and matches the
published head** (history unaltered) → append-only triggers survived → historical
queries succeed (`pm_event` 5,728; governance snapshots **113,972 rows, 2024-09-06 →
2026-06-26**). **The recovery mechanism is proven.** The one leg still untested is
*fetching from offsite* — which awaits Phase 3 configuration (owner). A literal
fresh-VPS run of `RECOVERY.md §3` completes Phase 4b once offsite exists.

## Institution test (Pillar X) — can another operator/researcher continue?

- **Recover:** `RECOVERY.md` (command-complete, timed, clean-machine drill).
- **Operate:** `OPERATIONS.md` (cadence, automation map, gates).
- **Verify:** `verify-memory-chain.py` (stdlib-only, independent of the service).
- **Understand:** `METHODOLOGY.md` + the authority legend shipped in every export.

A new maintainer can recover and run it; a new researcher can independently verify the
record's integrity; neither needs the original operator. That is the institution
standard — met, pending the offsite step that makes the canonical memory survive the
machine it lives on.

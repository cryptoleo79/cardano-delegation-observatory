# Post-Launch Roadmap

**Frame:** we are in the *adoption* phase, not the building phase. Nothing here is a
commitment to build — it's a categorized backlog, ranked so that when feedback arrives
(`FEEDBACK_PIPELINE.md`) we already know which lever to pull. **Bias every choice
toward what drives usage**, not toward what is technically interesting.

**Gating rule:** an item moves from this list into active work only when (a) it serves
adoption *or* fixes something live users hit, and (b) it does not violate the
methodology never-list. FLOW-1.5 is the standing example of an item that waits for
demand, not for a free afternoon.

Effort key: **QW** ≈ hours–1 day · **MED** ≈ days–2 weeks · **MAJOR** ≈ weeks–months.

---

## Quick wins (do these first — they cost little and unblock measurement/adoption)

| Item | Why it matters now | Notes / dependency |
|------|--------------------|--------------------|
| **Split nginx access logs by vhost** | Without this we can't answer "which pages / which routes" | sudo (owner) · prerequisite for the whole feedback pipeline |
| **Weekly log-parse script (IP-stripped aggregate)** | Turns existing logs into the page/route usage table | sudo to read root-owned logs · output is CC0 |
| **Footer "Feedback" link site-wide** | The only on-site feedback invitation; one link, no script, no social layer | points to GitHub Discussions or `mailto:` |
| **Seed DRep permalink outreach** | Sending each top DRep their own `/drep.html?id=` page is the single highest-leverage adoption act | see `FIRST_100_USERS.md` |
| **API stability/terms statement** | Developers won't depend on an API that might vanish; this is the cheapest adoption unlock | docs-only · versioned + CC0 + uptime note |
| **Fix stale nav on `action.html`** | Known inconsistency (old nav vs canonical 10-item) | cosmetic, but credibility |
| **Reconcile stale tickers in token seed** | AADA→LENFI, AGIX→FET — wrong tickers undermine trust on day one | `seed/tracked-tokens.json` |
| **Capture Catalyst Funds 14 & 15** | Catalyst page reads sparse; closing the fund gap makes it look complete | SPN was slow earlier — retry; archive repo |
| **Deploy CTF ecosystem cross-link** | CTF prod still missing the api.asy.life link (source ready, prod is sudo-deployed) | owner deploy |
| **README / announcement final polish** | First impression for anyone arriving from a link | EN+JA parity |

---

## Medium projects (weeks — pursue when feedback or usage points here)

| Item | Adoption rationale | State |
|------|--------------------|-------|
| **Market Data Accuracy build** | Rankings currently honest-but-thin (mcap on total not circulating, no liquidity/volume, ~11% universe). Accurate market data is what pulls the token/builder audience. | **Investigated + decided, not built.** Approach locked: circulating-supply override + flagged fallback; GeckoTerminal (keyless) for liquidity+volume; expand universe toward DexHunter ~1044; per-metric confidence. Full plan in `cardano-data-layer/MARKET_COVERAGE_AUDIT.md`. **Rule: accuracy before expansion.** |
| **Builders Fund read-integration** | Direct value to builders; turns project pages into a destination they return to | Needs **zero new backend** — uses existing `/project/:id`, `/category/:slug`, `/project/search`, `/history`. Design in `cardano-data-layer/BUILDERS_FUND_INTEGRATION.md`. Governed write side stays deferred. |
| **Capture real volume in the poller** | Unlocks the honestly-withheld volume ranking tab | folds into Market Data Accuracy (GeckoTerminal h24) |
| **Remaining JA parity sweep** | Half the intended audience is JA-native; gaps cost adoption there | on-chain enums + sourced events left EN by design — confirm scope |
| **Empty-state pass on thin pages** | 13 empty categories + sparse funds read as "broken" to newcomers | label-as-archival vs populate, decided per traffic (§3 of feedback doc) |
| **Lightweight API route counter at `/metrics`** | Cleaner usage signal than log-parsing for the API; no caller identity | aggregate `{route→count}` only |

---

## Major research items (months — demand-gated, never speculative)

| Item | What it is | Why it waits |
|------|-----------|--------------|
| **FLOW-1.5 — DRep migration matrix** | Research complete, methodology DRAFTed (`docs/FLOW_1.5_MIGRATION_METHODOLOGY.md`, would become METHODOLOGY §19), **not ratified, not implemented.** | **Waits for real demand from DReps** (feedback §5) *and* an explicit owner ratification of internal-ephemeral per-credential processing. Before any build: review **k threshold**, **dominance threshold**, **suppression rules**. No ETL / no UI / no exports until then. This is the canonical "build only when asked for" item. |
| **FLOW-6 — Catalyst ingestion** | Methodology drafted; needs the IdeaScale/Catalyst archive substantially captured first | Precondition: `project_observatory_ideascale_capture.md` TODO (IdeaScale-proper capture still pending; funds now 15/15 on projectcatalyst.io) |
| **Governed write side** (corrections, moderation, dispute) | The deliberately-unbuilt half of Project Memory — lets DReps/builders correct their own data | Demand is the trigger (feedback §5/§6); governance model already written, code intentionally not built. Big surface, big neutrality risk — only with a clear funding + maintainer model. |
| **voting.asy.life** (Ekklesia / Hydra participation layer) | The third pillar of the asy.life governance ecosystem | DNS reserved, not started; out of scope until observatory adoption is proven |
| **Funding & maintainer model** | The real long-term blocker for anything with a write side or live ETL guarantees | Not a feature — a sustainability decision; revisit once usage justifies it |

---

## How items flow

```
FEEDBACK_LOG.md  ──tag──▶  this roadmap  ──gate (adoption + never-list)──▶  active work
```

Demand promotes an item up. Lack of demand keeps it parked — *especially* the major
items. The roadmap exists so we never confuse "we could build it" with "people want it."

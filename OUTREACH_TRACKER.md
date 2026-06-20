# Outreach Tracker

**Phase:** Adoption. The platform is live; this file tracks the work of getting real
people to use it and say what they think. It is the operational companion to
`FIRST_100_USERS.md` (strategy) and `FEEDBACK_PIPELINE.md` (where feedback lands).

**The rule for every message:** no sales pitch, no hype. Send a person the one page
that is already about them (or already solves their problem) and say *"feedback
welcome."* Nothing more. We are asking, not selling.

**Privacy:** track public identifiers only — DRep IDs, project slugs, GitHub handles,
public social handles. No private contact details beyond what someone has made public.
The never-list still governs: no profiling, no scoring of the people we contact.

**Success is evidence, not volume.** A reply, a correction, a repeated request, one
external API consumer — each is worth more than a hundred unanswered sends.

---

## Priority order (from the master handoff)

1. **DReps** — the legitimizers. Send their own `/drep.html?id=` permalink.
2. **Builders** — project owners. Send their own `/project.html?id=` page.
3. **Developers** — the multiplier. Send the API (`api.asy.life/docs`).
4. **SPOs** — the adjacent network. Send treasury / governance-health + CC0 data.
5. **Governance participants** — word-of-mouth layer. Send the Top-30 + actions.

Work top-down. Don't widen to the next tier until the current one has been worked and
measured.

---

## Milestone: FIRST 15 USERS (prove-the-platform target)

The concrete near-term goal — small, reachable, evidence-generating. Not a vanity
number; each one is a real interaction logged below.

| Tier | Target | Contacted | Replied | Used (page/route) |
|------|--------|-----------|---------|-------------------|
| DReps | **5** | 0 | 0 | 0 |
| Builders | **5** | 0 | 0 | 0 |
| Developers | **5** | 0 | 0 | 0 |
| **Total** | **15** | **0** | **0** | **0** |

"Used" = there is evidence they actually opened/called the thing (a reply referencing
it, a correction, a repeated API call). That column is the real success measure.

## What to send (copy-paste ready — neutral, no pitch)

Fill the `<…>` placeholders. Keep it this short. Do not add adjectives.

### DRep
> Your DRep activity is recorded in a neutral, CC0 Cardano governance observatory —
> on-chain sourced, no scores or rankings. Your page: observatory.asy.life/drep.html?id=<drep_id>
> Everything is open and methodology is public. If anything looks off, tell us. Feedback welcome.

### Builder / project owner
> Your project is preserved in an open, provenance-backed Cardano project memory —
> with its source and history attached, so the record survives even if a site goes down.
> Your page: observatory.asy.life/project.html?id=<project_id>
> If anything's wrong or out of date, let us know and we'll note the correction. Feedback welcome.

### Developer
> Free, CC0, no-key Cardano data API — governance, treasury, projects, market, Catalyst,
> each response carrying its provenance. Docs: api.asy.life/docs · OpenAPI: api.asy.life/openapi.json
> If you build on it, I'd like to hear what's missing. Feedback welcome.

### SPO
> Neutral, CC0 Cardano treasury + governance data you can cite to your delegators —
> no scores, no judgment. Treasury: observatory.asy.life/treasury.html ·
> Governance health: observatory.asy.life/governance-health.html · Feedback welcome.

### Governance participant
> A neutral place to watch Cardano governance — Top-30 DReps, the live governance
> actions, the treasury — with no opinions attached. observatory.asy.life · Feedback welcome.

> **Note:** actual sending (email/DM/forum posts) is an owner action — these templates
> are ready to copy. Log each send below as it goes out.

### Targeted validation asks (only after they've engaged — don't lead with these)

**API validation — ask real developers (Obj 5):**
1. Which endpoint would you actually use?
2. Which endpoint is missing?
3. What would stop you adopting it? (stability, license, rate limits, a missing field…)

**Builders Fund validation — ask builders (Obj 6).** Money/custody/settlement stay off;
this is purely "does the read-only journey make sense?":
1. Does the builder → campaign → milestone → evidence journey make sense?
2. Would you understand what a **milestone** is and what counts as done?
3. Would you understand what counts as **evidence**?

Log answers in §2 (categorize) and §3 (if it's a request). A "no, this is confusing"
is a `confusion` data point — that's a win for evidence, not a failure.

---

## 1 · Outreach log

One row per contact attempt. `Sent` = the artifact link you sent. `Status` =
queued / sent / replied / no-reply / bounced.

| Date | Tier | Who (public id/handle) | Channel | Sent (page/link) | Status | Response summary |
|------|------|------------------------|---------|------------------|--------|------------------|
| | | | | | | |

---

## 2 · Feedback received

Every response, verbatim where possible. Mirror notable items into
`docs/FEEDBACK_LOG.md` and tag to a `ROADMAP_POST_LAUNCH.md` bucket.

| Date | Source | Tier | Verbatim ask / comment | Touches never-list? | Roadmap tag |
|------|--------|------|------------------------|--------------------|-------------|
| | | | | | |

---

## 3 · Requested features

Distinct asks. `Count` is how many people asked for it — that's the prioritization signal.

| Feature / request | First asked | Asked by (count) | Effort (QW/MED/MAJOR) | Never-list collision | Roadmap bucket |
|-------------------|-------------|------------------|-----------------------|----------------------|----------------|
| | | | | | |

---

## 4 · Repeated requests (the demand signal)

Promote here the moment a request is asked **twice or more**. This table is what
moves an item from "parked" to "active" in the roadmap — demand, not opinion.

| Request | Times asked | Tiers asking | Decision |
|---------|-------------|--------------|----------|
| | | | |

---

## Running tallies

Update as you go. These are evidence, not vanity — keep them honest.

- DReps contacted: **0** · replied: **0**
- Builders contacted: **0** · replied: **0**
- Developers contacted: **0** · replied: **0**
- SPOs contacted: **0** · replied: **0**
- Governance participants contacted: **0** · replied: **0**
- Corrections requested (the write-side demand signal): **0**
- External API consumers identified: **0**

---

## Operating rhythm

- **Per send:** log row in §1.
- **Per reply:** log §2; if it's a feature ask, also §3; if asked before, promote to §4.
- **Weekly:** reconcile with the `FEEDBACK_PIPELINE.md` log-parse (who's actually using
  the pages/routes vs who we contacted); update tallies.
- **When a request hits §4:** take it to `ROADMAP_POST_LAUNCH.md` and decide.

The job of this file is to convert outreach into evidence, and evidence into the next
roadmap decision. Nothing here builds a new subsystem — it proves who needs the ones
that exist.

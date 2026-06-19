# First 100 Users

**Goal:** move from *building* to *usage*. We have a substantial, live ecosystem
(`observatory.asy.life` + `api.asy.life` + three public archives) and effectively zero
proven users. The work now is distribution, not features.

**Principle:** we do not market, hype, or persuade. The observatory is neutral
infrastructure — adoption comes from **putting the right factual page in front of the
right person at the right moment.** The most powerful move we have is showing someone
*their own data, accurately preserved, with no judgment attached.* That is a gift, not
a pitch.

**Definition of a "user":** not a pageview. A user is someone who (a) returns, (b)
links to us, (c) calls the API more than once, or (d) sends feedback. Track against
`FEEDBACK_PIPELINE.md`.

---

## The one tactic that does the most work

**Send people their own permalink.**

- Every top DRep has `/drep.html?id=…`. Every preserved project has
  `/project.html?id=…`. These pages are factual, neutral, and *about them*.
- A short, non-promotional note — "Your DRep activity is part of a neutral, CC0
  governance observatory at observatory.asy.life; here's your page; everything is
  on-chain-sourced and you can tell us if anything's off" — converts far better than
  any announcement, because it's useful and it's about the recipient.
- It simultaneously seeds traffic, surfaces corrections (feedback §5/§6), and builds
  goodwill with the exact people whose buy-in legitimizes the project.

Everything below is a variation on this: find the audience, hand them the one page
that is already about them or already solves their problem.

---

## By audience

### DReps — *the legitimizers*
- **Where they are:** Intersect, DRep Telegram/Discord groups, GovTool community,
  X governance circle, Catalyst Town Halls.
- **What they want:** to know how they're seen; an accurate, neutral record; a link
  they can share; eventually, the ability to correct their own info.
- **The hook:** their `/drep.html?id=` permalink + `/flows.html` (delegation trend) +
  `/methodology.html` (proves we're fair, not editorializing).
- **The ask:** "Is your page accurate? Share it if it's useful." Nothing more.
- **Conversion signal:** they link their page; they ask for a correction or a feature
  (that ask is the input that one day decides FLOW-1.5).

### SPOs — *the adjacent network*
- **Where they are:** SPO Telegram/Discord groups, CExplorer/Pool.pm communities,
  pool operator forums, Cardano Forum staking section.
- **What they want:** governance context for their delegators; treasury/parameter
  visibility; neutral data they can cite to their community.
- **The hook:** `/treasury.html`, `/governance-health.html`, `/concentration.html`,
  and the CC0 data exports (they value reusable, attribution-free data).
- **The ask:** "Neutral governance + treasury data you can quote to your delegators,
  CC0." SPOs are natural amplifiers — they already publish to their communities.

### Builders — *the project owners*
- **Where they are:** Cardano Discord/Telegram dev channels, Catalyst proposer
  circles, Built-on-Cardano / cardanocube ecosystem.
- **What they want:** their project represented correctly; preservation (many have
  watched peers' data vanish — TapTools, jpg.store); a category/listing presence.
- **The hook:** their `/project.html?id=` page + `/ecosystem.html` (74-category
  explorer) + the preservation story ("your project is archived with chain-of-custody
  even if your site goes down").
- **The ask:** "Here's your project's preserved page — anything to correct?" This is
  the on-ramp to the future governed-write loop, and it makes builders feel *cared
  for*, not surveilled.

### Governance participants — *the everyday delegators & observers*
- **Where they are:** Cardano Forum, X, Reddit r/cardano, GovTool users, Catalyst
  voters.
- **What they want:** to understand what's happening in governance without spin; to
  decide delegation; a trustworthy reference to cite in debates.
- **The hook:** `/` (Top-30 at a glance), `/actions.html` (what's on the ballot),
  `/governance-health.html`, `/memory.html` (the plain-language front door).
- **The ask:** "A neutral place to see Cardano governance — no scores, no opinions."
  These people become the citation/word-of-mouth layer.

### Developers — *the multiplier*
- **Where they are:** GitHub, Cardano dev Discord/Telegram, builder Catalyst groups,
  Stack-Exchange-style Q&A.
- **What they want:** free, stable, well-documented data; something to build on now
  that TapTools is sunsetting; clear license and terms.
- **The hook:** `api.asy.life` — `/docs`, `/openapi.json`, the ready-made
  `examples/curl.sh` + `examples/sdk.mjs`, and the CC0 license.
- **The ask:** "Free CC0 Cardano governance + market + project data API — build on it."
- **Conversion signal (the strongest in the whole project):** one external app that
  consumes the API repeatedly. Land *one* and feature it; it becomes social proof for
  the next ten. Repeat callers (feedback §4) are interview targets — ask what they're
  building and remove their blockers first.

---

## Channels, in priority order

1. **Direct permalink outreach** (DReps, then builders) — highest conversion, lowest noise.
2. **GitHub** (developers) — Discussions + good READMEs + openapi; where devs already live.
3. **Cardano Forum** — one substantive, non-promotional post per pillar (governance,
   data API, preservation). Long-lived, searchable, credible.
4. **X / governance circle** — the launch thread (already drafted: `docs/LAUNCH_THREAD.md`)
   + replying with the *relevant page* whenever a governance question comes up.
5. **SPO / DRep group chats** — share CC0 data and let operators amplify.
6. **Catalyst / Intersect calls** — show, don't sell; mention the preservation work.

---

## Sequencing (don't do it all at once)

1. **Instrument first** (feedback pipeline live) so we can *see* what the first users do.
2. **Permalink outreach** to top DReps and a handful of notable projects — small batch,
   personal, watch the response.
3. **Developer post** (API) — aim for the one external consumer.
4. **Forum + thread** once a few pages have traction to point at.
5. **Measure, then widen** the channels that converted; drop the ones that didn't.

---

## What "success" looks like for the first 100

- A handful of DReps have shared or referenced their own page.
- At least one external app calls `api.asy.life` repeatedly.
- A few project owners have requested corrections (the write-side demand signal).
- `docs/FEEDBACK_LOG.md` is non-empty and pointing the roadmap.
- We can name *who* uses it and *what for* — the moment building stops being a guess.

The first 100 users are not a vanity number. They are the people whose behavior and
requests replace our assumptions. Getting them is the whole job right now.

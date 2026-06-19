# Feedback Pipeline

**Purpose:** turn the live ecosystem into a learning loop. We are done building blind.
Every decision from here is informed by *what people actually do and ask for* — not by
what we imagine they need.

**Hard constraint:** the observatory's "never" list still governs. No tracking of
individuals, no social layer on the data, no alerts, no cookies that profile people.
Feedback collection must be **aggregate, privacy-respecting, and off the data surface.**
We measure our *own pages and routes*, never our *users*.

---

## 1. How do we collect feedback?

Two streams: **passive** (what the infrastructure already records) and **active**
(what people tell us). Both feed one place.

### Passive — server-side, aggregate, zero new tracking surface
- **Source that already exists:** nginx access logs.
  - `observatory.asy.life` and `api.asy.life` both log to `/var/log/nginx/access.log`
    (currently a *single combined log*, root:adm, ~14-day rotation).
  - **Action 1 (quick win):** split the vhosts into separate access logs
    (`access_log /var/log/nginx/observatory.access.log;` in the observatory server
    block; same for api) so page traffic and API traffic are cleanly separable.
  - **Action 2 (quick win):** a small read-only log-parsing script (run weekly by
    cron, output a CC0-able aggregate table) → top pages, top API routes, 404s,
    referrers. **Strip / truncate client IPs** before any output is stored — we
    keep counts, never visitors.
  - This requires sudo (logs are root-owned) → **owner runs it or grants read.**
- **No JavaScript analytics by default.** Google Analytics / cookies are off the
  table — they contradict the neutral, surveillance-free posture and would be the
  one place we'd violate our own "no tracking" promise. If page-level analytics
  beyond logs is ever wanted, the *only* acceptable form is **self-hosted,
  cookieless, no-personal-data** (GoatCounter or Plausible self-hosted). Decision
  deferred — logs come first because they cost nothing and add no client surface.

### Active — people telling us, off-platform
The site has no comments, ratings, or accounts (and never will). So the feedback
*invitation* lives on the site, but the feedback *channel* lives elsewhere.
- **Add a single "Feedback" link** in the footer site-wide → points to a public
  GitHub Discussions board on `cardano-delegation-observatory` (or a plain
  `mailto:`). One link, no form, no script. (Quick win.)
- **GitHub Issues / Discussions** on the three public repos — the canonical place
  for builders and developers (they already live there).
- **Direct channels we monitor:** Cardano Forum, X/Twitter replies and DMs,
  Intersect / governance working-group calls, Catalyst Town Halls, SPO and DRep
  Telegram/Discord groups.

### One destination for everything
Maintain a running **`docs/FEEDBACK_LOG.md`** (append-only, dated entries):
`date · source · who-kind (DRep/SPO/builder/dev/gov/anon) · verbatim ask · our tag`.
Tag every item to a roadmap bucket (see `ROADMAP_POST_LAUNCH.md`). This file is the
raw material every future prioritization decision reads from.

---

## 2. Which pages get traffic?

**Method:** weekly log parse, ranked by request count, deduped by path, bots
filtered (drop obvious crawler UAs). Track the trend, not a single snapshot.

**Hypotheses to confirm/refute** (the whole point is we don't actually know yet):
- Likely high: `/` (Top-30 leaderboard), `/drep.html?id=…` permalinks (if we seed
  them — see `FIRST_100_USERS.md`), `/methodology.html` (credibility checkers).
- Possibly high: `/tokens.html`, `/rankings.html`, `/treasury.html`,
  `/catalyst.html` (each speaks to a different audience).
- Watch: `/concentration.html`, `/governance-health.html`, `/flows.html` — these are
  the analytical pages we're proudest of; do they actually land?

**Fill-in table (populate after ~2–4 weeks live):**

| Page | Requests/wk | Trend | Top referrer | Audience inferred |
|------|-------------|-------|--------------|-------------------|
| `/` | | | | |
| `/drep.html` | | | | |
| `/methodology.html` | | | | |
| … | | | | |

---

## 3. Which pages are ignored?

Same parse, bottom of the ranking. **Ignored ≠ kill it** — for a governance-memory
project some pages are reference/archival and *should* be quiet. The question is
diagnostic: is a page ignored because it's niche-by-design, or because it's
**undiscoverable** (bad nav placement) or **not useful** (empty state, unclear value)?

For each low-traffic page record one of:
- **Archival / reference** → expected, leave it.
- **Discoverability problem** → fix nav/links (quick win), re-measure.
- **Value problem** → candidate for rework or honest deprecation.

Known suspects up front: the 13 empty categories and sparse Catalyst funds may make
those pages feel hollow → traffic will tell us whether to invest or to label-and-move-on.

---

## 4. Which API routes are used?

`api.asy.life` is the developer-facing product and the clearest adoption signal we
have — **someone calling the API repeatedly is real usage, not a glance.**

**Method:** parse the api vhost log (once split) for path frequency, distinct
caller-coarseness (count of /24 subnets, *not* IPs), and error rates per route.
Optionally add a lightweight in-service route counter (the service already exists;
an aggregate `{route → count}` map exposed at `/health` or a `/metrics` endpoint is
a small, honest addition — no caller identity stored).

**What to learn:**
- Which of the ~37 routes get called at all (kill/merge dead ones).
- Price/OHLCV/token vs governance vs project-memory vs catalyst — *which domain*
  pulls developers. That tells us where the moat actually is in practice.
- Repeat callers = candidates to interview directly ("what are you building?").
- 4xx/5xx by route = the real bug/coverage backlog, ranked by demand.

| Route | Calls/wk | Distinct subnets | Error % | Notes |
|-------|----------|------------------|---------|-------|
| `/dreps` | | | | |
| `/token/:id` | | | | |
| `/project/:id` | | | | |
| … | | | | |

---

## 5. What do DReps ask for?

DReps are the subject *and* a primary audience. Listen where they are: Intersect,
DRep Telegram/Discord groups, governance calls, X, and replies when we send them
their own permalink page.

**Capture, don't guess. Anticipated themes (to validate):**
- "Is my page accurate? Can I correct/annotate my metadata?" → governed-write demand
  (currently the deliberately-unbuilt write side).
- "Show my delegation trend / where delegation came from." → flows/migration demand
  → this is the live signal that decides whether **FLOW-1.5** ever leaves research.
- "Compare me to peers without it being a ranking/judgment." → tension with the
  never-list; handle as methodology, not feature creep.
- "Embeddable badge / link for my own channels." → cheap distribution win.

Every DRep ask gets logged with whether honoring it would touch the never-list. That
distinction is the firewall against feedback eroding neutrality.

---

## 6. What do builders ask for?

Builders = projects in the ecosystem (Project Memory subjects) **and** developers
consuming the API. Two sub-audiences, slightly different asks.

**Project owners (subjects of the memory layer):**
- "This is our project's page — something's wrong / out of date / we're not dead." →
  the strongest, most actionable feedback we'll get, and the natural on-ramp to the
  governed correction loop. Treat every such message as gold.
- "Add our project / category / link." → coverage requests; route to import backlog.

**Developers (API consumers):**
- "Endpoint X is missing / returns null / is slow." → ranked by route demand (§4).
- "Need field Y / pagination / a webhook." (webhooks/feeds hit the never-list — say so.)
- "License / terms / rate-limit clarity." → docs quick win.
- "Stability guarantee — can I depend on this?" → the real adoption blocker for
  developers; answer it explicitly (versioned API, CC0, uptime).

---

## Operating rhythm

- **Weekly:** run the log parse; append notable items to `docs/FEEDBACK_LOG.md`.
- **Monthly:** re-rank pages and routes; move tagged items into `ROADMAP_POST_LAUNCH.md`.
- **Every roadmap decision** cites feedback evidence. No evidence → it waits.

The pipeline's job is not to generate work. It's to make sure the work we do is the
work people asked for.

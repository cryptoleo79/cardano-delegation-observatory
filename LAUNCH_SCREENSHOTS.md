# LAUNCH_SCREENSHOTS.md — capture checklist

I can't render a browser in the build environment, so this is the shot list to
capture (any browser; or `npx playwright screenshot <url> out.png`). Capture each
at **desktop 1440×900** and the starred ones also at **mobile 390×844**. Light
mode, EN. All URLs are live.

| # | URL | Frame / what it shows | Caption |
|---|---|---|---|
| 1 ★ | observatory.asy.life | Hero + ecosystem-scale band (847 / 74 / 1,048 / 15 / …) + Top-30 **leaderboard** (frozen rank+name, green/red Δ) | "Top-30 DReps by voting weight — a leaderboard, not a spreadsheet." |
| 2 ★ | observatory.asy.life/rankings.html | Hero + metric cards + segmented control + token rows with avatars + mcap bars | "Live token rankings — circulating market cap, real liquidity & volume, provenance on every value." |
| 3 ★ | observatory.asy.life/changes.html | Window control (24h/7d) + History-coverage panel + Top gains/losses + live feed | "Governance change feed — what changed today / this week. Movement only, no inference." |
| 4 | observatory.asy.life/projects.html | Hero + metric cards + project rows with website/GitHub/docs links | "Project Memory — 847 projects, 715 with sourced links, every value provenance-backed." |
| 5 | observatory.asy.life/ecosystem-map.html | Live public-metrics tiles + the CTF→Observatory→…→API flow map | "One map of the asy.life ecosystem + live metrics." |
| 6 | observatory.asy.life/heartbeat.html | The three pipeline cards (Fresh/Warning/Stale) | "System heartbeat — every pipeline's freshness, public." |
| 7 | observatory.asy.life/catalyst.html | Hero + metric cards + Funds 1–15 | "Catalyst preservation — 15/15 funds, chain-of-custody." |
| 8 | observatory.asy.life/governance-health.html | Metric cards (active DReps, concentration, participation) | "Governance health at a glance." |
| 9 | api.asy.life/docs (or /openapi.json) | The API docs / a sample `_quality` block | "Free, keyless, read-only API — 37 routes, provenance on every response." |

**Tips:** scroll so the metric cards + the table top are both visible (shots 1–4).
For the language pill, optionally capture EN and 日本語 side by side. The hero
"as of" cards make the data look live — keep them in frame.

**Suggested post order:** 1 (home leaderboard) → 3 (change feed) → 2 (rankings) →
9 (API) → 5 (map). Lead with the leaderboard or the change feed; both are the
strongest visuals.

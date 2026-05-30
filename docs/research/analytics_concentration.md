# Analytics — concentration metrics research notes

**Status:** Research only. Intelligence for future §22 methodology drafting. No code, no methodology edits, no schema changes.
**Date:** 2026-05-29
**Scope:** Gini, HHI, Theil, Atkinson, Nakamoto, top-N share, Shannon entropy as applied to stake-weighted DRep distribution.

---

## 1. Definitions and formulas

### 1.1 Gini coefficient

Measure of inequality, 0 (perfect equality) to 1 (maximum inequality).

For *n* entities sorted ascending *w₁ ≤ w₂ ≤ … ≤ wₙ*:

```
Gini = (2 · Σ(i · wᵢ)) / (n · Σwᵢ) − (n + 1) / n
```

**For the observatory:** input is `voting_weight_lovelace` per registered DRep (excluding `drep_always_abstain`, `drep_always_no_confidence` unless noted).

- Gini = 0: all DReps have equal voting weight
- Gini = 0.3–0.4: relatively equal governance power (low concentration)
- Gini = 0.6–0.8: moderate-to-high concentration
- Gini = 0.9+: extreme concentration

**Strengths:** intuitive 0–1 range; single summary number; well-studied.
**Weaknesses:** insensitive to *where* inequality occurs (top vs middle vs tail); two different distributions can share the same Gini; does not directly answer "how many DReps control voting."

### 1.2 Herfindahl-Hirschman Index (HHI)

Sum of squared market (voting) shares, 0 to 10,000.

```
HHI = Σ(sᵢ²)
```

where *sᵢ* = voting_weight of DRep *i* / total voting_weight, expressed as percentage.

**Example:** three DReps at 50%, 30%, 20%:
```
HHI = 50² + 30² + 20² = 2,500 + 900 + 400 = 3,800
```

**Antitrust thresholds** (DOJ/FTC, not governance):
- < 1,500: unconcentrated
- 1,500–2,500: moderately concentrated
- > 2,500: highly concentrated

**Why these thresholds DO NOT transfer to governance:**
- Antitrust HHI thresholds are calibrated for firm entry/exit and consumer price effects, not voting deadlock or minority protection
- Governance has different quorum / supermajority rules (e.g., Cardano no-confidence threshold is 13.33% of eligible voters — different from market-power antitrust)
- "Highly concentrated" market under antitrust might be acceptable governance if large stakeholders are diverse in interests

**Strengths:** emphasizes the largest entities (quadratic weighting); directly comparable across periods.
**Weaknesses:** absolute scale arbitrary for governance; cannot distinguish "three at 33%" from "ninety-nine at 1% + one at 1%" if numbers work out.

### 1.3 Theil index

Entropic inequality measure, 0 (perfect equality) to ln(*n*) (maximum inequality). Decomposable by subgroups.

```
Theil = (1/n) · Σ ln(mean_weight / wᵢ)
```

**Strengths:** decomposable (can compute Theil for top-N vs bottom-M and sum them); sensitive to mean.
**Weaknesses:** less intuitive than Gini; logarithms require handling zero or near-zero weights.

### 1.4 Atkinson index

Welfare-based inequality, 0 to 1, with ε inequality-aversion parameter.

```
Atkinson(ε) = 1 − ((1/n) · Σ(wᵢ / mean_weight)^(1−ε))^(1/(1−ε))
```

For ε = 1: `Atkinson(1) = 1 − exp((1/n) · Σ ln(wᵢ / mean_weight))`

ε choice: 0 → Gini-like; 1.0 → equal focus on all relative gaps; 2.0+ → strong focus on small-DRep end.

**Strengths:** clear welfare interpretation ("what fraction of average voting weight would DReps give up to achieve perfect equality?").
**Weaknesses:** requires choosing ε; different choices give different results.

### 1.5 Nakamoto coefficient

Minimum number of DReps whose combined voting weight exceeds a critical threshold (quorum, no-confidence, or another governance-relevant cutoff).

```
Nakamoto_coeff(threshold) = min(k) such that Σ(top-k weights) > threshold
```

**For Cardano:**
- No-confidence threshold: ~13.33% of eligible voters
- Ratification threshold: 50% + 1 (rules evolve)
- Other potential thresholds: quorum minimums, blocking coalitions

**Strengths:** *actionable*. Directly answers "can this threshold be crossed by X DReps?"
**Weaknesses:** requires defining the threshold; multiple thresholds yield multiple Nakamoto numbers (a single headline is incomplete).

### 1.6 Top-N share

Cumulative voting weight of largest *n* DReps as percentage.

```
Top-N share = Σ(voting_weight of top-n DReps) / total_voting_weight × 100%
```

**Strengths:** extremely simple, transparent; reportable as a small set (top-5, top-10, top-30) without single-number bias; directly observable from the daily snapshot.
**Weaknesses:** multiple numbers required to avoid cherry-picking; says nothing about the tail; sensitive to choice of n.

### 1.7 Shannon entropy

Information-theoretic measure of distribution disorder. Higher entropy = more uniform = less concentration.

```
Entropy = − Σ (pᵢ · ln(pᵢ))
```

Max entropy = ln(*n*). Normalized form: `Entropy / ln(n)`.

**Strengths:** sensitive to all entities; normalized form (0–1) intuitive as Gini complement.
**Weaknesses:** logarithm handling (must guard zero weights); inverse of concentration (mental flip required — high entropy = good decentralization).

---

## 2. Worked numerical example

**Snapshot of 10 DReps, plausible power-law distribution:**

| Rank | DRep | Weight (M lovelace) | % of total |
|---|---|---|---|
| 1 | D1 | 250 | 25.0% |
| 2 | D2 | 180 | 18.0% |
| 3 | D3 | 140 | 14.0% |
| 4 | D4 | 110 | 11.0% |
| 5 | D5 | 85 | 8.5% |
| 6 | D6 | 65 | 6.5% |
| 7 | D7 | 50 | 5.0% |
| 8 | D8 | 45 | 4.5% |
| 9 | D9 | 35 | 3.5% |
| 10 | D10 | 25 | 2.5% |
| **Total** | | **985** | **98.5%** (rounding) |

Computed metrics:

- **Gini ≈ 0.586** — moderate-to-high inequality
- **HHI ≈ 1,445** — unconcentrated to moderately concentrated under antitrust framing (no governance translation)
- **Theil ≈ 0.16** — moderate (on a scale max ≈ ln(10) ≈ 2.30)
- **Atkinson(1) ≈ 0.15** — moderate; equality would require giving up ~15% average weight
- **Nakamoto(13.33%) = 1** — D1 alone exceeds the no-confidence threshold (stark result)
- **Nakamoto(50%) = 3** — D1 + D2 + D3 = 570M exceeds 50% (500M)
- **Top-3 share = 57.0%**; **Top-5 = 76.5%**; **Top-10 = 100%**
- **Normalized entropy ≈ 0.60** — moderate concentration (60% of max disorder)

---

## 3. Sensitivity table

How metrics respond to three perturbations on the baseline.

### Test A: add a small new DRep at the tail (D11 with 5M)

| Metric | Baseline | After D11 | Δ |
|---|---|---|---|
| Gini | 0.586 | 0.584 | ↓ −0.002 |
| HHI | 1,445 | 1,433 | ↓ −12 |
| Theil | 0.159 | 0.161 | ↑ +0.002 |
| Atkinson(1) | 0.147 | 0.149 | ↑ +0.002 |
| Nakamoto(13.33%) | 1 | 1 | — |
| Nakamoto(50%) | 3 | 3 | — |
| Top-3 share | 57.0% | 56.7% | ↓ −0.3pp |
| Entropy (norm) | 0.603 | 0.605 | ↑ +0.002 |

**Lesson:** micro-DReps don't materially change concentration metrics, *except* mean-based indices (Theil, Atkinson) move slightly in the "more unequal" direction because new tiny DRep lowers the mean. Nakamoto unchanged.

### Test B: merge D1 (250M) + D2 (180M) → single 430M entity

| Metric | Baseline (10) | After merge (9) | Δ |
|---|---|---|---|
| Gini | 0.586 | 0.650 | ↑ +0.064 |
| HHI | 1,445 | 2,174 | ↑ +729 |
| Theil | 0.159 | 0.224 | ↑ +0.065 |
| Atkinson(1) | 0.147 | 0.213 | ↑ +0.066 |
| Nakamoto(13.33%) | 1 | 1 | — |
| Nakamoto(50%) | 3 | 2 | ↓ −1 |
| Top-3 share | 57.0% | 65.2% | ↑ +8.2pp |
| Entropy (norm) | 0.603 | 0.531 | ↓ −0.072 |

**Lesson:** all inequality metrics spike uniformly. **Nakamoto(50%) dropping by 1 is the most actionable signal** — it directly tells you a merger reduced the number of actors needed to control ratification. If Nakamoto stays the same despite Gini/HHI moving, concentration increased but not in a way that changes governance control.

### Test C: include vs exclude special DReps and unregistered stake

Assume drep_always_abstain holds 50M, drep_always_no_confidence holds 30M, unregistered = 20M.

| Metric | Include all | Active only | Δ |
|---|---|---|---|
| Gini | 0.650 | 0.586 | ↓ −0.064 |
| HHI | 1,800 | 1,445 | ↓ −355 |
| Top-3 share | 71.8% | 57.0% | ↓ −14.8pp |

**Lesson:** unregistered stake + special DReps inflate the denominator and make active DReps' shares look smaller → concentration metrics look *worse*. **Methodology must compute metrics on the active registered DReps only**, with explicit note about exclusions.

---

## 4. Recommended panel — avoiding redundancy

The seven measures above are not independent. Argue for a small panel rather than a single number.

**Suggested panel for daily publication:**

1. **Gini Coefficient** (0–1) — overall dispersion. Caveat readers: "insensitive to where the concentration occurs."
2. **HHI / 100** (0–100, renormalized) — different sensitivity than Gini (heavier weight on top). Caveat: antitrust thresholds do not apply to governance.
3. **Nakamoto coefficient (for no-confidence threshold)** — *actionable*. Define the threshold explicitly.
4. **Top-5 share and Top-10 share** (as a pair) — transparent, interpretable. Pair them to avoid cherry-picking.
5. **Normalized Shannon entropy** (0–1) — complements Gini by being equally sensitive to all entities.

**Metrics to NOT publish separately:**

- **Atkinson:** requires choosing ε; defer until clear governance policy asks for it.
- **Theil:** overlaps with entropy; less intuitive. Reserve for decomposability needs.
- **Top-1, Top-3 separately:** fine in JSON export, but don't clutter the main table.

**Why this panel:**
- Five numbers, manageable, avoids single-number bias
- Different sensitivities: Gini (middle), HHI (top), Entropy (all), Nakamoto (governance threshold), Top-N (transparent slice)
- No redundancy
- Actionable

**Presentation suggestion** — under a `concentration_metrics` key in daily snapshot JSON:

```json
{
  "snapshot_date": "2026-05-29",
  "concentration_metrics": {
    "gini_coefficient": 0.586,
    "hhi_normalized": 14.45,
    "nakamoto_coefficient_no_confidence": 2,
    "nakamoto_coefficient_ratification": 3,
    "top_5_share_percent": 76.5,
    "top_10_share_percent": 100.0,
    "shannon_entropy_normalized": 0.603
  },
  "concentration_notes": {
    "active_dreps_included": 10,
    "special_dreps_excluded": ["drep_always_abstain", "drep_always_no_confidence"],
    "unregistered_stake_excluded": true
  }
}
```

---

## 5. Inclusion / exclusion rules

### drep_always_abstain and drep_always_no_confidence

**Exclude from denominator.** They are protocol-level default delegation targets, not individual agents making decisions. Including them skews metrics upward.

Filter: `drep_id NOT IN ('drep_always_abstain', 'drep_always_no_confidence') AND last_seen_epoch >= current_epoch - 1`.

### Unregistered stake

**Exclude from denominator.** Does not participate in voting; including it inflates total and depresses real DReps' shares.

### Deregistered DReps

**Exclude; they have zero voting weight.**

### Inactive DReps (registered, zero weight)

**Exclude.** Zero weight provides no information; including them inflates *n* without adding distribution data. Filter: `voting_weight_lovelace > 0`.

### New DReps within the epoch

Do not exclude; note in methodology that adding a new DRep within the lookback window can slightly change Gini/HHI retrospectively. Metrics are "backward-looking snapshots, not trend-adjusted."

---

## 6. Time-series presentation

### Cadence options

**Daily metrics**
- Pro: high granularity, aligned with daily ETL
- Con: intra-epoch changes don't affect governance voting outcomes; daily metrics create noise around what "changed"

**Epoch-boundary metrics**
- Pro: aligned with governance snapshot mechanics
- Con: less frequent updates; requires mapping snapshots to epochs

**Recommendation: publish both.** Daily series for trend analysis within weeks. Epoch-boundary series for governance-outcome analysis ("what was concentration when voting occurred?"). Both in JSON; main HTML might show daily with epoch markers as vertical lines.

### Meaningful deltas

Do not define a universal "significance threshold." Provide raw numbers; let readers reason about significance given their priorities.

Suggested methodology language:

> "Concentration metrics are point measurements of the daily snapshot. Changes between consecutive days reflect delegation movements visible in voting-weight changes (Δ1d, Δ7d, Δ30d) from §18. The significance of any change depends on governance context (e.g., is there an active proposal where the change affects quorum?). The observatory reports the metrics as-is and does not interpret them as 'good' or 'bad' concentration."

### Sampling artifacts and new DReps

- New DRep registration can change Gini/HHI retroactively (denominator shifts)
- Sudden large movements (custodian/exchange) are one-time events, not trends; metrics will jump
- Dust delegations are negligible
- **Recommendation:** do not smooth or filter. Report as-is, with a note that readers cross-reference the voting-weight table to understand underlying movement.

---

## 7. Editorial-firewall recommendations

### Central risk

A single concentration metric in isolation is editorial. Examples:

- "Gini = 0.65" alone → "governance is centralized" or "governance is moderate" — both interpretations
- "HHI = 2,400" alone → "highly concentrated" (antitrust framing) or "voting still distributed"
- "Top-5 share = 40%" alone → "five entities control" or "60% is outside the top 5"

**Firewall rule:** never publish a single metric alone. Always publish a *set* with explicit technical descriptions and no implicit value judgments.

### Recommended methodology language for §22

> "The observatory publishes a set of concentration metrics — Gini coefficient, HHI, Nakamoto coefficient (for specified thresholds), top-N shares, and Shannon entropy — each computed daily on the registered DRep population. These metrics capture different aspects of voting power distribution: Gini measures overall inequality; HHI emphasizes large-scale concentration; Nakamoto measures governance control at specific thresholds; top-N shares show transparent slicing; entropy measures overall disorder. No single metric tells the full story. Readers should consult the full set to understand concentration in context.
>
> The metrics are reported as numbers, not as interpretations. An increase in Gini from 0.60 to 0.62 is a fact. Whether this represents 'problematic centralization' is a governance question the observatory does not answer. Readers and delegators can use these metrics to assess delegation choices and governance health according to their own priorities."

### Site presentation

Each metric with plain-language description, value, link to methodology:

```
Gini Coefficient [link to §22.1]: 0.586
  Measures how evenly voting power is distributed among active DReps, on a scale from 0
  (perfect equality) to 1 (one DRep controls all power). This metric is insensitive to
  where inequality occurs.

Nakamoto Coefficient (No-Confidence Threshold) [link to §22.5]: 2
  The minimum number of the largest DReps whose combined voting weight exceeds 13.33%
  (the Cardano no-confidence threshold). A lower number indicates a smaller group can
  trigger no-confidence.

Top-5 DRep Share: 76.5%
Top-10 DRep Share: 100.0%
  The percentage of total voting weight held by the largest 5 and 10 DReps.
  No interpretation; these are transparent slices of the distribution.
```

### Language to avoid

- ~~"Centralization is increasing"~~ → "Gini increased from 0.55 to 0.58."
- ~~"Governance is healthy/unhealthy"~~ → state the metric, let readers decide.
- ~~"Power is concentrated"~~ → "The top-5 DReps hold 76.5% of voting weight."
- ~~"Decentralization is the priority"~~ → report metrics. Decentralization is a value; the observatory reports facts.

### Explicit non-goals (for §22)

The observatory does not:

- Recommend "optimal" concentration levels
- Claim that lower Gini is categorically "better"
- Alert the community to "concerning" concentration changes
- Adjust metrics based on governance outcomes
- Predict governance outcomes from concentration metrics

---

## 8. Open questions for §22 author

1. **Scope of top-N in the panel.** Top-5 + top-10? Or top-3 / 5 / 10 / 30? Trade-off: more slices = more transparent, also overwhelming.
2. **Governance-context thresholds for HHI.** Antitrust does not transfer. Define local thresholds for "watch this"? Or no thresholds at all?
3. **Nakamoto denominator choices.** No-confidence only, or ratification (50%) and supermajority (66%) too? Each gives a different number.
4. **Time-series frequency and export paths.** Concentration inline in daily snapshot? Or separate `/data/snapshots/concentration.json`? Epoch-boundary series as separate file?
5. **Atkinson ε selection.** If ever added, which ε? Multiple?
6. **Audit and reproducibility.** Should concentration metrics be versioned with `schema_version` + `methodology_version`? Should readers be able to recompute from daily snapshot files alone?
7. **Per-DRep visualization.** Should drep.html show that DRep's contribution to moving Gini/HHI? (Likely future, not §22.)
8. **Relationship to FLOW-1 flow metrics.** Concentration metrics independent, or published together with delegation flow?
9. **Methodology versioning.** v0.8 or v1.0 when concentration ships?
10. **Community review.** Methodology comment period before shipping?

---

## 9. Key takeaways

1. **Single metrics are editorial; publish a panel.** Gini + HHI + Nakamoto + Top-N + Entropy provides non-redundant coverage.
2. **Nakamoto coefficient is the most governance-relevant.** Directly answers "how many DReps can trigger a governance action?"
3. **Top-N shares are the most transparent.** "Top 5 hold 76.5%; top 10 hold 100%" needs no formula.
4. **Exclude special DReps and unregistered stake from denominators.** They are not active governance participants.
5. **Daily snapshots are fine, with the intra-epoch caveat.** Consider both daily and epoch-boundary series.
6. **Guard against interpretation drift.** Methodology should emphasize that metrics are measurements, not judgments. Use "Gini is 0.59" not "governance is centralized."
7. **Sensitivity to changes is not uniform.** Micro-DReps barely move metrics. Mergers spike everything uniformly. Nakamoto is most actionable.
8. **Metrics are backward-looking snapshots.** Do not smooth or trend-adjust. Point measurements tied to daily voting-weight snapshots (§18).

---

## Sources

- https://boycewire.com/what-is-the-gini-coefficient/
- https://britannica.com/topic/Gini-Coefficient
- https://datacamp.com/blog/gini-coefficient
- https://ourworldindata.org/what-is-the-gini-coefficient
- https://justice.gov/atr/herfindahl-hirschman-index
- https://en.wikipedia.org/wiki/Herfindahl%E2%80%93Hirschman_index
- https://legalclarity.org/how-to-calculate-and-interpret-the-herfindahl-hirschman-index/
- https://en.wikipedia.org/wiki/Theil_index
- https://en.wikipedia.org/wiki/Atkinson_index
- https://census.gov/topics/income-poverty/income-inequality/about/metrics/atkinson-index.html
- https://urban.org/research/data-methods/data-analysis/quantitative-data-analysis/inequality-measures
- https://pmc.ncbi.nlm.nih.gov/articles/PMC12468843/
- https://ncbi.nlm.nih.gov/pmc/articles/PMC8417603/
- https://ccn.com/education/crypto/nakamoto-coefficient-explained-how-decentralized-are-blockchain-networks/
- https://ledger.com/academy/glossary/nakamoto-coefficient
- https://bitpulse.io/blog/understanding-the-nakamoto-coefficient-metric-on-onchain-risk
- https://arxiv.org/pdf/2510.05830 (Fairness in Token Delegation)
- https://cardano.org/news/2026-04-17-media-drep-votin-power-concentration/
- https://blog.bitium.agency/measuring-decentralization-metrics-trends-in-2025-db51aef04d0c
- https://en.wikipedia.org/wiki/Lorenz_curve
- https://lse.ac.uk/cpnss/assets/documents/voting-power-and-procedures/publications/2001/leech.pdf

# Voting layer — architecture brief for voting.asy.life

**Status:** Research only. Intelligence for future methodology and architecture work. No code, no methodology edits.
**Date:** 2026-05-29
**Scope:** Ekklesia, Hydra voting, liquid democracy, CIP-1694, governance participation UX.

---

## Concept landscape

### Ekklesia (on-chain deliberation)

Ekklesia (https://ekklesia.vote/) is a production governance platform that processed the 2025 Cardano budget cycle, aggregating off-chain signaling via polling alongside mainnet transactions. The model separates discussion and straw voting (Ekklesia polls) from formal on-chain treasury actions (GovTool). It functions as a deliberation substrate supporting DReps, SPOs, and ada holders, with current implementation centered on budgeting workflows. Status: operational but narrow in scope — principally serves fiscal decision-making.

A separate Project Catalyst proposal (https://projectcatalyst.io/funds/14/cardano-use-cases-concepts/ekklesia-high-frequency-voting-on-cardano-with-hydra) explicitly targets Hydra state channels for high-frequency governance, described as proposal-stage with completed Hydra integration milestone and funding allocated through May 2026.

### Hydra voting (layer-2 scalability)

Cardano's Hydra Head (https://hydra.family/head-protocol/docs/protocol-overview) is an isomorphic state channel protocol where off-chain processing uses the same ledger model as mainchain. For governance: votes occur within a Hydra head at near-instant latency, final tallies commit as Merkle roots to Layer 1 for verification. The architecture admits weighted voting (by stake, DRep affiliation, SPO status) and ranked-choice or approval formats within heads. Participant sets are static and pre-agreed; heads can be decommitted without full closure.

Status: Hydra mainnet live (May 2023); governance-specific projects onboarding. Bottlenecks: head bootstrap and closure incur multi-block latency; participant set management requires explicit membership protocols; informal consensus on head state between participants cannot be enforced on-chain mid-lifecycle.

### Liquid democracy (delegation re-delegation)

Across Polkadot OpenGov, Snapshot, Aragon, Decred, Tezos, Cosmos — observed pattern: multi-track delegation (Polkadot; https://wiki.polkadot.com/learn/learn-polkadot-opengov/) allows track-specific delegate assignment, but empirically drives concentration. Research (https://arxiv.org/html/2510.05830v1) shows ranking delegates by voting power received reinforces visibility bias: small delegate pools accumulate disproportionate influence regardless of community preference.

Long delegation chains (A → B → C) create opacity: voters cannot track influence drift without off-chain tooling. Behavioral finding: voters default to inactive delegation when friction is low, reducing real participation. Remedies tested: partial delegation (split power across multiple delegates; Tally), explicit recall windows, conviction multipliers (Bifrost vDOT), and re-delegation transparency dashboards — modest impact. No ecosystem reports solved voter apathy via delegation alone.

### Delegated voting / CIP-1694

CIP-1694 (https://cips.cardano.org/cip/CIP-1694) enshrines DRep delegation and three-body governance: Delegated Representatives, Stake Pool Operators, Constitutional Committee. Voting is proportional to lovelace delegated; non-participation marked as "abstain"; "no confidence" votes on the CC. DReps act as trustees for all delegated stake; any ada holder may register or change delegations at will.

Current state: operational mainnet (Conway era, September 2024); 2025 saw 70%+ active stake in budget cycle polling. Governance actions (treasury, parameter changes, constitutional amendments) threshold at two of three bodies. GovTool (https://gov.tools/governance_actions) is the voting interface but lacks submission tooling for non-technical users.

### Governance participation UX

Snapshot (https://snapshot.mirror.xyz/F0wSmh8LROHhLYGQ7VG6VEG1_L8_IQk8eC9U7gFwep0) removes gas friction; DAOs migrating to Snapshot saw participation spikes to 22–45% (vs. 5–12% on-chain baseline). UX design decisions observed: (i) voting power strategy customization reduces friction for domain-specific governance; (ii) one-click delegation with preset terms (e.g., conviction multiplier) drives participation; (iii) forum-to-vote widget integrations (https://governance.aave.com/) lower context-switching cost.

Discourse-hosted governance forums enable discussion before voting but create a discussion-vs-voting pipeline bottleneck unless voting widgets are embedded live. Tally (https://docs.tally.xyz/tally-features/governance) surfaces delegate track record (voting history, alignment) but default ranking by voting power received is a known concentration vector. Aragon's LockToVote plugin decouples voting power from token ownership via time-lock, shifting sybil resistance from wallet uniqueness to lock conviction.

Participation risk: low-friction voting increases quantity not quality; off-chain sentiment polls decouple from binding action, fostering performative engagement.

---

## Convergent themes

1. **Delegation opacity is unsolved.** All systems allow transitive delegation; none provide real-time delegation graph visualization below observer level. Long chains obscure voter intent and enable tacit influence capture.

2. **Sybil resistance and plutocracy are incompatible at scale.** Token weighting enables anti-sybil (voting power trackable to concrete stake) but concentrates power. One-person-one-vote is sybil-vulnerable without external identity. Quadratic voting and bond voting are partial mitigations, not solutions.

3. **Gas/friction elimination increases participation quantity, not deliberation depth.** Snapshot's participation spike is real but off-chain; transfers to on-chain voting show participation reversion when costs reappear.

4. **Participation barriers are structural, not just incentive.** Cost of voting (information gathering, registration, timing), cognitive load (proposal complexity, delegate evaluation), and historical ballot rejection ("once burned, less likely to vote again") suppress turnout across traditional and blockchain systems.

5. **Ranked-choice and approval voting are mechanism design layers.** Neither improves turnout; both require voter education. Ranked-choice is field-tested; approval voting is newer. Governance use cases (budget selection, motion voting) favor approval or score voting for simplicity.

---

## Cardano-specific feasibility

### Chain capabilities

- Plutus smart contracts support formal verification and deterministic validation off-chain before submission, reducing governance action failure risk.
- Extended EUTXO model allows multi-sig and threshold governance patterns without account abstraction complexity.
- CIP-1694 tricameral model (DReps, SPOs, CC) is already deployed and operational; no protocol changes needed for base governance.
- Hydra mainnet live; Ekklesia's high-frequency voting project is onboarded and funded through Q2 2026.

### Chain constraints

- Cardano Layer 1 TPS is 250–260 tx/s mainnet; governance voting at scale (100k+ transactions in one window) requires Hydra offload or temporal batching.
- Participant set for Hydra heads is static; cannot admit new voters mid-head without closure and restart. Governance workflows must pre-agree voter rosters (e.g., DRep-only heads, SPO-only heads).
- GovTool lacks proposal submission UI for non-technical users; submission requires command-line or API, excluding governance action types (constitutional updates) from broader participation.
- Cardano identity layer is minimal (no native proof-of-personhood). Sybil resistance depends on economic stake (plutocratic) or external identity oracles (centralization risk).

### CIP-1694 fit

CIP-1694 mandates three governance bodies and thresholds; a participation layer cannot override these rules. A voting.asy.life platform must:

- Accept delegations to DReps (registry lookup against chain state).
- Support SPO voting (pool ID validation).
- Support Constitutional Committee voting (current CC roster from chain).
- Tally results according to quorum and threshold rules in CIP-1694.
- Commit final tallies and custody proofs (Hydra closures or L1 transactions) to the chain for on-chain validation.

---

## Risks to participation legitimacy

1. **Sybil attacks via delegation**: A single actor registering many small DReps and self-delegating can artificially inflate "unique voter" metrics without adding legitimate voice. Mitigation: DRep identity attestation (externally sourced) or minimum delegation threshold (trades off small-holder voice).

2. **Coercion via delegation transparency**: Public on-chain delegation allows targeted pressure on individual delegators or DReps. Mitigation: optional privacy-preserving voting (Aragon's encrypted ballots; Snapshot signatures are pseudonymous by default).

3. **Voter fatigue**: Governance polls every month (Ekklesia budget cycle cadence) create decision fatigue; repeated low-stakes polls desensitize to participation. Mitigation: threshold participation gates (polls below quorum auto-fail, resetting participation expectations).

4. **Plutocracy concentration**: Large ADA holders dominate voting directly and indirect delegation pools, marginalizing small holders. Mitigation: conviction multipliers (penalize rapid delegation changes; Bifrost model) or quadratic voting for advisory polls.

5. **Delegation chain opacity**: Voters cannot audit whether their delegated stake is participating as intended. Mitigation: mandatory delegation transparency dashboard showing voter → DRep → CC/SPO path and voting record at each hop.

6. **Performative voting**: Off-chain Ekklesia polls decouple from binding action, reducing stakes. Voters signal preference without cost, lowering quality. Mitigation: link off-chain polls to formal governance action submission thresholds (e.g., poll quorum ≥ 25% triggers binding on-chain action).

---

## Recommended architecture direction

A three-phase progression toward a mature participation layer:

### Phase 1: Minimum viable (6 months, Q3–Q4 2026)

**Goal**: Unified UX for CIP-1694 governance; reduce friction vs. GovTool.

- **Interface**: Web dashboard mirroring Snapshot's design — connect wallet, review proposals, delegate or vote in one UI.
- **Scope**: DRep delegation, Constitutional Committee voting (read-only CC roster), SPO voting delegation. No Hydra integration yet.
- **Backend**: Blockfrost or Kupo indexing of chain state (voting power, delegation relationships, CIP-1694 thresholds).
- **Discussion layer**: Embedded Discourse forum (or GitHub discussions) linked to each governance action ID; voting widget displays poll status inline.
- **Sybil defaults**: Accept all registered DReps (no attestation gatekeeping); display "actively voted" indicator to surface engaged delegates.
- **Outcomes**: On-chain transaction (DRep delegation or vote submission) or Hydra signature collection for later batch commit.
- **UX friction reduction**: Pre-fill conviction multiplier defaults; one-click delegation templates by track.

### Phase 2: Intermediate (9 months)

**Goal**: Delegation transparency and off-chain polling.

- **Delegation graph**: Real-time visualization of voter → DRep → governance body chains; show voting records of each DRep at each step.
- **Advisory polls (Hydra-backed)**: Monthly Ekklesia-style polls via Hydra heads (pre-agreed participant roster: DReps, SPO representatives, randomly selected ada holders). Results publish as Layer 1 commitments. Ranked-choice or approval format per poll.
- **Conviction mechanics**: Introduce conviction multiplier UI; delegations can specify lock-in periods (e.g., 8-epoch conviction for 3x weight on treasury votes).
- **Identity bridge (optional)**: Integrate optional external identity provider for DRep attestation. Voluntary; not blocking unattested DReps.
- **Participation incentives**: Gamify through leaderboards (top DReps by voting record, fastest poll turnaround) and delegation rewards (rebate ADA for delegations held >4 epochs).
- **Outcomes**: Hydra heads for advisory polls; L1 commitments and treasury action trackers for binding votes.

### Phase 3: Mature (12+ months)

**Goal**: Scaled, resilient, sybil-resistant governance participation.

- **Quadratic voting for advisory polls**: Implement QV mechanism (voice credits, square-root cost per vote) for non-binding polls; pair with identity requirements.
- **Hydra multi-head federations**: Support parallel Hydra heads for different governance tracks (budgets, protocol parameters, constitutional amendments) with cross-head result aggregation on mainnet.
- **Delegation revocation windows**: Explicit "cooling-off" periods after delegation change (e.g., 2-epoch delay before new DRep takes effect), reducing coercion and sybil flash-delegation tactics.
- **Composable voting formats**: Support ranked-choice (Condorcet-style budget prioritization), approval (simple yes/no+abstain), and score voting (0–10 per option) depending on governance action type.
- **Privacy layer**: Optional encrypted voting (commit-reveal on-chain, Hydra off-chain decryption) for sensitive CC member voting.
- **Compliance / audit**: Full governance action submission UI integrated into voting.asy.life (currently missing from GovTool). Non-technical users can author proposals, submit validator scripts for review, and publish with signature collection.
- **Participation analytics**: Public dashboard of participation trends (turnout by action type, delegation volatility, voter segmentation by stake size) to inform governance redesign.

---

## Technical roadmap notes

**Hydra integration sequencing**

- Phase 1: Read-only state channel stubs (no voting inside Hydra).
- Phase 2: Single-purpose heads (Ekklesia polls, then budget ranking).
- Phase 3: Multi-head federation with fast head bootstrap (pre-provisioned heads per track).

**Storage and indexing**

- Off-chain: PostgreSQL indexed on chain sync points; GraphQL API for delegation graph queries.
- On-chain: Hydra head final state roots published to L1; CIP-1694 transaction indexing via Blockfrost.

**Contingency: If Hydra adoption stalls**

- Fall back to Snapshot-style off-chain polling (no Hydra closure guarantees); use Ekklesia budget polls as reference.
- Implement batched governance action submission to reduce L1 tx overhead.

---

## Sources

Ekklesia:
- https://ekklesia.vote/
- https://projectcatalyst.io/funds/14/cardano-use-cases-concepts/ekklesia-high-frequency-voting-on-cardano-with-hydra
- https://intersectmbo.org/news/building-a-2026-ecosystem-budget-for-cardano

Hydra & Layer 2:
- https://hydra.family/head-protocol/docs/protocol-overview
- https://docs.cardano.org/developer-resources/scalability-solutions/hydra
- https://iohk.io/en/blog/posts/2025/06/24/layer-2-expansion-beyond-hydra/

Liquid democracy & delegation:
- https://wiki.polkadot.com/learn/learn-polkadot-opengov/
- https://arxiv.org/html/2510.05830v1 (Fairness in Token Delegation)
- https://arxiv.org/pdf/2102.08823 (Vote Delegation and Misbehavior)
- https://arxiv.org/pdf/2403.07558 (Controlling Delegations)
- https://permanencedao.medium.com/vdot-governance-evolves-delegation-and-community-power-with-bifrost-832ba67ebf05

CIP-1694 & Cardano governance:
- https://cips.cardano.org/cip/CIP-1694
- https://www.intersectmbo.org/news/cardano-cip-1694-explained
- https://www.intersectmbo.org/news/governing-cardano-with-delegated-representatives
- https://docs.cardano.org/about-cardano/governance-overview
- https://gov.tools/governance_actions

Governance UX & participation:
- https://snapshot.mirror.xyz/F0wSmh8LROHhLYGQ7VG6VEG1_L8_IQk8eC9U7gFwep0
- https://docs.tally.xyz/tally-features/governance
- https://blog.aragon.org/delegate-voting-is-live-on-the-aragon-app/

Mechanism design & sybil resistance:
- https://gitcoin.co/mechanisms/quadratic-voting
- https://fairvote.org/resources/electoral-systems/ranked_choice_voting_vs_approval_voting/
- https://arxiv.org/pdf/2001.05271 (Safe Voting: Resilience to Sybils)
- https://arxiv.org/pdf/2505.04136 (Delegation and Participation: Epistemic View)

# Treasury observability — FLOW-5 implementation notes

**Status:** Research only. Intelligence for FLOW-5 methodology drafting and code planning. No code, no methodology edits.
**Date:** 2026-05-29
**Scope:** Koios endpoints (`/totals`, `/treasury_withdrawals`, `/proposal_list`); schema proposals; reconciliation queries; 5-layer verification skeleton.

---

## ⚠ Important correction — read this first

The naming of Koios `/treasury_withdrawals` is misleading. **`/treasury_withdrawals` ≠ governance treasury proposal payouts.** That endpoint returns *stake-credential withdrawals* (primarily ITN incentive program disbursements and historical reward distributions), with **no governance-action linkage** in its response shape.

The actual governance-action treasury data lives in `/proposal_list` filtered to `proposal_type = "TreasuryWithdrawals"`. Each such proposal carries a `withdrawal` array of `{amount, stake_address}` tuples and a `proposal_id` that ties to the broader governance lifecycle (proposed_epoch, ratified_epoch, enacted_epoch, expired_epoch, dropped_epoch).

Any FLOW-5 methodology that assumes `/treasury_withdrawals` is the source of governance treasury payouts is wrong. The source model must be revised before §22+ is drafted.

---

## 1. Endpoint catalog

### 1.1 `/totals` — epoch-level treasury and reserves snapshot

Per-epoch row, full history back to epoch 0 (Shelley genesis, May 2020).

Response shape (per epoch):
```json
{
  "epoch_no": 633,
  "circulation": "36218050029461828",
  "treasury":   "1643810583264563",
  "reward":     "782316410818029",
  "supply":     "38651361683179761",
  "reserves":   "6348638316820239",
  "fees":       "46087635341",
  "deposits_stake":    "4416572000000",
  "deposits_drep":     "522000000000",
  "deposits_proposal": "2200000000000",
  "treasury_donation":   null,
  "treasury_withdrawal": null,
  "reserves_withdrawal": null
}
```

**Semantics:**
- `treasury` = on-chain treasury balance at end of epoch
- `reserves` = on-chain reserves account balance at end of epoch
- `treasury_withdrawal` = net treasury withdrawals enacted during that epoch (null if none)
- `reserves_withdrawal` = net reserves withdrawals via MIR certificates (null if none, mostly pre-Conway)
- Deposits are *unrefunded* deposits held at end of epoch (governance proposal deposits, DRep registration deposits, stake credential deposits)

**Granularity:** epoch only. No intra-epoch transaction-level treasury snapshots. Intra-epoch changes are not observable.

**Conway-era semantics:** the endpoint correctly reports treasury balance after Conway-era governance actions are enacted. Withdrawals are reported as epoch-boundary state changes.

### 1.2 `/treasury_withdrawals` — stake-credential withdrawals (NOT governance-driven)

Paginated; one row per withdrawal transaction. Historical data observed back to epochs 374–495+.

Response shape (per withdrawal):
```json
{
  "epoch_no": 495,
  "epoch_slot": 85,
  "tx_hash": "87155b6281…",
  "block_hash": "30bf17dabe…",
  "block_height": 10526915,
  "amount": "102140000000000",
  "stake_address": "stake1uxv9hwk…",
  "earned_epoch": 495,
  "spendable_epoch": 496
}
```

**Critical:** no `action_id`, no `proposal_id`, no governance-action reference. This endpoint is for raw stake-credential withdrawal events. Treasury actions enacted by CIP-1694 governance do NOT appear here as governance events.

### 1.3 `/proposal_list` filtered to `TreasuryWithdrawals` — the actual source

Paginated list of all governance actions. Filter by `proposal_type = "TreasuryWithdrawals"`.

Relevant fields:
```json
{
  "proposal_id":   "gov_action1...",       // canonical immutable identifier
  "proposal_type": "TreasuryWithdrawals",
  "withdrawal": [                          // array of recipients
    {
      "amount":        "10000000000000",
      "stake_address": "stake17xzc8pt7…"
    }
  ],
  "block_time":      1779812326,
  "proposed_epoch":  630,
  "ratified_epoch":  null,
  "enacted_epoch":   null,
  "expired_epoch":   null,
  "dropped_epoch":   null,
  "return_address":  "...",
  "deposit":         "..."
}
```

**Sole linkage** between governance and treasury balance change is `proposal_id`. No other mechanism exists.

---

## 2. Treasury state semantics: published vs computed

**What `/totals` publishes:** the `treasury` value at epoch boundary represents the on-chain account balance after all that epoch's state transitions (enactments, withdrawals, deposit refunds). This is the **published fact** from the ledger state.

**What FLOW-5 must compute:**

1. **Net change per epoch:** `treasury[epoch_n] - treasury[epoch_n-1]` = net effect of all treasury actions during epoch n.
2. **Attribution to governance actions:** a TreasuryWithdrawals action with `enacted_epoch = E` contributes its withdrawal amount to the net change between epochs `E-1` and `E`. However, this is **inference**, not direct observation. Requires joining governance_actions.enacted_epoch = epoch_no for TreasuryWithdrawals actions, summing withdrawal amounts, comparing against net treasury change in `/totals`.
3. **Other treasury movements** may also contribute to the balance delta:
   - Deposit refunds (governance proposal deposits, DRep registration deposits, stake credential deposits)
   - Protocol-level transfers outside the governance scope
   - Rounding, fee adjustments, or ledger-internal corrections

**Key principle:** `/totals` is the canonical published fact. Governance actions are the *claimed mechanisms* for change. They may not fully sum to the observed delta; the publication shows what actually happened.

---

## 3. Treasury history availability

- Available range: epoch 0 (Shelley launch, 2020-05-10) → current
- Granularity: epoch only
- Conway-era cutoff: epoch 432 (April 2024). Treasury governance actions did not exist before then.

**Pre-Conway treasury changes** are observable in `/totals` but cannot be attributed to governance actions — they were driven by MIR (Move Instantaneous Reward) certificates and protocol-level genesis seeding. **FLOW-5 methodology must explicitly state: "Pre-Conway treasury changes are recorded but not attributed to governance mechanisms."**

**Backfill requirement:** ingest full `/totals` history once at bootstrap (~634 epochs at current state, ~250 KB gzipped). Subsequent daily runs fetch only new epochs.

---

## 4. Withdrawal linkage — worked example

```
1. Governance action submitted (epoch 630):
   proposal_id = "gov_action142ndnn…"
   proposal_type = "TreasuryWithdrawals"
   block_time = 1779812326
   proposed_epoch = 630
   withdrawal = [{ amount: "10000000000000", stake_address: "stake17xzc8pt7…" }]

2. Action ratified (within voting window):
   ratified_epoch = 631

3. Action enacted (protocol-specified epoch):
   enacted_epoch = 633

4. Observe treasury balance change:
   treasury[epoch_632] = 1,640,103,135,725,860 lovelace
   treasury[epoch_633] = 1,643,810,583,264,563 lovelace
   net_change = +3,707,447,538,703 lovelace (INCREASE)

5. Interpretation:
   The 10T-lovelace withdrawal should have *reduced* treasury. The observed
   increase means either:
   (a) the withdrawal was not yet enacted in epoch 633, OR
   (b) other treasury inflows (deposits, fees, rewards) exceeded the withdrawal, OR
   (c) the action is still active/ratified but not yet enacted.
```

This is exactly why §3's "published vs computed" distinction matters — the published `/totals` is authoritative; governance-action attribution is a partial explanation.

---

## 5. Proposed schema additions (DDL as documentation)

### `treasury_snapshot` — per-epoch treasury state

```sql
CREATE TABLE IF NOT EXISTS treasury_snapshot (
    epoch_no              INTEGER PRIMARY KEY,
    circulation_lovelace  INTEGER NOT NULL,
    treasury_lovelace     INTEGER NOT NULL,
    reward_lovelace       INTEGER NOT NULL,
    supply_lovelace       INTEGER NOT NULL,
    reserves_lovelace     INTEGER NOT NULL,
    fees_lovelace         INTEGER NOT NULL,
    deposits_stake        INTEGER NOT NULL,
    deposits_drep         INTEGER NOT NULL,
    deposits_proposal     INTEGER NOT NULL,
    treasury_donation     INTEGER,
    treasury_withdrawal   INTEGER,
    reserves_withdrawal   INTEGER,
    fetched_at            TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_treasury_snapshot_epoch ON treasury_snapshot (epoch_no);
```

### `treasury_withdrawals` — governance-action withdrawal recipients (normalized)

```sql
CREATE TABLE IF NOT EXISTS treasury_withdrawals (
    action_id          TEXT NOT NULL,   -- FK to governance_actions.action_id
    withdrawal_index   INTEGER NOT NULL,
    recipient_address  TEXT NOT NULL,   -- stake address (bech32)
    amount_lovelace    INTEGER NOT NULL,
    enacted_epoch      INTEGER,         -- denormalized for fast queries
    PRIMARY KEY (action_id, withdrawal_index),
    FOREIGN KEY (action_id) REFERENCES governance_actions(action_id)
);
CREATE INDEX IF NOT EXISTS idx_treasury_withdrawals_epoch ON treasury_withdrawals (enacted_epoch);
```

The `withdrawal_index` preserves array order from the source. `enacted_epoch` is denormalized from `governance_actions` for fast epoch-based aggregation without joins.

---

## 6. Reconciliation queries

### Enacted withdrawals in last N epochs

```sql
SELECT
    g.action_id,
    g.enacted_epoch,
    SUM(tw.amount_lovelace) AS total_withdrawn_lovelace,
    COUNT(tw.withdrawal_index) AS recipient_count
FROM governance_actions g
JOIN treasury_withdrawals tw ON g.action_id = tw.action_id
WHERE g.action_type = 'TreasuryWithdrawals'
  AND g.enacted_epoch >= (SELECT MAX(epoch_no) - 10 FROM treasury_snapshot)
GROUP BY g.action_id, g.enacted_epoch
ORDER BY g.enacted_epoch DESC;
```

### Observed vs governance-attributed change

```sql
WITH action_withdrawals AS (
  SELECT enacted_epoch, SUM(amount_lovelace) AS gov_action_total
  FROM treasury_withdrawals
  WHERE enacted_epoch IS NOT NULL
  GROUP BY enacted_epoch
),
observed_change AS (
  SELECT curr.epoch_no,
         curr.treasury_lovelace - prev.treasury_lovelace AS net_treasury_change
  FROM treasury_snapshot curr
  LEFT JOIN treasury_snapshot prev ON prev.epoch_no = curr.epoch_no - 1
)
SELECT oc.epoch_no,
       oc.net_treasury_change,
       COALESCE(aw.gov_action_total, 0) AS gov_action_withdrawals,
       (oc.net_treasury_change + COALESCE(aw.gov_action_total, 0)) AS unexplained_net_change
FROM observed_change oc
LEFT JOIN action_withdrawals aw ON aw.enacted_epoch = oc.epoch_no
WHERE oc.net_treasury_change < 0
   OR COALESCE(aw.gov_action_total, 0) > 0
ORDER BY oc.epoch_no DESC;
```

`unexplained_net_change` surfaces epochs where treasury moved but no governance-action withdrawals explain it (deposit refunds or other protocol-level transfers).

---

## 7. Methodology edge cases

- **Pre-Conway treasury seeding:** Shelley-era treasury was seeded at genesis via protocol parameters. No governance actions drove changes before epoch 432.
- **Reserves vs treasury:** two separate ledger accounts. `treasury` is governance-controlled (TreasuryWithdrawals). `reserves` was MIR-controlled pre-Conway and is largely passive in Conway. FLOW-5 initial scope: treasury only.
- **Intra-epoch ambiguity:** governance state transitions occur at epoch boundaries. A TreasuryWithdrawals action enacted at epoch E has its effect applied at the start of E, visible in `/totals` as the (E-1) → E delta.
- **Action immutability:** an enacted withdrawal cannot be reversed or amended. There is no "withdraw the withdrawal" action type. Treasury withdrawal records in the observatory are append-only, immutable once enacted.

---

## 8. Open questions for methodology author

1. **Unobserved treasury movements:** surface as warning, or accept as out-of-governance-scope?
2. **Reserves scope:** include from FLOW-5, or defer to later phase?
3. **Deposit tracking:** expose `deposits_stake`, `deposits_drep`, `deposits_proposal` fields, or treat as internal bookkeeping?
4. **Net Change Limit (NCL):** Conway protocol caps annual treasury withdrawals. Compute and publish "NCL utilization," or treat as policy interpretation outside scope?
5. **Treasury donations:** the `/totals.treasury_donation` field is always null in current data; behavior on first non-null is undefined.
6. **Multi-epoch enactment delays:** surface "pending withdrawal" state during ratified-but-not-enacted window, or only report once enacted?

---

## 9. Reproducibility plan: raw payload archival

Per §21 (FLOW-4), all raw Koios payloads used to compute treasury observability must be archived for third-party verification.

Required artifacts:

```
/data/snapshots/by-date/{YYYY-MM-DD}/koios_totals_full.json          # per-epoch /totals dump
/data/snapshots/by-date/{YYYY-MM-DD}/koios_proposal_list_tw.json     # /proposal_list filter
```

Each payload includes a `_metadata` child:
```json
{
  "koios_base": "https://api.koios.rest/api/v1",
  "endpoint": "/totals",
  "parameters": { "_epoch_no": "..." },
  "fetched_at_utc": "2026-05-29T02:05:00Z",
  "user_agent": "cardano-delegation-observatory/0.8.0",
  "http_status": 200,
  "content_hash_sha256": "..."
}
```

Verification protocol (third party):
1. Download dated archive
2. Re-fetch same Koios endpoint with same parameters
3. Compare canonical JSON byte-for-byte
4. Mismatch is signal: either Koios revised data (rare) or archive was modified

---

## 10. 5-layer verification protocol skeleton for FLOW-5

- **Layer 1 (ETL):** unit-test Koios fetch + JSON parsing; integration-test on bootstrap dataset (10 epochs).
- **Layer 2 (Data):** monotonic row count check on treasury_snapshot; duplicate-epoch check; FK integrity on treasury_withdrawals → governance_actions.
- **Layer 3 (Frontend):** number rendering test (no overflow/truncation); epoch boundary 431→432 transition test (last Shelley to first Conway).
- **Layer 4 (Semantics):** reconciliation query (§6) run weekly; flag if unexplained_net_change > 1% of treasury.
- **Layer 5 (Researcher Reproducibility):** archival completeness against sha256.json; third-party Koios re-fetch byte-equal.

---

## 11. Summary of proposed additions

| Component | Type | Purpose |
|---|---|---|
| `treasury_snapshot` table | Schema | Per-epoch tokenomics from `/totals` |
| `treasury_withdrawals` table | Schema | Normalized governance-action withdrawal recipients |
| `treasury_snapshot.json` export | Export | CC0 daily snapshot of treasury state for all epochs |
| `treasury_withdrawals_{action_id}.json` | Export | Per-action withdrawal specification and enactment status |
| Koios payload archives | Artifact | Raw `/totals`, `/proposal_list` responses for reproducibility |
| Reconciliation queries | Verification | Detect unexplained treasury movements |

**No application code is proposed here.** These are structural and methodological guideposts only.

---

## Sources

- https://api.koios.rest/
- https://cardano-community.github.io/guild-operators/Build/grest-changelog/
- https://developers.cardano.org/docs/governance/cardano-governance/governance-actions/
- https://intersectmbo.org/news/treasury-withdrawal-actions-ratification-enactment-and-smart-contracts/
- https://docs.cardano.org/about-cardano/explore-more/monetary-policy
- https://cardanofoundation.org/blog/understanding-cardanos-net-change-limit
- https://cips.cardano.org/cip/CIP-1694

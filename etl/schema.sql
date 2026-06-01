-- Cardano Delegation Observatory: SQLite schema
-- See METHODOLOGY.md for what each field represents and where it comes from.
-- This schema is the authoritative description of the project's data model.

-- DRep registry and metadata
CREATE TABLE IF NOT EXISTS dreps (
    drep_id              TEXT PRIMARY KEY,
    registered_epoch     INTEGER,
    metadata_url         TEXT,
    metadata_hash        TEXT,
    metadata_name        TEXT,
    metadata_fetched_at  TIMESTAMP,
    last_seen_epoch      INTEGER
);

-- Daily snapshot of voting weight per DRep
CREATE TABLE IF NOT EXISTS snapshots (
    snapshot_date           DATE NOT NULL,
    epoch                   INTEGER NOT NULL,
    drep_id                 TEXT NOT NULL,
    voting_weight_lovelace  INTEGER NOT NULL,
    delegator_count         INTEGER NOT NULL,
    PRIMARY KEY (snapshot_date, drep_id)
);
CREATE INDEX IF NOT EXISTS idx_snapshots_drep ON snapshots (drep_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON snapshots (snapshot_date);

-- Recorded votes (on-chain facts only — no interpretation)
CREATE TABLE IF NOT EXISTS votes (
    action_id        TEXT NOT NULL,
    drep_id          TEXT NOT NULL,
    vote             TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
    vote_epoch       INTEGER NOT NULL,
    vote_block_time  INTEGER,
    PRIMARY KEY (action_id, drep_id)
);
CREATE INDEX IF NOT EXISTS idx_votes_drep ON votes (drep_id, vote_epoch);
-- idx_votes_block_time is created in the migration step in open_db() (snapshot.py)
-- because the column is added on existing DBs only after this script runs.

-- Epoch metadata for time alignment in FLOW-2 governance event overlays.
-- See METHODOLOGY §19.2.
CREATE TABLE IF NOT EXISTS epoch_info (
    epoch_no         INTEGER PRIMARY KEY,
    start_time_unix  INTEGER NOT NULL,
    end_time_unix    INTEGER NOT NULL,
    start_date       TEXT NOT NULL       -- UTC ISO date (yyyy-mm-dd) of start_time_unix
);

-- Live-layer state (key/value, persisted between live ETL runs)
CREATE TABLE IF NOT EXISTS live_state (
    key         TEXT PRIMARY KEY,
    value       TEXT,
    updated_at  TIMESTAMP
);

-- Governance actions. State-transition epochs and submission block_time are
-- persisted separately for FLOW-2 overlay reproducibility (§19.1).
CREATE TABLE IF NOT EXISTS governance_actions (
    action_id              TEXT PRIMARY KEY,
    action_type            TEXT,
    title                  TEXT,
    submitted_epoch        INTEGER,
    submission_block_time  INTEGER,
    expires_epoch          INTEGER,
    expired_epoch          INTEGER,
    ratified_epoch         INTEGER,
    enacted_epoch          INTEGER,
    dropped_epoch          INTEGER,
    outcome                TEXT
);

-- FLOW-5: per-epoch treasury / reserves / supply state from Koios /totals.
-- See METHODOLOGY §22.3. One row per Cardano epoch. Idempotent upsert by epoch_no.
CREATE TABLE IF NOT EXISTS treasury_snapshot (
    epoch_no                          INTEGER PRIMARY KEY,
    circulation_lovelace              INTEGER NOT NULL,
    treasury_lovelace                 INTEGER NOT NULL,
    reward_lovelace                   INTEGER NOT NULL,
    supply_lovelace                   INTEGER NOT NULL,
    reserves_lovelace                 INTEGER NOT NULL,
    fees_lovelace                     INTEGER NOT NULL,
    deposits_stake                    INTEGER NOT NULL,
    deposits_drep                     INTEGER NOT NULL,
    deposits_proposal                 INTEGER NOT NULL,
    treasury_donation                 INTEGER,
    treasury_withdrawal_epoch_total   INTEGER,
    reserves_withdrawal_epoch_total   INTEGER,
    fetched_at                        TIMESTAMP NOT NULL
);

-- FLOW-5: normalized withdrawal recipients for TreasuryWithdrawals governance actions.
-- One row per (action_id, withdrawal_index). enacted_epoch denormalized from
-- governance_actions for fast epoch-keyed aggregation. See METHODOLOGY §22.3.
CREATE TABLE IF NOT EXISTS treasury_withdrawals (
    action_id                TEXT NOT NULL,
    withdrawal_index         INTEGER NOT NULL,
    recipient_stake_address  TEXT NOT NULL,
    amount_lovelace          INTEGER NOT NULL,
    enacted_epoch            INTEGER,
    PRIMARY KEY (action_id, withdrawal_index),
    FOREIGN KEY (action_id) REFERENCES governance_actions(action_id)
);
CREATE INDEX IF NOT EXISTS idx_treasury_withdrawals_epoch ON treasury_withdrawals (enacted_epoch);
CREATE INDEX IF NOT EXISTS idx_treasury_withdrawals_recipient ON treasury_withdrawals (recipient_stake_address);

-- ETL run telemetry — operational, auditable
CREATE TABLE IF NOT EXISTS etl_runs (
    run_started_at     TIMESTAMP NOT NULL,
    run_completed_at   TIMESTAMP,
    source             TEXT NOT NULL,
    block_height       INTEGER,
    n_dreps_seen       INTEGER,
    success            INTEGER NOT NULL CHECK (success IN (0, 1)),
    notes              TEXT
);
CREATE INDEX IF NOT EXISTS idx_etl_runs_started ON etl_runs (run_started_at);

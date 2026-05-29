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

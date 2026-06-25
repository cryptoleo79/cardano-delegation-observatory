# Disaster Recovery Runbook — Cardano Observatory memory

**Goal:** a brand-new operator, with only this document and the backup files, can
restore the Observatory's memory and prove it survived. No prior knowledge assumed.

**Definition of done (the final infrastructure milestone):** the Observatory can
survive **losing the server**, not just losing a file. That is proven only by
Scenario B below completing with every verification check green.

---

## 0. What exists, and where

Two SQLite databases hold all accrued memory:

| DB | Canonical path | Holds | Backed up? |
|----|----------------|-------|-----------|
| `cdl.sqlite` | `~/cardano-data-layer/service/data/cdl.sqlite` | Project Memory: append-only `pm_event` log + projections (the flagship) | ✅ local |
| `observatory.db` | `~/observatory/data/observatory.db` | Daily DRep/treasury/governance snapshot rows (back to 2024-09) | ✅ local + git-tracked |

Backups (gzip'd, date-stamped, WAL-safe, integrity-checked) live in
**`~/backups/observatory/`** — `NAME.YYYY-MM-DD.gz`, newest 14 kept.

Everything else is **derived** and can be regenerated from these two DBs:
static JSON in `~/observatory/data/snapshots/` (via `etl/snapshot.py` and the
data-layer `export-static.js` job) and the static site in `~/observatory/web/`.

Services: the read API is `cardano-data-layer.service` (systemd **--user**,
WorkingDirectory `~/cardano-data-layer/service`, `node src/server.js`, PORT 8787,
fronted by nginx as api.asy.life). The site is static files served by nginx.

---

## 1. First: is anything actually wrong? (~1 min)

```bash
bash ~/observatory/scripts/backup-status.sh   # health table; exit 0 = OK
```
Green and recent → no recovery needed. If a backup is MISSING/STALE/bad, or a
source DB is corrupt, continue.

---

## 2. Scenario A — restore ONE database (corruption / bad ETL / deletion) (~5 min)

Use when the server is intact but a DB is damaged. **Stop writers first.**

```bash
# --- cdl.sqlite (Project Memory) ---
systemctl --user stop cardano-data-layer.service            # release the DB
cd ~/backups/observatory
LATEST=$(ls -1t cdl.sqlite.*.gz | head -1); echo "restoring $LATEST"
cp ~/cardano-data-layer/service/data/cdl.sqlite{,.corrupt.$(date -u +%s)} 2>/dev/null || true  # keep the bad one
gunzip -c "$LATEST" > /tmp/cdl.restored.sqlite
sqlite3 /tmp/cdl.restored.sqlite 'PRAGMA integrity_check;'  # MUST print: ok
mv /tmp/cdl.restored.sqlite ~/cardano-data-layer/service/data/cdl.sqlite
rm -f ~/cardano-data-layer/service/data/cdl.sqlite-wal ~/cardano-data-layer/service/data/cdl.sqlite-shm
systemctl --user start cardano-data-layer.service
curl -s localhost:8787/health                               # expect ok

# --- observatory.db (snapshots) — no long-lived writer; ETL opens it per run ---
cd ~/backups/observatory
LATEST=$(ls -1t observatory.db.*.gz | head -1)
gunzip -c "$LATEST" > /tmp/obs.restored.db
sqlite3 /tmp/obs.restored.db 'PRAGMA integrity_check;'      # MUST print: ok
mv /tmp/obs.restored.db ~/observatory/data/observatory.db
```

Then regenerate derived exports (Section 4) and verify (Section 5).

---

## 3. Scenario B — full disaster recovery onto a CLEAN machine

This is the milestone drill. Target time ~30–45 min on a fresh VPS.

### 3.1 Prerequisites (~10 min)
```bash
# Node 22+, Python 3, sqlite3, nginx, git
node --version        # >= 22 (server uses node:sqlite)
python3 --version ; sqlite3 --version ; nginx -v ; git --version
# Clone the two repos to ~ (or restore them from git):
git clone <observatory-repo-url>      ~/observatory
git clone <cardano-data-layer-url>    ~/cardano-data-layer
cd ~/cardano-data-layer/service && npm ci    # if it has deps; server is near-zero-dep
```

### 3.2 Obtain the backups (~5 min)
Retrieve `~/backups/observatory/` from **offsite** (Phase 3). Until Phase 3 exists,
this step is the gap: a truly dead server has only what was replicated off-box.
```bash
mkdir -p ~/backups/observatory
# e.g.  rsync -avz user@offsite:backups/observatory/ ~/backups/observatory/
ls -1 ~/backups/observatory/*.gz        # confirm both DBs present
```

### 3.3 Restore both DBs (~3 min)
```bash
mkdir -p ~/cardano-data-layer/service/data ~/observatory/data
gunzip -c "$(ls -1t ~/backups/observatory/cdl.sqlite.*.gz     | head -1)" > ~/cardano-data-layer/service/data/cdl.sqlite
gunzip -c "$(ls -1t ~/backups/observatory/observatory.db.*.gz | head -1)" > ~/observatory/data/observatory.db
sqlite3 ~/cardano-data-layer/service/data/cdl.sqlite     'PRAGMA integrity_check;'  # ok
sqlite3 ~/observatory/data/observatory.db                'PRAGMA integrity_check;'  # ok
```

### 3.4 Start the service + restore schedules (~5 min)
```bash
# systemd --user unit (recreate if lost): WorkingDirectory ~/cardano-data-layer/service,
# ExecStart=/usr/bin/node src/server.js, Environment PORT=8787 HOST=127.0.0.1
systemctl --user daemon-reload
systemctl --user enable --now cardano-data-layer.service
loginctl enable-linger "$USER"        # so --user services + cron survive logout/reboot
curl -s localhost:8787/health         # expect ok

# Reinstall cron (backup + ETL + status); see Section 6 for the exact lines.
crontab -e
```

### 3.5 Regenerate derived exports (~3 min) — Section 4.

### 3.6 Front with nginx — restore the vhosts for observatory.asy.life (static
`~/observatory/web`) and api.asy.life (proxy to 127.0.0.1:8787). Reload nginx.

---

## 4. Regenerate derived data (after any restore)
```bash
# Project Memory static JSON (from cdl.sqlite):
node ~/cardano-data-layer/service/src/jobs/export-static.js
# DRep/treasury/governance snapshots + JSON (from observatory.db, or re-pull live):
cd ~/observatory && python3 etl/snapshot.py
```

---

## 5. Verification checklist — recovery is NOT complete until ALL pass

```bash
# 1. Integrity
sqlite3 ~/cardano-data-layer/service/data/cdl.sqlite 'PRAGMA integrity_check;'   # ok
# 2. History preserved — pm_event count > 0 and matches expectation (~5,700+)
sqlite3 ~/cardano-data-layer/service/data/cdl.sqlite 'SELECT COUNT(*) FROM pm_event;'
# 3. Snapshot depth preserved — rows back to 2024-09
sqlite3 ~/observatory/data/observatory.db 'SELECT COUNT(*),MIN(snapshot_date),MAX(snapshot_date) FROM snapshots;'
# 4. Application boots
systemctl --user is-active cardano-data-layer.service        # active
curl -s localhost:8787/health                               # ok
# 5. Historical queries succeed (Project Memory + governance)
curl -s localhost:8787/project/minswap | head -c 200        # real project record
curl -s localhost:8787/history/minswap | head -c 200        # append-only history
# 6. Project Memory survives end-to-end — the site loads a project page
#    https://observatory.asy.life/project.html?id=<id>  renders claims + history
```
- [ ] integrity_check = ok (both DBs)
- [ ] pm_event history intact
- [ ] snapshot history intact (2024-09 → today)
- [ ] service active + /health ok
- [ ] historical API queries return real data
- [ ] a project page renders with claims, evidence, and history

When every box is checked **on a clean machine**, Memory Integrity Phase 4 is done.

---

## 6. Operational reference

**Tooling (all in `~/observatory/scripts/`):**
- `backup-memory.sh` — make backups (WAL-safe, integrity-checked, rotated keep-14).
- `backup-selftest.sh` — prove the pipeline (18 checks incl. restore + failure modes).
- `backup-status.sh` — internal health report → `~/backups/observatory/STATUS.md`.

**Cron (user crontab):**
```
30 21 * * * cd ~/observatory && /usr/bin/bash scripts/backup-memory.sh   >> ~/backups/observatory/cron.log 2>&1
35 21 * * * cd ~/observatory && /usr/bin/bash scripts/backup-status.sh   >> ~/backups/observatory/cron.log 2>&1
40 21 * * 0 cd ~/observatory && /usr/bin/bash scripts/backup-selftest.sh >> ~/backups/observatory/cron.log 2>&1
10 8,20 * * * cd ~/observatory && /usr/bin/python3 etl/snapshot.py       >> ~/observatory/data/etl.log 2>&1
```
(env: `BACKUP_DIR`, `BACKUP_KEEP`, `BACKUP_STALE_HRS` override defaults.)

**Logs:** `~/backups/observatory/{backup.log,cron.log}`, `~/observatory/data/etl.log`.

**Known operational note:** `~/cardano-data-layer/service/data/poller.log` grows
unbounded (the 5-min OHLCV poller appends forever; ~65M and climbing). Not a memory
risk, but truncate/rotate it periodically, e.g. add to cron:
`0 3 * * 0 : > ~/cardano-data-layer/service/data/poller.log` (or use logrotate).

---

## 7. Phase 3 — offsite encrypted replication (OWNER action; the real durability)

The local backup protects against deletion / bad ETL / corruption / bad deploy.
It does **NOT** protect against disk failure, VPS loss, or datacenter loss — for
that, `~/backups/observatory/` must be replicated **off the machine, encrypted**.
Options (owner credentials required):
- `age`/`gpg` encrypt each `.gz`, then `rclone`/`rsync` to object storage or another host;
- a daily cron after 21:35 that pushes only new encrypted files;
- verify the offsite copy is readable and decrypts before trusting it.

Once Phase 3 exists, run Scenario B **end to end on a clean machine** to close
Phase 4 — that, and only that, makes "survive losing the server" true.

#!/usr/bin/env bash
# Memory durability backup — the century-goal safeguard.
#
# The Observatory's value is accrued history. Two SQLite DBs hold it:
#   - cdl.sqlite      : the Project Memory append-only, hash-chained event log
#                       (the actual "memory"; git-ignored, so otherwise UN-backed-up)
#   - observatory.db  : daily DRep / treasury / governance snapshot rows
#                       (git-tracked, but only as fresh as the last push)
#
# This makes a WAL-safe, integrity-checked, gzip'd, date-stamped copy of each into
# a backups dir OUTSIDE the git repo (so it can never be accidentally committed),
# and keeps the most recent KEEP copies. The latest backup of an append-only log
# already contains all history; the rolling window guards against a bad recent run.
#
# Read-only on the sources (sqlite3 .backup opens a read txn; never writes them).
# Zero dependencies beyond sqlite3 + gzip. Run daily from cron, after the ETL job.
#
#   bash scripts/backup-memory.sh
#
# Restore:  gunzip -c ~/backups/observatory/cdl.sqlite.YYYY-MM-DD.gz > restored.sqlite
#
# NOTE: this is a LOCAL backup (same machine) — it protects against corruption,
# a bad ETL run, and accidental deletion. It does NOT protect against disk loss;
# for that, an owner must replicate ~/backups/observatory offsite (rsync/cloud).

set -euo pipefail

DEST="${BACKUP_DIR:-$HOME/backups/observatory}"
KEEP="${BACKUP_KEEP:-14}"
STAMP="$(date -u +%Y-%m-%d)"
LOG="$DEST/backup.log"

# Source DBs: "name|path". Add a line here if a new accruing DB is introduced.
# Override for tests with BACKUP_SOURCES="name|path;name2|path2".
if [[ -n "${BACKUP_SOURCES:-}" ]]; then
  IFS=';' read -r -a SOURCES <<< "$BACKUP_SOURCES"
else
  SOURCES=(
    "cdl.sqlite|$HOME/cardano-data-layer/service/data/cdl.sqlite"
    "observatory.db|$HOME/observatory/data/observatory.db"
  )
fi

mkdir -p "$DEST"
log() { echo "$(date -u +%FT%TZ) $*" | tee -a "$LOG" >&2; }

backup_one() {
  local name="$1" src="$2"
  if [[ ! -f "$src" ]]; then log "SKIP $name — source not found: $src"; return 1; fi
  local tmp="$DEST/.$name.$STAMP.tmp" out="$DEST/$name.$STAMP.gz"

  # WAL-safe consistent copy (includes uncommitted WAL frames).
  if ! sqlite3 "$src" ".backup '$tmp'"; then log "FAIL $name — .backup error"; rm -f "$tmp"; return 1; fi

  # Integrity-check the COPY before trusting it.
  local check; check="$(sqlite3 "$tmp" 'PRAGMA quick_check;' 2>&1 || true)"
  if [[ "$check" != "ok" ]]; then log "FAIL $name — integrity check: $check"; rm -f "$tmp"; return 1; fi

  gzip -c "$tmp" > "$out"; rm -f "$tmp"
  log "OK   $name -> $(basename "$out") ($(du -h "$out" | cut -f1))"

  # Rotate: keep the newest $KEEP for this DB.
  ls -1t "$DEST/$name."*.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    rm -f "$old"; log "prune $(basename "$old")"
  done
}

rc=0
for entry in "${SOURCES[@]}"; do
  backup_one "${entry%%|*}" "${entry#*|}" || rc=1
done
log "done (rc=$rc, keep=$KEEP, dest=$DEST)"
exit $rc

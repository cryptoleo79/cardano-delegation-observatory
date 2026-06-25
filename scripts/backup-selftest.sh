#!/usr/bin/env bash
# Backup self-test — proves the backup pipeline actually works, end to end.
#
# Runs the real backup script against an ISOLATED temp destination (never touches
# the live ~/backups/observatory), then asserts every guarantee the backup makes:
#   - source DBs exist and pass integrity_check
#   - a backup file is written, dated, non-empty
#   - the gzip is valid (gzip -t)
#   - the RESTORED copy passes integrity_check (a backup you can't restore is not one)
#   - the Project Memory event log (pm_event) is present and non-empty in the restore
#   - rotation keeps exactly KEEP copies, no more
#   - exit codes are correct (0 on success; non-zero when a source is missing)
#
# On full success it stamps ~/backups/observatory/last-selftest.txt (read by
# backup-status.sh as the "last restore verification"). Exit 0 = all passed.
#
#   bash scripts/backup-selftest.sh

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP="$SCRIPT_DIR/backup-memory.sh"
MARKER="${BACKUP_DIR:-$HOME/backups/observatory}/last-selftest.txt"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { echo "  PASS  $*"; pass=$((pass+1)); }
no()  { echo "  FAIL  $*"; fail=$((fail+1)); }
chk() { if eval "$2"; then ok "$1"; else no "$1"; fi; }

echo "== backup self-test =="

# 0. prerequisites
chk "sqlite3 available"          'command -v sqlite3 >/dev/null'
chk "gzip available"             'command -v gzip >/dev/null'
chk "backup script present+exec" "[ -x '$BACKUP' ]"

# 1. real sources exist and are sound
CDL="$HOME/cardano-data-layer/service/data/cdl.sqlite"
OBS="$HOME/observatory/data/observatory.db"
chk "source cdl.sqlite exists"     "[ -f '$CDL' ]"
chk "source observatory.db exists" "[ -f '$OBS' ]"
chk "cdl.sqlite integrity ok"      "[ \"\$(sqlite3 '$CDL' 'PRAGMA quick_check;' 2>/dev/null)\" = ok ]"
chk "observatory.db integrity ok"  "[ \"\$(sqlite3 '$OBS' 'PRAGMA quick_check;' 2>/dev/null)\" = ok ]"

# 2. run the REAL backup into an isolated dir; must exit 0
BACKUP_DIR="$T/bk" BACKUP_KEEP=2 bash "$BACKUP" >/dev/null 2>&1
chk "backup run exits 0" "[ $? -eq 0 ]"
STAMP="$(date -u +%Y-%m-%d)"

for pair in "cdl.sqlite:pm_event" "observatory.db:snapshots"; do
  name="${pair%%:*}"; table="${pair##*:}"; f="$T/bk/$name.$STAMP.gz"
  chk "$name backup written"     "[ -s '$f' ]"
  chk "$name gzip valid"         "gzip -t '$f' 2>/dev/null"
  gunzip -c "$f" > "$T/$name.restored" 2>/dev/null
  chk "$name restore integrity"  "[ \"\$(sqlite3 '$T/$name.restored' 'PRAGMA integrity_check;' 2>/dev/null)\" = ok ]"
  cnt="$(sqlite3 "$T/$name.restored" "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo 0)"
  chk "$name restored $table has rows ($cnt)" "[ '${cnt:-0}' -gt 0 ]"
done

# 3. rotation: seed > KEEP fakes, re-run, assert exactly KEEP remain
for d in 2026-01-01 2026-01-02 2026-01-03; do : > "$T/bk/cdl.sqlite.$d.gz"; done
BACKUP_DIR="$T/bk" BACKUP_KEEP=2 bash "$BACKUP" >/dev/null 2>&1
kept="$(ls -1 "$T/bk/cdl.sqlite."*.gz 2>/dev/null | wc -l | tr -d ' ')"
chk "rotation keeps exactly 2 (got $kept)" "[ '$kept' -eq 2 ]"

# 4. failure mode: a missing source must yield non-zero exit
BACKUP_DIR="$T/bk2" BACKUP_SOURCES="ghost|$T/does-not-exist.sqlite" bash "$BACKUP" >/dev/null 2>&1
chk "missing source exits non-zero" "[ $? -ne 0 ]"

echo "== result: $pass passed, $fail failed =="
if [ "$fail" -eq 0 ]; then
  mkdir -p "$(dirname "$MARKER")"
  echo "$(date -u +%FT%TZ) selftest OK ($pass checks)" > "$MARKER"
  exit 0
fi
exit 1

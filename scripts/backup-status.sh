#!/usr/bin/env bash
# Backup status report — internal operational observability for the memory backups.
#
# Reports, per database: latest backup, age, size, gzip validity, restore integrity,
# plus retention count, disk headroom, last self-test result, and last ETL run.
# Writes ~/backups/observatory/STATUS.md (INTERNAL — never the web root) and prints.
# Exit code: 0 healthy, 1 if any backup is missing or stale (> STALE_HRS old).
#
#   bash scripts/backup-status.sh

set -uo pipefail
DEST="${BACKUP_DIR:-$HOME/backups/observatory}"
STALE_HRS="${BACKUP_STALE_HRS:-36}"
OUT="$DEST/STATUS.md"
DBS=("cdl.sqlite" "observatory.db")
now=$(date -u +%s); rc=0

latest() { ls -1t "$DEST/$1."*.gz 2>/dev/null | head -1; }
age_hrs() { local f="$1"; [ -f "$f" ] && echo $(( (now - $(stat -c %Y "$f")) / 3600 )) || echo "-1"; }

{
echo "# Memory backup status"
echo
echo "_Generated $(date -u +%FT%TZ) · internal operational report · not public._"
echo
echo "| Database | Latest backup | Age (h) | Size | gzip | Restore integrity |"
echo "|----------|---------------|--------:|-----:|------|-------------------|"
for db in "${DBS[@]}"; do
  f="$(latest "$db")"
  if [ -z "$f" ]; then echo "| $db | **MISSING** | — | — | — | — |"; rc=1; continue; fi
  a="$(age_hrs "$f")"; sz="$(du -h "$f" | cut -f1)"
  gz="ok"; gzip -t "$f" 2>/dev/null || { gz="**BAD**"; rc=1; }
  integ="skipped"
  if [ "$gz" = "ok" ]; then
    tmp="$(mktemp)"; gunzip -c "$f" > "$tmp" 2>/dev/null
    integ="$(sqlite3 "$tmp" 'PRAGMA quick_check;' 2>/dev/null || echo error)"
    [ "$integ" = "ok" ] || rc=1
    rm -f "$tmp"
  fi
  flag=""; [ "$a" -gt "$STALE_HRS" ] 2>/dev/null && { flag=" ⚠️STALE"; rc=1; }
  echo "| $db | $(basename "$f") | ${a}${flag} | $sz | $gz | $integ |"
done
echo
echo "## Operational"
echo "- Retention: keep ${BACKUP_KEEP:-14}; current files: $(ls -1 "$DEST/"*.gz 2>/dev/null | wc -l | tr -d ' ')"
echo "- Backups dir size: $(du -sh "$DEST" 2>/dev/null | cut -f1) · disk free: $(df -h "$DEST" | tail -1 | awk '{print $4" ("$5" used)"}')"
echo "- Stale threshold: ${STALE_HRS}h"
if [ -f "$DEST/last-selftest.txt" ]; then echo "- Last self-test: $(cat "$DEST/last-selftest.txt")"; else echo "- Last self-test: **never run** — run scripts/backup-selftest.sh"; fi
last_etl="$(sqlite3 "$HOME/observatory/data/observatory.db" 'SELECT MAX(run_completed_at) FROM etl_runs WHERE success=1;' 2>/dev/null || echo '?')"
echo "- Last ETL run (source freshness): ${last_etl:-?}"
echo
echo "_Health: $([ "$rc" -eq 0 ] && echo OK || echo NEEDS ATTENTION)_"
} | tee "$OUT"

exit $rc

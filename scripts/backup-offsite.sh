#!/usr/bin/env bash
# Offsite encrypted replication — Memory Integrity Phase 3 (Loop 7: SURVIVE).
#
# Takes the latest LOCAL backups (from backup-memory.sh), ENCRYPTS them, and pushes
# the ciphertext offsite. This is what makes the platform survive losing the whole
# server — the local backup alone does not.
#
# It is written to run with ZERO new dependencies (gpg is already present) and to be
# TESTABLE before any cloud is wired up: with no transport configured it stages the
# encrypted files locally and verifies they decrypt — proving the crypto path works.
#
# ── CONFIGURE (owner) ───────────────────────────────────────────────────────────
# Encryption — choose ONE (asymmetric strongly preferred; no secret lives on the box):
#   OFFSITE_GPG_RECIPIENT=<key-id|email>   # gpg --encrypt -r (public-key; best)
#   OFFSITE_PASSPHRASE_FILE=<path>         # gpg symmetric, passphrase read from file
# Transport — set OFFSITE_PUSH_CMD to a command that copies "$1" (a file) offsite, e.g.:
#   OFFSITE_PUSH_CMD='rclone copyto "$1" "remote:observatory/$(basename "$1")"'
#   OFFSITE_PUSH_CMD='rsync -a "$1" user@host:backups/observatory/'
#   OFFSITE_PUSH_CMD='aws s3 cp "$1" s3://bucket/observatory/'
#   OFFSITE_PUSH_CMD='scp "$1" user@host:backups/observatory/'
# If OFFSITE_PUSH_CMD is unset, files are only staged locally (a safe self-test).
#
# Put these in an env file (e.g. ~/backups/observatory/offsite.env, chmod 600) and
# source it from cron. NEVER commit secrets.
#
#   bash scripts/backup-offsite.sh            # encrypt + push (or stage if no transport)
#   bash scripts/backup-offsite.sh --dry-run  # show what would happen, change nothing

set -uo pipefail

SRC="${BACKUP_DIR:-$HOME/backups/observatory}"
STAGE="$SRC/offsite-staging"
LOG="$SRC/offsite.log"
ENVF="${OFFSITE_ENV:-$SRC/offsite.env}"
DRY=0; [[ "${1:-}" == "--dry-run" ]] && DRY=1
DBS=("cdl.sqlite" "observatory.db")

[[ -f "$ENVF" ]] && { set -a; . "$ENVF"; set +a; }
mkdir -p "$STAGE"; chmod 700 "$STAGE"
log() { echo "$(date -u +%FT%TZ) $*" | tee -a "$LOG" >&2; }

# --- choose an encryption method from config ---
ENC_MODE=""
if [[ -n "${OFFSITE_GPG_RECIPIENT:-}" ]]; then ENC_MODE="recipient"
elif [[ -n "${OFFSITE_PASSPHRASE_FILE:-}" && -f "${OFFSITE_PASSPHRASE_FILE}" ]]; then ENC_MODE="symmetric"
else
  log "NO ENCRYPTION CONFIGURED — set OFFSITE_GPG_RECIPIENT or OFFSITE_PASSPHRASE_FILE in $ENVF"
  log "Refusing to replicate plaintext offsite. (This is the owner step for Phase 3.)"
  exit 3
fi
command -v gpg >/dev/null || { log "FAIL gpg not installed"; exit 2; }

encrypt() { # $1 = plaintext path -> echoes ciphertext path
  local in="$1" out="$STAGE/$(basename "$1").gpg"
  if [[ "$ENC_MODE" == "recipient" ]]; then
    gpg --batch --yes --trust-model always -r "$OFFSITE_GPG_RECIPIENT" -o "$out" --encrypt "$in" 2>>"$LOG"
  else
    gpg --batch --yes --pinentry-mode loopback --passphrase-file "$OFFSITE_PASSPHRASE_FILE" \
        -o "$out" --symmetric --cipher-algo AES256 "$in" 2>>"$LOG"
  fi || return 1
  echo "$out"
}

verify_decrypt() { # $1 = ciphertext; prove it round-trips (symmetric only; recipient needs the private key)
  [[ "$ENC_MODE" != "symmetric" ]] && return 0
  local tmp; tmp="$(mktemp)"
  gpg --batch --yes --pinentry-mode loopback --passphrase-file "$OFFSITE_PASSPHRASE_FILE" \
      -o "$tmp" --decrypt "$1" 2>>"$LOG" || { rm -f "$tmp"; return 1; }
  gzip -t "$tmp" 2>/dev/null; local rc=$?; rm -f "$tmp"; return $rc
}

rc=0
log "start (mode=$ENC_MODE, transport=${OFFSITE_PUSH_CMD:+set}${OFFSITE_PUSH_CMD:-none}, dry=$DRY)"
for db in "${DBS[@]}"; do
  latest="$(ls -1t "$SRC/$db."*.gz 2>/dev/null | head -1)"
  [[ -z "$latest" ]] && { log "SKIP $db — no local backup found (run backup-memory.sh first)"; rc=1; continue; }
  if [[ $DRY -eq 1 ]]; then log "DRY would encrypt+push $(basename "$latest")"; continue; fi

  ct="$(encrypt "$latest")" || { log "FAIL encrypt $db"; rc=1; continue; }
  verify_decrypt "$ct" || { log "FAIL decrypt-verify $db (crypto round-trip)"; rc=1; continue; }
  log "OK encrypt $(basename "$ct") ($(du -h "$ct" | cut -f1))"

  if [[ -n "${OFFSITE_PUSH_CMD:-}" ]]; then
    if ( set -- "$ct"; eval "$OFFSITE_PUSH_CMD" ) 2>>"$LOG"; then log "OK push $(basename "$ct")"
    else log "FAIL push $(basename "$ct")"; rc=1; fi
  else
    log "STAGED only (no OFFSITE_PUSH_CMD) — $(basename "$ct") in $STAGE"
  fi
done
log "done (rc=$rc)"
exit $rc

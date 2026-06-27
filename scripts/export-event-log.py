#!/usr/bin/env python3
"""Export the canonical Project Memory event log as a git-trackable public artifact.

WHY (Era III, Parts 2 & 6): the hash chain is only independently verifiable if the
FULL ordered event log is a published artifact — not locked inside cdl.sqlite (which is
git-ignored and lives on one server). This writes the complete log as NDJSON so that:
  • anyone can re-verify the entire chain from public artifacts alone
    (events.ndjson + the chain_head in index.json + verify-memory-chain.py),
  • the canonical, verifiable memory survives total infrastructure loss via any repo
    clone — not just a local/offsite DB backup.

FORMAT: one JSON object per line, in seq order, with EVERY field including prev_hash
and hash. `payload` is emitted as the EXACT stored text (a JSON string), so the chain
is verifiable byte-for-byte in any language without re-serialization ambiguity.

Stdlib only (sqlite3 + json). Run it whenever the memory export is regenerated, then
verify and commit the result:
    python3 scripts/export-event-log.py
    python3 scripts/verify-memory-chain.py data/snapshots/projectmemory/events.ndjson \\
        --expect-head "$(python3 -c "import json;print(json.load(open('data/snapshots/projectmemory/index.json'))['meta']['chain_head'])")"
"""
import sys
import json
import sqlite3

DEFAULT_DB = "/home/midnight/cardano-data-layer/service/data/cdl.sqlite"
DEFAULT_OUT = "/home/midnight/observatory/data/snapshots/projectmemory/events.ndjson"


def main():
    db = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB
    out = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUT
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT seq, ts, type, subject, actor, payload, prev_hash, hash "
        "FROM pm_event ORDER BY seq ASC"
    ).fetchall()
    con.close()

    n = 0
    with open(out, "w", encoding="utf-8") as f:
        for e in rows:
            # payload stays a STRING (the exact stored text) for byte-exact verification.
            obj = {
                "seq": e["seq"], "ts": e["ts"], "type": e["type"],
                "subject": e["subject"], "actor": e["actor"],
                "payload": e["payload"], "prev_hash": e["prev_hash"], "hash": e["hash"],
            }
            f.write(json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n")
            n += 1
    head = rows[-1]["hash"] if rows else "0" * 64
    print(f"wrote {n} events -> {out} (head {head[:16]}…)")


if __name__ == "__main__":
    main()

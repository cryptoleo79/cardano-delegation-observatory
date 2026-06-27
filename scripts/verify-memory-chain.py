#!/usr/bin/env python3
"""Independent hash-chain verifier for Cardano Project Memory.

THE PRESERVATION GUARANTEE, MADE CHECKABLE BY ANYONE.

The Project Memory event log (`pm_event` in cdl.sqlite) is append-only and
hash-chained: each event's `hash` = sha256 of its content plus the previous
event's hash. Tampering with any historical event breaks every hash after it.

The live service can verify this — but a future researcher, a new operator after
a disaster recovery, or any third party auditing the public record should be able
to verify it *without* the service, in a language that will still run in decades.
This script does exactly that, using ONLY the Python 3 standard library
(sqlite3 + hashlib). No external dependencies, no project code, no network.

It re-implements the canonical hashing form documented in
cardano-data-layer/service/src/projectmemory/eventstore.js:
    GENESIS   = "0" * 64
    canonical = "\\n".join([prev_hash, ts, type, subject_or_empty, actor, payload])
    hash      = sha256(canonical).hexdigest()
The `payload` is read as the exact text stored at write time, so verification is
byte-for-byte and language-independent (no JSON re-serialization needed).

Usage:
    python3 verify-memory-chain.py [PATH_TO_cdl.sqlite] [--expect-head HEX]

    # default DB path:
    python3 scripts/verify-memory-chain.py
    # verify a recovered backup and confirm it matches the published head:
    python3 scripts/verify-memory-chain.py /tmp/restored.sqlite \\
        --expect-head "$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['meta']['chain_head'])" \\
                          data/snapshots/projectmemory/index.json)"

Exit code: 0 = chain intact (and matches --expect-head if given); 1 = broken/mismatch.
The published head lives in data/snapshots/projectmemory/index.json -> meta.chain_head.
"""
import sys
import json
import sqlite3
import hashlib

GENESIS = "0" * 64
DEFAULT_DB = "/home/midnight/cardano-data-layer/service/data/cdl.sqlite"


def canonical(prev_hash, ts, etype, subject, actor, payload):
    # Order-sensitive, newline-delimited — must match eventstore.js exactly.
    # NULL subject is hashed as the empty string.
    return "\n".join([prev_hash, ts, etype, subject or "", actor, payload])


def load_rows(path):
    """Read events from EITHER a sqlite DB or the public events.ndjson artifact.

    The NDJSON form lets anyone verify the chain from exported artifacts alone, with
    no database and no running service — the Era III independent-verification goal."""
    if path.endswith(".ndjson") or path.endswith(".jsonl"):
        rows = []
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    rows.append(json.loads(line))
        rows.sort(key=lambda e: e["seq"])
        return rows
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT seq, ts, type, subject, actor, payload, prev_hash, hash "
        "FROM pm_event ORDER BY seq ASC"
    ).fetchall()
    con.close()
    return rows


def verify(db_path):
    rows = load_rows(db_path)
    prev = GENESIS
    for e in rows:
        h = hashlib.sha256(
            canonical(prev, e["ts"], e["type"], e["subject"], e["actor"], e["payload"]).encode("utf-8")
        ).hexdigest()
        if e["prev_hash"] != prev:
            return {"ok": False, "seq": e["seq"], "reason": "prev_hash linkage broken", "count": len(rows)}
        if e["hash"] != h:
            return {"ok": False, "seq": e["seq"], "reason": "content hash mismatch (event altered)", "count": len(rows)}
        prev = e["hash"]
    return {"ok": True, "head": prev, "count": len(rows)}


def main():
    args = [a for a in sys.argv[1:]]
    expect = None
    if "--expect-head" in args:
        i = args.index("--expect-head")
        expect = args[i + 1]
        del args[i:i + 2]
    db = args[0] if args else DEFAULT_DB

    try:
        r = verify(db)
    except Exception as exc:  # noqa: BLE001 - report any read/parse failure plainly
        print(f"VERIFY ERROR ({db}): {exc}")
        sys.exit(1)

    if not r["ok"]:
        print(f"CHAIN BROKEN at seq {r['seq']}: {r['reason']} ({r['count']} events)")
        sys.exit(1)

    print(f"chain OK — {r['count']} events, head {r['head']}")
    if expect is not None:
        if r["head"] == expect:
            print(f"head MATCHES published chain_head ({expect[:16]}…)")
        else:
            print(f"HEAD MISMATCH — computed {r['head'][:16]}… != expected {expect[:16]}…")
            sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()

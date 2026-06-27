🇯🇵 日本語版（準備中）

# Cardano Delegation Observatory

Public governance observability infrastructure for the Cardano blockchain.

This site shows voting weight, delegation flow, and participation for the top 30 Cardano DReps, computed daily from on-chain data with a minimum 24-hour lag from any on-chain event to its appearance on the site.

## What this is

A neutral observability layer for Cardano DRep delegation. It exists to make governance behavior observable to anyone who wants to look — delegators doing due diligence, DReps reviewing their own behavior, researchers measuring decentralization over time, journalists citing source data.

## What this is not

This site does not produce trust scores, alignment ratings, rankings beyond raw on-chain voting weight, predictions, or any other form of editorial judgment on individual DReps. It does not provide alerts, notifications, comments, ratings, or any social layer. It is data.

See [METHODOLOGY.md](./METHODOLOGY.md) for the exhaustive list of what is and is not included, and exactly how every number on the site is computed from public APIs.

## Status

**Live and operating.** The site (observatory.asy.life) and the read-only Data Layer API (api.asy.life) are deployed. Snapshots are recorded daily; the platform is in long-term operation/preservation mode rather than active feature development.

The methodology remains the legitimacy core of this project. Substantive feedback — particularly from DReps, SPOs, and Japanese-speaking Cardano participants — is welcome via GitHub issues.

**For operators / maintainers** (install, restore, verify, recover, run): see [`docs/RECOVERY.md`](./docs/RECOVERY.md) (disaster recovery + clean-machine provisioning), [`docs/OPERATIONS.md`](./docs/OPERATIONS.md) (operating cadence + automation), and [`docs/PRESERVATION.md`](./docs/PRESERVATION.md) (independent verification of the historical record). The memory's integrity is independently checkable with [`scripts/verify-memory-chain.py`](./scripts/verify-memory-chain.py) (stdlib Python, no services required).

## License

- **Code:** Apache 2.0 (see `LICENSE`)
- **Data:** CC0 — published snapshots are public domain. Anyone may copy, redistribute, mirror, or build on them without attribution required.

## Operator

This observatory is operated by [cryptoleo79](https://github.com/cryptoleo79), an independent Cardano stake pool operator and DRep. The operator's own DRep entry (if any) appears in the published data alongside every other DRep, with no exclusion or special treatment. Operator disclosures are documented in [METHODOLOGY.md §10](./METHODOLOGY.md).

## Reproducibility

Every published number is derivable from public Koios API responses. The ETL source code (`etl/snapshot.py`) is the canonical computation. Anyone with a network connection can re-run it and verify the results against the published snapshots.

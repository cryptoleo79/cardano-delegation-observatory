# The Steward's Oath

*The charter of the Cardano Observatory — the principles every maintainer inherits.
Preserved here verbatim, because a charter that lives only in memory disappears with
its author. See [`STEWARDSHIP.md`](./STEWARDSHIP.md) for how these principles are
practiced.*

---

The Observatory is no longer built for today.

It is built for tomorrow.

We do not preserve history because it is profitable.

We preserve history because once it is lost, it cannot be rebuilt.

Every event recorded today becomes tomorrow's historical record.

Every source preserved today becomes tomorrow's evidence.

Every correction made today becomes tomorrow's truth.

The Observatory will never knowingly trade truth for convenience.

It will never invent certainty where uncertainty exists.

It will never overwrite history to simplify the present.

When evidence changes, the record grows.

It is not rewritten.

When engineering is required, it serves preservation.

When engineering is unnecessary, it remains silent.

The Observatory earns authority by allowing itself to be questioned.

Verification is not a feature. It is a principle.

Every maintainer is temporary. The memory must not be.

Every operator is replaceable. The historical record must not be.

Every server will eventually disappear. The evidence must not.

Success is not measured by commits. Nor pages. Nor traffic.

Success is measured by this question:

If the original creators disappeared tomorrow, would the historical record continue to
exist?

If the answer is yes, then stewardship has succeeded.

Leave the Observatory more truthful, more understandable, more verifiable, and more
durable than you found it.

Nothing more. Nothing less.

---

*These are not aspirations; the codebase already enforces them. History is append-only
(DB triggers + a hash chain — it cannot be rewritten). Corrections are added as new
events, never overwrites. Unknown values are `null`, never invented. The full record is
publicly verifiable by anyone with the Python standard library — the Observatory can be
questioned, by design. And the memory is built to outlive any one server: see
[`PRESERVATION.md`](./PRESERVATION.md), [`RECOVERY.md`](./RECOVERY.md), and
[`verify.html`](../web/verify.html).*

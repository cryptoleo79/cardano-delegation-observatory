# JA-4 audit — voting.asy.life and governance.asy.life

**Date:** 2026-06-02
**Scope:** The two sibling-site landing pages outside this repository:

- `/var/www/voting.asy.life/index.html` (16 KB)
- `/var/www/governance.asy.life/index.html` (19 KB)

Both files are owned by `www-data` and are deployed as self-contained single HTML pages with inline `<style>` and inline `setLang()` JavaScript — they do not consume the observatory's shared `web/i18n.js` or `web/style.css`. Each page uses the `<span class="en">…</span><span class="ja">…</span>` toggle pattern with a `body.lang-{en,ja}` class flipped by an inline JS function.

This audit is read-only. Findings that require file changes need root access to `/var/www/` or, preferably, an explicit move of these two pages into a versioned repository before any methodology-disciplined edit.

---

## Summary

| Page | Status | Issues found |
|---|---|---|
| voting.asy.life | mostly clean | 1 vocabulary divergence (Observatory in eco-strip) |
| governance.asy.life | mostly clean | 1 vocabulary divergence (Observatory in eco-strip) |

No register violations, no proper-noun violations beyond the one item, no broken language switching, no missing translations, no untranslated paragraphs.

---

## Findings

### V-1 — Observatory rendered as オブザバトリー (both pages, JA mode)

Each page's ecosystem strip and footer link to observatory.asy.life rendered with this pair:

```html
<a href="https://observatory.asy.life" class="eco-link">
  <span class="en">Observatory</span>
  <span class="ja">オブザバトリー</span>
</a>
```

`docs/JA_STYLE_GUIDE.md` §1 locks the observatory's brand as **Latin "Observatory" in both languages**, with the rationale that it is the site's name and treated as a proper noun per §2. The voting and governance pages diverge by katakana-izing it. This makes a JA user encounter two different renderings of the same brand depending on which sibling site they happen to be on:

- On observatory.asy.life (JA): "Observatory · CTF · 投票 · ガバナンス · GitHub"
- On voting.asy.life (JA):     "オブザバトリー · CTF · 投票 · ガバナンス · GitHub"
- On governance.asy.life (JA): "オブザバトリー · CTF · 投票 · ガバナンス · GitHub"

**Decision needed:**

- **Option A** (recommended): align voting and governance to Latin "Observatory" — matches the style guide and the current observatory site. Mechanical change: in each of the two files, replace `<span class="en">Observatory</span><span class="ja">オブザバトリー</span>` with `Observatory` (drop the wrapping spans entirely since it is the same in both languages). Two locations in voting.asy.life, three locations in governance.asy.life. Requires root or a one-shot capture into a repo.

- **Option B**: revise the style guide to allow オブザバトリー for ecosystem cross-references and keep observatory's own self-name as Latin. Slightly inconsistent but preserves the existing JA-community familiarity that may have driven the original choice on the sibling sites.

- **Option C**: change observatory.asy.life's eco-link-observatory to オブザバトリー (matching the sibling sites). Easier to apply (this repo is versioned, single i18n key change) but goes against the locked style guide.

This audit recommends Option A. The decision is the operator's; this document does not unilaterally rewrite the style guide.

### V-2 (informational, not a defect) — "DRep（委任代表者）" first-use gloss on voting.asy.life

Line 96 of voting.asy.life renders:

> Cardanoのガバナンスはオンチェーンで、票には拘束力があります。DRep（委任代表者）が投じる票が、トレジャリーからの引き出し、プロトコル・パラメーターの変更、憲法の改定といった決定を左右します。

The parenthetical "（委任代表者）" gloss after "DRep" is exactly the pattern recommended by `docs/JA_STYLE_GUIDE.md` §2 for proper-noun first-use in long-form prose. The DRep proper noun stays Latin throughout; the parenthetical exists once on first reference. **This is correct and is documented here only to confirm the audit checked for it deliberately.**

---

## What was checked (and passed)

The following classes of issues were probed and found absent on both pages:

- **Treasury terminology** — both pages use トレジャリー (9 total occurrences across the two pages); no 財務省 or 国庫 anywhere. Matches `docs/JA_STYLE_GUIDE.md` §1.2.
- **Canonical terminology** — neither page uses 正本 or 正規 (the deprecated renderings); the methodology-flavored "canonical" concept does not appear on these pages, which is expected for sibling landing pages.
- **Right-of-reply baggage** — no occurrence of 反論権 (the press-law term the style guide warns against) on either page; both pages avoid the §9 right-of-reply concept entirely, which is correct since neither is the methodology surface.
- **DRep as proper noun** — DRep stays in Latin across all 10 occurrences on voting.asy.life and remains Latin on governance.asy.life. Matches the style guide proper-noun rule.
- **Reconciliation / backfill / idempotent** — these methodology-layer concepts do not appear on either page, so the lock-in warnings (リコンサイル vs 突合, 埋め戻し vs バックフィル, べき等 vs 冪等) are not exercised here.
- **Voting / Governance translations** — both pages render Voting as 投票 and Governance as ガバナンス, matching the locked style guide eco-strip vocabulary.
- **Language-switch mechanism** — both pages use the `body.lang-{en,ja}` class with `setLang()` toggling between visible spans; verified that every `<span class="en">` has a sibling `<span class="ja">`, no orphans.
- **Hyperlink preservation** — anchors are not inside `<span>` pairs being toggled; the toggle pattern uses block-level or inline `<span class="en">` / `<span class="ja">` siblings with the `<a>` element outside the toggle scope, so the CC-4 problem the observatory has does not apply here.

---

## Recommendation

Apply **Option A** for V-1 when the operator next has root or sudo access to `/var/www/`. The minimal patch is:

```sh
# voting.asy.life
sudo sed -i 's|<span class="en">Observatory</span><span class="ja">オブザバトリー</span>|Observatory|g' /var/www/voting.asy.life/index.html

# governance.asy.life
sudo sed -i 's|<span class="en">Observatory</span><span class="ja">オブザバトリー</span>|Observatory|g' /var/www/governance.asy.life/index.html
```

The change is a no-op for English visitors and replaces katakana with Latin for JA visitors, making the ecosystem strip consistent across all four observatory-family domains (observatory, voting, governance, CTF).

**Preferred long-term:** move both files into a versioned repository so future style-guide changes can flow through normal commit + deploy discipline rather than ad-hoc sudo edits. This is a separate piece of work outside the JA-1 / JA-3 / JA-4 bundle.

---

## Out of scope for this audit

- The CTF site (`ctf.asy.life`) — `~/CTF/` is a separate repository with its own bilingual layer and own audit lifecycle.
- The deployment configuration (nginx vhosts, SSL certificates, deploy automation) of the two sibling sites.
- Future content additions on voting.asy.life or governance.asy.life — they describe planned features (Ekklesia/Hydra layer; governance portal). When those features ship, the JA register and locked vocabulary should be re-checked against `docs/JA_STYLE_GUIDE.md` at that time.

# nginx hardening — close repo-internal exposure (OWNER action, needs sudo)

**Status:** verified defect (Completion Sprint, Part 6). **Owner-blocked** — editing
`/etc/nginx` and reloading require sudo, which is a safety-rail prompt this agent
cannot drive non-interactively.

## What's exposed today

The vhost `observatory.asy.life` has `root /var/www/observatory.asy.life` (a deployed
copy of the whole repo) and this `location /`:

```nginx
location / { try_files /web$uri /web$uri/ $uri =404; }   # <-- the bare $uri fallback
location /data/ { autoindex off; }                       # <-- serves ALL of data/
```

The `$uri` fallback (added so root-level `README.md` / `METHODOLOGY.md` resolve) and
the broad `/data/` block mean the entire deployed repo is publicly fetchable:

| URL | Now | Should be |
|-----|-----|-----------|
| `/data/snapshots/changes.json` | 200 ✅ (intended) | 200 |
| `/data/observatory.db` | **200 ⚠️** (43MB raw SQLite) | 404 |
| `/scripts/backup-memory.sh` | **200 ⚠️** | 404 |
| `/etl/snapshot.py` | **200 ⚠️** | 404 |
| `/docs/WAR_ROOM.md` | **200 ⚠️** | 404 |
| `/.git/…` | 404 ✅ (dotfile deny) | 404 |
| backups | 404 ✅ (outside docroot) | 404 |

**Severity: MEDIUM.** No secret/PII leak — all data is CC0 and the repo is public on
GitHub — but it's unintended: the raw DB is a 43MB bandwidth/DoS vector and exposes
internal tables (`etl_runs`, `live_state`); scripts/etl/internal-docs shouldn't be
served from the production domain.

## The fix

Replace the `location /data/` and `location /` blocks. Keep serving snapshot JSON and
the two intended root docs; deny everything else outside `/web/`.

```nginx
    # Snapshot JSON only — NOT the raw DB or other files under data/.
    location /data/ {
        autoindex off;
        location ~ \.json$ { }              # allow *.json
        location ~ \.(db|sqlite|sqlite-wal|sqlite-shm)$ { deny all; return 404; }
        # everything else under /data/ that isn't .json: block
        location ~ /data/.+\.(?!json$)[^.]+$ { deny all; return 404; }
    }

    # Frontend lives under /web/. Allow ONLY the two intended root docs to fall
    # back to project root; everything else must exist under /web/ or 404.
    location = /README.md      { try_files /README.md =404; default_type text/plain; }
    location = /METHODOLOGY.md  { try_files /METHODOLOGY.md =404; default_type text/plain; }
    location / {
        try_files /web$uri /web$uri/ =404;  # <-- dropped the bare $uri fallback
    }

    # (keep) markdown as text, and the dotfile deny block unchanged.
```

The single most important line is removing the bare `$uri` from the `try_files` in
`location /` — that alone stops `/scripts/`, `/etl/`, `/docs/` from resolving. The
`/data/` tightening stops the raw DB download.

### Even simpler alternative (if the root .md docs aren't needed publicly)

```nginx
    location /data/ {
        autoindex off;
        location ~ \.json$ { }
        location ~ /data/ { deny all; return 404; }   # block all non-json under data/
    }
    location / { try_files /web$uri /web$uri/ =404; }  # web/ only, no root fallback
```

## Apply + verify

```bash
sudo nano /etc/nginx/sites-available/observatory.asy.life   # edit the two blocks
sudo nginx -t                                               # MUST pass
sudo systemctl reload nginx

# verify (json still 200; everything else 404)
for p in data/snapshots/changes.json data/observatory.db scripts/backup-memory.sh \
         etl/snapshot.py docs/WAR_ROOM.md; do
  printf "%s -> " "$p"; curl -s -o /dev/null -w "%{http_code}\n" -L "https://observatory.asy.life/$p"
done
# expect: changes.json 200; all others 404
```

## Optional: stop deploying non-web files at all

The deeper fix is to deploy only `web/` + `data/snapshots/` to
`/var/www/observatory.asy.life`, not the whole repo. Then even a permissive nginx
can't leak scripts/etl/docs/db. Adjust the deploy step (whatever copies the repo to
`/var/www`) to rsync only those two trees. This makes the nginx change defence-in-depth
rather than the sole guard.

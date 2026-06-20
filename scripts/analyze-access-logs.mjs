#!/usr/bin/env node
// Access-log evidence parser — turn nginx logs into adoption evidence.
//
// PURPOSE (prove-the-platform, Objectives 3/4/5): produce an honest, AGGREGATE
// picture of which observatory pages get real traffic (winner/loser) and which
// api.asy.life routes get called — the only "evidence not guesses" signal that
// does not depend on outreach replies. See FEEDBACK_PIPELINE.md.
//
// PRIVACY (non-negotiable, the never-list governs): this script keeps COUNTS, never
// visitors. Client IPs are never printed and never written anywhere. The only use of
// an IP is to fold it to its /24 and count DISTINCT /24s per API route as a coarse
// "how many different callers" signal — the IP itself is discarded immediately. No
// cookies, no user agents stored (UA is read once to drop bots, then dropped).
//
// READ-ONLY: opens log files for reading only. Writes nothing to /var/log. If you
// pass --out FILE it writes the aggregate report there (your choice of path).
//
// Zero dependencies (Node 22; node:zlib for .gz). nginx logs are root:adm, so:
//   sudo node scripts/analyze-access-logs.mjs
//   sudo node scripts/analyze-access-logs.mjs --days 7 --out /tmp/usage.md
//   sudo node scripts/analyze-access-logs.mjs --logs /var/log/nginx/access.log
//
// Default log set: /var/log/nginx/access.log, access.log.1, and access.log.*.gz.
//
// VHOST NOTE: the default combined log format has no $host field, so observatory
// vs api requests are separated HEURISTICALLY by request path (documented below).
// The clean fix is FEEDBACK_PIPELINE.md quick-win #1 — split the vhosts into
// separate access logs; if a $host token is present this script will use it.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

// ---- args ----
const argv = process.argv.slice(2);
function arg(name, def) { const i = argv.indexOf('--' + name); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; }
const DAYS = parseInt(arg('days', '0'), 10) || 0;      // 0 = all available
const OUT = arg('out', '');
const LOG_DIR = arg('logdir', '/var/log/nginx');
const explicitLogs = (arg('logs', '') || '').split(',').filter(Boolean);

// ---- candidate observatory pages (the winner/loser scoreboard, Obj 3/4) ----
const CANDIDATES = ['changes', 'projects', 'categories', 'rankings', 'memory', 'treasury', 'catalyst'];

// ---- bot detection (drop obvious crawlers; counted separately, never in totals) ----
const BOT = /(bot|spider|crawl|slurp|bingpreview|facebookexternal|semrush|ahrefs|mj12|dotbot|petalbot|gptbot|ccbot|claudebot|bytespider|headless|monitor|uptime|curl\/|wget|python-requests|go-http)/i;

// ---- classify a request path as api vs observatory (heuristic, see VHOST NOTE) ----
const API_PREFIXES = ['/dreps', '/drep/', '/actions', '/action/', '/votes', '/treasury', '/token', '/tokens', '/market', '/price', '/ohlcv', '/nft', '/project', '/projects', '/category', '/categories', '/history', '/catalyst', '/funds', '/fund/', '/governance', '/openapi.json', '/health', '/docs', '/archive', '/proposals'];
function classify(path, host) {
  if (host) return /(^|\.)api\./.test(host) ? 'api' : 'observatory';
  // path heuristic: observatory pages are *.html or "/"; everything matching an api
  // prefix (and not a .html) is treated as api. Imperfect — labelled as heuristic.
  if (path === '/' || path.endsWith('.html')) return 'observatory';
  if (API_PREFIXES.some((p) => path === p || path.startsWith(p))) return 'api';
  if (/\.(css|js|json|png|jpg|svg|ico|webp|txt|csv|xml|woff2?)$/i.test(path)) return 'asset';
  return 'observatory'; // default bucket for bare paths
}

// ---- nginx combined log line regex (optionally with a leading or trailing host) ----
// $remote_addr - - [time] "METHOD path HTTP/x" status bytes "ref" "ua"
const LINE = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+?)(?:\?[^"]*)? [^"]*" (\d{3}) (\S+) "([^"]*)" "([^"]*)"(?:\s+"?([^"\s]+))?/;

function ip24(ip) { // fold to /24 (or /48 for v6) without keeping the address
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':');
  const p = ip.split('.'); return p.length === 4 ? p.slice(0, 3).join('.') : ip;
}
function parseTs(s) { // "10/Oct/2026:13:55:36 +0000" -> Date
  const m = s.match(/^(\d+)\/(\w+)\/(\d+):(\d+):(\d+):(\d+)/); if (!m) return null;
  const mo = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }[m[2]];
  return new Date(Date.UTC(+m[3], mo, +m[1], +m[4], +m[5], +m[6]));
}

// ---- gather log files ----
let files = explicitLogs;
if (!files.length) {
  if (!existsSync(LOG_DIR)) { console.error('log dir not found: ' + LOG_DIR + ' (run with sudo, or pass --logs)'); process.exit(2); }
  let entries;
  try { entries = readdirSync(LOG_DIR); }
  catch (e) { console.error('cannot read ' + LOG_DIR + ': ' + e.message + '\nnginx logs are root-owned — run: sudo node scripts/analyze-access-logs.mjs'); process.exit(2); }
  files = entries.filter((f) => /^access\.log(\.\d+(\.gz)?)?$/.test(f)).sort().map((f) => LOG_DIR + '/' + f);
}
if (!files.length) { console.error('no access.log files found in ' + LOG_DIR); process.exit(2); }

const cutoff = DAYS ? Date.now() - DAYS * 86400000 : 0;

// ---- accumulators (counts only) ----
const pageHits = new Map();      // observatory path -> hits
const apiHits = new Map();       // api route -> hits
const apiStatus = new Map();     // api route -> {ok,err}
const apiCallers = new Map();    // api route -> Set of /24 (discarded after counting)
let total = 0, bots = 0, assets = 0, unparsed = 0, minTs = null, maxTs = null;

for (const file of files) {
  let buf;
  try { buf = readFileSync(file); } catch (e) { console.error('skip ' + file + ' (' + e.code + ')'); continue; }
  let text;
  try { text = file.endsWith('.gz') ? gunzipSync(buf).toString('utf8') : buf.toString('utf8'); }
  catch { continue; }
  for (const line of text.split('\n')) {
    if (!line) continue;
    const m = line.match(LINE);
    if (!m) { unparsed++; continue; }
    const [, ip, ts, , rawPath, statusStr, , , ua, hostMaybe] = m;
    const t = parseTs(ts); if (t) { const ms = t.getTime(); if (cutoff && ms < cutoff) continue; if (!minTs || ms < minTs) minTs = ms; if (!maxTs || ms > maxTs) maxTs = ms; }
    if (BOT.test(ua)) { bots++; continue; }
    const path = rawPath.split('?')[0];
    const kind = classify(path, hostMaybe);
    const status = parseInt(statusStr, 10);
    if (kind === 'asset') { assets++; continue; }
    total++;
    if (kind === 'api') {
      apiHits.set(path, (apiHits.get(path) || 0) + 1);
      const s = apiStatus.get(path) || { ok: 0, err: 0 }; if (status >= 400) s.err++; else s.ok++; apiStatus.set(path, s);
      let set = apiCallers.get(path); if (!set) { set = new Set(); apiCallers.set(path, set); } set.add(ip24(ip));
    } else {
      pageHits.set(path, (pageHits.get(path) || 0) + 1);
    }
  }
}

// ---- build report ----
function top(map, n) { return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n); }
const range = (minTs && maxTs) ? new Date(minTs).toISOString().slice(0, 10) + ' → ' + new Date(maxTs).toISOString().slice(0, 10) : 'n/a';

let r = '';
r += '# Access-log usage report\n\n';
r += '_Aggregate counts only — no IPs stored. Bots excluded from totals. ' + (OUT ? '' : 'Generated to stdout.') + '_\n\n';
r += '- Files parsed: ' + files.length + '\n';
r += '- Date range: ' + range + (DAYS ? ' (last ' + DAYS + 'd)' : ' (all available)') + '\n';
r += '- Human requests (pages+api): **' + total.toLocaleString() + '** · bots dropped: ' + bots.toLocaleString() + ' · assets: ' + assets.toLocaleString() + ' · unparsed: ' + unparsed.toLocaleString() + '\n';
r += '- Page/api split is heuristic by path (no $host in combined log) — split vhosts for exact attribution. See FEEDBACK_PIPELINE.md quick-win #1.\n\n';

// Winner/loser scoreboard for the named candidates (Obj 3/4)
r += '## Candidate page scoreboard (Obj 3/4)\n\n';
r += '| Page | Path | Hits | Signal |\n|------|------|-----:|--------|\n';
const pageVals = CANDIDATES.map((c) => ({ c, hits: (pageHits.get('/' + c + '.html') || 0) }));
const maxHit = Math.max(1, ...pageVals.map((p) => p.hits));
for (const { c, hits } of pageVals.sort((a, b) => b.hits - a.hits)) {
  const sig = hits === 0 ? 'no traffic — LOSER? diagnose' : hits >= maxHit * 0.6 ? 'WINNER candidate' : hits <= maxHit * 0.15 ? 'low — watch' : 'mid';
  r += '| ' + c + ' | /' + c + '.html | ' + hits + ' | ' + sig + ' |\n';
}
r += '\n_Signal is relative within this run. Confirm against `praise`/`confusion` reaction tags before any verdict (Obj 4 gate)._\n\n';

// All observatory pages, top 20
r += '## Top observatory pages\n\n| Path | Hits |\n|------|-----:|\n';
for (const [p, h] of top(pageHits, 20)) r += '| ' + p + ' | ' + h + ' |\n';

// API routes with status + caller diversity (Obj 5)
r += '\n## Top API routes (Obj 5)\n\n| Route | Calls | Err % | Distinct /24 |\n|-------|-----:|------:|-------------:|\n';
for (const [p, h] of top(apiHits, 25)) {
  const s = apiStatus.get(p) || { ok: 0, err: 0 }; const errPct = h ? Math.round((s.err / h) * 100) : 0;
  const callers = (apiCallers.get(p) || new Set()).size;
  r += '| ' + p + ' | ' + h + ' | ' + errPct + '% | ' + callers + ' |\n';
}
r += '\n_Distinct /24 = coarse caller diversity. A route called by many subnets repeatedly = real adoption; one subnet = probably us._\n';

if (OUT) { writeFileSync(OUT, r); console.error('wrote ' + OUT + ' (' + total + ' human requests)'); }
else process.stdout.write(r);

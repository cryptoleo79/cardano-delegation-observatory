#!/usr/bin/env node
// Active heartbeat alerting — detect a dead pipeline before users do.
//
// Zero dependencies (Node 22 global fetch). Run by cron every ~10 min. Checks the
// three public freshness signals against fixed thresholds, and on a STATE CHANGE
// (ok -> warn/critical, or recovery) sends one alert to the configured
// destination. It only alerts on transitions, so a sustained outage pings once,
// not every run. Every check is logged regardless.
//
// Destinations (set any one in monitor/alert.env or the environment):
//   DISCORD_WEBHOOK_URL   = https://discord.com/api/webhooks/...
//   TELEGRAM_BOT_TOKEN    = 123:ABC   (with TELEGRAM_CHAT_ID = 123456)
//   ALERT_WEBHOOK_URL     = any endpoint accepting POST {text,status,checks}
// With none set, alerts are written to the log + monitor/last-alert.txt only.
//
// Usage:
//   node monitor/heartbeat-check.mjs           # evaluate + alert on changes
//   node monitor/heartbeat-check.mjs --test    # send a test alert then a clear
//   node monitor/heartbeat-check.mjs --simulate=critical   # force-evaluate stale
// Exit code: 0 ok · 1 warning · 2 critical.

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(DIR, '.heartbeat-state.json');
const LOG_FILE = join(DIR, 'heartbeat-monitor.log');
const LAST_ALERT = join(DIR, 'last-alert.txt');
const ENV_FILE = join(DIR, 'alert.env');

const API_HEALTH = 'https://api.asy.life/health';
const META_URL = 'https://observatory.asy.life/data/snapshots/meta.json';
const DASH = 'https://observatory.asy.life/heartbeat.html';

// Thresholds (seconds).
const GOV_FAIL = 36 * 3600, GOV_CRIT = 48 * 3600;       // governance ETL (data_through)
const POLL_FAIL = 30 * 60, POLL_CRIT = 2 * 3600;        // market poller (token_market_as_of)
const HTTP_TIMEOUT_MS = 15000;

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const flagVal = (name) => { const f = flag(name); return f && f.includes('=') ? f.split('=')[1] : null; };

// --- config (alert.env: KEY=VALUE lines; env vars override) ---
function loadEnv() {
  const cfg = {};
  if (existsSync(ENV_FILE)) {
    for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith('#')) cfg[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  for (const k of ['DISCORD_WEBHOOK_URL', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'ALERT_WEBHOOK_URL']) {
    if (process.env[k]) cfg[k] = process.env[k];
  }
  return cfg;
}
const CFG = loadEnv();

const nowIso = () => new Date().toISOString();
function log(msg) { const line = `${nowIso()} ${msg}`; console.log(line); try { appendFileSync(LOG_FILE, line + '\n'); } catch {} }

async function getJson(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ac.signal, cache: 'no-cache' });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    return { ok: true, status: res.status, json: await res.json() };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally { clearTimeout(timer); }
}

const RANK = { ok: 0, warning: 1, critical: 2 };
function ageStr(sec) {
  if (sec == null) return 'n/a';
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

// --- the three checks ---
async function evaluate(simulate) {
  const now = Date.now();
  const checks = {};

  // 1) API liveness
  const health = await getJson(API_HEALTH);
  checks.api = health.ok
    ? { status: 'ok', detail: `responding (${health.json.routes} routes, up ${ageStr(health.json.uptime_s)})` }
    : { status: 'critical', detail: `unreachable: ${health.error}` };

  // 2) Governance ETL freshness (meta.json data_through)
  const meta = await getJson(META_URL);
  if (!meta.ok) {
    checks.governance = { status: 'critical', detail: `meta.json unreachable: ${meta.error}` };
  } else {
    const dt = meta.json.data_through;
    const ageS = dt ? (now - Date.parse(dt + 'T00:00:00Z')) / 1000 : null;
    const lr = meta.json.last_run || {};
    let status = ageS == null ? 'critical' : ageS >= GOV_CRIT ? 'critical' : ageS >= GOV_FAIL ? 'warning' : 'ok';
    if (lr.success !== 1 && lr.success !== true && status === 'ok') status = 'warning';
    checks.governance = { status, detail: `data_through ${dt} (age ${ageStr(ageS)}), epoch ${meta.json.tip_epoch}, last run ${lr.success === 1 ? 'ok' : 'FAILED'}` };
  }

  // 3) Market poller freshness (/health freshness.token_market_as_of)
  if (!health.ok || !health.json.freshness) {
    checks.poller = { status: health.ok ? 'warning' : 'critical', detail: health.ok ? 'no freshness block in /health' : `/health unreachable: ${health.error}` };
  } else {
    const f = health.json.freshness;
    const t = f.token_market_as_of ? Date.parse(f.token_market_as_of) : null;
    const ageS = t ? (now - t) / 1000 : null;
    const status = ageS == null ? 'critical' : ageS >= POLL_CRIT ? 'critical' : ageS >= POLL_FAIL ? 'warning' : 'ok';
    checks.poller = { status, detail: `token_market_as_of ${f.token_market_as_of} (age ${ageStr(ageS)}), ${f.token_market_rows} rows` };
  }

  if (simulate) { // force a worst-case for testing the alert path
    checks.governance = { status: simulate, detail: `SIMULATED ${simulate}: data_through stale` };
  }
  return checks;
}

// --- alert delivery ---
async function send(text) {
  let delivered = [];
  try {
    if (CFG.DISCORD_WEBHOOK_URL) {
      const r = await fetch(CFG.DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: text.slice(0, 1900) }) });
      delivered.push(`discord:${r.status}`);
    }
    if (CFG.TELEGRAM_BOT_TOKEN && CFG.TELEGRAM_CHAT_ID) {
      const u = `https://api.telegram.org/bot${CFG.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: CFG.TELEGRAM_CHAT_ID, text }) });
      delivered.push(`telegram:${r.status}`);
    }
    if (CFG.ALERT_WEBHOOK_URL) {
      const r = await fetch(CFG.ALERT_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
      delivered.push(`webhook:${r.status}`);
    }
  } catch (e) { delivered.push(`error:${e.message}`); }
  try { writeFileSync(LAST_ALERT, `${nowIso()}\n${text}\n`); } catch {}
  if (!delivered.length) { log('ALERT (no destination configured — logged only): ' + text.replace(/\n/g, ' | ')); return ['log-only']; }
  log('ALERT sent → ' + delivered.join(', '));
  return delivered;
}

function loadState() { try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return {}; } }
function saveState(s) { try { writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); } catch {} }

const ICON = { ok: '✅', warning: '⚠️', critical: '🚨' };
const LABEL = { api: 'Data Layer API', governance: 'Governance ETL', poller: 'Market poller' };

async function main() {
  // --test: prove the delivery path end-to-end, independent of real status.
  if (flag('test')) {
    await send(`🔔 asy.life heartbeat monitor — TEST ALERT. If you see this, alerting works.\n${DASH}`);
    await send(`✅ asy.life heartbeat monitor — TEST CLEARED. Alerts recover too.\n${DASH}`);
    log('test alert + clear sent');
    return 0;
  }

  const checks = await evaluate(flagVal('simulate'));
  const prev = loadState();
  const next = {};
  const transitions = [];

  for (const [key, c] of Object.entries(checks)) {
    const before = prev[key]?.status || 'ok';
    next[key] = { status: c.status, detail: c.detail, since: (before === c.status && prev[key]?.since) ? prev[key].since : nowIso() };
    log(`${ICON[c.status]} ${LABEL[key]}: ${c.status.toUpperCase()} — ${c.detail}`);
    if (c.status !== before) transitions.push({ key, before, after: c.status, detail: c.detail });
  }
  saveState(next);

  // Alert on any worsening or recovery transition.
  const worsened = transitions.filter((t) => RANK[t.after] > RANK[t.before]);
  const recovered = transitions.filter((t) => RANK[t.after] < RANK[t.before] && t.after === 'ok');

  if (worsened.length) {
    const sev = worsened.some((t) => t.after === 'critical') ? 'CRITICAL' : 'WARNING';
    const body = worsened.map((t) => `${ICON[t.after]} ${LABEL[t.key]}: ${t.before.toUpperCase()} → ${t.after.toUpperCase()}\n   ${t.detail}`).join('\n');
    await send(`🚨 asy.life heartbeat ${sev}\n${body}\n${DASH}`);
  }
  if (recovered.length) {
    const body = recovered.map((t) => `${ICON.ok} ${LABEL[t.key]}: recovered (${t.detail})`).join('\n');
    await send(`✅ asy.life heartbeat RECOVERED\n${body}\n${DASH}`);
  }
  if (!worsened.length && !recovered.length) log('no state change — no alert');

  const overall = Math.max(...Object.values(checks).map((c) => RANK[c.status]));
  return overall; // 0/1/2 exit code
}

main().then((code) => process.exit(code)).catch((e) => { log('monitor crashed: ' + e.message); process.exit(2); });

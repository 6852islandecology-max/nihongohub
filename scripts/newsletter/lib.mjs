// scripts/newsletter/lib.mjs — shared helpers for the first-party newsletter
// (public.subscribers → Resend audience → weekly broadcast). LOCAL ONLY (scripts/ is
// excluded from deploy). Needs .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const STATE_FILE = ROOT + 'scripts/newsletter/state.json';
export const OUT_DIR = 'C:/Users/Yurik/成果物/Marketing/NihongoHub/newsletter/';

// .env loader (same rule as dev-server.mjs: file never overrides a real env var)
for (const line of readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

export const FROM = process.env.NEWSLETTER_FROM || 'NihongoHub <letters@mail.nihongo-hub.com>';
export const REPLY_TO = process.env.NEWSLETTER_REPLY_TO || 'support@nihongo-hub.com';
export const AUDIENCE_NAME = 'NihongoHub — 47 Notes from Japan';

export function supabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export function requireResendKey() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY missing in .env — the key already exists in Vercel (used by api/stripe-webhook.js); paste the same value into .secretary/projects/nihongohub/.env as RESEND_API_KEY=re_...');
  }
}

export async function resend(path, { method = 'GET', body } = {}) {
  requireResendKey();
  const r = await fetch('https://api.resend.com' + path, {
    method,
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`Resend ${method} ${path} → ${r.status}: ${text.slice(0, 300)}`);
  return json;
}

export function loadState() { return existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {}; }
export function saveState(s) { writeFileSync(STATE_FILE, JSON.stringify(s, null, 2) + '\n'); }

// Find-or-create the audience once; remember its id in state.json (not secret).
export async function audienceId() {
  const st = loadState();
  if (st.audienceId) return st.audienceId;
  const list = await resend('/audiences');
  let a = (list.data || []).find(x => x.name === AUDIENCE_NAME);
  if (!a) a = await resend('/audiences', { method: 'POST', body: { name: AUDIENCE_NAME } });
  st.audienceId = a.id; saveState(st);
  return a.id;
}

export function today() { return new Date().toISOString().slice(0, 10); }
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

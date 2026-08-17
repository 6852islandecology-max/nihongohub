#!/usr/bin/env node
// Two-way sync between public.subscribers (source of truth for sign-ups) and the Resend
// audience (source of truth for unsubscribes, because Resend hosts the unsubscribe link).
//   node scripts/newsletter/sync-audience.mjs           # sync + print counts
//   node scripts/newsletter/sync-audience.mjs --dry     # counts only, no writes
import { supabase, resend, audienceId, today } from './lib.mjs';

const dry = process.argv.includes('--dry');
const sb = supabase();
await main();
async function main() {

const { data: subs, error } = await sb.from('subscribers').select('id,email,source,lang,created_at,unsubscribed_at').order('created_at');
if (error) throw error;
const active = subs.filter(s => !s.unsubscribed_at);
console.log(`[${today()}] subscribers: ${subs.length} total, ${active.length} active`);
if (dry && !process.env.RESEND_API_KEY) return;

const aid = await audienceId();
// Resend contact list (paginate defensively; the API returns {data:[...]}).
const existing = new Map();
const first = await resend(`/audiences/${aid}/contacts`);
for (const c of first.data || []) existing.set(c.email.toLowerCase(), c);

// 1) push new sign-ups → Resend
let added = 0;
for (const s of active) {
  if (existing.has(s.email.toLowerCase())) continue;
  if (dry) { added++; continue; }
  await resend(`/audiences/${aid}/contacts`, { method: 'POST', body: { email: s.email, unsubscribed: false } });
  added++;
}
// 2) pull unsubscribes → Supabase
let unsubbed = 0;
for (const [email, c] of existing) {
  if (!c.unsubscribed) continue;
  const row = subs.find(s => s.email.toLowerCase() === email && !s.unsubscribed_at);
  if (!row) continue;
  if (!dry) await sb.from('subscribers').update({ unsubscribed_at: new Date().toISOString() }).eq('id', row.id);
  unsubbed++;
}
console.log(`resend audience ${aid}: ${existing.size} contacts before, +${added} added, ${unsubbed} marked unsubscribed${dry ? ' (dry run)' : ''}`);
}

#!/usr/bin/env node
// Send a drafted issue.
//   node scripts/newsletter/send-issue.mjs <file.html> --subject "…" --test you@example.com   # one test email
//   node scripts/newsletter/send-issue.mjs <file.html> --subject "…"                          # broadcast to the audience
// Broadcast path: sync-audience first (new sign-ups in, unsubscribes out), then Resend Broadcast
// so {{{RESEND_UNSUBSCRIBE_URL}}} is rendered and unsubscribes are honoured by Resend itself.
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resend, audienceId, FROM, REPLY_TO, OUT_DIR, ROOT, today, loadState, saveState } from './lib.mjs';

const args = process.argv.slice(2);
const file = args.find(a => a.endsWith('.html'));
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const subject = arg('--subject'), test = arg('--test');
if (!file || !subject) { console.error('usage: send-issue.mjs <file.html> --subject "…" [--test you@example.com]'); process.exit(1); }
const html = readFileSync(file, 'utf8');
const txt = existsSync(file.replace(/\.html$/, '.txt')) ? readFileSync(file.replace(/\.html$/, '.txt'), 'utf8') : undefined;

if (test) {
  // Single transactional send; the unsubscribe placeholder is not rendered here, so swap it for a note.
  const r = await resend('/emails', { method: 'POST', body: {
    from: FROM, to: [test], reply_to: REPLY_TO, subject: `[TEST] ${subject}`,
    html: html.replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, '#unsubscribe-rendered-in-broadcast'),
    text: txt && txt.replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, '(rendered in broadcast)'),
  } });
  console.log('test sent:', r.id, '→', test);
  process.exit(0);
}

// real send
execFileSync(process.execPath, [ROOT + 'scripts/newsletter/sync-audience.mjs'], { stdio: 'inherit' });
const aid = await audienceId();
const b = await resend('/broadcasts', { method: 'POST', body: {
  audience_id: aid, from: FROM, reply_to: REPLY_TO, subject, html, text: txt,
  name: `${today()} ${subject}`.slice(0, 120),
} });
await resend(`/broadcasts/${b.id}/send`, { method: 'POST', body: {} });
const st = loadState(); st.issued = st.issued || [];
const slugFromFile = (file.match(/\d{4}-\d{2}-\d{2}-([a-z-]+)\.html$/) || [])[1];
if (slugFromFile && !st.issued.includes(slugFromFile)) st.issued.push(slugFromFile);
st.lastSent = { broadcastId: b.id, subject, date: today(), file }; saveState(st);
mkdirSync(OUT_DIR, { recursive: true });
appendFileSync(OUT_DIR + 'log.md', `- ${today()} broadcast ${b.id} — ${subject} — ${file}\n`);
console.log('broadcast sent:', b.id);

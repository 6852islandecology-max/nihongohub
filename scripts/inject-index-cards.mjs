#!/usr/bin/env node
// Add the 5 "full" prefectures (tokyo/kyoto/osaka/hokkaido/okinawa) to each locale
// blog index (es/id/th/zh), which the normal build skips. Translates their short
// index blurbs in one call, then inserts cards into the correct region section.
// Idempotent: skips a card if already present.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const BLOG = path.join(os.homedir(), '.secretary/projects/nihongohub/blog');
const { GUIDES, REGION_LABELS } = await import(pathToFileURL(path.join(BLOG, 'guides-data.js')).href);
const FULL = ['tokyo', 'kyoto', 'osaka', 'hokkaido', 'okinawa'];
const CODES = ['es', 'id', 'th', 'zh'];
const LANG_NAME = { es: 'Spanish', id: 'Indonesian', th: 'Thai', zh: 'Traditional Chinese' };

function loadEnvKey() {
  const txt = fs.readFileSync(path.join(BLOG, '..', '.env'), 'utf8');
  for (const line of txt.split(/\r?\n/)) { const m = line.match(/^ANTHROPIC_API_KEY=(.+)$/); if (m) return m[1].trim().replace(/^["']|["']$/g, ''); }
  throw new Error('no key');
}
const API_KEY = loadEnvKey();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function translateBlurbs(items) {
  // items: [{slug, blurb}]; returns {slug: {es, id, th, zh}}
  const sys = `Translate each English prefecture tagline into Spanish, Indonesian, Thai, and Traditional Chinese. These are short punchy travel taglines (keep them short, do not translate proper nouns/place names). Return ONLY a JSON object mapping each id to {"es":"...","id":"...","th":"...","zh":"..."}. No commentary.`;
  const user = JSON.stringify(items.map(i => ({ id: i.slug, en: i.blurb })));
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2000, temperature: 0, system: sys, messages: [{ role: 'user', content: user }] }),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  let t = (j.content || []).map(c => c.text || '').join('').trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(t);
}

function card(g, code, tr) {
  const desc = (tr[g.slug] && tr[g.slug][code]) || g.blurb || '';
  return `<a class="bcard" href="${g.slug}.html"><span class="bk">${g.kanji}</span><div class="br">${g.romaji.toUpperCase()}</div><p>${esc(desc)}</p></a>`;
}

function insertCard(html, regionLabel, cardHtml) {
  // Insert card at the start of the region's <div class="cards"> ... </div>
  const re = new RegExp(`(<h2>${regionLabel.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}</h2><div class="cards">)`);
  if (re.test(html)) return html.replace(re, `$1${cardHtml}`);
  return null; // region section absent
}

async function main() {
  const blurbs = FULL.map(s => { const g = GUIDES.find(x => x.slug === s); return { slug: s, blurb: g.blurb || '' }; });
  const tr = await translateBlurbs(blurbs);

  for (const code of CODES) {
    const f = path.join(BLOG, code, 'index.html');
    if (!fs.existsSync(f)) { console.log(`SKIP ${code}: no index`); continue; }
    let html = fs.readFileSync(f, 'utf8');
    let added = 0;
    for (const slug of FULL) {
      const g = GUIDES.find(x => x.slug === slug);
      if (new RegExp(`href="${slug}\\.html"`).test(html)) continue; // already listed
      const label = REGION_LABELS[g.region];
      const c = card(g, code, tr);
      const out = insertCard(html, label, c);
      if (out) { html = out; added++; }
      else {
        // region section missing (e.g. HOKKAIDŌ) — create it before the first <h2>
        const section = `<h2>${label}</h2><div class="cards">${c}</div>`;
        html = html.replace(/(<h2>)/, `${section}$1`);
        added++;
      }
    }
    fs.writeFileSync(f, html);
    console.log(`${code}/index.html: +${added} cards`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });

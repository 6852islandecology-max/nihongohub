#!/usr/bin/env node
/**
 * Translate the v2 photo-first pages (prefecture v2 + spot pages) into zh / es / th / id with Haiku 4.5.
 * Output: blog/translations-v2/<lang>.json  = { ui: {...}, pages: { <slug>: {...} } }
 * Re-runnable: skips slugs already present unless --force. Machine-checks the script of the output
 * (zh must contain CJK, th must contain Thai, es/id must be Latin and contain no kana/CJK) — a page that
 * fails the check is not saved (translation accidents were real: zh once came back in Japanese).
 *
 * Run: node scripts/translate-v2.mjs                       # all v2 pages, all langs
 *      node scripts/translate-v2.mjs --lang=zh tokushima   # one lang, one page
 * Cost: ~9 pages × 4 langs × ~$0.01 ≈ $0.4 (Haiku 4.5)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { GUIDES } from '../blog/guides-data.js';
import { EXTRA } from '../blog/guides-extra.js';
import { SPOTS } from './build-spots-v2.mjs';
import { V2_FACTS } from './build-guide-v2.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
for (const raw of readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/)) { const l = raw.trim(); if (!l || l.startsWith('#')) continue; const i = l.indexOf('='); if (i < 1) continue; const k = l.slice(0, i).trim(); let v = l.slice(i + 1).trim().replace(/^["']|["']$/g, ''); if (!process.env[k]) process.env[k] = v; }
const API_KEY = process.env.ANTHROPIC_API_KEY; if (!API_KEY) { console.error('ANTHROPIC_API_KEY missing'); process.exit(1); }
const sb = { window: {} }; vm.runInNewContext(readFileSync(ROOT + 'explore-data.js', 'utf8'), sb); const NH = sb.window.NH_EXTRA;
const ENRICHED = JSON.parse(readFileSync(ROOT + 'blog/guides-enriched.json', 'utf8'));
const OUT = ROOT + 'blog/translations-v2/'; mkdirSync(OUT, { recursive: true });

const LANGS = {
  // zh: mostly CJK; a few kana are legitimate (quoted Japanese words like 阿波踊り), a Japanese-language answer is not
  zh: { name: 'Traditional Chinese (繁體中文, Taiwan usage)', check: (t) => { const cjk = (t.match(/[一-鿿]/g) || []).length, kana = (t.match(/[぀-ヿ]/g) || []).length; return cjk > 20 && kana < Math.max(15, cjk * 0.05); } },
  es: { name: 'Spanish (neutral, Latin America friendly)', check: (t) => /[a-záéíóúñ]/i.test(t) && (t.match(/[぀-ヿ一-鿿฀-๿]/g) || []).length < 15 },
  th: { name: 'Thai', check: (t) => /[฀-๿]/.test(t) },
  id: { name: 'Indonesian (Bahasa Indonesia)', check: (t) => /[a-z]/i.test(t) && (t.match(/[぀-ヿ一-鿿฀-๿]/g) || []).length < 15 },
};

import { UI_EN } from './v2-ui-strings.mjs';

function prefPayload(slug) {
  const g = GUIDES.find(x => x.slug === slug), nh = NH[slug] || {}, ex = { ...(EXTRA[slug] || {}), ...(ENRICHED[slug] || {}) }, v = V2_FACTS[slug] || {};
  return {
    tagline: v.tagline || g.lede, blurb: nh.blurb || g.intro, history: ex.history || '', getting: g.getting || '',
    see: (nh.culture || []).slice(0, 3).map(c => c.note), eat: (nh.food || []).slice(0, 3).map(f => f.note),
    phrase_en: g.phrase?.en || '', word_en: g.word?.en || '', deeper_en: ex.deeper_phrase?.en || '',
    access: (v.access || []).map(a => ({ from: a.from, to: a.to, time: a.time, note: a.note })),
    numbers: (v.numbers || []).map(n => ({ label: n.label, sub: n.sub })),
    faq: (v.faq || []).map(([q, a]) => ({ q, a })),
    lede: g.lede,
  };
}
// drop empty strings/arrays so the model is not asked to "translate" nothing (shape checks then pass)
const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => Array.isArray(v) ? v.length : (v !== '' && v != null)));
function spotPayload(slug) {
  const s = SPOTS[slug];
  return { name: s.name, badge: s.badge, tagline: s.tagline, summary: s.summary, facts: s.facts.map(f => f[0]), access: s.access, guides: s.guides.map(g => g[1]) };
}

function prompt(kind, payload, lang) {
  const li = LANGS[lang];
  return `Translate this Japan travel content into ${li.name}. Output must be entirely in ${li.name} (except proper nouns kept in romaji: place names, station names, dish names like "Tokushima ramen", festival names like "Awa Odori"). Do not translate JSON keys. Keep numbers, units and dates exactly. Keep "PR" as is. Tone: warm, factual, concise.
INPUT (${kind}, JSON):
${JSON.stringify(payload, null, 1)}
OUTPUT: only a JSON object with exactly the same keys and array lengths, values translated. No markdown fences.`;
}
async function call(text) {
  const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4000, messages: [{ role: 'user', content: text }] }) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const d = await res.json(); const t = (d.content || []).map(b => b.type === 'text' ? b.text : '').join('\n').replace(/```json\s*|```/g, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0) throw new Error('no JSON'); return JSON.parse(t.slice(a, b + 1));
}
const flat = (o) => JSON.stringify(o).replace(/"[a-z_]+":/g, ' ');
async function translate(kind, payload, lang, label) {
  for (let i = 0; i < 3; i++) {
    try {
      const out = await call(prompt(kind, payload, lang));
      const same = Object.keys(payload).every(k => k in out) && Object.keys(payload).filter(k => Array.isArray(payload[k])).every(k => Array.isArray(out[k]) && out[k].length === payload[k].length);
      if (!same) throw new Error('shape mismatch');
      if (!LANGS[lang].check(flat(out))) throw new Error('script check failed (' + lang + ')');
      return out;
    } catch (e) { console.log(`  retry ${i + 1} ${lang}/${label}: ${e.message}`); await new Promise(r => setTimeout(r, 800 * (i + 1))); }
  }
  throw new Error('gave up ' + lang + '/' + label);
}

async function main() {
  const args = process.argv.slice(2); const only = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1] || null; const force = args.includes('--force');
  const want = args.filter(a => !a.startsWith('--'));
  const prefSlugs = want.length ? want.filter(s => GUIDES.some(g => g.slug === s)) : Object.keys(V2_FACTS);
  const spotSlugs = want.length ? want.filter(s => SPOTS[s]) : Object.keys(SPOTS);
  for (const lang of Object.keys(LANGS)) {
    if (only && lang !== only) continue;
    const f = OUT + lang + '.json'; const T = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { ui: null, pages: {} };
    if (!T.ui || force) { T.ui = await translate('ui strings', UI_EN, lang, 'ui'); console.log(`OK ${lang}/ui`); writeFileSync(f, JSON.stringify(T, null, 1)); }
    for (const s of prefSlugs) { if (T.pages[s] && !force) continue; try { T.pages[s] = await translate('prefecture page', compact(prefPayload(s)), lang, s); } catch (e) { console.log('FAIL', lang, s, e.message); continue; } console.log(`OK ${lang}/${s}`); writeFileSync(f, JSON.stringify(T, null, 1)); }
    for (const s of spotSlugs) { if (T.pages[s] && !force) continue; try { T.pages[s] = await translate('spot page', compact(spotPayload(s)), lang, s); } catch (e) { console.log('FAIL', lang, s, e.message); continue; } console.log(`OK ${lang}/${s}`); writeFileSync(f, JSON.stringify(T, null, 1)); }
  }
}
main().catch(e => { console.error(e); process.exit(1); });

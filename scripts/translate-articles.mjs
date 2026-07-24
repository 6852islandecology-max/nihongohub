#!/usr/bin/env node
// Translate the proven "collectible-tourism / franchise-place" winner articles
// (English standalone blog pages) into zh/es/th/id, producing full-fidelity locale
// pages at blog/<lang>/<slug>.html. Text is translated by Sonnet 4.6 (URLs preserved
// exactly by the model); the directory-depth path fix (prepend ../ to every relative
// URL) + <html lang> are applied deterministically in Node so markup stays correct.
//
// Usage:
//   node --env-file=.env scripts/translate-articles.mjs                 # all winners x 4 langs
//   node --env-file=.env scripts/translate-articles.mjs character-manholes-japan       # one slug
//   node --env-file=.env scripts/translate-articles.mjs character-manholes-japan id    # one slug/lang
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BLOG = path.join(os.homedir(), '.secretary/projects/nihongohub/blog');
const LANGS = {
  zh: { htmlLang: 'zh-Hant', name: 'Traditional Chinese' },
  es: { htmlLang: 'es', name: 'Spanish' },
  th: { htmlLang: 'th', name: 'Thai' },
  id: { htmlLang: 'id', name: 'Indonesian' },
};
// Proven winners (memory: collectible tourism = manhole/goshuin/stamp + franchise x place)
const WINNERS = [
  'character-manholes-japan', 'gundam-manholes-japan', 'manhole-cards-japan',
  'goshuin-temple-shrine-stamps', 'goshuincho-guide-japan', 'japan-100-castles-goshuin',
  'eki-stamps-japan', 'michi-no-eki-stamp-rally-japan',
  'evangelion-hakone-guide', 'one-piece-kumamoto-statues', 'anime-pilgrimage-japan',
];

function loadEnvKey() {
  const txt = readFileSync(path.join(BLOG, '..', '.env'), 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^ANTHROPIC_API_KEY=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  throw new Error('ANTHROPIC_API_KEY not found in .env');
}
const API_KEY = loadEnvKey();

const SYS = (langName) => `You are a professional website localizer. Translate the visible human-readable text of this HTML travel-guide article from English into ${langName}.

STRICT RULES:
- Output the COMPLETE HTML document only. No code fences, no commentary.
- Preserve EVERY HTML tag, attribute name, attribute value, class, id, inline style, URL, href, src, data-* attribute, and HTML comment EXACTLY. Do not add, remove, reorder, rename, or restyle any tag or attribute. Never change any URL, href, src, path, or filename.
- Translate ONLY: English prose between tags; the text inside <title>; the content="" of <meta name="description">, og:title, og:description; title="" tooltip text; the descriptive part of alt="" (keep place names); and the human-readable VALUES inside JSON-LD <script> blocks — only the values of "headline","description","caption","name","text". Never translate JSON-LD keys or any URL.
- DO NOT translate or change: Japanese text (kana/kanji), romaji written in Latin letters, proper nouns and place names, brand/product/character names, the "PR" disclosure label, currency, and numbers.
- For a romaji phrase followed by ' — "English meaning"', keep the romaji/Japanese and translate only the English meaning.
- The result must be valid HTML that renders with identical structure; only the prose language changes.`;

async function callSonnet(enHtml, langName) {
  const body = { model: 'claude-sonnet-4-6', max_tokens: 28000, temperature: 0, system: SYS(langName), messages: [{ role: 'user', content: enHtml }] };
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  let out = (j.content || []).map(c => c.text || '').join('');
  return out.trim().replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
}

// Deterministic fix for the extra directory level (blog/<lang>/ vs blog/).
// Prepend ../ to every RELATIVE href/src (leave absolute, protocol, #, mailto).
function fixPaths(html, langKey) {
  html = html.replace(/<html([^>]*?)\slang="[^"]*"/i, `<html$1 lang="${LANGS[langKey].htmlLang}"`);
  return html.replace(/\b(href|src)=("|')([^"']*)\2/gi, (m, attr, q, val) => {
    if (/^(https?:|\/\/|\/|#|mailto:|tel:|data:)/i.test(val) || val === '') return m;
    return `${attr}=${q}../${val}${q}`;
  });
}

async function main() {
  const [argSlug, argLang] = process.argv.slice(2);
  const slugs = argSlug ? [argSlug] : WINNERS;
  const langs = argLang ? [argLang] : Object.keys(LANGS);
  let done = 0, skipped = 0, failed = 0;
  for (const slug of slugs) {
    const src = path.join(BLOG, `${slug}.html`);
    if (!existsSync(src)) { console.error(`MISS ${slug} (no English source)`); failed++; continue; }
    const en = readFileSync(src, 'utf8');
    for (const lang of langs) {
      const outDir = path.join(BLOG, lang);
      const out = path.join(outDir, `${slug}.html`);
      if (existsSync(out)) { console.log(`skip ${lang}/${slug} (exists)`); skipped++; continue; }
      try {
        const t = await callSonnet(en, LANGS[lang].name);
        if (!/<\/html>/i.test(t) || t.length < en.length * 0.4) throw new Error('suspicious output length');
        writeFileSync(out, fixPaths(t, lang));
        console.log(`OK   ${lang}/${slug}  (${t.length}b)`);
        done++;
      } catch (e) { console.error(`FAIL ${lang}/${slug}: ${String(e.message).slice(0, 120)}`); failed++; }
    }
  }
  console.log(`\n[done=${done} skipped=${skipped} failed=${failed}]`);
}
main();

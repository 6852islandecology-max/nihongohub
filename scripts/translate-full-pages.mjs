#!/usr/bin/env node
// Translate the 5 bespoke "full" prefecture pages (tokyo/kyoto/osaka/hokkaido/okinawa)
// into es/id/th/zh, producing full-fidelity locale pages. Text is translated by
// Sonnet 4.6; all structure (paths, <html lang>, hreflang, language switcher, JSON-LD
// url/inLanguage) is fixed deterministically in Node so markup is always correct.
// Also patches the 5 English pages to add hreflang + a language switcher.
//
// Usage:
//   node scripts/translate-full-pages.mjs                 # all 5 x 4 langs + EN patch
//   node scripts/translate-full-pages.mjs kyoto           # one slug, all langs
//   node scripts/translate-full-pages.mjs kyoto es        # one slug, one lang
//   node scripts/translate-full-pages.mjs --patch-en      # only (re)patch EN pages

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BLOG = path.join(os.homedir(), '.secretary/projects/nihongohub/blog');
const BASE = 'https://www.nihongo-hub.com/blog';
const SLUGS = ['tokyo', 'kyoto', 'osaka', 'hokkaido', 'okinawa'];
const LANGS = {
  zh: { htmlLang: 'zh-Hant', label: '繁中', name: 'Traditional Chinese', ogLocale: 'zh_TW', quiz: '免費測驗' },
  es: { htmlLang: 'es', label: 'ES', name: 'Spanish', ogLocale: 'es_ES', quiz: 'CUESTIONARIO GRATIS' },
  th: { htmlLang: 'th', label: 'TH', name: 'Thai', ogLocale: 'th_TH', quiz: 'แบบทดสอบฟรี' },
  id: { htmlLang: 'id', label: 'ID', name: 'Indonesian', ogLocale: 'id_ID', quiz: 'KUIS GRATIS' },
};
const LANG_ORDER = ['en', 'zh', 'es', 'th', 'id'];

function loadEnvKey() {
  const txt = fs.readFileSync(path.join(BLOG, '..', '.env'), 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^ANTHROPIC_API_KEY=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  throw new Error('ANTHROPIC_API_KEY not found in .env');
}
const API_KEY = loadEnvKey();

const SYS = (langName) => `You are a professional website localizer. Translate the visible human-readable text of this HTML travel-guide page from English into ${langName}.

STRICT RULES:
- Output the COMPLETE HTML document only. No code fences, no commentary, no explanation.
- Preserve EVERY HTML tag, attribute name, attribute value, class, id, inline style, URL, href, src, data-* attribute, and HTML comment (<!-- ... -->) EXACTLY. Do not add, remove, reorder, rename, or restyle any tag or attribute.
- Translate ONLY: English prose text between tags; the text inside <title>; the content="" of <meta name="description">, <meta property="og:title">, and <meta property="og:description">; the title="" tooltip text on the rounded "chip" spans; the descriptive part of the lead photo's alt="" (keep the place name); and the human-readable VALUES inside the JSON-LD <script> blocks — specifically the values of "headline", "description", "caption", "name", and "text" only. Never translate JSON-LD keys or any URL.
- DO NOT translate or change: Japanese text (kana/kanji), romaji transliterations written in Latin letters (e.g. "Shashin o totte mo ii desu ka?"), proper nouns and place names (Kyoto, Fushimi Inari Taisha, Gion, Kinkaku-ji, Shinkansen, ICOCA, etc.), brand and product names, the "PR" disclosure label, currency, numbers, and ALL URLs/paths/filenames.
- Keep navigation kanji+romaji labels unchanged (e.g. 滋賀 SHIGA, 大阪 OSAKA).
- For a line that is a romaji phrase followed by ' — "English meaning" ...', keep the romaji and any Japanese unchanged and translate only the English meaning/explanation.
- The result must be valid HTML that renders with identical structure; only the language of the prose changes.`;

async function callSonnet(enHtml, langName) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    temperature: 0,
    system: SYS(langName),
    messages: [{ role: 'user', content: enHtml }],
  };
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  let out = (j.content || []).map(c => c.text || '').join('');
  out = out.trim().replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
  return out;
}

function hreflangBlock(slug) {
  const langs = [
    ['en', `${BASE}/${slug}.html`],
    ['es', `${BASE}/es/${slug}.html`],
    ['id', `${BASE}/id/${slug}.html`],
    ['th', `${BASE}/th/${slug}.html`],
    ['zh-Hant', `${BASE}/zh/${slug}.html`],
    ['x-default', `${BASE}/${slug}.html`],
  ];
  return '<!--hreflang-->\n' +
    langs.map(([l, h]) => `<link rel="alternate" hreflang="${l}" href="${h}">`).join('\n') +
    '\n<!--/hreflang-->';
}

function switcher(slug, current) {
  // current: 'en' | 'zh' | 'es' | 'th' | 'id'
  const href = (code) => {
    if (code === current) return null;
    if (current === 'en') return code === 'en' ? `${slug}.html` : `${code}/${slug}.html`;
    return code === 'en' ? `../${slug}.html` : `../${code}/${slug}.html`;
  };
  const item = (code, label) => {
    const h = href(code);
    return h ? `<a href="${h}">${label}</a>` : `<a aria-current="page">${label}</a>`;
  };
  const parts = [item('en', 'EN'), item('zh', '繁中'), item('es', 'ES'), item('th', 'TH'), item('id', 'ID')];
  return `<span class="langsw">${parts.join(' · ')}</span>`;
}

// Deterministic structural localization applied AFTER translation.
function localizeStructure(html, slug, code) {
  const L = LANGS[code];
  // 1) <html lang>
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${L.htmlLang}">`);
  // 2) page URL -> locale (canonical, og:url, JSON-LD url & mainEntityOfPage)
  html = html.split(`${BASE}/${slug}.html`).join(`${BASE}/${code}/${slug}.html`);
  // 3) inLanguage
  html = html.replace(/"inLanguage":"[^"]*"/, `"inLanguage":"${L.htmlLang}"`);
  // 4) relative paths (page now sits one dir deeper at blog/<code>/)
  html = html.split('../index.html').join('../../index.html');
  html = html.split('../prefectures.html').join('../../prefectures.html');
  html = html.split('../lib/config.js').join('../../lib/config.js');
  html = html.split('href="blog.css"').join('href="../blog.css"');
  html = html.split('src="img/').join('src="../img/');
  html = html.split('src="blog-quiz.js"').join('src="../blog-quiz.js"');
  // 5) hreflang block (insert before </head> if absent)
  if (!/<!--hreflang-->/.test(html)) html = html.replace('</head>', `${hreflangBlock(slug)}\n</head>`);
  // 6) og:locale (insert after og:type if absent)
  if (!/property="og:locale"/.test(html))
    html = html.replace(/(<meta property="og:type"[^>]*>)/, `$1\n<meta property="og:locale" content="${L.ogLocale}">`);
  // 7) language switcher: replace any carried-over (EN) switcher, else insert before CTA
  if (/class="langsw"/.test(html))
    html = html.replace(/<span class="langsw">[\s\S]*?<\/span>/, switcher(slug, code));
  else
    html = html.replace(/(\n\s*<a class="cta")/, `\n  ${switcher(slug, code)}$1`);
  return html;
}

function patchEnglish(slug) {
  const f = path.join(BLOG, `${slug}.html`);
  let html = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (!/<!--hreflang-->/.test(html)) { html = html.replace('</head>', `${hreflangBlock(slug)}\n</head>`); changed = true; }
  if (!/class="langsw"/.test(html)) { html = html.replace(/(\n\s*<a class="cta")/, `\n  ${switcher(slug, 'en')}$1`); changed = true; }
  if (changed) fs.writeFileSync(f, html);
  return changed;
}

function validate(html, slug, code) {
  const errs = [];
  const opens = (html.match(/</g) || []).length, closes = (html.match(/>/g) || []).length;
  if (Math.abs(opens - closes) > 2) errs.push(`tag imbalance < ${opens} > ${closes}`);
  if (!/<!--lead-photo-->/.test(html)) errs.push('missing lead-photo');
  if (!/class="langsw"/.test(html)) errs.push('missing switcher');
  if (!/<!--hreflang-->/.test(html)) errs.push('missing hreflang');
  if (!html.includes(`/blog/${code}/${slug}.html`)) errs.push('locale url not set');
  const ld = html.match(/evidence-ld--><script[^>]*>([\s\S]*?)<\/script>/);
  if (!ld) errs.push('missing BlogPosting JSON-LD'); else { try { JSON.parse(ld[1]); } catch { errs.push('BlogPosting JSON-LD invalid'); } }
  const faq = html.match(/"@type":"FAQPage"[\s\S]*?<\/script>/);
  return errs;
}

async function doOne(slug, code) {
  const enHtml = fs.readFileSync(path.join(BLOG, `${slug}.html`), 'utf8');
  const translated = await callSonnet(enHtml, LANGS[code].name);
  const localized = localizeStructure(translated, slug, code);
  const errs = validate(localized, slug, code);
  const dir = path.join(BLOG, code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.html`), localized);
  const status = errs.length ? `⚠ ${errs.join('; ')}` : 'ok';
  console.log(`  ${code}/${slug}.html  (${Math.round(localized.length / 1024)}KB)  ${status}`);
  return errs.length === 0;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--patch-en')) {
    for (const s of SLUGS) console.log(`EN patch ${s}: ${patchEnglish(s) ? 'updated' : 'already'}`);
    return;
  }
  const slugArgs = args.filter(a => !a.startsWith('--') && SLUGS.includes(a));
  const langArgs = args.filter(a => LANGS[a]);
  const slugs = slugArgs.length ? slugArgs : SLUGS;
  const codes = langArgs.length ? langArgs : Object.keys(LANGS);

  let ok = 0, bad = 0;
  for (const slug of slugs) {
    console.log(`\n${slug}:`);
    const enChanged = patchEnglish(slug);
    console.log(`  EN patch: ${enChanged ? 'added hreflang+switcher' : 'already present'}`);
    for (const code of codes) {
      try { (await doOne(slug, code)) ? ok++ : bad++; }
      catch (e) { bad++; console.log(`  ${code}/${slug}.html  ERROR ${e.message}`); }
      await new Promise(r => setTimeout(r, 400));
    }
  }
  console.log(`\nDone. ${ok} ok, ${bad} with warnings/errors.`);
}

main().catch(e => { console.error(e); process.exit(1); });

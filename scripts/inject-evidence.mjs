#!/usr/bin/env node
/*
 * inject-evidence.mjs
 * GEO build-time injection for the blog corpus. Everything here is written straight into the
 * served HTML (no runtime JS — AI crawlers / Googlebot do not reliably execute JS, so anything
 * blog-quiz.js adds at runtime is invisible to the engines we optimise for).
 *
 *   1. <!--evidence--> ... <!--/evidence-->   (after <h1>, prefecture guides)
 *      A 40-60 word "In short" quick-answer (TL;DR) + two concrete, sourced picks.
 *      en data: data/prefectures.json (.summary). locale data: data/geo-tldr.<lang>.json
 *      (translations of those summaries). No fabrication.
 *
 *   2. <!--evidence-ld--> ... <!--/evidence-ld-->   (before </head>, every blog page)
 *      A BlogPosting + Organization(sameAs) JSON-LD. Stacks on the existing FAQPage and ties
 *      every page (prefecture guides AND killer/topic pages, en AND locale) to the NihongoHub
 *      entity — the disambiguation signal GEO rewards.
 *
 * Idempotent: blocks are wrapped in markers and replaced on re-run. A plain Article left by
 * inject-article-jsonld.mjs (no sameAs) is replaced by our richer BlogPosting.
 * Scope: en guides + en killer/topic pages (blog/*.html) + locale guides for any locale whose
 * data/geo-tldr.<lang>.json exists (currently id).
 *
 * Usage:
 *   node scripts/inject-evidence.mjs            # all en + available-locale blog pages
 *   node scripts/inject-evidence.mjs --only=aichi
 *   node scripts/inject-evidence.mjs --dry      # report only, write nothing
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');
const DRY = process.argv.includes('--dry');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').split('=')[1] || '';

// Official NihongoHub entity profiles — keep in sync with the Organization block in index.html.
const SAMEAS = [
  'https://www.nihongo-hub.com',
  'https://nihongohub-nu.vercel.app',
  'https://ikimonohakasefamily.substack.com',
  'https://www.youtube.com/@JepangMenarik',
  'https://www.tiktok.com/@ikimonofamilyhakase',
  'https://www.instagram.com/familyikimono',
  'https://www.threads.net/@familyikimono',
  'https://www.pinterest.com/ikimonofamily',
];

// Localised labels for the visible quick-answer block. en is the default; locales add their own.
const LABELS = {
  en: { kicker: 'IN SHORT', see: 'Top pick', eat: 'Must-eat', src: 'source' },
  id: { kicker: 'SINGKATNYA', see: 'Pilihan utama', eat: 'Wajib dicoba', src: 'sumber' },
  es: { kicker: 'EN RESUMEN', see: 'Visita', eat: 'Prueba', src: 'fuente' },
  th: { kicker: 'สรุป', see: 'ชม', eat: 'ลอง', src: 'แหล่งที่มา' },
  'zh-Hant': { kicker: '重點', see: '必看', eat: '必嚐', src: '來源' },
};
// Locale guide directories processed when their translated-summary overlay exists.
const LOCALES = [
  { dir: 'id', lang: 'id', tldr: 'geo-tldr.id.json' },
  { dir: 'es', lang: 'es', tldr: 'geo-tldr.es.json' },
  { dir: 'th', lang: 'th', tldr: 'geo-tldr.th.json' },
  { dir: 'zh', lang: 'zh-Hant', tldr: 'geo-tldr.zh.json' },
];

const prefs = JSON.parse(readFileSync(join(ROOT, 'data', 'prefectures.json'), 'utf8')).prefectures || [];

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function pick(html, re) { const m = html.match(re); return m ? m[1] : null; }

// Visible quick-answer + sourced picks. `summary` is passed in (en: prefectures.json; locale:
// the translation overlay). Inline styles match the glance capsule palette — no extra CSS file.
function evidenceBlock(p, summary, L) {
  summary = (summary || '').trim();
  if (!summary) return null;
  const topSee = (p.culture && p.culture[0]) || null;
  const topEat = (p.foods && p.foods[0]) || null;
  const src = (topSee && topSee.source) || (topEat && topEat.source) || '';
  const picks = [
    topSee ? `📍 ${L.see}: <b>${escHtml(topSee.name)}</b>` : '',
    topEat ? `🥢 ${L.eat}: <b>${escHtml(topEat.name)}</b>` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');
  const srcLink = src
    ? ` &nbsp;·&nbsp; <a href="${escHtml(src)}" target="_blank" rel="noopener" style="color:#9c6b1f">${L.src}</a>`
    : '';
  return `<!--evidence-->
<div style="background:#fbf6ec;border:2px solid #e6ddd0;border-left:4px solid #c8911f;border-radius:10px;padding:12px 15px;margin:14px 0;font-size:14px;line-height:1.65">
<div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#c8911f;letter-spacing:.5px;margin-bottom:5px">${L.kicker}</div>
<div style="color:#2c2620">${escHtml(summary)}</div>
${picks ? `<div style="margin-top:7px;color:#4a4036;font-size:13.5px">${picks}${srcLink}</div>` : ''}</div>
<!--/evidence-->`;
}

// BlogPosting + Organization(sameAs) JSON-LD. Title/description come from the page itself, so the
// schema never drifts from what readers see. `aboutPlace` set only for prefecture guides.
function entityLd(html, { url, name, aboutPlace, lang = 'en' }) {
  const rawTitle = pick(html, /<title[^>]*>([^<]+)<\/title>/i) || name;
  const headline = rawTitle.replace(/\s+[—-]\s+NihongoHub\s*$/, '').trim();
  const description = pick(html, /<meta\s+name="description"\s+content="([^"]+)"/i) || undefined;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description: description || undefined,
    url,
    mainEntityOfPage: url,
    inLanguage: lang,
    image: 'https://www.nihongo-hub.com/og-default.png',
    isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' },
    author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/', sameAs: SAMEAS },
    publisher: {
      '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/',
      logo: { '@type': 'ImageObject', url: 'https://www.nihongo-hub.com/apple-touch-icon.png' },
    },
  };
  if (aboutPlace) ld.about = { '@type': 'Place', name: aboutPlace };
  return `<!--evidence-ld--><script type="application/ld+json">${JSON.stringify(ld)}</script><!--/evidence-ld-->`;
}

// Drop our previous block + any plain Article (no sameAs) inject-article-jsonld.mjs left, then add
// our BlogPosting only if the page now carries no article-type schema — so it never has two.
function injectEntity(html, ldStr) {
  html = html.replace(/\n?<!--evidence-ld-->[\s\S]*?<!--\/evidence-ld-->/g, '');
  html = html.replace(/[ \t]*<script type="application\/ld\+json">[^\n]*?<\/script>\n?/g, (m) =>
    (/"@type":"Article"/.test(m) && /"NihongoHub"/.test(m)) ? '' : m);
  const hasArticle = /"@type"\s*:\s*"(Article|BlogPosting)"/.test(html);
  if (!hasArticle) html = html.replace(/<\/head>/i, `${ldStr}\n</head>`);
  return html;
}

// Inject (visible quick-answer when `summary` exists) + (entity schema always) into one guide.
function processGuide(file, p, summary, L, url, lang) {
  let html = readFileSync(file, 'utf8');
  if (!/<h1[^>]*>[\s\S]*?<\/h1>/.test(html)) return { changed: false, noSummary: false };
  const before = html;
  const block = evidenceBlock(p, summary, L);
  html = html.replace(/\n?<!--evidence-->[\s\S]*?<!--\/evidence-->/g, '');
  if (block) html = html.replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/, `$1\n${block}`);
  html = injectEntity(html, entityLd(before, { url, name: `${p.name} Travel Guide`, aboutPlace: `${p.name} Prefecture, Japan`, lang }));
  const changed = html !== before;
  if (changed && !DRY) writeFileSync(file, html);
  return { changed, noSummary: !block };
}

// --- Pass 1: en prefecture guides (TL;DR + entity schema) ---
let changed = 0, skippedNoH1 = 0, noSummary = 0, missing = 0;
const prefSlugs = new Set(prefs.map((p) => p.slug));
for (const p of prefs) {
  if (ONLY && p.slug !== ONLY) continue;
  const file = join(BLOG, `${p.slug}.html`);
  if (!existsSync(file)) { missing++; continue; }
  const r = processGuide(file, p, p.summary, LABELS.en, p.guideUrl, 'en');
  if (r.changed) changed++;
  if (r.noSummary) noSummary++;
}

// --- Pass 2: en killer/topic pages (entity schema only — they have their own ledes) ---
let topicChanged = 0;
const topicFiles = readdirSync(BLOG)
  .filter((n) => n.endsWith('.html') && n !== 'index.html' && !prefSlugs.has(n.replace(/\.html$/, '')));
for (const name of topicFiles) {
  if (ONLY && name !== `${ONLY}.html`) continue;
  const file = join(BLOG, name);
  let html = readFileSync(file, 'utf8');
  if (!/<\/head>/i.test(html)) continue;
  const before = html;
  const url = pick(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i) || `https://www.nihongo-hub.com/blog/${name}`;
  const title = pick(html, /<title[^>]*>([^<]+)<\/title>/i) || name;
  html = injectEntity(html, entityLd(before, { url, name: title, lang: 'en' }));
  if (html !== before) { if (!DRY) writeFileSync(file, html); topicChanged++; }
}

// --- Pass 3: locale prefecture guides (translated TL;DR + entity schema), per available overlay ---
let localeChanged = 0;
for (const L of LOCALES) {
  const tldrPath = join(ROOT, 'data', L.tldr);
  if (!existsSync(tldrPath)) continue;
  const tldr = JSON.parse(readFileSync(tldrPath, 'utf8'));
  const labels = LABELS[L.lang] || LABELS.en;
  for (const p of prefs) {
    if (ONLY && p.slug !== ONLY) continue;
    const file = join(BLOG, L.dir, `${p.slug}.html`);
    if (!existsSync(file)) continue;
    const url = p.guideUrl.replace('/blog/', `/blog/${L.dir}/`);
    const r = processGuide(file, p, tldr[p.slug], labels, url, L.lang);
    if (r.changed) localeChanged++;
  }
}

console.log(`[inject-evidence] en-guides=${changed} no-h1=${skippedNoH1} no-summary=${noSummary} missing-file=${missing} topic-pages=${topicChanged} locale-guides=${localeChanged}`);

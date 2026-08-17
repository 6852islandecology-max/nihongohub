#!/usr/bin/env node
/**
 * Photo-first prefecture guide (v2 layout prototype). One page per slug.
 *
 * Reads: blog/guides-data.js (GUIDES), blog/guides-extra.js (EXTRA), explore-data.js (window.NH_EXTRA),
 *        blog/img-credits-multi.json (photos from scripts/fetch-photos-multi.mjs), assets/japan-map.svg (locator)
 * Writes: blog/<slug>-v2.html   (prototype path; noindex until it replaces blog/<slug>.html)
 *
 * Block order (studyinjapan/GaijinPot pattern, photo before prose, one affiliate per block):
 *   hero photo + stamp -> summary + locator map -> photo mosaic -> access timeline (12Go/eSIM)
 *   -> what to see (Viator per spot) -> what to eat (byFood) -> numbers w/ sources -> learn the Japanese (italki)
 *   -> trending -> final CTA (hotels) -> neighbours
 *
 * Run: node scripts/build-guide-v2.mjs tokushima
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { GUIDES, REGION_LABELS } from '../blog/guides-data.js';
import { EXTRA } from '../blog/guides-extra.js';
import { SPOTS } from './build-spots-v2.mjs';
import { existsSync } from 'node:fs';
const LANG_HTML = { en: 'en', zh: 'zh-Hant', es: 'es', th: 'th', id: 'id' };
const LANG_LABEL = { en: 'EN', zh: '繁中', es: 'ES', th: 'TH', id: 'ID' };
function loadT(lang) { const f = ROOT + 'blog/translations-v2/' + lang + '.json'; return lang !== 'en' && existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; }
import { UI_EN } from './v2-ui-strings.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enc = (s) => encodeURIComponent(s);

// explore-data.js is a browser IIFE that assigns window.NH_EXTRA — evaluate it in a sandbox
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(ROOT + 'explore-data.js', 'utf8'), sandbox);
const NH = sandbox.window.NH_EXTRA;
const CREDITS = JSON.parse(readFileSync(ROOT + 'blog/img-credits-multi.json', 'utf8'));
const ENRICHED = JSON.parse(readFileSync(ROOT + 'blog/guides-enriched.json', 'utf8'));
const RELEASE = JSON.parse(readFileSync(ROOT + 'blog/v2-release.json', 'utf8'));
const MAP_SVG = readFileSync(ROOT + 'assets/japan-map.svg', 'utf8')
  .replace(/<title>[\s\S]*?<\/title>/, '').replace(/<desc>[\s\S]*?<\/desc>/, '')
  .replace('<svg id="japan-map" class="geolonia-svg-map"', '<svg class="locator" aria-hidden="true" focusable="false"');

// Per-prefecture facts that are NOT in the existing data files. Every number carries its source.
// Add a prefecture = add an entry here (or move into a data file once >5 prefectures exist).
export const V2_FACTS = {
  tokushima: {
    code: 36, accent: '#1f3a5f', accentName: 'Awa indigo',
    tagline: 'Whirlpools, a 400-year-old dance, and a valley the road forgot.',
    photos: { hero: 'hero', mosaic: ['see4', 'tile2', 'tile3', 'tile4', 'tile5', 'tile1'], see: ['see1', 'see2', 'see3'], eat: ['food1', 'food2', 'food3'] },
    access: [
      { mode: 'plane', from: 'Tokyo (Haneda)', to: 'Tokushima Awaodori Airport', time: '1 h 10 min', note: 'JAL / ANA, ~10 flights a day' },
      { mode: 'bus',   from: 'Osaka / Kobe (Sannomiya)', to: 'Tokushima Station', time: '~2 h 30 min', note: 'highway bus over the Akashi-Kaikyō Bridge' },
    ],
    accessSource: 'Times: airline timetables and JR Shikoku / Honshi Bus published schedules (checked 2026-08).',
    numbers: [
      { label: 'Rent, small flat', value: '¥37,579', sub: 'per month, ≤29 m², Tokushima city', src: 'e-Stat Housing and Land Survey 2023' },
      { label: 'Bowl of ramen', value: '¥650', sub: 'eating out, Tokushima city', src: 'e-Stat Retail Price Survey, Aug 2024' },
      { label: 'Average temperature', value: '17.6 ℃', sub: 'annual mean, 2023', src: 'Japan Meteorological Agency' },
      { label: 'Awa Odori crowd', value: '1,000,000+', sub: 'spectators each August', src: 'JNTO / Tokushima City' },
      { label: 'Sudachi grown here', value: '98 %', sub: 'of Japan’s crop', src: 'JNTO / Tokushima Prefecture' },
    ],
    faq: [
      ['Is Tokushima worth visiting?', 'Yes if you like nature and festivals more than shopping. The Naruto whirlpools, the Iya Valley vine bridges and Awa Odori are all things you cannot see anywhere else in Japan.'],
      ['How many days do I need?', 'Two days covers Naruto and the city; add one or two more for the Iya Valley and Oboke Gorge, which are a 1.5–2 hour drive inland.'],
      ['When are the whirlpools biggest?', 'Around spring and autumn spring-tides, roughly an hour either side of the published peak time. Check the tide table before you buy a boat ticket.'],
    ],
  },
};

const MODE_ICON = {
  plane: '<svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
  train: '<svg viewBox="0 0 24 24"><path d="M12 2C8 2 4 2.5 4 6v9.5A3.5 3.5 0 0 0 7.5 19L6 20.5V21h12v-.5L16.5 19a3.5 3.5 0 0 0 3.5-3.5V6c0-3.5-4-4-8-4M7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m3.5-6H6V6h5zm2 0V6h5v5zm3.5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/></svg>',
  bus:   '<svg viewBox="0 0 24 24"><path d="M4 16c0 .9.4 1.7 1 2.2V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.8c.6-.5 1-1.3 1-2.2V6c0-3.5-3.6-4-8-4S4 2.5 4 6zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M18 11H6V6h12z"/></svg>',
};

let _B = '';
function photo(slug, key, cls = '') {
  const p = CREDITS[slug]?.[key]; if (!p) return '';
  const pn = (GUIDES.find(x => x.slug === slug) || {}).romaji || '';
  return `<img class="${cls}" src="${_B}${p.file}" width="${p.width}" height="${p.height}" alt="${esc(p.label)}, ${esc(pn)} Prefecture, Japan" loading="lazy" decoding="async">`;
}
function credit(slug, key) {
  const p = CREDITS[slug]?.[key]; if (!p) return '';
  const src = { find47: 'FIND/47', 'flickr/openverse': 'Flickr', wikimedia: 'Wikimedia Commons' }[p.fetched_from] || p.fetched_from;
  return `${esc(p.label)} — <a href="${esc(p.source_page)}" rel="noopener">${esc(p.artist)}</a> via ${src}, <a href="${esc(p.license_url || 'https://creativecommons.org/licenses/')}" rel="license noopener">${esc(p.license)}</a>`;
}
// explore-data notes were captured with a hard 160-char cut; end on a word and mark the cut
function tidy(t) { t = String(t || '').trim(); if (!t || /[.!?)]$/.test(t)) return t; return t.replace(/\s+\S*$/, '') + '…'; }
function stat(n, max = 5) { return Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join(''); }

export function buildV2(slug, lang = 'en') {
  const g = GUIDES.find(x => x.slug === slug); if (!g) throw new Error('no guide ' + slug);
  const T = loadT(lang), TP = (T && T.pages[slug]) || null, UI = { ...UI_EN, ...((T && T.ui) || {}) };
  const u = (k) => UI[k] || UI_EN[k] || k;
  const B = lang === 'en' ? '' : '../';        // -> blog/
  _B = B;
  const S = lang === 'en' ? '../' : '../../';  // -> site root
  const tr = (arr, i, fallback) => (TP && Array.isArray(TP[arr]) && TP[arr][i]) || fallback;
  const ex = { ...(EXTRA[slug] || {}), ...(ENRICHED[slug] || {}) }, nh = NH[slug] || {};
  // Generic defaults for prefectures without hand-written V2 facts: numbers/FAQ blocks are omitted, access falls back to the guide text.
  const REGION_ACCENT = { hokkaido: '#1d3a5f', tohoku: '#3b2a4f', kanto: '#7a2e1e', chubu: '#1f3a2a', kansai: '#5a3a12', chugoku: '#1a3a4a', shikoku: '#1f3a5f', 'kyushu-okinawa': '#6b2a1a' };
  const idx = GUIDES.findIndex(x => x.slug === slug); // GUIDES is in JIS order -> code = idx + 1
  const v = V2_FACTS[slug] || { code: idx + 1, accent: REGION_ACCENT[g.region] || '#1f3a5f', tagline: g.lede || g.blurb || '', photos: { hero: 'hero', mosaic: ['tile1', 'tile2', 'tile3', 'tile4', 'tile5'], see: ['see1', 'see2', 'see3'], eat: ['food1', 'food2', 'food3'] }, access: [], accessSource: '', numbers: [], faq: [] };
  const has = (k) => !!CREDITS[slug]?.[k];
  const TAG = (TP && TP.tagline) || v.tagline || g.lede || g.blurb || '', BLURB = (TP && TP.blurb) || nh.blurb || g.intro || g.blurb || '', HIST = (TP && TP.history) || ex.history || '', GETTING = (TP && TP.getting) || g.getting || '';
  const P = { hero: has(v.photos.hero) ? v.photos.hero : (['hero', 'tile1', 'see1', 'tile2'].find(has)), mosaic: v.photos.mosaic.filter(has), see: v.photos.see.map(k => has(k) ? k : null), eat: v.photos.eat.map(k => has(k) ? k : null) };
  if (!P.hero) throw new Error('no photos fetched for ' + slug + ' — run scripts/fetch-photos-multi.mjs ' + slug);
  const name = g.romaji, region = REGION_LABELS[g.region];
  const seeItems = (nh.culture || []).slice(0, 3), eatItems = (nh.food || []).slice(0, 3);
  const heroP = CREDITS[slug][P.hero];
  const title = `${name} Prefecture Travel Guide (2026): ${TAG.replace(/\.$/, '')} — NihongoHub`;
  const desc = `${BLURB} ${lang === 'en' ? 'Photos, access from Tokyo & Osaka, what to see and eat, real prices, and the Japanese you’ll actually use.' : ''}`.trim();
  const url = `https://www.nihongo-hub.com/blog/${lang === 'en' ? '' : lang + '/'}${slug}-v2.html`;
  const altUrls = ['en', 'zh', 'es', 'th', 'id'].filter(l => l === 'en' || loadT(l)?.pages?.[slug]).map(l => [l, `https://www.nihongo-hub.com/blog/${l === 'en' ? '' : l + '/'}${slug}-v2.html`]);
  const neighbours = ((g.related && g.related.length) ? g.related.map(s => GUIDES.find(x => x.slug === s)) : GUIDES.filter(x => x.region === g.region && x.slug !== slug).slice(0, 3)).filter(Boolean);
  const allCredits = [P.hero, ...P.mosaic, ...P.see, ...P.eat].filter(Boolean).filter((k, i, a) => a.indexOf(k) === i);

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: `${name} Prefecture Travel Guide`, description: desc,
    mainEntityOfPage: url, inLanguage: LANG_HTML[lang], datePublished: '2026-08-15', dateModified: '2026-08-15',
    author: { '@type': 'Organization', name: 'NihongoHub' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' },
    image: { '@type': 'ImageObject', url: `https://www.nihongo-hub.com/blog/${heroP.file}`, caption: heroP.label, creditText: heroP.artist, license: heroP.license_url, acquireLicensePage: heroP.source_page },
    about: { '@type': 'AdministrativeArea', name: `${name} Prefecture`, containedInPlace: { '@type': 'Country', name: 'Japan' } },
  };
  const faqld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: v.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };

  return `<!doctype html>
<html lang="${LANG_HTML[lang]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${RELEASE.prefectures.includes(slug) ? '' : '<meta name="robots" content="noindex">'}
<link rel="canonical" href="${url}">
${altUrls.map(([l, h]) => `<link rel="alternate" hreflang="${LANG_HTML[l]}" href="${h}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${altUrls[0][1]}">
<link rel="icon" href="/favicon.ico" sizes="any">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(name)} Prefecture Travel Guide"><meta property="og:description" content="${esc(TAG)}"><meta property="og:image" content="https://www.nihongo-hub.com/blog/${heroP.file}"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&family=Karla:wght@400;500;700&family=Shippori+Mincho+B1:wght@700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
${v.faq.length ? `<script type="application/ld+json">${JSON.stringify(faqld)}</script>` : ''}
<style>
:root{--paper:#f5efe3;--paper-2:#ede4d2;--ink:#1c1a16;--ink-2:#4a453c;--muted:#7a7263;--line:#d9cfb9;--seal:#c1301c;--accent:${v.accent};--accent-soft:${v.accent}14;--card:#fffaf0;--max:1120px;--r:14px}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Karla,system-ui,sans-serif;-webkit-font-smoothing:antialiased;
 background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1px);background-size:6px 6px}
a{color:var(--accent)}img{max-width:100%;display:block}
h1,h2,h3{font-family:Fraunces,Georgia,serif;font-weight:600;letter-spacing:-.01em;line-height:1.1;margin:0}
.wrap{max-width:var(--max);margin:0 auto;padding:0 20px}
/* nav */
.nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px;background:var(--ink);color:#f5efe3;font-size:14px}
.nav a{color:inherit;text-decoration:none}.nav .brand{font-family:Fraunces,serif;font-weight:700;font-size:20px}.nav .brand b{color:#e9a23b;font-weight:700}
.nav .links{display:flex;gap:18px;opacity:.85}.nav .cta{background:#e9a23b;color:#1c1a16;padding:6px 12px;border-radius:999px;font-weight:700}
/* hero */
.hero{position:relative;height:min(78vh,640px);min-height:420px;overflow:hidden;background:#222}
.hero img{width:100%;height:100%;object-fit:cover;filter:saturate(1.05)}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08) 25%,rgba(28,26,22,.55) 60%,rgba(28,26,22,.92) 100%)}
.hero .in{position:absolute;inset:auto 0 0 0;color:#fff;padding:0 20px 40px;z-index:2}
.hero .in .hw{display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:end}
.stamp{width:132px;height:132px;border-radius:50%;border:5px double var(--seal);color:var(--seal);background:rgba(245,239,227,.92);display:grid;place-items:center;transform:rotate(-7deg);box-shadow:0 10px 30px rgba(0,0,0,.35);position:relative}
.stamp span{font-family:'Shippori Mincho B1',serif;font-weight:800;font-size:54px;line-height:1;letter-spacing:.02em}
.stamp small{position:absolute;bottom:14px;font:700 9px/1 Karla,sans-serif;letter-spacing:.2em;text-transform:uppercase}
.hero .kicker{font:700 12px/1 Karla,sans-serif;letter-spacing:.24em;text-transform:uppercase;opacity:.9}
.hero h1{font-size:clamp(44px,8vw,96px);font-weight:700;margin:6px 0 4px;text-shadow:0 2px 6px rgba(0,0,0,.6),0 8px 40px rgba(0,0,0,.6)}
.hero .tag{font-family:Fraunces,serif;font-style:italic;font-weight:300;font-size:clamp(18px,2.4vw,26px);opacity:.98;max-width:34ch;text-shadow:0 1px 4px rgba(0,0,0,.7),0 4px 24px rgba(0,0,0,.6)}
.hero .cred{position:absolute;right:14px;top:12px;font-size:11px;color:#fff;opacity:.75;z-index:2}.hero .cred a{color:#fff}
/* summary + locator */
.sum{display:grid;grid-template-columns:1.4fr 1fr;gap:40px;padding:56px 0 24px;align-items:center}
.sum p.lede{font-family:Fraunces,serif;font-size:clamp(20px,2.2vw,26px);font-weight:300;line-height:1.35;margin:0 0 18px}
.sum p{margin:0 0 12px;color:var(--ink-2)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.chip{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:13px}
.locbox{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px;position:relative}
.locbox .locator{width:100%;height:auto;max-height:280px}
.locbox .locator path,.locbox .locator polygon{fill:#e3d9c3 !important;stroke:#f5efe3 !important;stroke-width:1.2 !important}
.locbox .locator [data-code="${v.code}"] path,.locbox .locator [data-code="${v.code}"] polygon,.locbox .locator [data-code="${v.code}"]{fill:var(--accent) !important}
.locbox .lbl{position:absolute;left:16px;top:14px;font:700 11px/1 Karla,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.locbox .lbl b{display:block;font:600 22px/1.1 Fraunces,serif;letter-spacing:0;text-transform:none;color:var(--ink);margin-top:6px}
/* mosaic */
.mosaic{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:190px;gap:8px;margin:20px 0 8px}
.mosaic figure{margin:0;position:relative;overflow:hidden;border-radius:10px;background:#ddd}
.mosaic figure:first-child{grid-column:span 2;grid-row:span 2}
.mosaic img{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}.mosaic figure:hover img{transform:scale(1.04)}
.mosaic figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 12px 10px;color:#fff;font-size:12px;background:linear-gradient(transparent,rgba(0,0,0,.6))}
.credits{font-size:11px;color:var(--muted);margin:6px 0 0}.credits a{color:var(--muted)}
/* sections */
section.blk{padding:52px 0 8px}
.h{display:flex;align-items:baseline;gap:14px;margin-bottom:22px}
.h h2{font-size:clamp(28px,3.4vw,40px)}.h .n{font-family:Fraunces,serif;font-style:italic;color:var(--seal);font-size:18px}
.h .hb{margin-left:auto}
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:#f5efe3;text-decoration:none;font-weight:700;font-size:14px;padding:10px 16px;border-radius:999px;border:0;white-space:nowrap}
.btn.light{background:var(--card);color:var(--ink);border:1px solid var(--line)}
.btn .pr{font-size:9px;letter-spacing:.14em;background:#e9a23b;color:#1c1a16;padding:2px 5px;border-radius:4px}
/* access */
.access{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.route{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:20px 22px;display:grid;grid-template-columns:44px 1fr;gap:16px}
.route .ic{width:44px;height:44px;border-radius:50%;background:var(--accent-soft);display:grid;place-items:center}.route .ic svg{width:22px;height:22px;fill:var(--accent)}
.tl{position:relative;padding-left:22px}.tl::before{content:"";position:absolute;left:5px;top:10px;bottom:10px;width:2px;background:var(--seal)}
.tl div{position:relative;padding:2px 0}.tl div::before{content:"";position:absolute;left:-22px;top:9px;width:12px;height:12px;border-radius:50%;background:var(--paper);border:3px solid var(--seal)}
.tl .t{display:inline-block;background:var(--seal);color:#fff;font-weight:700;font-size:13px;padding:2px 10px;border-radius:4px;margin:6px 0}
.tl .stn{font-weight:700}.tl small{color:var(--muted);display:block}
.src{font-size:12px;color:var(--muted);margin-top:12px}
/* cards */
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column}
.card img{aspect-ratio:4/3;object-fit:cover;width:100%;height:auto}
.card .b{padding:16px 18px 18px;display:flex;flex-direction:column;gap:8px;flex:1}
.card h3{font-size:21px}.card p{margin:0;color:var(--ink-2);font-size:14.5px}
.card .row{margin-top:auto;display:flex;gap:8px;flex-wrap:wrap;padding-top:6px}
.card .row a{font-size:13px;text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 11px;color:var(--ink);background:var(--paper)}
.card .row a[data-aff]{background:var(--accent);color:#fff;border-color:var(--accent)}
.card .tag{position:absolute;left:10px;top:10px;background:var(--seal);color:#fff;font:700 10px/1 Karla;letter-spacing:.16em;padding:5px 8px;border-radius:4px}
.card .imgw{position:relative}
.cards.spots{grid-template-columns:repeat(4,1fr)}.cards.spots .card{text-decoration:none;color:inherit}.cards.spots .card h3{font-size:18px}.cards.spots .card p{font-size:13.5px}
@media (max-width:820px){.cards.spots{grid-template-columns:1fr 1fr}}
/* numbers */
.nums{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.num{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 14px;text-align:center}
.num .v{font-family:Fraunces,serif;font-weight:700;font-size:30px;color:var(--accent);line-height:1.1}
.num .l{font-weight:700;font-size:13px;margin-top:6px}.num .s{font-size:12px;color:var(--muted)}
.nums-src{font-size:12px;color:var(--muted);margin-top:12px}
.pips{display:flex;flex-wrap:wrap;gap:16px 26px;margin:20px 0 0;font-size:13px}.pips span{display:inline-flex;gap:8px;align-items:center}
.pips i{display:inline-block;width:10px;height:10px;border:1px solid var(--accent);margin-right:2px;background:transparent}.pips i.on{background:var(--accent)}
/* speak */
.speak{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.ph{background:var(--ink);color:#f5efe3;border-radius:var(--r);padding:22px 22px 18px;position:relative;overflow:hidden}
.ph::after{content:"話";position:absolute;right:-6px;bottom:-26px;font:800 120px/1 'Shippori Mincho B1',serif;opacity:.06}
.ph .k{font:700 11px/1 Karla;letter-spacing:.2em;text-transform:uppercase;color:#e9a23b}
.ph .jp{font:700 26px/1.3 'Shippori Mincho B1',serif;margin:10px 0 4px}.ph .ro{font-style:italic;opacity:.85}.ph .en{margin-top:6px;font-size:14px}
.ph .row{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}.ph .row a{color:#f5efe3;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:5px 11px;font-size:13px;text-decoration:none}
/* trending */
.feed{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.feed a{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;text-decoration:none;color:var(--ink);font-size:14px}
.feed a b{display:block;font-family:Fraunces,serif;font-weight:600;font-size:16px;line-height:1.3;margin-bottom:6px}.feed a small{color:var(--muted)}
.tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.tags a{font-size:13px;text-decoration:none;color:var(--accent);border:1px solid var(--line);border-radius:999px;padding:5px 11px;background:var(--card)}
/* final cta */
.final{margin:56px 0 0;position:relative;border-radius:18px;overflow:hidden;min-height:300px;display:grid;place-items:center;text-align:center;color:#fff}
.final img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.final::before{content:"";position:absolute;inset:0;background:rgba(28,26,22,.55)}
.final .in{position:relative;padding:44px 20px}.final h2{font-size:clamp(28px,4vw,44px);margin-bottom:8px}.final p{margin:0 0 20px;opacity:.9}
.final .btn{background:#e9a23b;color:#1c1a16;font-size:16px;padding:14px 22px}
.faq details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:10px}.faq summary{cursor:pointer;font-weight:700}.faq p{margin:8px 0 0;color:var(--ink-2)}
.nb{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.nb a{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;text-decoration:none;color:var(--ink)}
.nb a b{font-family:Fraunces,serif;font-size:20px;display:block}.nb a span{font-size:13px;color:var(--muted)}
.disc{font-size:12px;color:var(--muted);margin:28px 0 0}
footer{margin-top:56px;padding:26px 20px;background:var(--ink);color:#c9c0ad;font-size:13px;text-align:center}footer a{color:#f5efe3}
@media (max-width:820px){.sum,.access,.cards,.speak,.feed,.nb{grid-template-columns:1fr}.mosaic{grid-template-columns:repeat(2,1fr);grid-auto-rows:150px}.mosaic figure:first-child{grid-column:span 2;grid-row:span 1}.nums{grid-template-columns:repeat(2,1fr)}.hero .in .hw{grid-template-columns:1fr}.stamp{width:96px;height:96px}.stamp span{font-size:38px}.h .hb{margin-left:0}.h{flex-wrap:wrap}.nav .links{display:none}}
</style>
</head>
<body>
<nav class="nav"><a class="brand" href="${S}index.html">Nihongo<b>Hub</b></a><div class="links"><a href="${B}index.html">${u('all47')}</a><a href="${S}prefectures.html">${u('playmap')}</a><a href="${S}index.html#learn">${u('learn')}</a></div><div style="display:flex;gap:10px;align-items:center">${altUrls.map(([l]) => l === lang ? `<b style="color:#e9a23b">${LANG_LABEL[l]}</b>` : `<a href="${l === 'en' ? (lang === 'en' ? '' : '../') : (lang === 'en' ? l + '/' : '../' + l + '/')}${slug}-v2.html" style="opacity:.8">${LANG_LABEL[l]}</a>`).join('')}<a class="cta" href="${S}quiz.html">${u('freequiz')}</a></div></nav>

<header class="hero">
  <img src="${B}${heroP.file}" width="${heroP.width}" height="${heroP.height}" alt="${esc(heroP.label)}, ${esc(name)} Prefecture, Japan" fetchpriority="high" decoding="async">
  <div class="cred">Photo: <a href="${esc(heroP.source_page)}" rel="noopener">${esc(heroP.artist)}</a> via ${({ find47: 'FIND/47', 'flickr/openverse': 'Flickr', wikimedia: 'Wikimedia Commons' })[heroP.fetched_from] || ''} · <a href="${esc(heroP.license_url)}" rel="license noopener">${esc(heroP.license)}</a></div>
  <div class="in"><div class="hw" style="max-width:var(--max);margin:0 auto">
    <div class="stamp" title="${esc(name)}"><span>${esc(g.kanji)}</span><small>${esc(region)}</small></div>
    <div><div class="kicker">${esc(region)} · ${esc(g.kanji)}県 · Japan</div><h1>${esc(name)}</h1><p class="tag">${esc(TAG)}</p></div>
  </div></div>
</header>

<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">${esc(BLURB)}</p>
      <p>${esc(HIST)}</p>
      <div class="chips">${(nh.areas || []).slice(0, 6).map(a => `<span class="chip">${esc(a.romaji || a.name || a)}${a.kanji ? ' <span style="color:var(--muted)">' + esc(a.kanji) + '</span>' : ''}</span>`).join('')}</div>
    </div>
    <div class="locbox"><div class="lbl">${u('whereitis')}<b>${esc(name)}, ${esc(region)}</b></div>${MAP_SVG}</div>
  </div>

  <div class="mosaic">${P.mosaic.map(k => `<figure>${photo(slug, k, '', '(max-width:820px) 50vw, 25vw')}<figcaption>${esc(CREDITS[slug][k]?.label || '')}</figcaption></figure>`).join('')}</div>
  <p class="credits">${u('photos')}: ${P.mosaic.map(k => credit(slug, k)).join(' · ')}</p>

  <section class="blk" id="access">
    <div class="h"><span class="n">01</span><h2>${u('getting')}</h2><a class="btn hb" data-aff="twelvego" href="https://12go.asia/en/travel/japan" target="_blank" rel="sponsored noopener">${u('bookbus')} <span class="pr">PR</span></a></div>
    <div class="access">${v.access.length ? v.access.map((r, i) => { const ta = tr('access', i, null) || {}; return `<div class="route"><div class="ic">${MODE_ICON[r.mode]}</div><div class="tl"><div><span class="stn">${esc(ta.from || r.from)}</span></div><div><span class="t">${esc(ta.time || r.time)}</span><small>${esc(ta.note || r.note)}</small></div><div><span class="stn">${esc(ta.to || r.to)}</span></div></div></div>`; }).join('') : `<div class="route" style="grid-column:1/-1;grid-template-columns:1fr"><div><p style="margin:0">${esc(GETTING)}</p></div></div>`}</div>
    <p class="src">${esc(v.accessSource)} <a data-aff="yesim" href="https://yesim.app/" target="_blank" rel="sponsored noopener">${u('esim')} (PR)</a></p>
  </section>

  <section class="blk" id="see">
    <div class="h"><span class="n">02</span><h2>${u('see')}</h2><a class="btn light hb" data-aff="viator" href="https://www.viator.com/searchResults/all?text=${enc(name + ' Japan')}" target="_blank" rel="sponsored noopener">${u('alltours')} · ${esc(name)} <span class="pr">PR</span></a></div>
    <div class="cards">${seeItems.map((it, i) => `<div class="card"><div class="imgw">${P.see[i] ? photo(slug, P.see[i]) : ''}<span class="tag">${it.tag === 'hidden' ? u('hidden') : u('toppick')}</span></div><div class="b"><h3>${esc(it.name)}</h3><p>${esc(tidy(tr('see', i, it.note)))}</p><div class="row"><a href="https://www.google.com/maps/search/?api=1&query=${enc(it.name.split(' (')[0] + ' ' + name)}" target="_blank" rel="noopener">${u('map')}</a><a href="${esc(it.url)}" target="_blank" rel="noopener">${u('official')}</a><a data-aff="viator" href="https://www.viator.com/searchResults/all?text=${enc(it.name.split(' (')[0].split(' & ')[0])}" target="_blank" rel="sponsored noopener">${u('tickets')}</a></div></div></div>`).join('')}</div>
  </section>

  ${(() => { const sp = Object.entries(SPOTS).filter(([, v]) => v.pref === slug); if (!sp.length) return ''; return `<section class="blk" id="spots"><div class="h"><span class="n">02b</span><h2>${u('spotguides')}</h2></div><div class="cards spots">${sp.map(([k, v]) => { const hp = CREDITS[k]?.[v.photos[0]]; const TS = (T && T.pages[k]) || {}; return `<a class="card" href="${B}${lang === 'en' ? '' : lang + '/'}spots/${k}.html"><div class="imgw">${hp ? `<img src="${B}${hp.file}" width="${hp.width}" height="${hp.height}" alt="${esc(hp.label)}" loading="lazy" decoding="async">` : ''}<span class="tag">${esc(TS.badge || v.badge)}</span></div><div class="b"><h3>${esc(TS.name || v.name)} <small style="font:700 14px 'Shippori Mincho B1',serif;color:var(--muted)">${esc(v.kanji)}</small></h3><p>${esc(TS.tagline || v.tagline)}</p></div></a>`; }).join('')}</div></section>`; })()}

  <section class="blk" id="eat">
    <div class="h"><span class="n">03</span><h2>${u('eat')}</h2><a class="btn light hb" data-aff="byfood" href="https://www.byfood.com/" target="_blank" rel="sponsored noopener">${u('foodtours')} <span class="pr">PR</span></a></div>
    <div class="cards">${eatItems.map((it, i) => `<div class="card"><div class="imgw">${P.eat[i] ? photo(slug, P.eat[i]) : ''}<span class="tag">${it.tag === 'hidden' ? u('localsecret') : u('musteat')}</span></div><div class="b"><h3>${esc(it.name)}</h3><p>${esc(tidy(tr('eat', i, it.note)))}</p></div></div>`).join('')}</div>
  </section>

  ${v.numbers.length ? `<section class="blk" id="numbers">
    <div class="h"><span class="n">04</span><h2>${esc(name)} ${u('numbers')}</h2></div>
    <div class="nums">${v.numbers.map((n, i) => { const tn = tr('numbers', i, null) || {}; return `<div class="num"><div class="v">${esc(n.value)}</div><div class="l">${esc(tn.label || n.label)}</div><div class="s">${esc(tn.sub || n.sub)}</div></div>`; }).join('')}</div>
    <p class="nums-src">${u('sources')}: ${v.numbers.map((n, i) => `${esc((tr('numbers', i, null) || {}).label || n.label)} — ${esc(n.src)}`).join(' · ')}.</p>
    ${nh.stats ? `<div class="pips"><span>Food ${stat(nh.stats.food)}</span><span>Culture ${stat(nh.stats.culture)}</span><span>Nature ${stat(nh.stats.nature)}</span><span>City ${stat(nh.stats.city)}</span><span>Access ${stat(nh.stats.access)}</span> <a href="${S}rank.html?pref=${slug}">${u('howrank')}</a></div>` : ''}
  </section>` : (nh.stats ? `<section class="blk" id="numbers"><div class="h"><span class="n">04</span><h2>${esc(name)} ${u('glance')}</h2></div><div class="pips"><span>Food ${stat(nh.stats.food)}</span><span>Culture ${stat(nh.stats.culture)}</span><span>Nature ${stat(nh.stats.nature)}</span><span>City ${stat(nh.stats.city)}</span><span>Access ${stat(nh.stats.access)}</span> <a href="${S}rank.html?pref=${slug}">${u('howrank')}</a></div></section>` : '')}

  ${(g.phrase || g.word || ex.deeper_phrase) ? `<section class="blk" id="speak">
    <div class="h"><span class="n">05</span><h2>${u('speak')} ${esc(name)}</h2><a class="btn hb" data-aff="italki" href="https://www.italki.com/" target="_blank" rel="sponsored noopener">${u('practise')} <span class="pr">PR</span></a></div>
    <div class="speak">
      ${g.phrase ? `<div class="ph"><div class="k">${u('asklocal')}</div><div class="jp">${esc(g.phrase.jp)}</div><div class="ro">${esc(g.phrase.ro)}</div><div class="en">${esc((TP && TP.phrase_en) || g.phrase.en)}</div><div class="row"><a href="${S}quiz.html?topic=travel">${u('testyourself')}</a></div></div>` : ''}
      ${g.word ? `<div class="ph"><div class="k">${u('localword')}</div><div class="jp">${esc(g.word.jp)}</div><div class="ro">${esc(g.word.ro)}</div><div class="en">${esc((TP && TP.word_en) || g.word.en)}</div><div class="row"><a href="${S}quiz.html?topic=travel">${u('testyourself')}</a></div></div>` : ''}
      ${ex.deeper_phrase ? `<div class="ph"><div class="k">${u('onemore')}</div><div class="jp">${esc(ex.deeper_phrase.jp || ex.deeper_phrase)}</div><div class="ro">${esc(ex.deeper_phrase.ro || '')}</div><div class="en">${esc((TP && TP.deeper_en) || ex.deeper_phrase.en || '')}</div><div class="row"><a href="${S}index.html#learn">${u('practisemore')}</a></div></div>` : ''}
    </div>
  </section>` : ''}

  ${(nh.feed || []).length ? `<section class="blk" id="now"><div class="h"><span class="n">06</span><h2>${esc(name)} ${u('rightnow')}</h2></div><div class="feed">${nh.feed.slice(0, 3).map(f => `<a href="${esc(f.url)}" target="_blank" rel="noopener"><b>${esc(f.title)}</b><small>${esc(f.source)}</small></a>`).join('')}</div>${(nh.hashtags || []).length ? `<div class="tags">${nh.hashtags.map(h => `<a href="${esc(h.url)}" target="_blank" rel="noopener">${esc(h.label)}</a>`).join('')}</div>` : ''}</section>` : ''}

  <div class="final">${photo(slug, P.mosaic[0] || P.hero)}<div class="in"><h2>${u('sleepin')} ${esc(name)}</h2><p>${u('compare')}</p><a class="btn" data-aff="booking" data-aff-fallback="https://www.booking.com/searchresults.html?ss=${enc(name + ' Japan')}" href="https://www.booking.com/searchresults.html?ss=${enc(name + ' Japan')}" target="_blank" rel="sponsored noopener">${u('findstay')} <span class="pr">PR</span></a></div></div>

  ${v.faq.length ? `<section class="blk faq" id="faq"><div class="h"><span class="n">07</span><h2>${u('faq')}</h2></div>${v.faq.map(([q, a], i) => { const tf = tr('faq', i, null) || {}; return `<details><summary>${esc(tf.q || q)}</summary><p>${esc(tf.a || a)}</p></details>`; }).join('')}</section>` : ''}

  <section class="blk" id="next"><div class="h"><span class="n">08</span><h2>${u('nextdoor')}</h2></div><div class="nb">${neighbours.map(n => `<a href="${B}${lang === 'en' ? '' : lang + '/'}${n.slug}.html"><b>${esc(n.romaji)}</b><span>${esc(n.lede || n.blurb || '')}</span></a>`).join('')}<a href="${S}prefectures.html?pref=${slug}"><b>${u('playmapcard')}</b><span>${esc(u('unlock').replace('{name}', name))}</span></a></div></section>

  <p class="disc">${u('disclosure')} ${u('photos')}: ${allCredits.map(k => credit(slug, k)).join(' · ')}. Map: Geolonia (MIT).</p>
</main>
<footer>© 2026 NihongoHub · <a href="${B}index.html">${u('allguides')}</a> · <a href="${S}index.html">${u('home')}</a> · <a href="${B}${lang === 'en' ? '' : lang + '/'}${slug}.html">${u('classic')}</a></footer>
<script defer src="/_vercel/insights/script.js"></script>
<script src="${S}lib/config.js"></script>
<script src="${B}blog-quiz.js"></script>
</body>
</html>`;
}

if (/build-guide-v2/.test(process.argv[1] || '')) {
  const slugs = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!slugs.length) { console.error('usage: node scripts/build-guide-v2.mjs <slug>'); process.exit(1); }
  for (const s of slugs) {
    for (const lang of ['en', 'zh', 'es', 'th', 'id']) {
      if (lang !== 'en' && !loadT(lang)?.pages?.[s]) continue;
      mkdirSync(ROOT + 'blog/' + lang, { recursive: true });
      const html = buildV2(s, lang); const out = lang === 'en' ? `blog/${s}-v2.html` : `blog/${lang}/${s}-v2.html`;
      writeFileSync(ROOT + out, html); console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
    }
  }
}

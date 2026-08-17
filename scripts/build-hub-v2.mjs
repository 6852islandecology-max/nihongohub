#!/usr/bin/env node
/**
 * 47-prefecture hub (photo grid + clickable map + FAQ) -> blog/japan-prefectures.html
 * Static HTML (no JS-injected body text) so the hub itself is the search landing page for
 * "japan prefectures" derivatives. Cards link to the v2 prefecture guides.
 * Run: node scripts/build-hub-v2.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GUIDES, REGION_LABELS } from '../blog/guides-data.js';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CREDITS = JSON.parse(readFileSync(ROOT + 'blog/img-credits-multi.json', 'utf8'));
const RELEASE = JSON.parse(readFileSync(ROOT + 'blog/v2-release.json', 'utf8'));
const _sb = { window: {} }; vm.runInNewContext(readFileSync(ROOT + 'explore-data.js', 'utf8'), _sb); const NH = _sb.window.NH_EXTRA || {};
const MAP_SVG = readFileSync(ROOT + 'assets/japan-map.svg', 'utf8').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<desc>[\s\S]*?<\/desc>/, '')
  .replace('<svg id="japan-map" class="geolonia-svg-map"', '<svg class="bigmap" role="img" aria-label="Map of Japan\'s 47 prefectures"');
const REGION_ORDER = ['hokkaido', 'tohoku', 'kanto', 'chubu', 'kansai', 'chugoku', 'shikoku', 'kyushu-okinawa'];
const REGION_NAME = { hokkaido: 'Hokkaido', tohoku: 'Tohoku', kanto: 'Kanto', chubu: 'Chubu', kansai: 'Kansai (Kinki)', chugoku: 'Chugoku', shikoku: 'Shikoku', 'kyushu-okinawa': 'Kyushu & Okinawa' };
const ACCENT = { hokkaido: '#1d3a5f', tohoku: '#3b2a4f', kanto: '#7a2e1e', chubu: '#1f3a2a', kansai: '#5a3a12', chugoku: '#1a3a4a', shikoku: '#1f3a5f', 'kyushu-okinawa': '#6b2a1a' };
// Facts with sources (kept to well-established official figures)
const FAQ = [
  ['How many prefectures does Japan have?', 'Forty-seven: one “dō” (Hokkaidō), one “to” (Tōkyō), two “fu” (Ōsaka and Kyōto) and 43 “ken”. They are grouped into eight regions, listed below.'],
  ['Which prefecture is the largest, and which the smallest?', 'Hokkaidō is by far the largest at about 83,400 km²; Kagawa on Shikoku is the smallest at about 1,880 km² (Geospatial Information Authority of Japan, area statistics).'],
  ['Which prefecture has the most people, and which the fewest?', 'Tōkyō, with about 14 million residents; Tottori, with about 550,000 (2020 Population Census, Statistics Bureau of Japan).'],
  ['What is the difference between a prefecture and a region?', 'Prefectures are the official administrative units with their own governors and assemblies. Regions (Tōhoku, Kantō, Kansai …) are conventional groupings used for weather, travel and statistics; they have no government of their own.'],
];
const heroOf = (slug) => { const c = CREDITS[slug] || {}; const k = ['hero', 'tile1', 'see1', 'tile2', 'tile3', 'see2'].find(k => c[k]); return k ? c[k] : null; };

const cards = REGION_ORDER.map(reg => {
  const gs = GUIDES.filter(g => g.region === reg);
  return `<section class="reg" id="${reg}" style="--accent:${ACCENT[reg]}"><div class="h"><h2>${esc(REGION_NAME[reg])}</h2><span class="cnt">${gs.length} prefecture${gs.length > 1 ? 's' : ''}</span></div>
  <div class="grid">${gs.map(g => { const p = heroOf(g.slug); const idx = GUIDES.indexOf(g) + 1; return `<a class="card" href="${RELEASE.prefectures.includes(g.slug) ? g.slug + '-v2.html' : g.slug + '.html'}"><div class="imgw">${p ? `<img src="${p.file}" width="${p.width}" height="${p.height}" alt="${esc(p.label)}, ${esc(g.romaji)} Prefecture, Japan" loading="lazy" decoding="async">` : ''}<span class="no">${String(idx).padStart(2, '0')}</span><span class="kj">${esc(g.kanji)}</span></div><div class="b"><h3>${esc(g.romaji)}</h3><p>${esc(g.lede || g.blurb || g.intro || '')}</p></div></a>`; }).join('')}</div></section>`;
}).join('');

const jsonld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: "Japan's 47 Prefectures — map, list and photo guides", url: 'https://www.nihongo-hub.com/blog/japan-prefectures.html', inLanguage: 'en',
  hasPart: GUIDES.map(g => ({ '@type': 'Article', name: `${g.romaji} Prefecture Travel Guide`, url: `https://www.nihongo-hub.com/blog/${RELEASE.prefectures.includes(g.slug) ? g.slug + '-v2' : g.slug}.html` })) };
const faqld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
const heroSlugs = ['tokushima', 'kyoto', 'hokkaido', 'okinawa', 'nagano', 'kagoshima'].map(heroOf).filter(Boolean);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Japan's 47 Prefectures: map, list by region and photo guides — NihongoHub</title>
<meta name="description" content="All 47 prefectures of Japan on one page: clickable map, the eight regions, and a photo guide for every prefecture with access, food, real prices and the Japanese you’ll use there.">
${RELEASE.hub ? '' : '<meta name="robots" content="noindex">'}
<link rel="canonical" href="https://www.nihongo-hub.com/blog/japan-prefectures.html">
<link rel="icon" href="/favicon.ico" sizes="any">
<meta property="og:type" content="website"><meta property="og:title" content="Japan's 47 Prefectures — map, list & photo guides"><meta property="og:description" content="Every prefecture of Japan with photos, access, food, prices and phrases."><meta property="og:image" content="https://www.nihongo-hub.com/blog/${heroSlugs[0]?.file || ''}"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&family=Karla:wght@400;500;700&family=Shippori+Mincho+B1:wght@700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<script type="application/ld+json">${JSON.stringify(faqld)}</script>
<style>
:root{--paper:#f5efe3;--ink:#1c1a16;--ink-2:#4a453c;--muted:#7a7263;--line:#d9cfb9;--seal:#c1301c;--card:#fffaf0;--max:1160px;--r:14px}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Karla,system-ui,sans-serif;-webkit-font-smoothing:antialiased;background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1px);background-size:6px 6px}
a{color:inherit}img{max-width:100%;display:block;height:auto}h1,h2,h3{font-family:Fraunces,Georgia,serif;font-weight:600;letter-spacing:-.01em;line-height:1.1;margin:0}
.wrap{max-width:var(--max);margin:0 auto;padding:0 20px}
.nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px;background:var(--ink);color:#f5efe3;font-size:14px}.nav a{color:inherit;text-decoration:none}.nav .brand{font-family:Fraunces,serif;font-weight:700;font-size:20px}.nav .brand b{color:#e9a23b}.nav .links{display:flex;gap:18px;opacity:.85}.nav .cta{background:#e9a23b;color:#1c1a16;padding:6px 12px;border-radius:999px;font-weight:700}
.hero{padding:56px 0 24px}.hero h1{font-size:clamp(38px,6vw,72px);font-weight:700;max-width:16ch}.hero p{font-family:Fraunces,serif;font-weight:300;font-size:clamp(18px,2.2vw,24px);max-width:52ch;margin:14px 0 0;color:var(--ink-2)}
.strip{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:26px 0 8px}.strip img{width:100%;height:150px;object-fit:cover;border-radius:8px}
.top{display:grid;grid-template-columns:1.1fr .9fr;gap:36px;align-items:center;padding:30px 0}
.bigmap{width:100%;height:auto}.bigmap path,.bigmap polygon{fill:#e3d9c3 !important;stroke:#f5efe3 !important;stroke-width:1.2 !important;transition:fill .2s}.bigmap g.prefecture:hover path,.bigmap g.prefecture:hover polygon{fill:var(--seal) !important;cursor:pointer}
.regs{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.regs a{display:block;text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.regs a b{font-family:Fraunces,serif;font-size:18px;display:block}.regs a span{font-size:13px;color:var(--muted)}
.reg{padding:40px 0 4px}.reg .h{display:flex;align-items:baseline;gap:14px;margin-bottom:16px}.reg h2{font-size:clamp(26px,3.2vw,38px);color:var(--accent)}.reg .cnt{font-size:13px;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.card{display:block;text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}.card .imgw{position:relative;aspect-ratio:4/3;background:#ddd}.card img{width:100%;height:100%;object-fit:cover;transition:transform .5s}.card:hover img{transform:scale(1.04)}
.card .no{position:absolute;left:10px;top:10px;font:700 11px/1 Karla;letter-spacing:.16em;background:rgba(28,26,22,.75);color:#f5efe3;padding:5px 7px;border-radius:4px}.card .kj{position:absolute;right:10px;bottom:8px;font:800 30px/1 'Shippori Mincho B1',serif;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)}
.card .b{padding:12px 14px 14px}.card h3{font-size:19px}.card p{margin:4px 0 0;font-size:13.5px;color:var(--ink-2)}
.faq{padding:48px 0 0}.faq h2{font-size:clamp(26px,3.2vw,38px);margin-bottom:16px}.faq details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:10px}.faq summary{cursor:pointer;font-weight:700}.faq p{margin:8px 0 0;color:var(--ink-2)}
.more{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:40px}.more a{display:block;background:var(--ink);color:#f5efe3;border-radius:12px;padding:18px;text-decoration:none}.more a b{font-family:Fraunces,serif;font-size:20px;display:block}.more a span{font-size:13px;opacity:.8}
footer{margin-top:56px;padding:26px 20px;background:var(--ink);color:#c9c0ad;font-size:13px;text-align:center}footer a{color:#f5efe3}
@media (max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}.top,.more{grid-template-columns:1fr}.strip{grid-template-columns:repeat(3,1fr)}.nav .links{display:none}}
</style>
</head>
<body>
<nav class="nav"><a class="brand" href="../index.html">Nihongo<b>Hub</b></a><div class="links"><a href="../prefectures.html">Play the map</a><a href="index.html">All guides</a><a href="../index.html#learn">Learn Japanese</a></div><a class="cta" href="../quiz.html">Free quiz</a></nav>
<main class="wrap">
  <header class="hero"><h1>Japan’s 47 prefectures, one photo guide each</h1><p>Every prefecture of Japan by region: what it looks like, how to get there, what to eat, what things cost, and the Japanese you will actually say there. Tap a prefecture on the map or scroll the eight regions.</p>
    <div class="strip">${heroSlugs.map(p => `<img src="${p.file}" width="${p.width}" height="${p.height}" alt="${esc(p.label)}" loading="lazy" decoding="async">`).join('')}</div></header>
  <div class="top"><div>${MAP_SVG}</div><div class="regs">${REGION_ORDER.map(r => `<a href="#${r}"><b>${esc(REGION_NAME[r])}</b><span>${GUIDES.filter(g => g.region === r).map(g => g.romaji).join(' · ')}</span></a>`).join('')}</div></div>
  ${cards}
  <section class="faq"><h2>Common questions</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
  <div class="more"><a href="../prefectures.html"><b>Play the 47-prefecture map</b><span>Unlock prefectures, battle quizzes, collect titles.</span></a><a href="../quiz.html?topic=travel"><b>Prefecture quiz</b><span>Test the kanji, food and landmarks of each prefecture.</span></a><a href="../wildlife.html"><b>Wildlife by prefecture</b><span>GBIF-based ranking of species richness in all 47.</span></a></div>
</main>
<footer>© 2026 NihongoHub · <a href="index.html">All guides</a> · <a href="../index.html">Home</a> · Photos: free licences, credited on each prefecture page · Map: Geolonia (MIT)</footer>
<script>document.querySelectorAll('.bigmap g.prefecture').forEach(function(g){var c=g.className.baseVal.split(' ')[0];var rel=${JSON.stringify(RELEASE.prefectures)};g.addEventListener('click',function(){location.href=c+(rel.indexOf(c)>=0?'-v2.html':'.html');});g.style.cursor='pointer';});</script>
</body>
</html>`;
writeFileSync(ROOT + 'blog/japan-prefectures.html', html);
console.log(`wrote blog/japan-prefectures.html (${(html.length / 1024).toFixed(0)} KB), cards with photos: ${GUIDES.filter(g => heroOf(g.slug)).length}/47`);

#!/usr/bin/env node
// Inject a SECOND, in-body CC photo into travel guides, after a given heading.
// Source images fetched by fetch-wikimedia.mjs into blog/img-src/{pseudo}.* with
// attribution in blog/img-credits.json. Converts to webp, inserts a <figure
// class="lead-photo"> with full CC attribution, idempotent via <!--inbody:{pseudo}--> marker.
//   node scripts/inject-inbody.mjs

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const HOME = os.homedir();
const BLOG = path.join(HOME, '.secretary/projects/nihongohub/blog');
const IMGDIR = path.join(BLOG, 'img');
const SRCDIR = path.join(BLOG, 'img-src');
const CREDITS = JSON.parse(fs.readFileSync(path.join(BLOG, 'img-credits.json'), 'utf8'));

const CONFIG = [
  { pseudo: 'japan-cash-or-card-2026-b', file: 'japan-cash-or-card-2026.html', after: '<h2 id="where-cash">Where cash is still required</h2>' },
  { pseudo: 'is-japan-expensive-2026-b', file: 'is-japan-expensive-2026.html', after: '<h2 id="breakdown">Where the money goes</h2>' },
  { pseudo: 'japan-2026-travel-changes-b', file: 'japan-2026-travel-changes.html', after: '<h2 id="jr-pass">JR Pass: another price rise from October 1</h2>' },
  { pseudo: 'konbini-guide-japan-b', file: 'konbini-guide-japan.html', after: '<h2 id="buy">What to actually buy</h2>' },
  { pseudo: 'kissaten-showa-retro-japan-b', file: 'kissaten-showa-retro-japan.html', after: '<h2 id="menu">The menu: cream soda, Napolitan, pudding à la mode</h2>' },
  { pseudo: 'renting-apartment-japan-foreigner-b', file: 'renting-apartment-japan-foreigner.html', after: '<h2 id="cheaper">Cheaper, lower-friction routes</h2>' },
  // top-ranking collect/travel guides: mid-scroll second photo (visual rest where photos were absent)
  { pseudo: 'manhole-cards-japan-b', file: 'manhole-cards-japan.html', after: '<h2 id="designs">Notable designs by city</h2>' },
  { pseudo: 'goshuin-temple-shrine-stamps-b', file: 'goshuin-temple-shrine-stamps.html', after: '<h2 id="spots">Famous spots for goshuin</h2>' },
  { pseudo: 'japan-100-castles-goshuin-b', file: 'japan-100-castles-goshuin.html', after: '<h2 id="twelve">The 12 original surviving keeps (the real hook)</h2>' },
  { pseudo: 'gundam-manholes-japan-b', file: 'gundam-manholes-japan.html', after: '<h2 id="where">Where to find them</h2>' },
  // knife-towns spoke (2026-08-23): the Sakai Hamono museum building, at the head of the town rundown
  { pseudo: 'japanese-knife-towns-guide-b', file: 'japanese-knife-towns-guide.html', after: "<h3>Sakai, Osaka — the professional chef's town</h3>", cls: 'inline-photo',
    alt: 'Sakai Traditional Crafts Museum building, Sakai, Osaka, Japan',
    cap: 'The Sakai Traditional Crafts Museum (Sakai Denshokan), home of the free "Sakai Hamono Museum CUT" exhibit' },
  { pseudo: 'japanese-knife-towns-guide-seki', file: 'japanese-knife-towns-guide.html', after: '<h3>Seki, Gifu — 700 years, and the volume behind your kitchen drawer</h3>', cls: 'inline-photo',
    alt: 'Tachi sword on display at the Seki Traditional Swordsmith Museum, Seki, Gifu, Japan',
    cap: 'A tachi in the Seki Traditional Swordsmith Museum, where a Seki smith forges in public once a month' },
  { pseudo: 'japanese-knife-towns-guide-echizen', file: 'japanese-knife-towns-guide.html', after: '<h3>Echizen, Fukui — the one where you can make your own</h3>', cls: 'inline-photo',
    alt: 'Hand-forged Echizen bunka kitchen knife with a magnolia handle, Fukui, Japan',
    cap: 'A hand-forged bunka from Echizen — the first cutlery in Japan designated a national Traditional Craft' },
  { pseudo: 'japanese-knife-towns-guide-tsubame', file: 'japanese-knife-towns-guide.html', after: '<h3>Tsubame-Sanjo, Niigata — four days a year, a hundred open factories</h3>', cls: 'inline-photo',
    alt: 'Tsubame-Sanjo Jibasan Center, Niigata, Japan',
    cap: 'The Tsubame-Sanjo Jibasan Center — what is open in the weeks when the factories are not' },
  { pseudo: 'japanese-knife-towns-guide-miki', file: 'japanese-knife-towns-guide.html', after: '<h3>Miki, Hyogo — the one that is not about kitchen knives</h3>', cls: 'inline-photo',
    alt: 'Stage and crowd at the Miki Hardware Festival, Miki, Hyogo, Japan',
    cap: "The Miki Hardware Festival (2013 edition) — the town's tool trade turned into two days of markets" },
  // tea-regions spoke (2026-08-23): one photo per region, plus the shading explainer and the buying section
  { pseudo: 'japanese-tea-regions-guide-shaded', file: 'japanese-tea-regions-guide.html', after: '<h2 id="choose">Three things that decide which region you want</h2>',
    alt: 'Tea bushes under black shading netting on frames, Japan',
    cap: 'Shading frames over tea bushes — the step that turns ordinary leaf into gyokuro and tencha' },
  { pseudo: 'japanese-tea-regions-guide-uji', file: 'japanese-tea-regions-guide.html', after: '<h3>Uji, Kyoto — the matcha that wins the competition</h3>', cls: 'inline-photo',
    alt: 'Byodo-in Phoenix Hall reflected in its pond, Uji, Kyoto, Japan',
    cap: 'Byōdō-in in Uji — the matcha workshops are five to ten minutes from here' },
  { pseudo: 'japanese-tea-regions-guide-yame', file: 'japanese-tea-regions-guide.html', after: '<h3>Yame, Fukuoka — gyokuro, and a 25-year streak</h3>', cls: 'inline-photo',
    alt: 'Terraced tea fields in the hills of Yame, Fukuoka, Japan',
    cap: 'Tea terraces at Yame, Fukuoka — twenty-five consecutive gyokuro production-area prizes' },
  { pseudo: 'japanese-tea-regions-guide-b', file: 'japanese-tea-regions-guide.html', after: '<h3>Chiran, Kagoshima — the new number one, with samurai gardens</h3>', cls: 'inline-photo',
    alt: 'Tea fields at Chiran, Minamikyushu, Kagoshima, Japan',
    cap: 'Tea fields at Chiran, Minamikyūshū, Kagoshima' },
  { pseudo: 'japanese-tea-regions-guide-sayama', file: 'japanese-tea-regions-guide.html', after: '<h3>Sayama, Saitama — the one you can do before dinner</h3>', cls: 'inline-photo',
    alt: 'Sayama tea fields with pylons behind, Saitama, Japan',
    cap: 'Sayama tea fields in Saitama — a working crop at the cold northern edge, inside a Tokyo day trip' },
  // whisky-towns spoke (2026-08-23): one photo per distillery town
  { pseudo: 'japanese-whisky-towns-guide-yoichi', file: 'japanese-whisky-towns-guide.html', after: '<h3>Yoichi, Hokkaido — the one that started it, and the easiest to enter</h3>', cls: 'inline-photo',
    alt: 'The relocated Taketsuru residence at the Nikka Yoichi Distillery, Hokkaido, Japan',
    cap: "The house Masataka Taketsuru shared with his Scottish wife Rita, moved onto the Yoichi site in 2002" },
  { pseudo: 'japanese-whisky-towns-guide-yamazaki', file: 'japanese-whisky-towns-guide.html', after: '<h3>Yamazaki, Osaka — the oldest, and the hardest ticket</h3>', cls: 'inline-photo',
    alt: 'Copper pot stills in the still house at the Yamazaki Distillery, Osaka, Japan',
    cap: 'Copper pot stills at Yamazaki, Japan’s first malt distillery, opened in 1923' },
  { pseudo: 'japanese-whisky-towns-guide-hakushu', file: 'japanese-whisky-towns-guide.html', after: '<h3>Hakushu, Yamanashi — a distillery inside a forest</h3>', cls: 'inline-photo',
    alt: 'The wooded entrance to the Suntory Hakushu Distillery, Hokuto, Yamanashi, Japan',
    cap: 'The entrance at Hakushu, built in 1973 in woodland in the Southern Japanese Alps' },
  { pseudo: 'japanese-whisky-towns-guide-mars', file: 'japanese-whisky-towns-guide.html', after: '<h3>Komagatake, Nagano — free, high, and nobody queues</h3>', cls: 'inline-photo',
    alt: 'The Mars Komagatake Distillery building with its pagoda kiln roof, Miyada, Nagano, Japan',
    cap: 'Mars Komagatake in Miyada, Nagano — the sign by the door reads kengaku uketsuke, tour reception' },
  { pseudo: 'japanese-whisky-towns-guide-chichibu', file: 'japanese-whisky-towns-guide.html', after: '<h3>Chichibu, Saitama — the one you cannot visit, and should still go to</h3>', cls: 'inline-photo',
    alt: 'The gate of Chichibu Shrine with stacked sake barrels, Chichibu, Saitama, Japan',
    cap: 'Chichibu Shrine, where the February whisky festival is held — the stacked barrels are local sake' },
  { pseudo: 'japanese-tea-regions-guide-gyokuro', file: 'japanese-tea-regions-guide.html', after: '<h2 id="buy">What to bring home, and what not to</h2>',
    alt: 'Brewed Japanese green tea in a cup beside a kyusu teapot',
    cap: 'Brewed leaf tea with a kyūsu — buy the amount you will drink in a few weeks, not a keepsake tin' },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function cleanTitle(t) {
  return String(t).replace(/^File:/, '').replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[_]+/g, ' ').replace(/\s*\(\d[\d\s-]*\)\s*$/, '').replace(/\s*-\s*[A-Z]$/, '').replace(/\s+/g, ' ').trim();
}
function artistName(html) {
  const txt = String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return txt && txt.length <= 60 ? txt : (txt ? txt.slice(0, 40) + '…' : 'Wikimedia contributor');
}

async function run() {
  let ok = 0;
  for (const c of CONFIG) {
    const rec = CREDITS[c.pseudo];
    if (!rec) { console.log('SKIP (no credit) ' + c.pseudo); continue; }
    const src = rec.path && fs.existsSync(rec.path) ? rec.path
      : ['jpg', 'png', 'webp', 'jpeg'].map(e => path.join(SRCDIR, `${c.pseudo}.${e}`)).find(p => fs.existsSync(p));
    if (!src) { console.log('SKIP (no src image) ' + c.pseudo); continue; }
    const out = path.join(IMGDIR, `${c.pseudo}.webp`);
    fs.mkdirSync(IMGDIR, { recursive: true });
    // 2026-08-23: the CSS renders these at aspect-ratio 16/9 with object-fit:cover, so any
    // stored pixels outside that band were downloaded and then cropped away. Crop to 16:9
    // here instead (same centre crop the browser was doing) — typically 40-60% fewer bytes.
    await sharp(src).resize(1280, 720, { fit: 'cover', position: 'centre', withoutEnlargement: true })
      .webp({ quality: 74 }).toFile(out);

    // 2026-08-23: Commons file names make poor alt text and captions ("Sakai HAMONO Museum",
    // "知覧町茶畑 20150922 - panoramio"). Hand-written text used to be wiped on every re-run,
    // so an entry can carry its own alt/cap here and stay stable across re-injection.
    const title = c.cap || cleanTitle(rec.title);
    const altText = c.alt || title;
    const artist = artistName(rec.artist_html);
    const fig =
`<!--inbody:${c.pseudo}-->
<figure class="${c.cls || 'lead-photo'}">
  <img src="img/${c.pseudo}.webp" alt="${esc(altText)}" loading="lazy" width="1280" decoding="async">
  <figcaption>${esc(title)} — photo by ${esc(artist)}, <a href="${esc(rec.license_url || '')}" target="_blank" rel="noopener nofollow">${esc(rec.license || 'CC')}</a>, via <a href="${esc(rec.source_page || '')}" target="_blank" rel="noopener nofollow">Wikimedia Commons</a></figcaption>
</figure>
<!--/inbody:${c.pseudo}-->`;

    const fp = path.join(BLOG, c.file);
    let html = fs.readFileSync(fp, 'utf8');
    // 2026-08-23: the old code replaced an existing block in place, so changing `after`
    // silently did nothing and the photo stayed where it was first injected. Strip any
    // existing block first, then insert at the anchor — `after` is authoritative, and
    // re-running still produces the same file.
    const marker = new RegExp(`<!--inbody:${c.pseudo}-->[\\s\\S]*?<!--/inbody:${c.pseudo}-->\\n?`);
    const stripped = html.replace(marker, '');
    const idx = stripped.indexOf(c.after);
    if (idx === -1) { console.log('SKIP (anchor not found) ' + c.file + ' :: ' + c.after); continue; }
    const insertAt = stripped.indexOf('\n', idx + c.after.length);
    const at = insertAt === -1 ? idx + c.after.length : insertAt;
    html = stripped.slice(0, at) + '\n' + fig + stripped.slice(at);
    fs.writeFileSync(fp, html);
    console.log(`OK    ${c.file} <- ${c.pseudo}.webp  [${rec.license}]`);
    ok++;
  }
  console.log(`Injected in-body: ${ok}/${CONFIG.length}`);
}
run();

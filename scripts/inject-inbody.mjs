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
    await sharp(src).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);

    const title = cleanTitle(rec.title);
    const artist = artistName(rec.artist_html);
    const fig =
`<!--inbody:${c.pseudo}-->
<figure class="lead-photo">
  <img src="img/${c.pseudo}.webp" alt="${esc(title)}" loading="lazy" width="1280" decoding="async">
  <figcaption>${esc(title)} — photo by ${esc(artist)}, <a href="${esc(rec.license_url || '')}" target="_blank" rel="noopener nofollow">${esc(rec.license || 'CC')}</a>, via <a href="${esc(rec.source_page || '')}" target="_blank" rel="noopener nofollow">Wikimedia Commons</a></figcaption>
</figure>
<!--/inbody:${c.pseudo}-->`;

    const fp = path.join(BLOG, c.file);
    let html = fs.readFileSync(fp, 'utf8');
    const marker = new RegExp(`<!--inbody:${c.pseudo}-->[\\s\\S]*?<!--/inbody:${c.pseudo}-->\\n?`);
    if (marker.test(html)) {
      html = html.replace(marker, fig + '\n');
    } else {
      const idx = html.indexOf(c.after);
      if (idx === -1) { console.log('SKIP (anchor not found) ' + c.file + ' :: ' + c.after); continue; }
      const insertAt = html.indexOf('\n', idx + c.after.length);
      const at = insertAt === -1 ? idx + c.after.length : insertAt;
      html = html.slice(0, at) + '\n' + fig + html.slice(at);
    }
    fs.writeFileSync(fp, html);
    console.log(`OK    ${c.file} <- ${c.pseudo}.webp  [${rec.license}]`);
    ok++;
  }
  console.log(`Injected in-body: ${ok}/${CONFIG.length}`);
}
run();

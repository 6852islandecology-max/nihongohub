// One-shot (2026-08-06): add kback boxes from anime cluster articles to the
// Japan-only merch hub. Idempotent: skips files already linking the target.
import fs from 'node:fs';
import path from 'node:path';

const BLOG = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'blog');
const TARGET = 'japan-only-anime-merch-guide.html';

const JOBS = [
  {
    file: 'anime-pilgrimage-japan.html',
    box: `  <div class="kback">
    <b>&#128717; The merch you can only get here</b>
    <p style="margin:6px 0 0">Pilgrimage towns are also where Japan-only goods live &mdash; venue exclusives, regional gachapon, store bonuses. Our <a href="japan-only-anime-merch-guide.html">Japan-only anime merch guide &#8594;</a> maps what exists and how to get it (even from overseas).</p>
  </div>\n\n`,
  },
  {
    file: 'character-manholes-japan.html',
    box: `  <div class="kback">
    <b>&#128717; Beyond the covers: Japan-only merch</b>
    <p style="margin:6px 0 0">The towns behind these manholes often stock goods sold nowhere else. See our <a href="japan-only-anime-merch-guide.html">Japan-only anime &amp; character merch guide &#8594;</a> for what's genuinely Japan-locked and the honest ways to buy it.</p>
  </div>\n\n`,
  },
  {
    file: 'pokefuta-pokemon-manholes-japan.html',
    box: `  <div class="kback">
    <b>&#128717; Chasing Japan-only Pok&eacute;mon goods too?</b>
    <p style="margin:6px 0 0">Pok&eacute;mon Center Japan exclusives never ship overseas directly. Our <a href="japan-only-anime-merch-guide.html">Japan-only merch guide &#8594;</a> covers what's exclusive and the realistic routes &mdash; in person or by proxy.</p>
  </div>\n\n`,
  },
];

let ok = 0, skip = 0, fail = 0;
for (const j of JOBS) {
  const p = path.join(BLOG, j.file);
  if (!fs.existsSync(p)) { console.log('MISSING ' + j.file); fail++; continue; }
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes(TARGET)) { console.log('SKIP    ' + j.file); skip++; continue; }
  let idx = html.indexOf('<div class="aff" id="nl-box"');
  if (idx < 0) idx = html.lastIndexOf('</article>');
  if (idx < 0) { console.log('NO-ANCHOR ' + j.file); fail++; continue; }
  html = html.slice(0, idx) + j.box + html.slice(idx);
  fs.writeFileSync(p, html, 'utf8');
  console.log('OK      ' + j.file); ok++;
}
console.log(`done: ok=${ok} skip=${skip} fail=${fail}`);

// Inject a newsletter CTA box before </article> in the winning collectible-cluster articles.
// Idempotent: skips files that already contain id="nl-box".
import fs from 'node:fs';
import path from 'node:path';

const BLOG = 'C:/Users/Yurik/.secretary/projects/nihongohub/blog';
const TARGETS = [
  'manhole-cards-japan.html',
  'gundam-manholes-japan.html',
  'character-manholes-japan.html',
  'goshuin-temple-shrine-stamps.html',
  'goshuincho-guide-japan.html',
  'japan-100-castles-goshuin.html',
  'anime-pilgrimage-japan.html',
  'eki-stamps-japan.html',
  'michi-no-eki-stamp-rally-japan.html',
  'pokefuta-pokemon-manholes-japan.html',
];

const BOX = `
  <div class="aff" id="nl-box" style="background:#f4efe6;border-color:#b8a88a">
    <b style="font-family:inherit;color:#6b5b3e">One honest note from Japan, in your inbox</b>
    <p style="margin:6px 0 0">We're a Japanese family of three traveling all 47 prefectures with our kid, and this guide comes from that road. Our free newsletter <b>47 Notes from Japan</b> shares the travel notes, collectible finds, and real-life Japanese that don't fit in a guide. No spam, unsubscribe anytime.</p>
    <div style="margin-top:6px">
      <a href="https://ikimonohakasefamily.substack.com" target="_blank" rel="noopener" data-aff="newsletter">&#128238; Subscribe free on Substack &#8594;</a>
    </div>
  </div>

`;

let changed = 0, skipped = 0, missing = 0;
for (const f of TARGETS) {
  const p = path.join(BLOG, f);
  if (!fs.existsSync(p)) { console.log('MISSING ' + f); missing++; continue; }
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('id="nl-box"')) { console.log('SKIP    ' + f); skipped++; continue; }
  const idx = html.lastIndexOf('</article>');
  if (idx < 0) { console.log('NO-ANCHOR ' + f); missing++; continue; }
  html = html.slice(0, idx) + BOX + html.slice(idx);
  fs.writeFileSync(p, html, 'utf8');
  console.log('OK      ' + f);
  changed++;
}
console.log(`done: changed=${changed} skipped=${skipped} problems=${missing}`);

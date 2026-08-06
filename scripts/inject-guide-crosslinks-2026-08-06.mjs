// One-shot (2026-08-06): add kback cross-link boxes from cluster articles to the two
// new Amazon buying guides (gunpla-starter-kits-guide / japanese-castle-model-kits-guide).
// Idempotent: skips files already linking to the target guide.
import fs from 'node:fs';
import path from 'node:path';

const BLOG = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'blog');

const JOBS = [
  {
    file: 'gundam-manholes-japan.html', target: 'gunpla-starter-kits-guide.html',
    box: `  <div class="kback">
    <b>&#129521; Saw the manholes &mdash; now build the robot</b>
    <p style="margin:6px 0 0">If hunting Gundam manholes put you in the mood to make something, our <a href="gunpla-starter-kits-guide.html">Gunpla starter kit guide &#8594;</a> compares the beginner-friendly Entry Grade, HG and RG kits (and which ones need no tools at all).</p>
  </div>\n\n`,
  },
  {
    file: 'character-manholes-japan.html', target: 'gunpla-starter-kits-guide.html',
    box: `  <div class="kback">
    <b>&#129521; Take the hobby home</b>
    <p style="margin:6px 0 0">Chasing character manholes often ends in a hobby shop. If Gundam is your franchise, see our <a href="gunpla-starter-kits-guide.html">beginner Gunpla kit comparison &#8594;</a> for what to build first.</p>
  </div>\n\n`,
  },
  {
    file: 'anime-pilgrimage-japan.html', target: 'gunpla-starter-kits-guide.html',
    box: `  <div class="kback">
    <b>&#129521; Bring the pilgrimage home</b>
    <p style="margin:6px 0 0">A lot of seichi junrei trips end with a model kit in the suitcase. If Gundam sites were on your route, our <a href="gunpla-starter-kits-guide.html">Gunpla starter kit guide &#8594;</a> covers the beginner grades worth building.</p>
  </div>\n\n`,
  },
  {
    file: 'japan-100-castles-goshuin.html', target: 'japanese-castle-model-kits-guide.html',
    box: `  <div class="kback">
    <b>&#127983; Put a castle on your shelf</b>
    <p style="margin:6px 0 0">Finished (or just started) your castle stamp book? Our <a href="japanese-castle-model-kits-guide.html">Japanese castle model kit guide &#8594;</a> compares Himeji, Nagoya and Kumamoto kits you can build at home between trips.</p>
  </div>\n\n`,
  },
  {
    file: 'nagoya-aichi-collectibles.html', target: 'japanese-castle-model-kits-guide.html',
    box: `  <div class="kback">
    <b>&#127983; Nagoya Castle, desk-size</b>
    <p style="margin:6px 0 0">Can't get enough of the golden shachihoko? Our <a href="japanese-castle-model-kits-guide.html">castle model kit guide &#8594;</a> includes a Nagoya Castle kit alongside Himeji and Kumamoto.</p>
  </div>\n\n`,
  },
  {
    file: 'one-piece-kumamoto-statues.html', target: 'japanese-castle-model-kits-guide.html',
    box: `  <div class="kback">
    <b>&#127983; Kumamoto Castle at home</b>
    <p style="margin:6px 0 0">Kumamoto Castle anchors the statue route &mdash; and it also exists as a buildable kit. See our <a href="japanese-castle-model-kits-guide.html">Japanese castle model kit guide &#8594;</a>.</p>
  </div>\n\n`,
  },
];

let ok = 0, skip = 0, fail = 0;
for (const j of JOBS) {
  const p = path.join(BLOG, j.file);
  if (!fs.existsSync(p)) { console.log('MISSING ' + j.file); fail++; continue; }
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes(j.target)) { console.log('SKIP    ' + j.file); skip++; continue; }
  // Insert before the newsletter box when present, else before </article>.
  let idx = html.indexOf('<div class="aff" id="nl-box"');
  if (idx < 0) idx = html.lastIndexOf('</article>');
  if (idx < 0) { console.log('NO-ANCHOR ' + j.file); fail++; continue; }
  html = html.slice(0, idx) + j.box + html.slice(idx);
  fs.writeFileSync(p, html, 'utf8');
  console.log('OK      ' + j.file); ok++;
}
console.log(`done: ok=${ok} skip=${skip} fail=${fail}`);

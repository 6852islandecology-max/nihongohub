// One-shot (2026-08-06): add kback cross-link boxes from the goshuin / kissaten cluster
// articles to the matcha & tea ceremony set buying guide.
// This guide is designed to convert from internal traffic rather than SERP, so these
// four boxes are the conversion path, not a nicety.
// Idempotent: skips files already linking to the target guide.
import fs from 'node:fs';
import path from 'node:path';

const BLOG = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'blog');

const TARGET = 'matcha-tea-ceremony-sets-guide.html';

const JOBS = [
  {
    file: 'goshuin-temple-shrine-stamps.html',
    box: `  <div class="kback">
    <b>&#127861; The bowl of tea that came with the stamp</b>
    <p style="margin:6px 0 0">Plenty of temples hand you a bowl of matcha and a sweet while your goshuin is being written. If that pause is the part you want to keep, our <a href="${TARGET}">matcha and tea ceremony set comparison &#8594;</a> covers which whisk sets include a bowl, which don't, and what to buy first.</p>
  </div>\n\n`,
  },
  {
    file: 'kirie-goshuin-japan.html',
    box: `  <div class="kback">
    <b>&#127861; Slow craft, at home</b>
    <p style="margin:6px 0 0">Kirie goshuin appeal to the same taste as hand-split bamboo tools. See our <a href="${TARGET}">matcha and tea ceremony set comparison &#8594;</a> for the chasen, chashaku and bowl sets worth owning &mdash; and the one accessory most people forget.</p>
  </div>\n\n`,
  },
  {
    file: 'autumn-goshuin-momiji-japan.html',
    box: `  <div class="kback">
    <b>&#127861; Momiji season, and a bowl of tea</b>
    <p style="margin:6px 0 0">Autumn temple visits usually end sitting down with a bowl of matcha. Our <a href="${TARGET}">matcha and tea ceremony set comparison &#8594;</a> compares five whisk and utensil sets, including which ones actually work as gifts.</p>
  </div>\n\n`,
  },
  {
    file: 'kissaten-showa-retro-japan.html',
    box: `  <div class="kback">
    <b>&#127861; Bringing the counter home</b>
    <p style="margin:6px 0 0">If what you liked about kissaten was one drink made slowly and properly, matcha is the version you can practise at home. Our <a href="${TARGET}">matcha and tea ceremony set comparison &#8594;</a> covers bamboo versus electric, and what each set leaves out.</p>
  </div>\n\n`,
  },
];

let ok = 0, skip = 0, fail = 0;
for (const j of JOBS) {
  const p = path.join(BLOG, j.file);
  if (!fs.existsSync(p)) { console.log('MISSING ' + j.file); fail++; continue; }
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes(TARGET)) { console.log('SKIP    ' + j.file); skip++; continue; }
  // Insert before the newsletter box when present, else before </article>.
  let idx = html.indexOf('<div class="aff" id="nl-box"');
  if (idx < 0) idx = html.lastIndexOf('</article>');
  if (idx < 0) { console.log('NO-ANCHOR ' + j.file); fail++; continue; }
  html = html.slice(0, idx) + j.box + html.slice(idx);
  fs.writeFileSync(p, html, 'utf8');
  console.log('OK      ' + j.file); ok++;
}
console.log(`done: ok=${ok} skip=${skip} fail=${fail}`);

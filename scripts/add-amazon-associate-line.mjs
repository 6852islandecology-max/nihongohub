// One-shot (2026-08-06): append the Amazon Associates required disclosure sentence
// to the disclose paragraph of every blog page that carries Amazon affiliate links.
// Idempotent: skips files that already contain the sentence.
import fs from 'node:fs';
import path from 'node:path';

const BLOG = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'blog');
const LINE = ' As an Amazon Associate, NihongoHub earns from qualifying purchases.';

let ok = 0, skip = 0, none = 0;
for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.html'))) {
  const p = path.join(BLOG, f);
  let html = fs.readFileSync(p, 'utf8');
  if (!html.includes('data-aff="amazon"')) continue;
  if (html.includes('As an Amazon Associate')) { skip++; continue; }
  // Append inside the first paragraph that carries the affiliate disclosure wording.
  const m = html.match(/<p class="disclose"[^>]*>[\s\S]*?<\/p>/);
  if (!m) { console.log('NO-DISCLOSE ' + f); none++; continue; }
  const patched = m[0].replace(/<\/p>$/, LINE + '</p>');
  html = html.replace(m[0], patched);
  fs.writeFileSync(p, html, 'utf8');
  console.log('OK ' + f);
  ok++;
}
console.log(`done: ok=${ok} already=${skip} no-disclose=${none}`);

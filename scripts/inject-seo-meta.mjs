// One-shot injector: adds canonical + favicon + og:image meta + twitter:card
// to every .html file that doesn't already have a canonical link.
// Run from the project root: `node scripts/inject-seo-meta.mjs`
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://www.nihongo-hub.com';
const OG = SITE + '/og-default.png';

function urlFor(relPath) {
  const posix = relPath.split(path.sep).join('/');
  if (posix === 'index.html') return SITE + '/';
  if (posix.endsWith('/index.html')) return SITE + '/' + posix.replace(/index\.html$/, '');
  return SITE + '/' + posix;
}

function metaBlock(canonical) {
  return [
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="icon" href="/favicon.ico" sizes="any">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${OG}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:site_name" content="NihongoHub">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${OG}">`,
  ].join('\n');
}

const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (name.endsWith('.html')) files.push(p);
  }
}
walk('.');

let modified = 0, skipped = 0;
for (const f of files) {
  const rel = path.relative('.', f);
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes('rel="canonical"')) { skipped++; continue; }
  const m = html.match(/<head[^>]*>/i);
  if (!m) { skipped++; continue; }
  const insertAt = m.index + m[0].length;
  const block = '\n' + metaBlock(urlFor(rel)) + '\n';
  const updated = html.slice(0, insertAt) + block + html.slice(insertAt);
  fs.writeFileSync(f, updated);
  modified++;
}
console.log('modified:', modified, 'skipped:', skipped, 'total:', files.length);

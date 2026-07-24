// canonical + favicon + og:image meta + twitter:card を、canonical をまだ持たない
// .html すべてに入れる。canonical がある file は触らない（= 何度実行しても安全）。
//
// 2026-07-24: 「One-shot」と書かれていたが、実際には build-guides.mjs が blog/<slug>.html を
// 全文再生成するたびに canonical が消えるので、繰り返し必要。scripts/build-blog.mjs の一段に組み込んだ。
// あわせて --dry と --dir を足した。これまでは実行するまで影響範囲が分からなかった。
//
// Run from the project root:
//   node scripts/inject-seo-meta.mjs --dry          何が変わるか見るだけ
//   node scripts/inject-seo-meta.mjs --dir=blog     blog/ 配下だけに限定
//   node scripts/inject-seo-meta.mjs                全体
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const dirArg = argv.find((a) => a.startsWith('--dir='));
const ROOT_DIR = dirArg ? dirArg.split('=')[1] : '.';

const SITE = 'https://www.nihongo-hub.com';
const OG = SITE + '/og-default.png';

function urlFor(relPath) {
  const posix = relPath.split(path.sep).join('/');
  if (posix === 'index.html') return SITE + '/';
  if (posix.endsWith('/index.html')) return SITE + '/' + posix.replace(/index\.html$/, '');
  return SITE + '/' + posix;
}

// 2026-07-24: 「ブロックを丸ごと入れる」から「足りないタグだけ入れる」に変えた。
//
// きっかけ: canonical を持たない blog HTML 215 本のうち 210 本は、inject-lead-photo が入れた
// 記事固有の og:image を既に持っていた。丸ごと挿入すると og-default.png が <head> の先頭に
// 入り、リード写真より前に出る。多くのクローラは先頭を採るため、210 記事の SNS プレビュー画像が
// 汎用画像に差し替わってしまう。canonical を足しに行ったつもりで og:image を壊す、という事故になる。
//
// 各タグを「そのページに無いときだけ」入れる形にすれば、canonical の補完と
// 既存 og:image の温存を両立できる。
function metaTags(canonical, html) {
  const has = (re) => re.test(html);
  const out = [];
  if (!has(/rel="canonical"/)) out.push(`<link rel="canonical" href="${canonical}">`);
  if (!has(/rel="icon"/)) {
    out.push(`<link rel="icon" href="/favicon.ico" sizes="any">`);
    out.push(`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">`);
  }
  if (!has(/rel="apple-touch-icon"/)) out.push(`<link rel="apple-touch-icon" href="/apple-touch-icon.png">`);
  if (!has(/property="og:url"/)) out.push(`<meta property="og:url" content="${canonical}">`);
  const hasOgImage = has(/property="og:image"/);
  if (!hasOgImage) {
    out.push(`<meta property="og:image" content="${OG}">`);
    out.push(`<meta property="og:image:width" content="1200">`);
    out.push(`<meta property="og:image:height" content="630">`);
  }
  if (!has(/property="og:site_name"/)) out.push(`<meta property="og:site_name" content="NihongoHub">`);
  if (!has(/name="twitter:card"/)) out.push(`<meta name="twitter:card" content="summary_large_image">`);
  // twitter:image は og:image が無いときだけ入れる。
  // 記事固有の og:image があるのに twitter:image に汎用画像を入れると、
  // X 側だけ汎用画像になって食い違う（Twitter は twitter:image が無ければ og:image を使う）。
  if (!has(/name="twitter:image"/) && !hasOgImage) out.push(`<meta name="twitter:image" content="${OG}">`);
  return out;
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
walk(ROOT_DIR);

let modified = 0, skipped = 0;
const touched = [];
for (const f of files) {
  const rel = path.relative('.', f);
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes('rel="canonical"')) { skipped++; continue; }
  const m = html.match(/<head[^>]*>/i);
  if (!m) { skipped++; continue; }
  const tags = metaTags(urlFor(rel), html);
  if (!tags.length) { skipped++; continue; }
  touched.push(`${rel}  (+${tags.length} tags)`);
  if (DRY) { modified++; continue; }
  const insertAt = m.index + m[0].length;
  const block = '\n' + tags.join('\n') + '\n';
  const updated = html.slice(0, insertAt) + block + html.slice(insertAt);
  fs.writeFileSync(f, updated);
  modified++;
}
if (DRY) {
  console.log('--dry: 以下に不足タグを入れる（書き込みはしない）');
  touched.forEach((t) => console.log('  ' + t));
}
console.log(DRY ? 'would modify:' : 'modified:', modified, 'skipped:', skipped, 'total:', files.length);

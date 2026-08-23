#!/usr/bin/env node
// Inject one indexable CC lead photo per blog article, for Google Image Search / SEO.
// Source: 成果物/Marketing/NihongoHub/visual/library (Wikimedia Commons CC, attribution in manifest.json).
// Per article it: optimizes a webp, injects <figure> after the lede, sets og:image, and
// upgrades JSON-LD image -> ImageObject. Applies to all locale variants (en/es/id/th/zh).
// Idempotent: re-running replaces the previously injected block (marked <!--lead-photo-->).
//
// Usage:
//   node scripts/inject-lead-photo.mjs aichi hokkaido mie     # specific slugs
//   node scripts/inject-lead-photo.mjs --all-prefectures      # all 47 with library photos
//   node scripts/inject-lead-photo.mjs --report               # print selection table only, no writes

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const HOME = os.homedir();
const SITE = path.join(HOME, '.secretary/projects/nihongohub');
const BLOG = path.join(SITE, 'blog');
const IMGDIR = path.join(BLOG, 'img');
const MANIFEST = path.join(HOME, '成果物/Marketing/NihongoHub/visual/library/manifest.json');
const LOCALES = ['', 'es/', 'id/', 'th/', 'zh/']; // '' = root english
const BASE_URL = 'https://www.nihongo-hub.com';

// 47 prefecture slugs == manifest keys
const PREF_TITLE = { // Proper-cased prefecture label for alt text
  aichi:'Aichi', akita:'Akita', aomori:'Aomori', chiba:'Chiba', ehime:'Ehime', fukui:'Fukui',
  fukuoka:'Fukuoka', fukushima:'Fukushima', gifu:'Gifu', gunma:'Gunma', hiroshima:'Hiroshima',
  hokkaido:'Hokkaido', hyogo:'Hyogo', ibaraki:'Ibaraki', ishikawa:'Ishikawa', iwate:'Iwate',
  kagawa:'Kagawa', kagoshima:'Kagoshima', kanagawa:'Kanagawa', kochi:'Kochi', kumamoto:'Kumamoto',
  kyoto:'Kyoto', mie:'Mie', miyagi:'Miyagi', miyazaki:'Miyazaki', nagano:'Nagano', nagasaki:'Nagasaki',
  nara:'Nara', niigata:'Niigata', oita:'Oita', okayama:'Okayama', okinawa:'Okinawa', osaka:'Osaka',
  saga:'Saga', saitama:'Saitama', shiga:'Shiga', shimane:'Shimane', shizuoka:'Shizuoka',
  tochigi:'Tochigi', tokushima:'Tokushima', tokyo:'Tokyo', tottori:'Tottori', toyama:'Toyama',
  wakayama:'Wakayama', yamagata:'Yamagata', yamaguchi:'Yamaguchi', yamanashi:'Yamanashi',
};

// Optional manual override: prefer a specific filename for a slug (set after quality review).
const PREFER = {
  // aichi: 'Some_Better_Photo.jpg',
};

// Clean English subject override where the source title is non-English or messy.
const SUBJECT_OVERRIDE = {
  'gundam-manholes-japan': 'Gundam statue, Odaiba',
  'goshuin-temple-shrine-stamps': 'Goshuin stamp book',
  'buy-from-japan-proxy-services': 'Japanese red postbox',
  'eki-stamps-japan': 'Railway station platform',
  'character-manholes-japan': 'Decorative manhole cover',
  'goshuincho-guide-japan': 'Goshuin stamp book',
  'michi-no-eki-stamp-rally-japan': 'Roadside station (michi-no-eki)',
  'sailor-moon-manholes-tokyo': 'Tokyo Tower from Shiba Park',
  'evangelion-hakone-guide': 'Hakone Shrine torii on Lake Ashi, with Mt. Fuji',
  'one-piece-kumamoto-statues': 'Mount Aso crater, Kumamoto',
  'slam-dunk-kamakura-crossing': 'Kamakurakōkōmae Station, Enoden line',
  'gunpla-starter-kits-guide': 'Life-size Unicorn Gundam statue, Odaiba',
  'japanese-castle-model-kits-guide': 'Himeji Castle with cherry blossoms',
  'japan-only-anime-merch-guide': 'Gashapon capsule-toy machines',
  'tori-no-ichi-kumade-japan': 'Kumade stalls at tori-no-ichi, Asakusa',
  'shichifukujin-meguri-japan': 'Bentendō on Shinobazu Pond, Ueno',
  'daruma-markets-japan': 'Daruma dolls at Daruma-ji, Takasaki',
  'yamanote-line-departure-melodies': 'E235 series train on the Yamanote Line, Tokyo',
  'japan-station-melodies-by-region': '323 series train on the Osaka Loop Line',
  'japanese-razors-feather-kai-guide': 'Feather Popular double-edge safety razor, made in Seki',
  'japanese-hand-tools-saws-chisels-planes-guide': 'Japanese dozuki pull saw with a replaceable blade',
};

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

// --- scoring: prefer iconic landscape photos over generic interiors/roads ---
const GOOD = /castle|shrine|jinja|temple|tera|ji\b|lake|mount|mt\.|river|coast|sea|bay|garden|park|falls|waterfall|gorge|valley|village|town|street|harbor|harbour|island|cherry|sakura|autumn|snow|festival|matsuri|tower|bridge|pagoda|terrace|rice|onsen|spring|cliff|beach|forest|shr/i;
const BAD = /interior|museum|chart|map|diagram|sign|board|admiralty|parking|road_r\d|prefectural_road/i;

function scoreImg(e) {
  let s = 0;
  const land = e.width >= e.height;
  s += land ? 200 : 0;                       // landscape strongly preferred
  s += Math.min(e.width, 4000) / 50;         // resolution, capped
  const t = (e.title || e.filename || '');
  if (GOOD.test(t)) s += 120;
  if (BAD.test(t)) s -= 150;
  if (e.width < 1000) s -= 80;               // too small to be a good lead
  return s;
}

function humanizeTitle(raw, pref) {
  let t = String(raw || '').replace(/^File:/, '').replace(/\.(jpe?g|png|webp|gif|tif|jpeg)$/i, '');
  t = t.replace(/[_]+/g, ' ').trim();
  t = t.replace(/^\d{6,}\s+/, '');                     // leading date string 20181111
  t = t.replace(/\s*\(\s*\d+\s*\)\s*$/, '');           // trailing (62)
  t = t.replace(/\s+\d{6,}\s*$/, '');                  // trailing date string
  t = t.replace(/[-\s]+\d{1,3}\s*$/, '');              // trailing counter -1 / 50 / 02
  t = t.replace(/\s+\d{4}\s*$/, '');                   // trailing year
  // drop redundant "... [,/in] <Pref> Prefecture Japan" tail (alt appends it anyway)
  if (pref) t = t.replace(new RegExp(`[,\\s]+(in\\s+)?${pref}(\\s+Prefecture)?(\\s+Japan)?\\s*$`, 'i'), '');
  t = t.replace(/[,\s]+Japan\s*$/i, '');
  // title-case ALLCAPS words, leave normal words alone
  t = t.split(' ').map(w => (/^[A-Z]{2,}$/.test(w) ? w[0] + w.slice(1).toLowerCase() : w)).join(' ');
  t = t.replace(/\s*,\s*,+/g, ',').replace(/[\s,]+$/g, '').replace(/\s{2,}/g, ' ').trim();
  return t;
}

// Clean, SEO-friendly subject from the search query (the article's headline landmark),
// which is far cleaner than the Commons filename. Dedupes repeated words, title-cases.
function titleCaseQuery(q) {
  const seen = new Set(), out = [];
  for (const w of q.split(/\s+/)) {
    const k = w.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(/^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w);
  }
  return out.join(' ').trim();
}

function subjectOf(slug, e, pref) {
  if (SUBJECT_OVERRIDE[slug]) return SUBJECT_OVERRIDE[slug];
  if (e.fetched_from === 'wikimedia' && e.query) return titleCaseQuery(e.query);
  return humanizeTitle(e.title, pref);
}

function parseArtist(html) {
  if (!html) return { text: 'Unknown', href: '' };
  const text = html.replace(/<[^>]+>/g, '').trim() || 'Unknown';
  const m = html.match(/href="([^"]+)"/);
  let href = m ? m[1] : '';
  if (href.startsWith('//')) href = 'https:' + href;
  return { text, href };
}

function kebab(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const CREDITS_PATH = path.join(BLOG, 'img-credits.json');
const credits = fs.existsSync(CREDITS_PATH) ? JSON.parse(fs.readFileSync(CREDITS_PATH, 'utf8')) : {};

function pick(slug) {
  // 1) prefer a Wikimedia-fetched image keyed to the article's headline landmark
  if (credits[slug] && fs.existsSync(credits[slug].path)) return credits[slug];
  // 2) fall back to the curated library
  const entries = (manifest.entries[slug] || []).filter(e => fs.existsSync(e.path));
  if (!entries.length) return null;
  if (PREFER[slug]) {
    const f = entries.find(e => e.filename === PREFER[slug]);
    if (f) return f;
  }
  return entries.slice().sort((a, b) => scoreImg(b) - scoreImg(a))[0];
}

async function buildImage(slug, e, subject) {
  fs.mkdirSync(IMGDIR, { recursive: true });
  const slugPart = kebab(subject) || slug;
  const outName = `${slug}-${slugPart}.webp`;
  const outPath = path.join(IMGDIR, outName);
  const meta = await sharp(e.path).resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(outPath);
  return { outName, subject, w: meta.width, h: meta.height };
}

function injectFile(absFile, { slug, pref, subject, outName, alt, captionHtml, fullUrl, license, source, artistText }) {
  if (!fs.existsSync(absFile)) return false;
  let html = fs.readFileSync(absFile, 'utf8');
  const isRoot = !/\/(es|id|th|zh)\//.test(absFile.replace(/\\/g, '/'));
  const imgSrc = isRoot ? `img/${outName}` : `../img/${outName}`;

  const figure =
`<!--lead-photo-->
<figure class="lead-photo">
  <img src="${imgSrc}" alt="${esc(alt)}" loading="lazy" width="1280" decoding="async">
  <figcaption>${captionHtml}</figcaption>
</figure>
<!--/lead-photo-->`;

  // 1) body: replace existing block, or use a bare opening marker as the insertion
  //    point, or fall back to inserting after the lede paragraph.
  //    2026-08-23: a hand-written article that carried only <!--lead-photo--> (no closing
  //    marker) took the first branch, matched nothing, and was silently left photo-less
  //    while the script still reported OK. A bare marker now means "put it here".
  if (/<!--lead-photo-->[\s\S]*?<!--\/lead-photo-->/.test(html)) {
    html = html.replace(/<!--lead-photo-->[\s\S]*?<!--\/lead-photo-->/, figure);
  } else if (html.includes('<!--lead-photo-->')) {
    html = html.replace('<!--lead-photo-->', figure);
  } else {
    html = html.replace(/(<p class="lede">[\s\S]*?<\/p>)/, `$1\n${figure}`);
  }

  // 2) og:image (insert once after og:type, else replace)
  if (/property="og:image"/.test(html)) {
    html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${fullUrl}">`);
  } else {
    html = html.replace(/(<meta property="og:type"[^>]*>)/, `$1\n<meta property="og:image" content="${fullUrl}">`);
  }

  // 3) JSON-LD image -> ImageObject
  const imageObj = JSON.stringify({
    '@type': 'ImageObject', url: fullUrl, contentUrl: fullUrl,
    caption: alt, creditText: artistText, license, acquireLicensePage: source,
  });
  html = html.replace(/"image":"https:\/\/www\.nihongo-hub\.com\/og-default\.png"/, `"image":${imageObj}`);
  // re-runs: replace an already-injected ImageObject too
  html = html.replace(/"image":\{"@type":"ImageObject"[^}]*\}/, `"image":${imageObj}`);

  fs.writeFileSync(absFile, html);
  return true;
}

function ensureCss() {
  const cssPath = path.join(BLOG, 'blog.css');
  let css = fs.readFileSync(cssPath, 'utf8');
  if (css.includes('.lead-photo')) return;
  css += `

/* lead photo (CC, for image-search SEO) */
.lead-photo{margin:16px 0 18px;border-radius:12px;overflow:hidden;border:2px solid #e6ddd0;background:#fbf6ec}
.lead-photo img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
.lead-photo figcaption{font-size:11.5px;color:#7a6e5c;padding:6px 12px;line-height:1.5}
.lead-photo figcaption a{color:#9c6b1f;text-decoration:none}
.lead-photo figcaption a:hover{text-decoration:underline}
`;
  fs.writeFileSync(cssPath, css);
}

async function processSlug(slug, report) {
  const isPref = !!PREF_TITLE[slug];
  const pref = PREF_TITLE[slug] || '';
  const e = pick(slug);
  if (!e) { console.log(`SKIP   ${slug.padEnd(11)} (no usable photo)`); return { slug, ok: false }; }
  const subject = subjectOf(slug, e, pref);
  const { text: artistText, href: artistHref } = parseArtist(e.artist_html);
  const license = e.license_url || e.license || '';
  const licLabel = e.license || 'CC';
  const source = e.source_page;
  if (report) {
    console.log(`${slug.padEnd(11)} ${String(e.width).padStart(4)}x${String(e.height).toString().padEnd(4)} ${licLabel.padEnd(6)} ${subject}`);
    return { slug, ok: true, subject };
  }
  const { outName, w, h } = await buildImage(slug, e, subject);
  const alt = isPref ? `${subject}, ${pref} Prefecture, Japan` : `${subject}, Japan`;
  const fullUrl = `${BASE_URL}/blog/img/${outName}`;
  const artistLink = artistHref ? `<a href="${esc(artistHref)}" target="_blank" rel="noopener nofollow">${esc(artistText)}</a>` : esc(artistText);
  const licLink = (e.license_url) ? `<a href="${esc(e.license_url)}" target="_blank" rel="noopener nofollow">${esc(licLabel)}</a>` : esc(licLabel);
  const captionHtml =
    `${esc(subject)} — photo by ${artistLink}, ${licLink}, via ` +
    `<a href="${esc(source)}" target="_blank" rel="noopener nofollow">Wikimedia Commons</a>`;
  let n = 0;
  for (const loc of LOCALES) {
    const f = path.join(BLOG, loc, `${slug}.html`);
    if (injectFile(f, { slug, pref, subject, outName, alt, captionHtml, fullUrl, license, source, artistText })) n++;
  }
  console.log(`OK     ${slug.padEnd(11)} -> img/${outName} (${w}x${h})  [${n} locale files]`);
  return { slug, ok: true, outName, subject };
}

async function main() {
  const args = process.argv.slice(2);
  const report = args.includes('--report');
  let slugs = args.filter(a => !a.startsWith('--'));
  if (args.includes('--all-prefectures') || (!slugs.length && report)) slugs = Object.keys(PREF_TITLE);
  if (args.includes('--all')) {
    // every article that has a fetched credit or a library entry, prefectures first
    const set = new Set([...Object.keys(PREF_TITLE), ...Object.keys(credits), ...Object.keys(manifest.entries)]);
    slugs = [...set].filter(s => fs.existsSync(path.join(BLOG, `${s}.html`)));
  }
  if (!slugs.length) { console.error('No slugs given. Use slugs, --all, --all-prefectures, or --report.'); process.exit(1); }

  if (!report) ensureCss();
  const results = [];
  for (const s of slugs) results.push(await processSlug(s, report));
  const ok = results.filter(r => r.ok).length;
  console.log(`\n${report ? 'Report' : 'Injected'}: ${ok}/${slugs.length} articles.`);
}

main().catch(e => { console.error(e); process.exit(1); });

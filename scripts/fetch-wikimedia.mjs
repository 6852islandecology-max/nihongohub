#!/usr/bin/env node
// Fetch one good CC-licensed lead photo per article from Wikimedia Commons,
// keyed to the article's headline landmark ("Top pick"). Captures attribution.
// Writes optimized source to blog/img-src/{slug}.jpg and a credit record to
// blog/img-credits.json. inject-lead-photo.mjs then prefers these over the library.
//
// Only free licenses are accepted (CC0, Public domain, CC BY, CC BY-SA).
//
// Usage:
//   node scripts/fetch-wikimedia.mjs                 # all configured targets
//   node scripts/fetch-wikimedia.mjs kyoto osaka     # specific slugs
//   node scripts/fetch-wikimedia.mjs --list          # print target queries, no fetch

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();
const BLOG = path.join(HOME, '.secretary/projects/nihongohub/blog');
const SRCDIR = path.join(BLOG, 'img-src');
const CREDITS = path.join(BLOG, 'img-credits.json');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'NihongoHub-leadphoto/1.0 (https://www.nihongo-hub.com; contact: support@nihongo-hub.com)';

// --- targets: slug -> { query, label } ----------------------------------
// Prefecture queries derived from each article's "Top pick" landmark.
const PREF = {
  aichi:'Nagoya Castle', akita:'Oga Peninsula Akita', aomori:'Sannai-Maruyama site',
  chiba:'Naritasan Shinshoji', ehime:'Dogo Onsen Honkan', fukui:'Eiheiji temple',
  fukuoka:'Dazaifu Tenmangu', fukushima:'Tsurugajo castle Aizu', gifu:'Shirakawa-go',
  gunma:'Tomioka Silk Mill', hiroshima:'Itsukushima Shrine torii Miyajima', hokkaido:'Otaru Canal',
  hyogo:'Himeji Castle', ibaraki:'Kairakuen garden Mito', ishikawa:'Kenrokuen garden',
  iwate:'Chusonji Konjikido Hiraizumi', kagawa:'Ritsurin Garden Takamatsu', kagoshima:'Sengan-en garden Sakurajima',
  kanagawa:'Great Buddha Kamakura Kotoku-in', kochi:'Kochi Castle', kumamoto:'Kumamoto Castle',
  kyoto:'Fushimi Inari Taisha torii', mie:'Ise Jingu Naiku', miyagi:'Matsushima Bay',
  miyazaki:'Takachiho Gorge', nagano:'Matsumoto Castle', nagasaki:'Glover Garden Nagasaki',
  nara:'Todaiji temple Nara deer', niigata:'Bandai Bridge Niigata', oita:'Beppu Hells jigoku',
  okayama:'Korakuen garden Okayama', okinawa:'Shuri Castle', osaka:'Osaka Castle tenshu keep tower',
  saga:'Yutoku Inari Shrine', saitama:'Kawagoe Kurazukuri street warehouse', shiga:'Hikone Castle',
  shimane:'Izumo Taisha', shizuoka:'Kunozan Toshogu', tochigi:'Nikko Toshogu',
  tokushima:'Awa Odori dance', tokyo:'Sensoji Asakusa Kaminarimon', tottori:'Tottori Sand Dunes',
  toyama:'Kurobe Dam', wakayama:'Koyasan Okunoin', yamagata:'Yamadera Risshakuji',
  yamaguchi:'Kintaikyo Bridge Iwakuni', yamanashi:'Chureito Pagoda Mount Fuji',
};
// Topic articles with a clearly photogenic subject (abstract/IP-sensitive topics omitted on purpose).
const TOPIC = {
  'goshuin-temple-shrine-stamps':'Goshuin stamp book',
  'gundam-manholes-japan':'Gundam statue Odaiba',
  'japan-100-castles-goshuin':'Matsumoto Castle Japan',
  'luxury-ryokan-guide':'Japanese ryokan onsen room',
  'manhole-cards-japan':'decorative manhole cover Japan',
  // Proxy/forwarding article: IP-safe neutral subject (parcels/post, not anime/Pokémon goods).
  'buy-from-japan-proxy-services':'Japanese red postbox street',
  'wildlife-watching-japan':'Japanese macaque snow monkey Jigokudani',
  'science-firefly-bioluminescence-japan':'Genji firefly Luciola',
  'anime-pilgrimage-japan':'Washinomiya shrine',
  // collectible-hunting cluster (2026-07): IP-safe, photogenic subjects (no character IP)
  'eki-stamps-japan':'Japanese railway station platform',
  'character-manholes-japan':'Kobe manhole cover Japan',
  'goshuincho-guide-japan':'goshuin stamp book',
  // franchise × place cluster (2026-07-17): public statues/landscapes, IP-safe subjects
  'sailor-moon-manholes-tokyo':'Tokyo Tower Shiba Park',
  'evangelion-hakone-guide':'Lake Ashi Hakone torii Mount Fuji',
  'one-piece-kumamoto-statues':'Mount Aso crater volcano',
  'slam-dunk-kamakura-crossing':'Kamakurakokomae Station Enoden',
  'michi-no-eki-stamp-rally-japan':'michi-no-eki roadside station',
  // 2026 travel & culture guides (photogenic only; abstract topics omitted)
  'japan-cash-or-card-2026':'Japanese yen coins',
  'is-japan-expensive-2026':'Dotonbori Osaka street',
  'japan-2026-travel-changes':'Shinkansen N700 bullet train',
  'konbini-guide-japan':'Lawson convenience store Japan',
  'kissaten-showa-retro-japan':'cream soda Japan',
  'renting-apartment-japan-foreigner':'danchi apartment Tokyo',
  // in-body (second) photos for travel guides
  'japan-cash-or-card-2026-b':'Japanese yen banknotes 1000 yen',
  'is-japan-expensive-2026-b':'tonkotsu ramen',
  'japan-2026-travel-changes-b':'Shinkansen platform Tokyo Station',
  'konbini-guide-japan-b':'onigiri rice ball',
  'kissaten-showa-retro-japan-b':'pudding a la mode parfait',
  'renting-apartment-japan-foreigner-b':'Japanese apartment interior room',
  // in-body (second) photos for the top-ranking collect/travel guides (mid-scroll visual rest)
  'manhole-cards-japan-b':'Japanese manhole cover',
  'goshuin-temple-shrine-stamps-b':'Kiyomizu-dera temple Kyoto',
  'japan-100-castles-goshuin-b':'Himeji Castle keep',
  'gundam-manholes-japan-b':'manhole cover Tokyo', // IP-safe: generic decorative manhole, not Gundam
  // collectible cluster wave 3 (2026-08): seasonal + event-timed spokes
  'kirie-goshuin-japan':'Ninnaji five-storied pagoda Kyoto',
  'autumn-goshuin-momiji-japan':'Tofukuji autumn leaves Kyoto',
  'nagoya-aichi-collectibles':'Inuyama Castle keep',
  // collectible cluster wave 4 (2026-08): winter/New Year luck-object markets
  'tori-no-ichi-kumade-japan':'Otori Shrine Asakusa Tokyo',
  'shichifukujin-meguri-japan':'Bentendo Shinobazu Pond Ueno',
  'daruma-markets-japan':'Shorinzan Darumaji Takasaki',
  // Amazon buying guides (2026-08-06): public-landmark leads (statue/castle, precedent = gundam-manholes)
  'gunpla-starter-kits-guide':'Life-Sized Unicorn Gundam Statue',
  'japanese-castle-model-kits-guide':'Himeji Castle cherry blossoms',
  // Japan-only merch hub (2026-08-06): IP-safe street subject (machines, no single character IP)
  'japan-only-anime-merch-guide':'Laika ac Gashapon Machines',
};
const TARGETS = { ...PREF, ...TOPIC };

const FREE_OK = /(^|\b)(cc0|public domain|cc[- ]by([- ]sa)?([- ]\d(\.\d)?)?|pd|pdmark)\b/i;
const FREE_BAD = /non[- ]free|fair use|copyright|all rights reserved|by-nc|by-nd|noncommercial|no derivativ/i;
const BAD_SUBJECT = /\bchart\b|\bmap\b|diagram|engraving|woodblock|ukiyo|lithograph|\b1[5-8]\d\d\b|logo|coat of arms|\bflag\b|locator|painting|\bsiege\b|\bbattle\b|folding screen|byobu|scroll|print of|drawing|sketch|portrait/i;

function stripHtml(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

async function apiSearch(query) {
  const u = new URL(API);
  u.search = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search',
    gsrsearch: query, gsrnamespace: '6', gsrlimit: '20',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600',
  }).toString();
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`API ${r.status} for "${query}"`);
  const j = await r.json();
  const pages = j?.query?.pages || {};
  return Object.values(pages).map(p => ({ title: p.title, info: (p.imageinfo || [])[0] })).filter(x => x.info);
}

function licenseOf(ext) {
  const short = stripHtml(ext?.LicenseShortName?.value);
  const mach = stripHtml(ext?.License?.value);
  const url = stripHtml(ext?.LicenseUrl?.value);
  const blob = `${short} ${mach}`;
  const free = (FREE_OK.test(blob) || /pd|public/i.test(mach)) && !FREE_BAD.test(blob);
  return { short: short || mach || 'CC', url, free };
}

function scoreCand(c, query) {
  const inf = c.info, ext = inf.extmetadata || {};
  const lic = licenseOf(ext);
  if (!lic.free) return -1e9;
  const mime = inf.mime || '';
  if (!/image\/(jpeg|png|webp)/.test(mime)) return -1e9;
  const title = c.title.replace(/^File:/, '');
  if (BAD_SUBJECT.test(title)) return -1e6;
  let s = 0;
  const land = inf.width >= inf.height;
  s += land ? 300 : -50;
  s += Math.min(inf.width, 4000) / 40;
  if (inf.width < 1000) s -= 200;
  // relevance: query tokens present in title
  const toks = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const tl = title.toLowerCase();
  s += toks.filter(t => tl.includes(t)).length * 60;
  return s;
}

async function download(url, dest) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function fetchOne(slug, query) {
  const cands = await apiSearch(query);
  const ranked = cands.map(c => ({ c, s: scoreCand(c, query) })).filter(x => x.s > -1e5).sort((a, b) => b.s - a.s);
  if (!ranked.length) return { slug, ok: false, reason: 'no free candidate' };
  const best = ranked[0].c, inf = best.info, ext = inf.extmetadata || {};
  const lic = licenseOf(ext);
  const ext2 = (inf.url.match(/\.(jpe?g|png|webp)$/i) || ['', 'jpg'])[1].toLowerCase();
  const srcPath = path.join(SRCDIR, `${slug}.${ext2 === 'jpeg' ? 'jpg' : ext2}`);
  fs.mkdirSync(SRCDIR, { recursive: true });
  const dlUrl = inf.thumburl || inf.url;
  const bytes = await download(dlUrl, srcPath);
  const rec = {
    query, title: best.title, path: srcPath.replace(/\\/g, '/'),
    source_page: inf.descriptionurl,
    license: lic.short, license_url: lic.url,
    artist_html: ext?.Artist?.value || '',
    width: inf.thumbwidth || inf.width, height: inf.thumbheight || inf.height,
    fetched_from: 'wikimedia',
  };
  return { slug, ok: true, rec, bytes };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    for (const [s, q] of Object.entries(TARGETS)) console.log(`${s.padEnd(36)} ${q}`);
    return;
  }
  let slugs = args.filter(a => !a.startsWith('--'));
  if (!slugs.length) slugs = Object.keys(TARGETS);
  const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, 'utf8')) : {};
  let ok = 0, fail = 0;
  for (const slug of slugs) {
    const q = TARGETS[slug];
    if (!q) { console.log(`SKIP  ${slug} (no target query)`); continue; }
    try {
      const r = await fetchOne(slug, q);
      if (r.ok) {
        credits[slug] = r.rec; ok++;
        const artist = stripHtml(r.rec.artist_html) || 'Unknown';
        console.log(`OK    ${slug.padEnd(34)} ${r.rec.license.padEnd(14)} ${(r.rec.title.replace(/^File:/, '')).slice(0, 50)}  [${artist.slice(0,22)}]`);
      } else { fail++; console.log(`FAIL  ${slug.padEnd(34)} ${r.reason}`); }
    } catch (e) { fail++; console.log(`ERR   ${slug.padEnd(34)} ${e.message}`); }
    fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 2)); // persist incrementally
    await new Promise(r => setTimeout(r, 350)); // be polite to the API
  }
  console.log(`\nFetched ${ok}, failed ${fail}. Credits -> ${path.relative(process.cwd(), CREDITS)}`);
}

main().catch(e => { console.error(e); process.exit(1); });

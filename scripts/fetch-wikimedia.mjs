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
  // Izu Islands anime cluster (2026-08): island landscapes only, no character IP
  'tokyo-izu-islands-anime':'Izu Oshima island',
  // station melodies (2026-08-15): trains/platforms only, no people
  'yamanote-line-departure-melodies':'E235 series Yamanote Line train platform',
  'japan-station-melodies-by-region':'Osaka Loop Line 323 series train',
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
  // Seki/Sanjo blade-trade guides (2026-08-19): the actual products, CC BY, picked from contact sheets
  'japanese-razors-feather-kai-guide':'Feather Popular Razor (14067356604)',
  'japanese-hand-tools-saws-chisels-planes-guide':'Jap saw Dozuki P2100027',
  // knife-towns spoke (2026-08-23, content-strategy 確定版 spoke #1): lead = Shun santoku
  // (Seki-made, landscape product shot, crops to 16:9); in-body = Sakai Takayuki at Aoki-hamono.
  'japanese-knife-towns-guide':'Santoku-Kai-Shun-Nagare',
  'japanese-knife-towns-guide-b':'Sakai HAMONO Museum',
  // tea-regions spoke (2026-08-23, content-strategy 確定版 spoke #2): lead = Obuchi Sasaba
  // (Fuji City tea terraces under Mt Fuji); in-body = Chiran tea fields, Kagoshima.
  'japanese-tea-regions-guide':'Obuchi Sasaba',
  'japanese-tea-regions-guide-b':'知覧町茶畑 20150922 - panoramio',
  // 2026-08-23 写真密度の底上げ: 勝っている収集型記事は7-12枚/記事(280-420語/枚)だったのに対し
  // spoke #1/#2 は2枚(1600-1900語/枚)しかなかった。産地ごとに1枚を基本にする。
  'japanese-knife-towns-guide-seki':'Seki Sword Tradition Museum 1',
  'japanese-knife-towns-guide-echizen':'Masakage Yuki Bunka 170mm (2026)-104A7635',
  'japanese-knife-towns-guide-tsubame':'Tsubamesanjo Jibasan Center, Roadside Station, Niigata, Japan, August 2019',
  'japanese-knife-towns-guide-miki':'Miki hardware Festival 01',
  'japanese-tea-regions-guide-shaded':'Tee-beschatet-gross',
  'japanese-tea-regions-guide-uji':'Byodoin Phoenix Hall Uji 2009',
  'japanese-tea-regions-guide-yame':'Yame Tea Plantation 03',
  'japanese-tea-regions-guide-sayama':'狭山茶畑 - panoramio',
  'japanese-tea-regions-guide-gyokuro':'Gyokuro-with-kyusu',
  // whisky-towns spoke (2026-08-23, content-strategy 確定版 spoke #3)
  'japanese-whisky-towns-guide':'Nikka Whisky Yoichi Distillery. Still House',
  'japanese-whisky-towns-guide-yoichi':'Nikka Whisky Yoichi Distillery. The former residence of the Taketsuru. C',
  'japanese-whisky-towns-guide-yamazaki':'Yamazaki Distillery 山崎蒸留所17',
  'japanese-whisky-towns-guide-hakushu':'Hakushu Distillery',
  'japanese-whisky-towns-guide-mars':'Honbo syuzo sinsyu factory',
  'japanese-whisky-towns-guide-chichibu':'Chichibu Shrine - 秩父神社 - panoramio',
  // pottery-towns spoke (2026-08-23, content-strategy 確定版 spoke #4)
  'japanese-pottery-towns-guide':'常滑（土管坂） - panoramio',
  'japanese-pottery-towns-guide-tokoname':'Yakimono-sanpomichi Tokoname (Aichi) 22.jpg',
  'japanese-pottery-towns-guide-mashiko':'2023年（令和5年）春の益子陶器市「益子焼窯元共販センター」。',
  'japanese-pottery-towns-guide-arita':'Tozan Shrine01',
  'japanese-pottery-towns-guide-bizen':'Imbe Bizen Okayama pref Japan07s3',
  'japanese-pottery-towns-guide-shigaraki':'信楽焼の狸 - panoramio',
  // souvenir hub (2026-08-23, content-strategy 確定版 の hub): Kappabashi kitchenware street
  'japan-souvenirs-worth-carrying-home':'Kappabashi-dori streetcorner (Kitchen town - southern end) a sunny morning in Tokyo Japan.jpg',
  // walkable-islands article (2026-08-23): computed from blog/data/islands.json
  'japan-islands-you-can-walk-around':'Biwako Okishima aerial.jpg',
  'japan-islands-you-can-walk-around-okishima':'Okishima alley ac (1).jpg',
  'japan-islands-you-can-walk-around-ainoshima':'相島の猫.jpg',
  'japan-islands-you-can-walk-around-manabeshima':'Row of houses in Manabeshima.jpg',
  'japan-islands-you-can-walk-around-kudaka':'Stone wall in Kudaka Island 202401.jpg',
  'japan-islands-you-can-walk-around-himakajima':'Himakajima Island.jpg',
  // car-free onsen experiment (2026-08-23, 20% 実験枠 #1)
  'onsen-towns-near-tokyo-without-a-car':'草津温泉の湯畑01.jpg',
  'onsen-towns-near-tokyo-without-a-car-atami':'Atami city view 2024 Nov 3 various.jpeg',
  'onsen-towns-near-tokyo-without-a-car-hakone':'161222 Hakone-Yumoto Station Hakone Japan01n.jpg',
  'onsen-towns-near-tokyo-without-a-car-kinugawa':'170826 Kinugawa Onsen Station Nikko Japan02s3.jpg',
  'onsen-towns-near-tokyo-without-a-car-yuzawa':'Echigo-Yuzawa Station',
  'onsen-towns-near-tokyo-without-a-car-kusatsu':'草津温泉の湯畑03.jpg',
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

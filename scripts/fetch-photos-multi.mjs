#!/usr/bin/env node
// Fetch SEVERAL free-licensed photos per prefecture (or spot) for the photo-first guide layout.
// Source order (owner decision 2026-08-16: attractive first, encyclopedic last):
//   1. FIND/47  (search.find47.jp, METI-backed 47-prefecture archive, all CC BY 4.0, up to 4928px)
//   2. Flickr   (via Openverse API, CC BY / BY-SA / CC0 / PDM only, ~1024px, no API key; anon 200 req/day)
//   3. Wikimedia Commons (CC0 / PD / CC BY / CC BY-SA)
// Writes optimized webp into blog/img/ and a credit record per photo into blog/img-credits-multi.json.
//
// Usage:
//   node scripts/fetch-photos-multi.mjs tokushima            # one slug (prefecture entry in PHOTOS)
//   node scripts/fetch-photos-multi.mjs tokushima --force    # re-fetch keys already in credits
//   node scripts/fetch-photos-multi.mjs tokushima --force --keys tile1,see2   # re-fetch only those keys
//   node scripts/fetch-photos-multi.mjs --list               # show configured queries
//   node scripts/fetch-photos-multi.mjs --catalog tokushima  # only (re)build the FIND/47 catalog for a prefecture
//
// Adding a prefecture/spot = add an entry to PHOTOS below (slug -> [{key, q, label, must?, pref?}]).
// Every rec carries fetched_from + attribution fields; the page builder prints them.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const HOME = os.homedir();
const BLOG = path.join(HOME, '.secretary/projects/nihongohub/blog');
const IMGDIR = path.join(BLOG, 'img');
const SRCDIR = path.join(BLOG, 'img-src');
const CREDITS = path.join(BLOG, 'img-credits-multi.json');
const F47CAT = path.join(BLOG, 'find47-catalog.json');
const UA = 'NihongoHub-photos/1.0 (https://www.nihongo-hub.com; contact: support@nihongo-hub.com)';
const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- targets ---------------------------------------------------------
// key = role in the page template; q = search string(s), first is primary; label = caption subject;
// must = regex the candidate title/description must match (relevance guard); pref = FIND/47 prefecture slug.
const PHOTOS = {
  tokushima: [
    { key: 'hero',  q: ['Naruto whirlpools', 'Naruto Strait', 'Onaruto Bridge'], must: /naruto|whirlpool|うず|渦/i, label: 'Naruto whirlpools' },
    { key: 'tile1', q: ['Awa Odori dancers', 'Awa Odori festival', 'Awaodori'], must: /^(?![\s\S]*(taiwan|taïwan|koenji|kōenji|tokyo|nagoya|memorial hall|kaikan|museum))(?=[\s\S]*(awa|odori|阿波))/i, sources: ['find47', 'wikimedia'], label: 'Awa Odori dancers' }, // Flickr top hit was a face close-up (personality rights) -> skip Flickr here
    { key: 'tile2', q: ['Iya Kazurabashi vine bridge', 'Iya vine bridge', 'kazurabashi'], must: /iya|kazura|vine|祖谷|かずら/i, label: 'Iya Kazurabashi vine bridge' },
    { key: 'tile3', q: ['Oboke Gorge', 'Yoshino river Tokushima', 'Oboke', 'Koboke'], must: /oboke|koboke|大歩危|小歩危|yoshino|吉野/i, label: 'Oboke Gorge on the Yoshino River' },
    { key: 'tile4', q: ['Mount Bizan Tokushima', 'Bizan', 'Tokushima city'], must: /bizan|眉山|tokushima city|徳島市/i, label: 'Tokushima city from Mount Bizan' },
    { key: 'tile5', q: ['Ryozenji', 'Shikoku pilgrimage temple Tokushima', 'Ryozen-ji Naruto'], must: /ryozen|霊山|pilgrim|henro|遍路/i, label: 'Ryōzen-ji, temple no. 1 of the Shikoku pilgrimage' },
    { key: 'tile6', q: ['Nagoro scarecrow', 'Nagoro kakashi', 'scarecrow village Tokushima'], must: /scarecrow|kakashi|nagoro|名頃|かかし/i, label: 'Nagoro scarecrow village' },
    { key: 'food1', q: ['Tokushima ramen'], must: /ramen|ラーメン/i, label: 'Tokushima ramen' },
    { key: 'food2', q: ['sudachi'], must: /sudachi|すだち|スダチ/i, label: 'Sudachi citrus' },
    { key: 'food3', q: ['Naruto Kintoki sweet potato', 'satsumaimo Naruto'], must: /kintoki|sweet potato|金時|さつま/i, label: 'Naruto Kintoki sweet potato' },
    { key: 'see1',  q: ['Awa Odori Kaikan', 'Awa Odori hall', 'Awa Odori'], must: /awa|odori|阿波/i, sources: ['find47', 'wikimedia'], label: 'Awa Odori Kaikan' },
    { key: 'see2',  q: ['whirlpools bridge', 'Uzu no Michi', 'Naruto whirlpool boat'], must: /whirlpool|uzu|渦/i, label: 'Naruto whirlpools and the Onaruto Bridge' },
    { key: 'see3',  q: ['Iya Valley', 'Iya Onsen', 'Biwa Falls Iya'], must: /iya|祖谷/i, label: 'Iya Valley' },
    { key: 'see4',  q: ['Oboke gorge boat', 'Oboke sightseeing boat'], must: /oboke|大歩危|boat|遊覧/i, label: 'Oboke Gorge sightseeing boat' },
  ],
  // ---- Tokushima spot pages (2026-08-16): 3 photos each, sources try FIND/47 -> Flickr -> Wikimedia
  'naruto-whirlpools': [
    { key: 'hero', q: ['spring tide', 'whirlpools bridge', 'Naruto whirlpools'], must: /whirlpool|tide|渦|naruto/i, label: 'Naruto whirlpools at spring tide' },
    { key: 'p1', q: ['Naruto Kaikyo Bridge', 'Onaruto Bridge', 'Naruto bridge'], must: /naruto|bridge|鳴門/i, label: 'The Ōnaruto Bridge over the strait' },
    { key: 'p2', q: ['Naruto whirlpool boat', 'Uzu no Michi', 'Naruto whirlpools sightseeing'], must: /naruto|whirlpool|uzu|渦/i, label: 'Sightseeing boat in the whirlpools' },
  ],
  'awa-odori-kaikan': [
    { key: 'hero', q: ['Awa Odori dancers', 'Awa Odori festival', 'Awaodori'], must: /^(?![\s\S]*(taiwan|taïwan|koenji|kōenji|tokyo|nagoya|memorial hall|kaikan|museum))(?=[\s\S]*(awa|odori|阿波))/i, sources: ['find47', 'wikimedia'], label: 'Awa Odori dancers' },
    { key: 'p1', q: ['Awa Odori Kaikan', 'Awa Odori Museum'], must: /awa|odori|阿波/i, sources: ['find47', 'wikimedia'], label: 'Awa Odori Kaikan stage' },
    { key: 'p2', q: ['Mount Bizan Tokushima', 'Bizan ropeway', 'Bizan'], must: /bizan|眉山/i, label: 'Mount Bizan above the hall' },
  ],
  'iya-kazurabashi': [
    { key: 'hero', q: ['Iya Kazura Bridge', 'Kazura Bridge in Iya', 'kazurabashi'], must: /iya|kazura|vine|祖谷|かずら/i, label: 'Iya Kazurabashi vine bridge' },
    { key: 'p1', q: ['Iyadani Suspension bridge', 'Iya vine bridge crossing', 'Iya Valley'], must: /iya|kazura|vine|祖谷/i, label: 'Crossing the vine bridge' },
    { key: 'p2', q: ['Biwa Falls Iya', 'Iya Valley gorge', 'Iya Onsen'], must: /iya|biwa|祖谷/i, label: 'Iya Valley' },
  ],
  'ryozenji-temple': [
    { key: 'hero', q: ['Ryozenji', 'Ryozen-ji Naruto', 'Ryozenji Temple'], must: /ryozen|霊山寺/i, label: 'Ryōzen-ji, temple no. 1 of the Shikoku pilgrimage' },
    { key: 'p1', q: ['Shikoku pilgrimage henro', 'ohenro pilgrim Shikoku', 'henro'], must: /henro|pilgrim|遍路|巡礼/i, label: 'Rural Shikoku' },
  ],
  'oboke-gorge': [
    { key: 'hero', q: ['Oboke gorge boat', 'Oboke Gorge', 'Yoshino river Tokushima'], must: /oboke|koboke|大歩危|小歩危|yoshino|吉野/i, label: 'Oboke Gorge sightseeing boat' },
    { key: 'p1', q: ['Oboke gorge pleasure boat', 'Oboke Gorge boat'], must: /oboke|大歩危/i, sources: ['find47', 'wikimedia'], label: 'Sightseeing boat in the gorge' },
    { key: 'p2', q: ['Koinobori Oboke Gorge', 'Oboke Gorge Tokushima'], must: /oboke|大歩危|koinobori/i, sources: ['find47', 'wikimedia'], label: 'Koinobori over the gorge in May' },
  ],
  'ishima-island': [
    { key: 'hero', q: ['Ishima Tokushima', 'Ishima Anan', 'Ishima island', 'Ishima lighthouse'], must: /ishima|伊島/i, label: 'Ishima, Anan' },
    { key: 'p1', q: ['Ishima lighthouse', 'Ishima fishing port', 'Ishima Anan'], must: /ishima|伊島/i, label: 'Ishima' },
  ],
  'takegashima-island': [
    { key: 'hero', q: ['Takegashima Kaiyo', 'Takegashima Tokushima', 'Kaiyo Tokushima coast', 'Marine Jam Kaiyo'], must: /takegashima|竹ヶ島|竹ケ島|kaiyo|海陽/i, label: 'Takegashima, Kaiyō' },
    { key: 'p1', q: ['Shishikui Station', 'Asa Coast Railway', 'Shishikui'], must: /shishikui|宍喰|asa/i, label: 'Asa Coast Railway at Shishikui, the gateway to Takegashima' },
  ],
  'shimadajima-island': [
    { key: 'hero', q: ['View from Horikoshi Bridge, Shimada Island', 'Shimada Island Naruto', 'Shimadajima'], must: /shimada|島田/i, label: 'Shimadajima from Horikoshi Bridge' },
    { key: 'p1', q: ['Uchinoumi Naruto', 'Naruto Uchinoumi park', 'Horikoshi Bridge Naruto'], must: /uchinoumi|内ノ海|horikoshi|堀越/i, label: 'Naruto’s inland sea' },
  ],
};
const PREF_OF = { tokushima: 'tokushima', 'naruto-whirlpools': 'tokushima', 'awa-odori-kaikan': 'tokushima', 'iya-kazurabashi': 'tokushima', 'ryozenji-temple': 'tokushima', 'oboke-gorge': 'tokushima', 'ishima-island': 'tokushima', 'takegashima-island': 'tokushima', 'shimadajima-island': 'tokushima' }; // slug -> FIND/47 prefecture slug (spot slugs map to their prefecture)

// FIND/47 static archive: /en/images%253Farea=<area>%26prefectures=<pref>[%26page=N].html
const F47_AREA = {
  hokkaido: 'hokkaido',
  akita: 'tohoku', aomori: 'tohoku', fukushima: 'tohoku', iwate: 'tohoku', miyagi: 'tohoku', yamagata: 'tohoku',
  chiba: 'kanto-koshinetsu', gunma: 'kanto-koshinetsu', ibaraki: 'kanto-koshinetsu', kanagawa: 'kanto-koshinetsu', nagano: 'kanto-koshinetsu', niigata: 'kanto-koshinetsu', saitama: 'kanto-koshinetsu', tochigi: 'kanto-koshinetsu', tokyo: 'kanto-koshinetsu', yamanashi: 'kanto-koshinetsu',
  aichi: 'tokai-hokuriku', fukui: 'tokai-hokuriku', gifu: 'tokai-hokuriku', ishikawa: 'tokai-hokuriku', mie: 'tokai-hokuriku', shizuoka: 'tokai-hokuriku', toyama: 'tokai-hokuriku',
  hyogo: 'kinki', kyoto: 'kinki', nara: 'kinki', osaka: 'kinki', shiga: 'kinki', wakayama: 'kinki',
  hiroshima: 'chugoku', okayama: 'chugoku', shimane: 'chugoku', tottori: 'chugoku', yamaguchi: 'chugoku',
  ehime: 'sikoku', kagawa: 'sikoku', kochi: 'sikoku', tokushima: 'sikoku',
  fukuoka: 'kyushu-okinawa', kagoshima: 'kyushu-okinawa', kumamoto: 'kyushu-okinawa', miyazaki: 'kyushu-okinawa', nagasaki: 'kyushu-okinawa', oita: 'kyushu-okinawa', okinawa: 'kyushu-okinawa', saga: 'kyushu-okinawa',
};

// ---------- auto specs for any of the 47 prefectures (when no hand-written PHOTOS entry) ----------
import vm from 'node:vm';
import { GUIDES } from '../blog/guides-data.js';
const _sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(HOME, '.secretary/projects/nihongohub/explore-data.js'), 'utf8'), _sb);
const NH = _sb.window.NH_EXTRA || {};
const GENERIC = new Set(['art','island','islands','garden','gardens','gorge','ropeway','sand','coin','castle','temple','shrine','museum','park','beach','valley','falls','waterfall','lake','mountain','mount','bridge','festival','market','street','village','station','tower','house','cave','onsen','spring','springs','coast','bay','river','forest','road','trail','ruins','site','district','quarter','old','great','grand','national','world','heritage','skyline','night','view','viewpoint','observatory','aquarium','zoo','ramen','sushi','curry','noodle','dumplings','crab','oyster','oysters','wagyu','pottery','ware','dyeing','indigo','silk','paper','sake','tea','fruit','peach','apple','melon','strawberry','citrus','potato']);
const STOP = new Set(['the', 'and', 'with', 'from', 'year', 'round', 'hall', 'area', 'city', 'town', 'japan', 'japanese', 'prefecture', 'famous', 'local', 'style', 'sweet', 'fresh', 'grilled', 'noodles', 'soup', 'dish', 'dishes', 'rice', 'beef', 'pork', 'chicken', 'fish', 'sea', 'sea bream']);
const clean = (n) => String(n).split(/ \(| & | \/ | and /)[0].trim();
function mustOf(name) { const all = clean(name).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(t => t.length > 3 && !STOP.has(t)); const proper = all.filter(t => !GENERIC.has(t)); const toks = proper.length ? proper : all; return toks.length ? new RegExp(toks.map(t => t.replace(/[-]/g, '.?')).join('|'), 'i') : null; }
function autoSpecs(slug) {
  const g = GUIDES.find(x => x.slug === slug), nh = NH[slug]; if (!g || !nh) return null;
  const cul = (nh.culture || []).map(c => c.name), food = (nh.food || []).map(f => f.name);
  const heroName = (g.see && g.see[0]) || cul[0];
  const specs = [{ key: 'hero', q: [clean(heroName), clean(cul[0] || heroName), `${clean(heroName)} ${g.romaji}`], must: mustOf(heroName), label: clean(heroName) }];
  cul.slice(0, 5).forEach((n, i) => specs.push({ key: `tile${i + 1}`, q: [clean(n), `${clean(n)} ${g.romaji}`], must: mustOf(n), label: clean(n) }));
  cul.slice(0, 3).forEach((n, i) => specs.push({ key: `see${i + 1}`, q: [clean(n), `${clean(n)} ${g.romaji}`], must: mustOf(n), label: clean(n) }));
  food.slice(0, 3).forEach((n, i) => specs.push({ key: `food${i + 1}`, q: [clean(n), `${clean(n)} ${g.romaji}`, `${clean(n)} Japan food`], must: mustOf(n), label: clean(n) }));
  return specs;
}
GUIDES.forEach(g => { PREF_OF[g.slug] = PREF_OF[g.slug] || g.slug; });

const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const unesc = (s) => String(s || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const kebab = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
async function get(url, ua = UA) { const r = await fetch(url, { headers: { 'User-Agent': ua, 'Accept-Language': 'en' } }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r; }

// ---------- 1. FIND/47 --------------------------------------------------------
async function find47Catalog(pref, force = false) {
  const cat = fs.existsSync(F47CAT) ? JSON.parse(fs.readFileSync(F47CAT, 'utf8')) : {};
  if (cat[pref] && !force) return cat[pref];
  const area = F47_AREA[pref]; if (!area) throw new Error('no FIND/47 area for ' + pref);
  const ids = new Set();
  for (let page = 1; page < 60; page++) {
    const u = `https://search.find47.jp/en/images%253Farea=${area}%26prefectures=${pref}${page > 1 ? `%26page=${page}` : ''}.html`;
    let html; try { html = await (await get(u, UA_BROWSER)).text(); } catch (e) { break; }
    const found = [...html.matchAll(/\/en\/i\/([A-Za-z0-9]+)/g)].map(m => m[1]);
    const before = ids.size; found.forEach(i => ids.add(i));
    if (ids.size === before) break; // no new ids -> past the last page
    await sleep(400);
  }
  const items = [];
  for (const id of ids) {
    try {
      const html = await (await get(`https://search.find47.jp/en/i/${id}`, UA_BROWSER)).text();
      const title = unesc((html.match(/<title>Learn more about &quot;(.+?)&quot;/) || [, ''])[1]).replace(/\s*\(([^)]+)\)\s*$/, '').trim();
      const num = (html.match(/NO\.(\d+)/) || [, ''])[1];
      const base = (html.match(/https:\/\/find47\.jp\/uploads\/image_file\/content\/[0-9/]+\//) || [, ''])[0];
      // photographer: text right after the view counter block; fall back to og/twitter meta if present
      const txt = stripHtml(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''));
      const m = txt.match(new RegExp(`NO\\.${num}\\s+(.+?)\\s+([A-Za-z]+)\\s+\\d+\\s+\\d+\\s+(.+?)\\s+Technical Details`));
      const who = m ? m[3].trim() : 'FIND/47 contributor';
      const photographer = who === 'FIND/47 contributor' ? who : who.split(' ')[0], desc = who === 'FIND/47 contributor' ? '' : who.split(' ').slice(1).join(' ');
      if (base) items.push({ id, num, title, photographer, desc, base, page: `https://search.find47.jp/en/i/${id}` });
    } catch (e) { /* skip broken page */ }
    await sleep(300);
  }
  cat[pref] = items; fs.writeFileSync(F47CAT, JSON.stringify(cat, null, 1));
  return items;
}
async function fromFind47(spec, pref, used) {
  const items = await find47Catalog(pref);
  const queries = Array.isArray(spec.q) ? spec.q : [spec.q];
  let best = null, bestScore = -1;
  for (const it of items) {
    if (used.has('f47:' + it.id)) continue;
    const t = (it.title + ' ' + (it.desc || '')).toLowerCase();
    if (spec.must && !spec.must.test(it.title + ' ' + (it.desc || ''))) continue;
    let s = 0;
    queries.forEach((q, qi) => { const toks = q.toLowerCase().split(/\s+/).filter(x => x.length > 2); const hits = toks.filter(x => t.includes(x)).length; if (hits) s = Math.max(s, hits * 10 - qi); });
    if (s > bestScore) { bestScore = s; best = it; }
  }
  if (!best || bestScore <= 0) return null;
  const size = spec.key === 'hero' ? 'm' : 's'; // m=1920px, s=1280px
  return {
    dlUrl: best.base + size + '.jpg', usedKey: 'f47:' + best.id, rec: { source_id: 'f47:' + best.id,
      title: best.title, source_page: best.page, license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
      artist: best.photographer, artist_html: '', fetched_from: 'find47',
    },
  };
}

// ---------- 2. Flickr via Openverse ------------------------------------------
async function fromOpenverse(spec, used) {
  const queries = Array.isArray(spec.q) ? spec.q : [spec.q];
  for (const q of queries) {
    const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q + ' Japan')}&license=by,by-sa,cc0,pdm&source=flickr&page_size=20&mature=false`;
    let d; try { d = await (await get(u)).json(); } catch (e) { if (/429/.test(e.message)) { console.log('  openverse rate-limited'); return null; } continue; }
    const cands = (d.results || []).filter(r => !used.has('ov:' + r.id) && r.width >= 900)
      .filter(r => !spec.must || spec.must.test(r.title + ' ' + (r.tags || []).map(t => t.name).join(' ')))
      .map(r => { const t = (r.title + ' ' + (r.tags || []).map(t => t.name).join(' ')).toLowerCase(); const toks = q.toLowerCase().split(/\s+/).filter(x => x.length > 2); const hits = toks.filter(x => t.includes(x)).length; return { r, s: hits * 10 + (r.width >= r.height ? 3 : 0) + Math.min(r.width, 2048) / 1024 }; })
      .filter(x => x.s >= 10).sort((a, b) => b.s - a.s);
    await sleep(3200); // anon burst limit 20/min
    if (!cands.length) continue;
    const r = cands[0].r;
    return {
      dlUrl: r.url, usedKey: 'ov:' + r.id, rec: { source_id: 'ov:' + r.id,
        title: r.title, source_page: r.foreign_landing_url, license: `CC ${r.license.toUpperCase()} ${r.license_version || ''}`.trim(),
        license_url: r.license_url || `https://creativecommons.org/licenses/${r.license}/${r.license_version || '2.0'}/`,
        artist: r.creator || 'Flickr user', artist_html: '', fetched_from: 'flickr/openverse',
      },
    };
  }
  return null;
}

// ---------- 3. Wikimedia Commons ---------------------------------------------
const FREE_OK = /(^|\b)(cc0|public domain|cc[- ]by([- ]sa)?([- ]\d(\.\d)?)?|pd|pdmark)\b/i;
const FREE_BAD = /non[- ]free|fair use|copyright|all rights reserved|by-nc|by-nd|noncommercial|no derivativ/i;
const BAD_SUBJECT = /\bchart\b|\bmap\b|diagram|engraving|woodblock|ukiyo|lithograph|\b1[5-8]\d\d\b|logo|coat of arms|\bflag\b|locator|painting|\bsiege\b|\bbattle\b|folding screen|byobu|scroll|print of|drawing|sketch|portrait|\.svg$/i;
function licenseOf(ext) {
  const short = stripHtml(ext?.LicenseShortName?.value), mach = stripHtml(ext?.License?.value), url = stripHtml(ext?.LicenseUrl?.value);
  const blob = `${short} ${mach}`;
  return { short: short || mach || 'CC', url, free: (FREE_OK.test(blob) || /pd|public/i.test(mach)) && !FREE_BAD.test(blob) };
}
async function fromWikimedia(spec, used) {
  const queries = Array.isArray(spec.q) ? spec.q : [spec.q];
  const wantLand = spec.key === 'hero' || spec.key.startsWith('tile');
  for (const q of queries) {
    const u = new URL('https://commons.wikimedia.org/w/api.php');
    u.search = new URLSearchParams({ action: 'query', format: 'json', generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: '25', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600' }).toString();
    let j; try { j = await (await get(u)).json(); } catch { continue; }
    const cands = Object.values(j?.query?.pages || {}).map(p => ({ title: p.title, info: (p.imageinfo || [])[0] })).filter(x => x.info)
      .map(c => {
        const inf = c.info, ext = inf.extmetadata || {}; const title = c.title.replace(/^File:/, '');
        if (used.has('wm:' + c.title) || !licenseOf(ext).free || !/image\/(jpeg|png|webp)/.test(inf.mime || '') || BAD_SUBJECT.test(title)) return null;
        if (spec.must && !spec.must.test(title + ' ' + stripHtml(ext?.ImageDescription?.value))) return null;
        const toks = q.toLowerCase().split(/\s+/).filter(t => t.length > 2); const hits = toks.filter(t => title.toLowerCase().includes(t)).length; if (!hits) return null;
        let s = hits * 60 + Math.min(inf.width, 4000) / 40 + (wantLand ? (inf.width >= inf.height ? 300 : -50) : 0) - (inf.width < 1000 ? 200 : 0);
        return { c, s };
      }).filter(Boolean).sort((a, b) => b.s - a.s);
    await sleep(350);
    if (!cands.length) continue;
    const best = cands[0].c, inf = best.info, ext = inf.extmetadata || {}, lic = licenseOf(ext);
    return { dlUrl: inf.thumburl || inf.url, usedKey: 'wm:' + best.title, rec: { source_id: 'wm:' + best.title, title: best.title.replace(/^File:/, ''), source_page: inf.descriptionurl, license: lic.short, license_url: lic.url, artist: stripHtml(ext?.Artist?.value) || 'Unknown', artist_html: ext?.Artist?.value || '', fetched_from: 'wikimedia' } };
  }
  return null;
}

// ---------- pipeline ------------------------------------------------------------
async function fetchOne(slug, spec, used) {
  const pref = spec.pref || PREF_OF[slug];
  const all = { find47: () => pref ? fromFind47(spec, pref, used) : null, flickr: () => fromOpenverse(spec, used), wikimedia: () => fromWikimedia(spec, used) };
  const tries = (spec.sources || ['find47', 'flickr', 'wikimedia']).map(n => [n, all[n]]);
  for (const [name, fn] of tries) {
    let hit = null; try { hit = await fn(); } catch (e) { console.log(`  ${name} error: ${e.message}`); }
    if (!hit) continue;
    fs.mkdirSync(SRCDIR, { recursive: true }); fs.mkdirSync(IMGDIR, { recursive: true });
    const src = path.join(SRCDIR, `${slug}-${spec.key}.jpg`);
    const r = await get(hit.dlUrl, hit.rec.fetched_from === 'find47' ? UA_BROWSER : UA); fs.writeFileSync(src, Buffer.from(await r.arrayBuffer()));
    const outName = `${slug}-${spec.key}-${kebab(spec.label)}.webp`;
    const meta = await sharp(src).resize({ width: spec.key === 'hero' ? 1600 : 960, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(IMGDIR, outName));
    used.add(hit.usedKey);
    return { ok: true, rec: { key: spec.key, label: spec.label, query: spec.q, file: `img/${outName}`, width: meta.width, height: meta.height, ...hit.rec } };
  }
  return { ok: false, reason: 'no free candidate in any source' };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--list') && args.length > 1) { const sl = args.filter(a => !a.startsWith('--'))[0]; (PHOTOS[sl] || autoSpecs(sl) || []).forEach(p => console.log(`${sl.padEnd(12)} ${p.key.padEnd(6)} ${[].concat(p.q).join(' | ')}   must=${p.must}`)); return; }
  if (args.includes('--list')) { for (const [s, l] of Object.entries(PHOTOS)) l.forEach(p => console.log(`${s.padEnd(12)} ${p.key.padEnd(6)} ${[].concat(p.q).join(' | ')}`)); return; }
  if (args.includes('--catalog')) { const pref = args[args.indexOf('--catalog') + 1]; const items = await find47Catalog(pref, true); console.log(`FIND/47 ${pref}: ${items.length} photos`); items.forEach(i => console.log(`  ${i.id} ${i.title}  [${i.photographer}]`)); return; }
  const slugs = args.filter(a => !a.startsWith('--') && !(args[args.indexOf(a) - 1] === '--keys')); const force = args.includes('--force');
  const onlyKeys = args.includes('--keys') ? args[args.indexOf('--keys') + 1].split(',') : null;
  if (!slugs.length) { console.error('give a slug, e.g. tokushima'); process.exit(1); }
  const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, 'utf8')) : {};
  for (const slug of slugs) {
    const specs = PHOTOS[slug] || autoSpecs(slug); if (!specs) { console.log(`SKIP ${slug}: no PHOTOS entry and not a prefecture`); continue; }
    credits[slug] = credits[slug] || {};
    const used = new Set(Object.entries(credits[slug]).filter(([k]) => !(force && (!onlyKeys || onlyKeys.includes(k)))).map(([, r]) => r.source_id).filter(Boolean));
    for (const spec of specs) {
      if (onlyKeys && !onlyKeys.includes(spec.key)) continue;
      if (credits[slug][spec.key] && !force) { console.log(`KEEP ${slug}/${spec.key.padEnd(6)} ${credits[slug][spec.key].fetched_from}`); continue; }
      try {
        const r = await fetchOne(slug, spec, used);
        if (r.ok) { credits[slug][spec.key] = r.rec; console.log(`OK   ${slug}/${spec.key.padEnd(6)} ${r.rec.fetched_from.padEnd(16)} ${r.rec.license.padEnd(12)} ${r.rec.title.slice(0, 55)}  [${r.rec.artist.slice(0, 20)}]`); }
        else console.log(`FAIL ${slug}/${spec.key.padEnd(6)} ${r.reason}`);
      } catch (e) { console.log(`ERR  ${slug}/${spec.key.padEnd(6)} ${e.message}`); }
      fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 2));
    }
  }
  console.log(`\nCredits -> ${CREDITS}`);
}
main().catch(e => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/**
 * Spot child pages (photo-first, v2 look). One page per SPOTS entry -> blog/spots/<slug>.html
 *
 * Layers that GaijinPot spot pages do not have: facts with sources, phrases for this kind of place
 * (data/spot-phrases.js, 5 languages), prefecture nature stats (GBIF, wildlife.html), collectible/related
 * guides, one affiliate per block, parent prefecture + sibling spots + RPG map.
 *
 * Reads: blog/img-credits-multi.json (photos), data/spot-phrases.js, wildlife.html DATA, assets/japan-map.svg
 * Run:   node scripts/build-spots-v2.mjs            # all spots
 *        node scripts/build-spots-v2.mjs ishima-island
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { UI_EN } from './v2-ui-strings.mjs';
const LANG_HTML = { en: 'en', zh: 'zh-Hant', es: 'es', th: 'th', id: 'id' };
const LANG_LABEL = { en: 'EN', zh: '繁中', es: 'ES', th: 'TH', id: 'ID' };
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enc = (s) => encodeURIComponent(s);
const CREDITS = JSON.parse(readFileSync(ROOT + 'blog/img-credits-multi.json', 'utf8'));
const RELEASE = JSON.parse(readFileSync(ROOT + 'blog/v2-release.json', 'utf8'));
const sb = { window: {} }; vm.runInNewContext(readFileSync(ROOT + 'data/spot-phrases.js', 'utf8'), sb);
const PHRASES = sb.window.NH_SPOT_PHRASES.categories;
const WL = (() => { const h = readFileSync(ROOT + 'wildlife.html', 'utf8'); const m = h.match(/const DATA = (\[[\s\S]*?\]);\s*\n/); return vm.runInNewContext(m[1]); })();
const MAP_SVG = readFileSync(ROOT + 'assets/japan-map.svg', 'utf8').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<desc>[\s\S]*?<\/desc>/, '')
  .replace('<svg id="japan-map" class="geolonia-svg-map"', '<svg class="locator" aria-hidden="true" focusable="false"');
const SRC = { find47: 'FIND/47', 'flickr/openverse': 'Flickr', wikimedia: 'Wikimedia Commons' };
function loadT(lang) { const f = ROOT + 'blog/translations-v2/' + lang + '.json'; return lang !== 'en' && existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; }

// ---------- prefecture context (extend when more prefectures get spot pages) ----------
const PREFS = {
  tokushima: { code: 36, name: 'Tokushima', kanji: '徳島', region: 'Shikoku', accent: '#1f3a5f', slug: 'tokushima', wl: WL.find(d => d[2] === 'TOKUSHIMA') },
};

// ---------- spots ----------
// kind -> phrase category in data/spot-phrases.js. facts: [text, source]. Everything numeric carries a source.
export const SPOTS = {
  'naruto-whirlpools': {
    pref: 'tokushima', name: 'Naruto Whirlpools', kanji: '鳴門の渦潮', kind: 'sightseeing', badge: 'Natural wonder', mapq: 'Uzu no Michi, Naruto, Tokushima',
    tagline: 'Tidal whirlpools you can stand above — or sail into.',
    summary: 'Twice a day the tide forces the Seto Inland Sea through the 1.3 km Naruto Strait, and the water spins into whirlpools among the largest anywhere. You can watch from a boat, or from the glass floor of the Uzu-no-Michi walkway slung under the Ōnaruto Bridge.',
    facts: [
      ['Whirlpools reach roughly 20 m across at the strongest spring tides', 'Naruto City tourism (naruto-tourism.jp)'],
      ['Uzu-no-Michi walkway: 450 m long inside the bridge girder, glass floor about 45 m above the water', 'Uzu-no-Michi official (uzunomichi.jp)'],
      ['Best around spring and autumn spring tides, within about an hour of the published peak; check the tide table before buying tickets', 'Naruto City tide calendar'],
    ],
    access: 'Local bus from JR Naruto Station to Naruto Kōen (about 20 min); the bridge and Uzu-no-Michi are a short walk from the park.',
    tickets: 'Naruto whirlpools cruise', hotelq: 'Naruto Tokushima',
    photos: ['hero', 'p1', 'p2'],
    guides: [['../japan-station-melodies-by-region.html', 'Station melodies by region — the sound of arriving in Shikoku']],
    siblings: ['awa-odori-kaikan', 'shimadajima-island', 'ryozenji-temple'],
  },
  'awa-odori-kaikan': {
    pref: 'tokushima', name: 'Awa Odori Kaikan', kanji: '阿波おどり会館', kind: 'festival', badge: 'Living tradition', mapq: 'Awa Odori Kaikan, Tokushima',
    tagline: 'The 400-year-old dance you can watch every day, not just in August.',
    summary: 'Awa Odori is Japan’s biggest Bon dance festival: four August nights when troupes of dancers fill Tokushima’s streets. Miss the dates and you can still see it — the Kaikan stages performances year-round, and the Bizan ropeway leaves from its top floor for the view over the city.',
    facts: [
      ['Festival dates: 12–15 August every year, in Tokushima city', 'Tokushima City / Awa Odori official'],
      ['Well over a million spectators each August', 'JNTO / Tokushima City'],
      ['Daily stage performances at the Kaikan; the Bizan Ropeway boards from the 5th floor', 'Awa Odori Kaikan official'],
    ],
    access: 'About 10 minutes on foot from JR Tokushima Station, at the foot of Mount Bizan.',
    tickets: 'Awa Odori Tokushima', hotelq: 'Tokushima Japan',
    photos: ['hero', 'p1', 'p2'],
    guides: [['../eki-stamps-japan.html', 'Eki stamps — collect the station stamp before you leave Tokushima']],
    siblings: ['naruto-whirlpools', 'ryozenji-temple', 'iya-kazurabashi'],
  },
  'iya-kazurabashi': {
    pref: 'tokushima', name: 'Iya Kazurabashi', kanji: '祖谷のかずら橋', kind: 'sightseeing', badge: 'Hidden valley', mapq: 'Iya Kazurabashi, Miyoshi, Tokushima',
    tagline: 'A bridge woven from mountain vines, deep in a valley the road forgot.',
    summary: 'The Iya Valley is one of Japan’s most remote gorges, and its vine suspension bridge is the reason most people make the trip. The bridge sways; the boards have gaps; the river is a long way down. It is rebuilt with fresh vines every few years so it stays exactly this alarming.',
    facts: [
      ['Length about 45 m, width 2 m, roughly 14 m above the Iya River; one of Japan’s three surviving vine bridges', 'Miyoshi City tourism (miyoshi-tourism.jp)'],
      ['Re-woven every three years from hardy kiwi vine (shirakuchikazura)', 'Miyoshi City tourism'],
      ['Nearby: Biwa Falls (a few minutes’ walk) and Oboke Gorge downstream', 'Miyoshi City tourism'],
    ],
    access: 'Bus from JR Oboke Station (Dosan Line) about 25 min to Kazurabashi; a car makes the wider valley much easier.',
    tickets: 'Iya Valley', hotelq: 'Iya Valley',
    photos: ['hero', 'p1', 'p2'],
    guides: [['../michi-no-eki-stamp-rally-japan.html', 'Michi-no-eki stamp rally — Michi-no-Eki Oboke is on the way']],
    siblings: ['oboke-gorge', 'ryozenji-temple', 'awa-odori-kaikan'],
  },
  'oboke-gorge': {
    pref: 'tokushima', name: 'Oboke Gorge', kanji: '大歩危', kind: 'sightseeing', badge: 'River gorge', mapq: 'Oboke Gorge, Miyoshi, Tokushima',
    tagline: 'Marble cliffs, jade water, and a boat that takes you into both.',
    summary: 'The Yoshino River has cut Oboke and Koboke gorges through hard crystalline schist, leaving pale rock walls above green water. A short sightseeing boat runs from the riverside; rafting companies use the same stretch. In early May hundreds of koinobori carp streamers hang across the gorge.',
    facts: [
      ['Sightseeing boat: about 30 minutes round trip from the Oboke riverside', 'Oboke-kyo Mannaka (official boat operator)'],
      ['JR Oboke Station on the Dosan Line is the gateway to both the gorge and the Iya Valley', 'JR Shikoku'],
      ['Michi-no-Eki Oboke (Lapis Oboke) beside the gorge houses a yōkai museum and a stone museum', 'Miyoshi City tourism'],
    ],
    access: 'JR Oboke Station (about 1 h 15 min from Tokushima by limited express via Awa-Ikeda; about 1 h from Kōchi). Boat pier and michi-no-eki are a short walk or one bus stop away.',
    tickets: 'Oboke Gorge', hotelq: 'Oboke Iya',
    photos: ['hero', 'p1', 'p2'],
    guides: [['../michi-no-eki-stamp-rally-japan.html', 'Michi-no-eki stamp rally guide'], ['../eki-stamps-japan.html', 'Eki stamps — JR Shikoku stations']],
    siblings: ['iya-kazurabashi', 'ryozenji-temple', 'naruto-whirlpools'],
  },
  'ryozenji-temple': {
    pref: 'tokushima', name: 'Ryōzen-ji', kanji: '霊山寺', kind: 'temple_shrine', badge: 'Pilgrimage no. 1', mapq: 'Ryozenji Temple, Naruto, Tokushima',
    tagline: 'Where the 88-temple Shikoku pilgrimage begins.',
    summary: 'Ryōzen-ji is temple number one of the Shikoku Henro, the 88-temple pilgrimage that circles the island. Pilgrims buy their white vest, sedge hat, staff and stamp book here before setting out; the shop and the flow of ohenro give the small temple an atmosphere out of proportion to its size.',
    facts: [
      ['Temple no. 1 of the Shikoku 88; the full circuit is roughly 1,200 km', 'Shikoku Henro official / Shikoku Tourism'],
      ['Pilgrim goods (hakui vest, kongōzue staff, nōkyōchō stamp book) are sold on site', 'Ryōzen-ji temple office'],
      ['Temples 1–10 lie close together along the Yoshino River, so a first day of walking is realistic', 'Shikoku Henro official'],
    ],
    access: 'About 10 minutes on foot from JR Bandō Station (Kōtoku Line), 25 min by train from Tokushima.',
    tickets: 'Shikoku pilgrimage', hotelq: 'Naruto Tokushima',
    photos: ['hero', 'p1'],
    guides: [['../goshuin-temple-shrine-stamps.html', 'Goshuin — how temple stamps work (the pilgrimage nōkyō is the same idea)'], ['../goshuincho-guide-japan.html', 'Choosing a goshuinchō stamp book']],
    siblings: ['naruto-whirlpools', 'awa-odori-kaikan', 'shimadajima-island'],
  },
  'ishima-island': {
    pref: 'tokushima', name: 'Ishima', kanji: '伊島', kind: 'sightseeing', badge: 'Inhabited island', island: true, mapq: 'Ishima, Anan, Tokushima',
    tagline: 'A fishing island in the Kii Channel with no cars and 165 people.',
    summary: 'Ishima sits off the Anan coast at the mouth of the Kii Channel. The village is packed onto a strip of flat land so tight that the only way around is on foot. Spiny lobster is the local catch; a ridge path lined with 33 stone Buddhas crosses the island, and the lighthouse on the far side was Japan’s first fully unmanned one.',
    facts: [
      ['Area 1.44 km²; population 165', 'SHIMADAS (Japan Center for Island Studies), figures as printed'],
      ['About 3,900 visitors a year (FY2016)', 'SHIMADAS'],
      ['Ferry from Tōshima port (Anan) about 30 min, 3 sailings a day; no cars on the island', 'SHIMADAS / Ishima ferry service'],
      ['Ise-ebi (spiny lobster) is the specialty', 'SHIMADAS'],
    ],
    access: 'JR Anan Station → bus/taxi to Tōshima port → ferry 30 min. Day trip is possible on the 3-sailing timetable; check the return time before you board.',
    tickets: 'Anan Tokushima', hotelq: 'Anan Tokushima', ferry: true,
    photos: ['hero', 'p1'],
    guides: [['../tokyo-izu-islands-anime.html', 'More small islands: the Izu Islands guide']],
    siblings: ['takegashima-island', 'shimadajima-island', 'naruto-whirlpools'],
  },
  'takegashima-island': {
    pref: 'tokushima', name: 'Takegashima', kanji: '竹ヶ島', kind: 'sightseeing', badge: 'Inhabited island', island: true, mapq: 'Takegashima, Kaiyo, Tokushima',
    tagline: 'A tuna-fishing island you can drive to, with clownfish under the pier.',
    summary: 'Takegashima hangs off the southern tip of Tokushima, joined to the mainland by a bridge. Fishing is the whole point of the place, but the reason visitors come is the water: a marine museum, a glass-bottom boat, sea kayaks and snorkelling over coral where clownfish live at the northern edge of their range.',
    facts: [
      ['Area 1.30 km²; population 214', 'SHIMADAS (Japan Center for Island Studies), figures as printed'],
      ['Marine Jam (Kaiyō Town marine museum) with a glass-bottom boat and a small aquarium; closed Tuesdays', 'SHIMADAS / Kaiyō Town'],
      ['Local table: dried seafood, spiny lobster, abalone', 'SHIMADAS'],
    ],
    access: 'Bus from JR Mugi Station about 40 min, or from Shishikui Station (Asa Coast Railway) about 9 min, to Takegashima.',
    tickets: 'Kaiyo Tokushima snorkeling', hotelq: 'Kaiyo Tokushima', ferry: true,
    photos: ['hero', 'p1'],
    guides: [['../wildlife-watching-japan.html', 'Wildlife watching in Japan — where to see what']],
    siblings: ['ishima-island', 'shimadajima-island', 'oboke-gorge'],
  },
  'shimadajima-island': {
    pref: 'tokushima', name: 'Shimadajima', kanji: '島田島', kind: 'sightseeing', badge: 'Inhabited island', island: true, mapq: 'Shimadajima, Naruto, Tokushima',
    tagline: 'The quiet farm-and-fishing island next door to the whirlpools.',
    summary: 'Shimadajima lies in Naruto’s inland sea a few minutes from the Ōnaruto Bridge, but it is a different world: lotus fields, an old shrine festival where the portable shrine is carried into the sea, and almost no visitors. The expressway crosses it, so you can reach it by car — or take the four-minute ferry from Dōnoura.',
    facts: [
      ['Area 5.72 km²; population 430', 'SHIMADAS (Japan Center for Island Studies), figures as printed'],
      ['Ferry from Dōnoura about 4 min, 10 sailings a day; also reachable by road via Naruto-kita IC', 'SHIMADAS / Naruto City'],
      ['Specialties: lotus root and ancient-variety rice; Awai Shrine autumn festival on 16 October', 'SHIMADAS'],
    ],
    access: 'From Naruto: car via Naruto-kita IC, or bus/taxi to Dōnoura and the 4-minute ferry.',
    tickets: 'Naruto Tokushima', hotelq: 'Naruto Tokushima', ferry: true,
    photos: ['hero', 'p1'],
    guides: [['../goshuin-temple-shrine-stamps.html', 'Goshuin at small shrines — how to ask']],
    siblings: ['naruto-whirlpools', 'ishima-island', 'takegashima-island'],
  },
};

function credit(slug, key) {
  const p = CREDITS[slug]?.[key]; if (!p) return '';
  return `${esc(p.label)} — <a href="${esc(p.source_page)}" rel="noopener">${esc(p.artist)}</a> via ${SRC[p.fetched_from] || ''}, <a href="${esc(p.license_url || '#')}" rel="license noopener">${esc(p.license)}</a>`;
}
let _B = '../';
function img(slug, key, prefName) { const p = CREDITS[slug]?.[key]; if (!p) return ''; return `<img src="${_B}${p.file}" width="${p.width}" height="${p.height}" alt="${esc(p.label)}, ${esc(prefName)} Prefecture, Japan" loading="lazy" decoding="async">`; }
function phrasePack(kind) { return PHRASES.find(c => c.key === kind) || PHRASES.find(c => c.key === 'sightseeing'); }

export function buildSpot(slug, lang = 'en') {
  const s = SPOTS[slug], P = PREFS[s.pref], C = CREDITS[slug] || {};
  const T = loadT(lang), TP = (T && T.pages[slug]) || {}, UI = { ...UI_EN, ...((T && T.ui) || {}) };
  const u = (k) => UI[k] || UI_EN[k] || k;
  const B = lang === 'en' ? '../' : '../../';       // -> blog/
  const S = lang === 'en' ? '../../' : '../../../'; // -> site root
  _B = B;
  const L = lang === 'en' ? '' : lang + '/';        // language dir inside blog/
  const guide = `${B}${L}${P.slug}-v2.html`, map = `${S}prefectures.html?pref=${P.slug}`;
  const NAME = TP.name || s.name, TAGL = TP.tagline || s.tagline, SUMM = TP.summary || s.summary, BADGE = TP.badge || s.badge, ACC = TP.access || s.access;
  const FACT = (i) => (TP.facts && TP.facts[i]) || s.facts[i][0];
  const GLAB = (i) => (TP.guides && TP.guides[i]) || s.guides[i][1];
  const heroP = C[s.photos[0]]; if (!heroP) throw new Error('no hero photo for ' + slug);
  const url = `https://www.nihongo-hub.com/blog/${L}spots/${slug}.html`;
  const altUrls = ['en', 'zh', 'es', 'th', 'id'].filter(l => l === 'en' || loadT(l)?.pages?.[slug]).map(l => [l, `https://www.nihongo-hub.com/blog/${l === 'en' ? '' : l + '/'}spots/${slug}.html`]);
  const title = `${NAME} (${s.kanji}), ${P.name}: ${TAGL.replace(/\.$/, '')} — NihongoHub`;
  const desc = lang === 'en' ? `${SUMM.split('. ')[0]}. Photos, how to get there, facts with sources, and the Japanese you’ll use at ${s.name}.` : SUMM;
  const pack = phrasePack(s.kind); const phrases = pack.phrases.slice(0, 4);
  const sibs = s.siblings.map(x => [x, SPOTS[x]]).filter(([, v]) => v);
  const wl = P.wl; // [rank, jp, en, gid, JBI, richness, species, threatened, records, area, pop]
  const jsonld = { '@context': 'https://schema.org', '@type': 'TouristAttraction', name: NAME, alternateName: s.kanji, description: SUMM, url, inLanguage: LANG_HTML[lang],
    image: { '@type': 'ImageObject', url: `https://www.nihongo-hub.com/blog/${heroP.file}`, caption: heroP.label, creditText: heroP.artist, license: heroP.license_url, acquireLicensePage: heroP.source_page },
    containedInPlace: { '@type': 'AdministrativeArea', name: `${P.name} Prefecture`, containedInPlace: { '@type': 'Country', name: 'Japan' } }, isAccessibleForFree: true };

  return `<!doctype html>
<html lang="${LANG_HTML[lang]}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${RELEASE.spots.includes(slug) ? '' : '<meta name="robots" content="noindex">'}
<link rel="canonical" href="${url}">
${altUrls.map(([l, h]) => `<link rel="alternate" hreflang="${LANG_HTML[l]}" href="${h}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${altUrls[0][1]}">
<link rel="icon" href="/favicon.ico" sizes="any">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(NAME)} — ${esc(P.name)}"><meta property="og:description" content="${esc(TAGL)}"><meta property="og:image" content="https://www.nihongo-hub.com/blog/${heroP.file}"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="nh-place" content="${esc(P.name)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&family=Karla:wght@400;500;700&family=Shippori+Mincho+B1:wght@700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>
:root{--paper:#f5efe3;--ink:#1c1a16;--ink-2:#4a453c;--muted:#7a7263;--line:#d9cfb9;--seal:#c1301c;--accent:${P.accent};--accent-soft:${P.accent}14;--card:#fffaf0;--max:1080px;--r:14px}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Karla,system-ui,sans-serif;-webkit-font-smoothing:antialiased;background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1px);background-size:6px 6px}
a{color:var(--accent)}img{max-width:100%;display:block;height:auto}h1,h2,h3{font-family:Fraunces,Georgia,serif;font-weight:600;letter-spacing:-.01em;line-height:1.1;margin:0}
.wrap{max-width:var(--max);margin:0 auto;padding:0 20px}
.nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px;background:var(--ink);color:#f5efe3;font-size:14px}.nav a{color:inherit;text-decoration:none}.nav .brand{font-family:Fraunces,serif;font-weight:700;font-size:20px}.nav .brand b{color:#e9a23b}.nav .links{display:flex;gap:18px;opacity:.85}.nav .cta{background:#e9a23b;color:#1c1a16;padding:6px 12px;border-radius:999px;font-weight:700}
.crumbs{font-size:13px;color:var(--muted);padding:12px 0}.crumbs a{color:var(--muted)}
.hero{position:relative;height:min(70vh,560px);min-height:380px;overflow:hidden;background:#222}.hero>img{width:100%;height:100%;object-fit:cover}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08) 25%,rgba(28,26,22,.55) 60%,rgba(28,26,22,.92) 100%);z-index:1}
.hero .in{position:absolute;inset:auto 0 0 0;color:#fff;padding:0 20px 36px;z-index:2}.hero .hw{max-width:var(--max);margin:0 auto;display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:end}
.stamp{width:104px;height:104px;border-radius:50%;border:5px double var(--seal);color:var(--seal);background:rgba(245,239,227,.93);display:grid;place-items:center;transform:rotate(-7deg);box-shadow:0 10px 30px rgba(0,0,0,.35);position:relative}.stamp span{font-family:'Shippori Mincho B1',serif;font-weight:800;font-size:40px;line-height:1}.stamp small{position:absolute;bottom:11px;font:700 8px/1 Karla;letter-spacing:.2em;text-transform:uppercase}
.hero .kicker{font:700 12px/1 Karla;letter-spacing:.24em;text-transform:uppercase;opacity:.9}.hero .kicker b{background:var(--seal);color:#fff;padding:3px 7px;border-radius:4px;margin-right:8px;letter-spacing:.14em}
.hero h1{font-size:clamp(38px,6.4vw,76px);font-weight:700;margin:8px 0 2px;text-shadow:0 2px 6px rgba(0,0,0,.6),0 8px 40px rgba(0,0,0,.6)}.hero h1 small{display:block;font:700 22px/1.2 'Shippori Mincho B1',serif;opacity:.9;margin-top:4px}
.hero .tag{font-family:Fraunces,serif;font-style:italic;font-weight:300;font-size:clamp(17px,2.2vw,24px);opacity:.98;max-width:36ch;text-shadow:0 1px 4px rgba(0,0,0,.7)}
.hero .cred{position:absolute;right:14px;top:12px;font-size:11px;color:#fff;opacity:.75;z-index:2}.hero .cred a{color:#fff}
.sum{display:grid;grid-template-columns:1.25fr 1fr;gap:36px;padding:44px 0 8px;align-items:start}.sum p.lede{font-family:Fraunces,serif;font-size:clamp(19px,2vw,24px);font-weight:300;line-height:1.4;margin:0 0 18px}
.facts{list-style:none;padding:0;margin:0}.facts li{padding:10px 0;border-top:1px solid var(--line);font-size:15px}.facts li small{display:block;color:var(--muted);font-size:12px}
.mapbox{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}.mapbox iframe{width:100%;height:280px;border:0;display:block}.mapbox .loc{padding:12px 14px;display:flex;gap:12px;align-items:center;font-size:13px}.mapbox .locator{width:78px;height:auto}.mapbox .locator path,.mapbox .locator polygon{fill:#e3d9c3 !important;stroke:#f5efe3 !important;stroke-width:1.2 !important}.mapbox .locator [data-code="${P.code}"] path,.mapbox .locator [data-code="${P.code}"] polygon,.mapbox .locator [data-code="${P.code}"]{fill:var(--accent) !important}
.strip{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:24px 0 6px}.strip figure:only-child{grid-column:span 2}.strip figure{margin:0;position:relative;overflow:hidden;border-radius:10px;height:260px;background:#ddd}.strip img{width:100%;height:100%;object-fit:cover}.strip figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 12px 10px;color:#fff;font-size:12px;background:linear-gradient(transparent,rgba(0,0,0,.6))}
.credits{font-size:11px;color:var(--muted);margin:6px 0 0}.credits a{color:var(--muted)}
section.blk{padding:44px 0 4px}.h{display:flex;align-items:baseline;gap:14px;margin-bottom:18px;flex-wrap:wrap}.h h2{font-size:clamp(26px,3vw,36px)}.h .n{font-family:Fraunces,serif;font-style:italic;color:var(--seal);font-size:18px}.h .hb{margin-left:auto}
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:#f5efe3;text-decoration:none;font-weight:700;font-size:14px;padding:10px 16px;border-radius:999px;white-space:nowrap}.btn.light{background:var(--card);color:var(--ink);border:1px solid var(--line)}.btn .pr{font-size:9px;letter-spacing:.14em;background:#e9a23b;color:#1c1a16;padding:2px 5px;border-radius:4px}
.plan{display:grid;grid-template-columns:1.4fr 1fr;gap:18px}.plan .card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:20px 22px}.plan .card h3{font-size:19px;margin-bottom:8px}.plan .card p{margin:0;color:var(--ink-2);font-size:15px}.plan .row{display:flex;flex-direction:column;gap:10px}
.speak{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.ph{background:var(--ink);color:#f5efe3;border-radius:var(--r);padding:20px 20px 16px;position:relative;overflow:hidden}.ph::after{content:"話";position:absolute;right:-6px;bottom:-26px;font:800 110px/1 'Shippori Mincho B1',serif;opacity:.06}.ph .jp{font:700 22px/1.35 'Shippori Mincho B1',serif;margin:0 0 4px}.ph .ro{font-style:italic;opacity:.85;font-size:14px}.ph .en{margin-top:6px;font-size:14px}
.nat{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.num{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px 14px;text-align:center}.num .v{font-family:Fraunces,serif;font-weight:700;font-size:28px;color:var(--accent);line-height:1.1}.num .l{font-weight:700;font-size:13px;margin-top:6px}.num .s{font-size:12px;color:var(--muted)}
.more{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.more a{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;text-decoration:none;color:var(--ink)}.more a b{font-family:Fraunces,serif;font-size:19px;display:block}.more a span{font-size:13px;color:var(--muted)}
.final{margin:48px 0 0;position:relative;border-radius:18px;overflow:hidden;min-height:260px;display:grid;place-items:center;text-align:center;color:#fff}.final img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.final::before{content:"";position:absolute;inset:0;background:rgba(28,26,22,.55)}.final .in{position:relative;padding:40px 20px}.final h2{font-size:clamp(26px,3.6vw,40px);margin-bottom:8px}.final p{margin:0 0 18px;opacity:.9}.final .btn{background:#e9a23b;color:#1c1a16;font-size:16px;padding:14px 22px}
.disc{font-size:12px;color:var(--muted);margin:26px 0 0}footer{margin-top:52px;padding:26px 20px;background:var(--ink);color:#c9c0ad;font-size:13px;text-align:center}footer a{color:#f5efe3}
@media (max-width:820px){.sum,.plan,.speak,.more,.strip{grid-template-columns:1fr}.nat{grid-template-columns:repeat(2,1fr)}.hero .hw{grid-template-columns:1fr}.stamp{width:84px;height:84px}.stamp span{font-size:32px}.nav .links{display:none}.h .hb{margin-left:0}}
</style>
</head>
<body>
<nav class="nav"><a class="brand" href="${S}index.html">Nihongo<b>Hub</b></a><div class="links"><a href="${B}index.html">${u('all47')}</a><a href="${guide}">${esc(P.name)} ${u('guide')}</a><a href="${map}">${u('playmap')}</a></div><div style="display:flex;gap:10px;align-items:center">${altUrls.map(([l]) => l === lang ? `<b style="color:#e9a23b">${LANG_LABEL[l]}</b>` : `<a href="${B}${l === 'en' ? '' : l + '/'}spots/${slug}.html" style="opacity:.8">${LANG_LABEL[l]}</a>`).join('')}<a class="cta" href="${S}quiz.html">${u('freequiz')}</a></div></nav>

<header class="hero">
  <img src="${B}${heroP.file}" width="${heroP.width}" height="${heroP.height}" alt="${esc(heroP.label)}, ${esc(P.name)} Prefecture, Japan" fetchpriority="high" decoding="async">
  <div class="cred">Photo: <a href="${esc(heroP.source_page)}" rel="noopener">${esc(heroP.artist)}</a> via ${SRC[heroP.fetched_from] || ''} · <a href="${esc(heroP.license_url)}" rel="license noopener">${esc(heroP.license)}</a></div>
  <div class="in"><div class="hw">
    <div class="stamp"><span>${esc(P.kanji)}</span><small>${esc(P.region)}</small></div>
    <div><div class="kicker"><b>${esc(BADGE)}</b>${esc(P.name)} · ${esc(P.region)} · Japan</div><h1>${esc(NAME)}<small>${esc(s.kanji)}</small></h1><p class="tag">${esc(TAGL)}</p></div>
  </div></div>
</header>

<main class="wrap">
  <div class="crumbs"><a href="${B}index.html">${u('all47')}</a> › <a href="${guide}">${esc(P.name)}</a> › ${esc(NAME)}</div>
  <div class="sum">
    <div>
      <p class="lede">${esc(SUMM)}</p>
      <ul class="facts">${s.facts.map(([t, src], i) => `<li>${esc(FACT(i))}<small>${u('source')}: ${esc(src)}</small></li>`).join('')}</ul>
    </div>
    <div class="mapbox"><iframe title="Map of ${esc(s.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${enc(s.mapq)}&output=embed"></iframe><div class="loc">${MAP_SVG}<div><b>${esc(NAME)}</b><br>${esc(P.name)} · ${esc(P.region)}<br><a href="https://www.google.com/maps/search/?api=1&query=${enc(s.mapq)}" target="_blank" rel="noopener">Open in Google Maps →</a></div></div></div>
  </div>
  ${s.photos.length > 1 ? `<div class="strip">${s.photos.slice(1).map(k => C[k] ? `<figure>${img(slug, k, P.name)}<figcaption>${esc(C[k].label)}</figcaption></figure>` : '').join('')}</div><p class="credits">${u('photos')}: ${s.photos.map(k => credit(slug, k)).filter(Boolean).join(' · ')}</p>` : ''}

  <section class="blk" id="plan">
    <div class="h"><span class="n">01</span><h2>${u('plan')}</h2><a class="btn hb" data-aff="viator" href="https://www.viator.com/searchResults/all?text=${enc(s.tickets)}" target="_blank" rel="sponsored noopener">${u('tourstickets')} <span class="pr">PR</span></a></div>
    <div class="plan">
      <div class="card"><h3>${u('getting')}</h3><p>${esc(ACC)}</p></div>
      <div class="card"><h3>${u('book')}</h3><div class="row">${s.ferry ? `<a class="btn light" data-aff="twelvego" href="https://12go.asia/en/travel/japan" target="_blank" rel="sponsored noopener">${u('ferries')} <span class="pr">PR</span></a>` : ''}<a class="btn light" data-aff="booking" data-aff-fallback="https://www.booking.com/searchresults.html?ss=${enc(s.hotelq)}" href="https://www.booking.com/searchresults.html?ss=${enc(s.hotelq)}" target="_blank" rel="sponsored noopener">${u('staynear')} <span class="pr">PR</span></a><a class="btn light" data-aff="yesim" href="https://yesim.app/" target="_blank" rel="sponsored noopener">eSIM <span class="pr">PR</span></a></div></div>
    </div>
  </section>

  <section class="blk" id="speak">
    <div class="h"><span class="n">02</span><h2>${esc(pack.label[lang] || pack.label.en)}</h2><a class="btn hb" data-aff="italki" href="https://www.italki.com/" target="_blank" rel="sponsored noopener">${u('practise')} <span class="pr">PR</span></a></div>
    <div class="speak">${phrases.map(p => `<div class="ph"><div class="jp">${esc(p.jp)}</div><div class="ro">${esc(p.ro)}</div><div class="en">${esc(p.trans[lang] || p.trans.en)}</div></div>`).join('')}</div>
    <p class="credits">${u('alsoin')} English · 繁體中文 · Español · ไทย · Bahasa Indonesia — <a href="${S}quiz.html?topic=travel">${u('testyourself')}</a>.</p>
  </section>

  ${wl ? `<section class="blk" id="nature"><div class="h"><span class="n">03</span><h2>${u('nature')} ${esc(P.name)}</h2><a class="btn light hb" href="${S}wildlife.html?pref=${s.pref}">${u('seeranking')}</a></div>
    <div class="nat"><div class="num"><div class="v">${wl[6].toLocaleString()}</div><div class="l">${u('species')}</div><div class="s">GBIF, 2024</div></div><div class="num"><div class="v">${wl[7]}</div><div class="l">${u('threatened')}</div><div class="s">IUCN CR/EN/VU, 2024</div></div><div class="num"><div class="v">${wl[8].toLocaleString()}</div><div class="l">${u('sightings')}</div><div class="s">GBIF occurrences, 2024</div></div><div class="num"><div class="v">#${wl[0]}</div><div class="l">${u('of47')}</div><div class="s">species richness, effort-standardised</div></div></div>
    <p class="credits">Data: GBIF occurrence records for ${esc(P.name)} (GADM ${esc(wl[3])}), year 2024, as compiled on NihongoHub Wildlife.</p></section>` : ''}

  <section class="blk" id="more"><div class="h"><span class="n">04</span><h2>${u('godeeper')}</h2></div>
    <div class="more">${s.guides.map(([h, t], i) => `<a href="${B}${h.replace(/^\.\.\//, '')}"><b>${esc(GLAB(i).split(' — ')[0])}</b><span>${esc(GLAB(i).split(' — ')[1] || '')}</span></a>`).join('')}${sibs.map(([k, v]) => { const TS = (T && T.pages[k]) || {}; return `<a href="${k}.html"><b>${esc(TS.name || v.name)}</b><span>${esc(TS.tagline || v.tagline)}</span></a>`; }).join('')}<a href="${guide}"><b>${esc(P.name)} ${u('guide')}</b><span>${u('prefguide')}</span></a><a href="${map}"><b>${u('playmapcard')}</b><span>${esc(u('unlock').replace('{name}', P.name))}</span></a></div>
  </section>

  <div class="final">${img(slug, s.photos[s.photos.length - 1], P.name)}<div class="in"><h2>${u('sleepnear')} ${esc(NAME)}</h2><p>${u('compareinns')} ${esc(s.hotelq)}.</p><a class="btn" data-aff="booking" data-aff-fallback="https://www.booking.com/searchresults.html?ss=${enc(s.hotelq)}" href="https://www.booking.com/searchresults.html?ss=${enc(s.hotelq)}" target="_blank" rel="sponsored noopener">${u('findstay')} <span class="pr">PR</span></a></div></div>

  <p class="disc">${u('disclosure')} Facts carry their source next to them; island figures are as printed in SHIMADAS and may predate your visit. Map: Geolonia (MIT); embedded map © Google.</p>
</main>
<footer>© 2026 NihongoHub · <a href="${B}index.html">${u('allguides')}</a> · <a href="${S}index.html">${u('home')}</a></footer>
<script defer src="/_vercel/insights/script.js"></script>
<script src="${S}lib/config.js"></script>
<script src="${B}blog-quiz.js"></script>
</body>
</html>`;
}

if (/build-spots-v2/.test(process.argv[1] || '')) {
const want = process.argv.slice(2).filter(a => !a.startsWith('--'));
const slugs = want.length ? want : Object.keys(SPOTS);
for (const s of slugs) {
  for (const lang of ['en', 'zh', 'es', 'th', 'id']) {
    if (lang !== 'en' && !loadT(lang)?.pages?.[s]) continue;
    const dir = lang === 'en' ? 'blog/spots/' : `blog/${lang}/spots/`; mkdirSync(ROOT + dir, { recursive: true });
    const html = buildSpot(s, lang); writeFileSync(`${ROOT}${dir}${s}.html`, html); console.log(`wrote ${dir}${s}.html (${(html.length / 1024).toFixed(0)} KB)`);
  }
}
}

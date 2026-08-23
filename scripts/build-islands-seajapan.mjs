#!/usr/bin/env node
// Regional child of the islands hub: the inhabited islands of the Sea of Japan side — Sado, the Oki, Rebun–Rishiri and the rest.
// Usage: node scripts/build-islands-seajapan.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'sea-of-japan-islands', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/islands.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const all = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(i => i.name && i.pop != null && i.area != null);
// membership by name within the relevant prefectures (the roster has no "which sea" field)
const SETS = {
  'North (Hokkaido)': { pref: '北海道', names: ['礼文島', '利尻島', '焼尻島', '天売島', '奥尻島', '室津島'] },
  'Sado & the Tōhoku–Hokuriku coast': { pref: null, names: ['佐渡島', '粟島', '飛島', '能登島', '舳倉島'] },
  'Oki': { pref: '島根県', names: ['島後', '中ノ島', '西ノ島', '知夫里島'] },
  'San\'in–Yamaguchi': { pref: '山口県', names: ['見島', '櫃島', '青海島', '角島', '蓋井島', '六連島'] },
  'Genkai (Fukuoka & Saga)': { pref: null, names: ['馬島', '藍島', '地島', '相島', '志賀島', '能古島', '玄界島', '小呂島', '姫島', '高島', '神集島', '小川島', '加部島', '加唐島', '松島', '馬渡島', '向島'] },
};
const PREF_EN = { '北海道': 'Hokkaido', '新潟県': 'Niigata', '山形県': 'Yamagata', '石川県': 'Ishikawa', '島根県': 'Shimane', '山口県': 'Yamaguchi', '福岡県': 'Fukuoka', '佐賀県': 'Saga' };
const list = [];
for (const [g, def] of Object.entries(SETS)) for (const i of all) {
  if (!def.names.includes(i.ja)) continue;
  if (def.pref && i.pref !== def.pref) continue;
  if (!def.pref && !['新潟県', '山形県', '石川県', '福岡県', '佐賀県'].includes(i.pref)) continue;
  if (g === 'North (Hokkaido)' && i.ja === '小島') continue;
  i.group = g; i.prefEn = PREF_EN[i.pref] || i.pref; list.push(i);
}
const GROUPS = Object.keys(SETS);
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const areaFmt = (a) => a == null ? '—' : (a >= 10 ? a.toFixed(0) : a.toFixed(2));
const P = (k) => CREDITS[SLUG][k];
const byPop = [...list].sort((a, b) => b.pop - a.pop); const tiny = list.filter(i => i.pop < 100);
const T = Object.fromEntries(list.map(i => [i.ja, i]));
const RELEASED = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'blog/v2-release.json'), 'utf8')).prefectures);
const prefLink = (i) => { const slug = { '北海道': 'hokkaido', '新潟県': 'niigata', '山形県': 'yamagata', '石川県': 'ishikawa', '島根県': 'shimane', '山口県': 'yamaguchi', '福岡県': 'fukuoka', '佐賀県': 'saga' }[i.pref]; return slug ? (RELEASED.has(slug) ? `${slug}-v2.html` : `${slug}.html`) : ''; };
const tr = (i) => `<tr data-g="${esc(i.group)}" data-pop="${i.pop}" data-area="${i.area}" data-q="${esc((i.name + ' ' + i.ja + ' ' + i.prefEn + ' ' + i.group).toLowerCase())}">
<td>${esc(i.name)}<span class="pk">${esc(i.ja)}</span></td><td>${prefLink(i) ? `<a href="${prefLink(i)}">${esc(i.prefEn)}</a>` : esc(i.prefEn)}<span class="pk">${esc(i.group)}</span></td><td class="num">${fmt(i.pop)}</td><td class="num">${areaFmt(i.area)}</td>
<td>${i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">Wikipedia</a>` : ''}</td></tr>`;

const TABLE = `<div class="prose"><p>Every inhabited island on Japan's Sea of Japan and Genkai coasts in the roster, from Rebun in the far north to the Saga fishing islands. Sort by people or size, or type a name.</p></div>
<div class="filters" id="jfilter"><button aria-pressed="true" data-g="all">All ${list.length}</button>${GROUPS.map(g => `<button aria-pressed="false" data-g="${g}">${g} (${list.filter(i => i.group === g).length})</button>`).join('')}<input type="search" id="jsearch" placeholder="Search an island…" aria-label="Search islands"></div>
<div class="tbl-wrap" style="max-height:70vh;overflow-y:auto"><table class="tbl" id="jtable"><thead><tr><th>Island</th><th>Prefecture · group</th><th class="sortable" data-k="pop">People ▾</th><th class="sortable" data-k="area">km² ▾</th><th>Read more</th></tr></thead><tbody>
${[...list].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || b.pop - a.pop).map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} islands. Population and area are the figures printed in SHIMADAS (2019 edition; 2015 census and GSI). Iki and Tsushima, which also face this sea, are in the <a href="nagasaki-islands.html">Nagasaki table</a>.</p>`;

const card = (key, title, body) => `<div class="card"><div class="imgw">${img(SLUG, key, title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;
const GROUPSEC = `<div class="prose"><p>The Sea of Japan islands are far apart and each one is its own trip. These are the ones people go for.</p></div>
<div class="cards">
${card('sado', 'Sado', `Japan's biggest island after the main four and Okinawa's: ${fmt(T['佐渡島']?.pop)} people, ${areaFmt(T['佐渡島']?.area)} km², gold mines (World Heritage since 2024), tub boats at Ogi, the crested ibis reintroduced to the wild. Jet-foil from Niigata in about 1 h 10 min.`)}
${card('hero', 'The Oki Islands', `Four inhabited islands 60–80 km off Shimane: Dōgo (${fmt(T['島後']?.pop)} people) and the three Dōzen islands — Nishinoshima with the Kuniga cliffs, Nakanoshima, Chiburijima (${fmt(T['知夫里島']?.pop)}). Exiled emperors, a UNESCO Global Geopark, ferries from Sakaiminato and Shichirui.`)}
${card('rishiri', 'Rebun and Rishiri', `Rishiri is a volcano in the sea (${fmt(T['利尻島']?.pop)} people); Rebun next to it (${fmt(T['礼文島']?.pop)}) is the "flower island", the northernmost inhabited island in Japan. Ferries from Wakkanai; June to August is the season and everything else is closed.`)}
${card('tsunoshima', 'The bridged and the near', `Tsunoshima (${fmt(T['角島']?.pop)}) is the bridge photo everyone knows; Notojima (${fmt(T['能登島']?.pop)}) has the aquarium; Ōmijima at Nagato and Shikanoshima off Fukuoka are day trips by car or bus. Islands you can visit without a timetable.`)}
${card('noko', 'The Genkai fishing islands', `Off Fukuoka and Saga: Nokonoshima (ten minutes from the city, ${fmt(T['能古島']?.pop)} people), Ainoshima with its cats, Genkaijima, and the Saga islands — Kakarashima, Madarashima, Kabeshima — reached from Karatsu and Yobuko. Fresh squid, no hotels.`)}
${card('hegura', 'The far ones', `Hegurajima (${fmt(T['舳倉島']?.pop)} people, 50 km off Wajima, ama divers and migrating birds), Mishima off Hagi (${fmt(T['見島']?.pop)}), Awashima off Niigata (${fmt(T['粟島']?.pop)}), Tobishima off Yamagata (${fmt(T['飛島']?.pop)}) and Okushiri off Hokkaido. One boat a day or fewer, and it does not go in a north-westerly.`)}
</div>`;

const HOW = `<div class="prose">
<p>The Sea of Japan coast is long, cold in winter and thinly islanded — ${list.length} inhabited islands from Hokkaido to Saga in the SHIMADAS roster, against ${110} in the Seto Inland Sea alone. What it lacks in number it makes up in character: Sado and the Oki are places of exile with a thousand years of history, Rebun and Rishiri are alpine islands at sea level, and the small ones are fishing villages that see almost nobody.</p>
<p>This is the Sea of Japan slice of our <a href="japan-inhabited-islands.html">table of every inhabited island in Japan</a>: same source, same columns, grouped by coast. Iki and Tsushima face the same sea but belong to Nagasaki and are in <a href="nagasaki-islands.html">that table</a>.</p>
</div>
<div class="callout"><b>The season matters more here than anywhere.</b> Ferries to Rebun, Rishiri, Hegura, Awashima and Tobishima thin out or stop in winter, and the north-westerly wind cancels sailings from November to March even where they run. Late spring to early autumn is the window; check 欠航 (cancellations) the morning you travel and have a spare day.</div>`;

const NUMBERS = `<div class="nums">
<div class="num"><div class="v">${list.length}</div><div class="l">Inhabited islands</div><div class="s">Hokkaido to Saga</div></div>
<div class="num"><div class="v">${tiny.length}</div><div class="l">Under 100 people</div><div class="s">${Math.round(tiny.length / list.length * 100)}%</div></div>
<div class="num"><div class="v">${fmt(byPop[0].pop)}</div><div class="l">Largest</div><div class="s">${esc(byPop[0].name)}</div></div>
<div class="num"><div class="v">${areaFmt(T['佐渡島']?.area)}</div><div class="l">km² · Sado</div><div class="s">bigger than Singapore</div></div>
<div class="num"><div class="v">45°N</div><div class="l">Rebun</div><div class="s">the northernmost inhabited island</div></div>
</div>
<p class="nums-src">Source: SHIMADAS (Japan Islands Center, 2019 edition), 2015 census and GSI figures.</p>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">On the board</div><div class="jp">欠航</div><div class="ro">kekkō</div><div class="en">Cancelled — on this coast, a winter habit</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">The sea</div><div class="jp">日本海</div><div class="ro">Nihonkai</div><div class="en">The Sea of Japan — 海 (umi/kai) is sea; the Inland Sea is 内海</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">On Sado and the Oki</div><div class="jp">流刑</div><div class="ro">rukei</div><div class="en">Exile — the reason emperors and monks ended up on these islands</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>`;

const FAQ = [
  ['Which islands are in the Sea of Japan?', `On the Japanese side, from north to south: Rebun, Rishiri, Yagishiri, Teuri and Okushiri off Hokkaido; Tobishima, Awashima and Sado off Tōhoku and Niigata; Notojima and Hegurajima off Ishikawa; the four Oki islands off Shimane; Mishima, Ōmijima, Tsunoshima and the small islands off Yamaguchi; and the Genkai islands off Fukuoka and Saga — ${list.length} inhabited islands in this table, plus Iki and Tsushima under Nagasaki.`],
  ['How do I get to Sado?', 'Jet-foil (about 1 h 10 min) or car ferry (about 2 h 30 min) from Niigata port to Ryōtsu; a second car ferry runs from Naoetsu to Ogi. Niigata is two hours from Tokyo by Shinkansen.'],
  ['How do I get to the Oki Islands?', 'Ferry or fast boat from Shichirui (Matsue) or Sakaiminato — about 2 h 30 min by ferry, faster on the Rainbow Jet — or a short flight from Izumo or Osaka Itami to Oki Airport on Dōgo. Boats between the four islands connect them.'],
  ['When can I visit Rebun and Rishiri?', 'June to early September. Ferries from Wakkanai run all year but lodgings, buses and the flower trails are seasonal, and winter sailings are often cancelled.'],
  ['Are the population figures current?', 'They are the 2015 census as printed in the 2019 edition of SHIMADAS; every island here has fewer people now.'],
];
const NEXT = `<div class="nb"><a href="japan-inhabited-islands.html"><b>Every inhabited island in Japan</b><span>The national table these ${list.length} come from.</span></a><a href="nagasaki-islands.html"><b>Nagasaki's islands</b><span>Iki, Tsushima, the Gotō and Hirado.</span></a><a href="seto-inland-sea-islands.html"><b>Islands of the Seto Inland Sea</b><span>110 islands, short ferries.</span></a></div>`;

const TITLE = `Sea of Japan Islands: Sado, the Oki, Rebun–Rishiri and Every Other Inhabited One (${list.length}) (2026)`;
const DESC = `Every inhabited island on Japan's Sea of Japan and Genkai coasts — ${list.length} from Rebun to Saga — grouped and sortable by population and area, with how Sado, the Oki and Rebun–Rishiri are reached and when the boats actually run.`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('hero').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };
const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('hero').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'hero', stamp: '隠岐', stampSmall: 'SEA OF JAPAN', kicker: `Japan · Sea of Japan coast · ${list.length} inhabited islands · updated ${date}`, title: 'Sea of Japan islands', tag: `Sado, the Oki, Rebun and Rishiri, and every other inhabited island on the cold side of the country.` })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">The Sea of Japan coast has ${list.length} inhabited islands between Hokkaido and Saga, and almost none of them are on the way to anywhere. Sado and the Oki are places of exile turned into places to go; Rebun and Rishiri are alpine islands you reach from Wakkanai in summer only; the rest are fishing villages that see one boat a day.</p>
      <p>The Sea of Japan slice of our national island table — same source, same numbers, grouped by coast, with the boats and the season explained.</p>
      <div class="chips"><span class="chip">${list.length} islands</span><span class="chip">${GROUPS.length} groups</span><span class="chip">${tiny.length} under 100 people</span><span class="chip">largest ${esc(byPop[0].name)}</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#groups">Sado · Oki · Rebun–Rishiri ↓</a><a class="btn light" href="#table">The table — all ${list.length}</a><a class="btn light" href="japan-inhabited-islands.html">All of Japan's islands</a><a class="btn light" href="nagasaki-islands.html">Nagasaki's islands</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['oki2', 'rebun', 'sado'])}
  ${section('01', 'how', 'The cold side of the country', HOW)}
  ${section('02', 'numbers', 'The shape of it', NUMBERS)}
  ${section('03', 'groups', 'The islands people go for', GROUPSEC)}
  ${section('04', 'table', `The table: all ${list.length}`, TABLE)}
  ${section('05', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('06', FAQ)}
  ${section('07', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: <i>SHIMADAS</i> (Japan Islands Center, 2019 edition) for the roster and figures (2015 census, GSI); only published figures are reproduced, no text. Which sea an island faces is our assignment by name; Ōnejima in Lake Nakaumi and the Pacific-side islands of the same prefectures are left out. English article links verified by prefecture; a blank means unverified. Photos are Creative Commons — credits under each image.</p>
</main>
${footer()}
<script>
(function(){var t=document.getElementById('jtable');if(!t)return;var tb=t.tBodies[0],rows=Array.prototype.slice.call(tb.rows),g='all',q='',dir={};
t.querySelectorAll('th.sortable').forEach(function(th){th.addEventListener('click',function(){var k=th.dataset.k,asc=!dir[k];dir={};dir[k]=asc;t.querySelectorAll('th.sortable').forEach(function(x){x.textContent=x.textContent.replace(/[▾▴]$/,'').trim()+' ▾';});th.textContent=th.textContent.replace(/[▾▴]$/,'').trim()+(asc?' ▴':' ▾');rows.sort(function(a,b){return (asc?1:-1)*(Number(a.dataset[k])-Number(b.dataset[k]));});rows.forEach(function(r){tb.appendChild(r);});});});
function apply(){rows.forEach(function(r){var ok=(g==='all'||r.dataset.g===g)&&(!q||r.dataset.q.indexOf(q)>=0);r.style.display=ok?'':'none';});}
var f=document.getElementById('jfilter');f.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');g=b.dataset.g;apply();});
document.getElementById('jsearch').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();apply();});})();
</script>
<!-- 計測 (2026-08-23): これが無いと pv_blog__<slug> も aff_* も飛ばず、記事別レポートに行が出ない -->
<script src="blog-quiz.js" defer><\/script>
</body>
</html>
`;
fs.writeFileSync(PAGE, html);
console.log(`built ${SLUG}.html: ${list.length} islands;`, GROUPS.map(g => g + '=' + list.filter(i => i.group === g).length).join(' | '));

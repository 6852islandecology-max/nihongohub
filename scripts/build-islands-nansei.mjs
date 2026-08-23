#!/usr/bin/env node
// Regional child of the islands hub: the Nansei (south-western) Islands — every inhabited island from Tanegashima to Yonaguni.
// Usage: node scripts/build-islands-nansei.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'nansei-islands', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/islands.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const all = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(i => i.name && i.pop != null && i.area != null && ['鹿児島県', '沖縄県'].includes(i.pref));
// entries are a name, or [name, area] where the name is shared by two islands in the same prefecture
const SETS = {
  'Ōsumi & Mishima': { pref: '鹿児島県', names: ['種子島', '屋久島', '口永良部島', '竹島', '硫黄島', '黒島'] },
  'Tokara': { pref: '鹿児島県', names: ['口之島', '中之島', '諏訪之瀬島', '平島', '悪石島', '小宝島', '宝島'] },
  'Amami': { pref: '鹿児島県', names: ['奄美大島', '加計呂麻島', '請島', '与路島', '喜界島', '徳之島', '沖永良部島', '与論島'] },
  'Around Okinawa Island': { pref: '沖縄県', names: ['伊平屋島', '野甫島', '伊是名島', ['宮城島', 0.24], '屋我地島', '古宇利島', '伊江島', '瀬底島', ['水納島', 0.47], '平安座島', ['宮城島', 5.54], '伊計島', '浜比嘉島', '津堅島', '久高島', ['奥武島', 0.23]] },
  'Kerama & the west': { pref: '沖縄県', names: ['前島', '渡嘉敷島', '座間味島', '阿嘉島', '慶留間島', '粟国島', '渡名喜島', '久米島', ['奥武島', 0.63], 'オーハ島'] },
  'Daitō': { pref: '沖縄県', names: ['南大東島', '北大東島'] },
  'Miyako': { pref: '沖縄県', names: ['宮古島', '池間島', '大神島', '来間島', '伊良部島', '下地島', '多良間島', ['水納島', 2.16]] },
  'Yaeyama': { pref: '沖縄県', names: ['石垣島', '竹富島', '小浜島', '嘉弥真島', '黒島', '新城島（上地・下地）', '西表島', '由布島', '鳩間島', '波照間島', '与那国島'] },
};
const PREF_EN = { '鹿児島県': 'Kagoshima', '沖縄県': 'Okinawa' };
const list = [];
for (const [g, def] of Object.entries(SETS)) for (const n of def.names) {
  const [ja, area] = Array.isArray(n) ? n : [n, null];
  const hit = all.find(i => i.pref === def.pref && i.ja === ja && (area == null || Math.abs(i.area - area) < 0.01));
  if (!hit) { console.error('missing', g, ja); continue; }
  hit.group = g; hit.prefEn = PREF_EN[hit.pref]; list.push(hit);
}
const GROUPS = Object.keys(SETS);
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const areaFmt = (a) => a == null ? '—' : (a >= 10 ? a.toFixed(0) : a.toFixed(2));
const P = (k) => CREDITS[SLUG][k];
const byPop = [...list].sort((a, b) => b.pop - a.pop); const tiny = list.filter(i => i.pop < 100);
const T = (ja, pref) => list.find(i => i.ja === ja && (!pref || i.pref === pref));
const RELEASED = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'blog/v2-release.json'), 'utf8')).prefectures);
const prefLink = (i) => { const slug = { '鹿児島県': 'kagoshima', '沖縄県': 'okinawa' }[i.pref]; return RELEASED.has(slug) ? `${slug}-v2.html` : `${slug}.html`; };
const tr = (i) => `<tr data-g="${esc(i.group)}" data-pop="${i.pop}" data-area="${i.area}" data-q="${esc((i.name + ' ' + i.ja + ' ' + i.prefEn + ' ' + i.group).toLowerCase())}">
<td>${esc(i.name)}<span class="pk">${esc(i.ja)}</span></td><td><a href="${prefLink(i)}">${esc(i.prefEn)}</a><span class="pk">${esc(i.group)}</span></td><td class="num">${fmt(i.pop)}</td><td class="num">${areaFmt(i.area)}</td>
<td>${i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">Wikipedia</a>` : ''}</td></tr>`;

const TABLE = `<div class="prose"><p>Every inhabited island of the chain, north to south, grouped the way the ferries and flights group them. Sort by people or size, or type a name.</p></div>
<div class="filters" id="jfilter"><button aria-pressed="true" data-g="all">All ${list.length}</button>${GROUPS.map(g => `<button aria-pressed="false" data-g="${g}">${g} (${list.filter(i => i.group === g).length})</button>`).join('')}<input type="search" id="jsearch" placeholder="Search an island…" aria-label="Search islands"></div>
<div class="tbl-wrap" style="max-height:70vh;overflow-y:auto"><table class="tbl" id="jtable"><thead><tr><th>Island</th><th>Prefecture · group</th><th class="sortable" data-k="pop">People ▾</th><th class="sortable" data-k="area">km² ▾</th><th>Read more</th></tr></thead><tbody>
${[...list].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || b.pop - a.pop).map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} islands. Population and area are the figures printed in SHIMADAS (2019 edition; 2015 census and GSI). Eight islands the extraction missed — Kuchinoshima, Nakakoshiki, Takeshima, Ukejima, Ikarajima, Zamami, Ikema and Hatoma — are taken from their Japanese Wikipedia articles, with the population as dated there. Okinawa Island itself is not a "remote island" in the roster and is not listed; the Koshiki and Yatsushiro-sea islands of Kagoshima are in the <a href="japan-inhabited-islands.html">national table</a>.</p>`;

const card = (key, title, body) => `<div class="card"><div class="imgw">${img(SLUG, key, title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;
const GROUPSEC = `<div class="prose"><p>Eight groups, and almost nobody does more than two in one trip. From north to south:</p></div>
<div class="cards">
${card('yakushima', 'Yakushima and Tanegashima', `The first islands south of Kyushu. Yakushima (${fmt(T('屋久島').pop)} people, ${areaFmt(T('屋久島').area)} km²) is the cedar forest — World Heritage since 1993, the Shiratani gorge that became Princess Mononoke's forest, and rain that locals say falls 35 days a month. Tanegashima next door (${fmt(T('種子島').pop)}) has the space centre and the surf. Jet-foil from Kagoshima in two to three hours, or a short flight. Kuchinoerabu and the three Mishima islands are the volcanic outliers.`)}
${card('suwanose', 'The Tokara Islands', `Seven inhabited islands in a line, ${fmt(list.filter(i => i.group === 'Tokara').reduce((s, i) => s + i.pop, 0))} people between them, one ferry from Kagoshima twice a week that takes 13 hours to the last one. Suwanosejima is an active volcano with ${fmt(T('諏訪之瀬島').pop)} people on its flank; Akusekijima has the masked Boze festival; Takarajima has the pirate-treasure legend. Toshima is the longest village in Japan, 160 km end to end.`)}
${card('amami', 'The Amami Islands', `Amami Ōshima (${fmt(T('奄美大島').pop)} people, ${areaFmt(T('奄美大島').area)} km²) is the biggest island on this page outside Okinawa and on the 2021 World Natural Heritage list for its forests and the Amami rabbit. Around it: Kakeroma, Uke and Yoro in the strait; Kikai, a raised coral island; Tokunoshima with its bullfights and centenarians; Okinoerabu's caves; Yoron, with a sandbar that appears at low tide and Okinawa on the horizon. Direct flights from Tokyo and Osaka; the Kagoshima–Naha ferry calls at all of them.`)}
${card('zamami', 'Kerama, Kume and the islands around Okinawa', `The Kerama — Tokashiki, Zamami (${fmt(T('座間味島').pop)} people), Aka, Geruma — are 40 km and under an hour from Naha, a national park, and the water people mean by "Kerama blue"; humpbacks in winter. Kume is a 35-minute flight with a seven-kilometre sandbar. Closer in, sixteen islands ring Okinawa Island — Kouri, Sesoko, Henza and Hamahiga by bridge, Ie by ferry from Motobu, and Kudaka, the sacred island, fifteen minutes from Azama.`)}
${card('hero', 'Miyako', `Miyako (${fmt(T('宮古島').pop)} people) has direct flights from Tokyo and Osaka, the seven-kilometre Yonaha-Maehama beach, and bridges to Ikema, Kurima and Irabu — the Irabu bridge, 3.5 km, is the longest toll-free one in Japan. Shimoji's airport reopened to airlines in 2019. Tarama and its Minna islet sit halfway to Ishigaki; Ōgami, ${fmt(T('大神島').pop)} people, is the island in the photo that nobody visits.`)}
${card('taketomi', 'Yaeyama', `Ishigaki (${fmt(T('石垣島').pop)}) is the hub with flights from the mainland; from its port Taketomi is ten minutes (the red-roofed village, the water-buffalo cart), Kohama and Kuroshima half an hour, Iriomote (${fmt(T('西表島').pop)} people on an island that is ninety per cent jungle, with about a hundred wild cats) forty minutes. Hateruma, an hour away on a rough crossing, is the southernmost inhabited island in Japan; Yonaguni, a flight west, is the westernmost, with Taiwan 111 km away and horses on the cliffs.`)}
</div>
<div class="callout"><b>Daitō.</b> Two more islands, ${fmt(T('南大東島').pop)} and ${fmt(T('北大東島').pop)} people, 360 km east of Okinawa and not on the way to anything: raised atolls with cliffs instead of beaches, sugar cane, a small plane from Naha, and a ferry that lifts passengers aboard in a crane basket because there is no harbour to speak of. They belong here only by prefecture, and they are the most surprising two rows in the table.</div>`;

const HOW = `<div class="prose">
<p>The Nansei Islands run 1,200 km from the tip of Kyushu to within sight of Taiwan. ${list.length} of them have people: the big, busy ones everyone has heard of — Yakushima, Amami, Miyako, Ishigaki — and fifty smaller ones that range from bridged suburbs of Okinawa Island to a volcano with seventy people on it. They are split between two prefectures, Kagoshima in the north and Okinawa from Yoron's horizon south, and the split is also a change of language, food, roof tiles and history: the Amami islands were taken from the Ryukyu Kingdom by Satsuma in 1609, and the rest were the kingdom until 1879.</p>
<p>This is the southern slice of our <a href="japan-inhabited-islands.html">table of every inhabited island in Japan</a>: same source, same columns, grouped by archipelago. Okinawa Island itself is not in the roster (it is the mainland here), and Kagoshima's islands in the Yatsushiro Sea and the Koshiki group face the other way and are left to the national table.</p>
</div>
<div class="callout"><b>Three gateways.</b> Kagoshima for Yakushima, Tanegashima, Tokara and Amami (and the long ferry south to Naha); Naha for the Kerama, Kume, the bridged islands and Daitō; Ishigaki for every Yaeyama island, with Miyako its own hub. Flying between gateways is normal; sailing the whole chain is a 25-hour ferry and a week.</div>`;

const NUMBERS = `<div class="nums">
<div class="num"><div class="v">${list.length}</div><div class="l">Inhabited islands</div><div class="s">Tanegashima to Yonaguni</div></div>
<div class="num"><div class="v">${tiny.length}</div><div class="l">Under 100 people</div><div class="s">${Math.round(tiny.length / list.length * 100)}%</div></div>
<div class="num"><div class="v">${fmt(byPop[0].pop)}</div><div class="l">Largest</div><div class="s">${esc(byPop[0].name)}</div></div>
<div class="num"><div class="v">${areaFmt(T('奄美大島').area)}</div><div class="l">km² · Amami Ōshima</div><div class="s">biggest by area</div></div>
<div class="num"><div class="v">111 km</div><div class="l">Yonaguni → Taiwan</div><div class="s">the western end</div></div>
</div>
<p class="nums-src">Source: SHIMADAS (Japan Islands Center, 2019 edition), 2015 census and GSI; eight islands from Japanese Wikipedia as noted under the table.</p>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">Greeting, Okinawan</div><div class="jp">めんそーれ</div><div class="ro">mensōre</div><div class="en">Welcome — you will see it at every airport south of Amami</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">On the board</div><div class="jp">欠航</div><div class="ro">kekkō</div><div class="en">Cancelled — Hateruma and Tokara crossings in particular</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">The word for island here</div><div class="jp">しま</div><div class="ro">shima</div><div class="en">In the Ryukyus it also means your home village — "my shima" is where you are from</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>`;

const FAQ = [
  ['What are the Nansei Islands?', `The chain of islands between Kyushu and Taiwan: the Ōsumi islands (Tanegashima, Yakushima), Tokara, Amami, the Okinawa islands, Miyako and Yaeyama, plus the Daitō islands to the east. ${list.length} of them are inhabited; the northern half is Kagoshima prefecture, the southern half Okinawa.`],
  ['Which is the best island to visit?', 'It depends what you want: Yakushima for forest and hiking, Zamami or Aka for a quick beach trip from Naha, Miyako for beaches with direct flights, Ishigaki as a base for Taketomi and Iriomote, Amami for the quiet version of all of it. Most people pick one gateway (Kagoshima, Naha or Ishigaki) and two islands.'],
  ['How do I get to the Yaeyama islands?', 'Fly to Ishigaki (direct from Tokyo, Osaka, Nagoya, Naha), then take the ferries from Ishigaki port: Taketomi 10 min, Kohama and Kuroshima about 30, Iriomote 40–45, Hateruma about 60. Yonaguni is a flight from Ishigaki or Naha, or a twice-weekly four-hour ferry.'],
  ['Is the southernmost island in Japan Hateruma?', 'Hateruma is the southernmost inhabited island; Okinotorishima, far to the east, is the southernmost territory but has no one on it. Yonaguni is the westernmost inhabited island.'],
  ['Are the population figures current?', 'They are the 2015 census as printed in the 2019 edition of SHIMADAS; most islands have fewer people now, though Miyako and Ishigaki have grown.'],
];
const NEXT = `<div class="nb"><a href="japan-inhabited-islands.html"><b>Every inhabited island in Japan</b><span>The national table these ${list.length} come from.</span></a><a href="izu-ogasawara-islands.html"><b>Izu and Ogasawara</b><span>Tokyo's islands, a day trip to a week.</span></a><a href="nagasaki-islands.html"><b>Nagasaki's islands</b><span>Iki, Tsushima, the Gotō and Hirado.</span></a></div>`;

const TITLE = `Nansei Islands: Every Inhabited Island From Tanegashima to Yonaguni (${list.length}) — Yakushima, Amami, Kerama, Miyako, Yaeyama (2026)`;
const DESC = `All ${list.length} inhabited islands of Japan's south-western chain — Yakushima and Tanegashima, Tokara, Amami, the islands around Okinawa, Kerama, Daitō, Miyako and Yaeyama — grouped and sortable by population and area, with which gateway each group is reached from.`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('hero').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };
const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('hero').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'hero', stamp: '琉球', stampSmall: 'NANSEI ISLANDS', kicker: `Japan · Kagoshima & Okinawa · ${list.length} inhabited islands · updated ${date}`, title: 'The Nansei Islands', tag: `Every inhabited island from Tanegashima to Yonaguni — Yakushima, Amami, Kerama, Miyako, Yaeyama and the ones in between.` })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">Between Kyushu and Taiwan there are ${list.length} islands with people on them. A handful are famous — Yakushima's cedars, Miyako's beaches, Ishigaki and Iriomote — and the rest are the reason to come back: Tokara's volcano villages, the Amami strait, the Kerama forty minutes from Naha, Hateruma at the bottom, Yonaguni at the western edge, and Daitō, which belongs to nothing.</p>
      <p>The southern slice of our national island table — same numbers, grouped by archipelago, with the gateway for each.</p>
      <div class="chips"><span class="chip">${list.length} islands</span><span class="chip">${GROUPS.length} groups</span><span class="chip">${tiny.length} under 100 people</span><span class="chip">largest ${esc(byPop[0].name)}</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#groups">Yakushima · Amami · Kerama · Yaeyama ↓</a><a class="btn light" href="#table">The table — all ${list.length}</a><a class="btn light" href="japan-inhabited-islands.html">All of Japan's islands</a><a class="btn light" href="${RELEASED.has('okinawa') ? 'okinawa-v2.html' : 'okinawa.html'}">Okinawa prefecture guide</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['hateruma', 'yonaguni', 'irabu'])}
  ${section('01', 'how', 'Twelve hundred kilometres of islands', HOW)}
  ${section('02', 'numbers', 'The shape of it', NUMBERS)}
  ${section('03', 'groups', 'The groups, north to south', GROUPSEC)}
  ${section('04', 'table', `The table: all ${list.length}`, TABLE)}
  ${section('05', 'japanese', 'The Japanese (and Okinawan) you\'ll actually use', SPEAK)}
  ${faqSection('06', FAQ)}
  ${section('07', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: <i>SHIMADAS</i> (Japan Islands Center, 2019 edition) for the roster and figures (2015 census, GSI); only published figures are reproduced, no text. Eight islands missing from our extraction are filled from Japanese Wikipedia and marked as such. Grouping is ours; ferry and flight times are rounded from the operators' timetables and change by season. English article links verified by prefecture; a blank means unverified. Photos are Creative Commons — credits under each image.</p>
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

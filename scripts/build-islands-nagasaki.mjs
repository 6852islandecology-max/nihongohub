#!/usr/bin/env node
// Regional child of the islands hub: the inhabited islands of Nagasaki — Gotō, Hirado, Iki, Tsushima and the bay islands.
// Usage: node scripts/build-islands-nagasaki.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'nagasaki-islands', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/islands.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const list = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(i => i.name && i.pop != null && i.area != null && i.pref === '長崎県');
// island groups (by name; the SHIMADAS roster does not carry an archipelago field)
const GOTO = new Set(['福江島', '中通島', '久賀島', '奈留島', '若松島', '宇久島', '小値賀島', '野崎島', '嵯峨島', '椛島', '頭ヶ島', '日島', '有福島', '漁生浦島', '黄島', '赤島', '桐ノ小島', '若宮島', '納島', '斑島', '六島', '島山島', '前島', '黒島', '寺島', '大島']);
const HIRADO = new Set(['平戸島', '的山大島', '度島', '高島', '生月島']);
const IKI = new Set(['壱岐島', '原島', '長島']);
const TSUSHIMA = new Set(['対馬島', '海栗島', '沖ノ島', '赤品泊島', '泊島']);
const group = (i) => GOTO.has(i.ja) && !(i.ja === '大島' && i.pop > 1000) && !(i.ja === '高島' && i.pop > 300) ? 'Gotō' : HIRADO.has(i.ja) ? 'Hirado' : IKI.has(i.ja) ? 'Iki' : TSUSHIMA.has(i.ja) ? 'Tsushima' : 'Bays & coast';
for (const i of list) i.group = group(i);
const GROUPS = ['Gotō', 'Hirado', 'Iki', 'Tsushima', 'Bays & coast'];
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const areaFmt = (a) => a == null ? '—' : (a >= 10 ? a.toFixed(0) : a.toFixed(2));
const P = (k) => CREDITS[SLUG][k];
const byPop = [...list].sort((a, b) => b.pop - a.pop); const tiny = list.filter(i => i.pop < 100);
const T = Object.fromEntries(list.map(i => [i.ja, i]));
const RELEASED = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'blog/v2-release.json'), 'utf8')).prefectures);
const prefPage = RELEASED.has('nagasaki') ? 'nagasaki-v2.html' : 'nagasaki.html';
const tr = (i) => `<tr data-g="${esc(i.group)}" data-pop="${i.pop}" data-area="${i.area}" data-q="${esc((i.name + ' ' + i.ja + ' ' + i.group).toLowerCase())}">
<td>${esc(i.name)}<span class="pk">${esc(i.ja)}</span></td><td>${esc(i.group)}</td><td class="num">${fmt(i.pop)}</td><td class="num">${areaFmt(i.area)}</td>
<td>${i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">Wikipedia</a>` : ''}</td></tr>`;

const TABLE = `<div class="prose"><p>Every inhabited island of Nagasaki Prefecture in the roster, grouped. Sort by people or size, or type a name. "Read more" links to the English Wikipedia article where we could verify one.</p></div>
<div class="filters" id="nfilter"><button aria-pressed="true" data-g="all">All ${list.length}</button>${GROUPS.map(g => `<button aria-pressed="false" data-g="${g}">${g} (${list.filter(i => i.group === g).length})</button>`).join('')}<input type="search" id="nsearch" placeholder="Search an island…" aria-label="Search islands"></div>
<div class="tbl-wrap" style="max-height:70vh;overflow-y:auto"><table class="tbl" id="ntable"><thead><tr><th>Island</th><th>Group</th><th class="sortable" data-k="pop">People ▾</th><th class="sortable" data-k="area">km² ▾</th><th>Read more</th></tr></thead><tbody>
${[...list].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || b.pop - a.pop).map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} islands. Population and area are the figures printed in SHIMADAS (2019 edition; 2015 census and GSI), except Nakadōri, which the roster extraction missed and which carries its 2010 census figure from the Japanese Wikipedia. Groups are ours; several small islands with the same name (Ōshima, Takashima) could not be told apart in the source and sit under "Bays & coast".</p>`;

const card = (key, title, body) => `<div class="card"><div class="imgw">${img(SLUG, key, title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;
const GROUPSEC = `<div class="prose"><p>Nagasaki's islands come in four groups and a scatter, and they are not interchangeable — Iki is a day out from Fukuoka, Tsushima is a trip, the Gotō are a pilgrimage.</p></div>
<div class="cards">
${card('church', 'The Gotō Islands', `Fukue (${fmt(T['福江島']?.pop)} people), Nakadōri (${fmt(T['中通島']?.pop)}), Naru, Wakamatsu, Hisaka, Ojika, Uku and a dozen small ones, 100 km west of Nagasaki. Fifty churches from the "hidden Christian" centuries, several on the World Heritage list; a jet-foil from Nagasaki or a flight from Fukuoka.`)}
${card('hirado', 'Hirado', `Hirado Island (${fmt(T['平戸島']?.pop)}) is bridged to the mainland; behind it Ikitsuki, Azuchi-Ōshima and Takushima. The first Dutch and English trading post in Japan, and the church-behind-temple view that is on every poster.`)}
${card('iki', 'Iki', `One big island (${fmt(T['壱岐島']?.pop)} people, ${areaFmt(T['壱岐島']?.area)} km²) an hour by jet-foil from Fukuoka's Hakata port — beaches, barley shōchū, ancient burial mounds and a Yayoi-period settlement site.`)}
${card('hero', 'Tsushima', `Japan's biggest island outside the main four and Okinawa, ${areaFmt(T['対馬島']?.area)} km² and ${fmt(T['対馬島']?.pop)} people, closer to Busan than to Fukuoka. Drowned valleys, the Tsushima leopard cat, and Korean day-trippers; a two-hour jet-foil from Hakata or a short flight.`)}
${card('hisaka', 'The small ones', `${tiny.length} of Nagasaki's islands have fewer than a hundred residents — Hisakajima (pictured, ${fmt(T['久賀島']?.pop)}) is one of the bigger of them. Boats a few times a day from Fukue or Nakadōri; nowhere to stay on most.`)}
</div>`;

const HOW = `<div class="prose">
<p>Nagasaki has more inhabited islands than any other prefecture — <b>${list.length}</b> in the SHIMADAS roster, a fifth of the national total — because its coast is nothing but peninsulas and bays and the Gotō, Hirado, Iki and Tsushima groups all lie off it. This page is the Nagasaki slice of our <a href="japan-inhabited-islands.html">table of every inhabited island in Japan</a>: same source, same columns, one prefecture, with the four groups pulled out because that is how you actually travel them.</p>
</div>
<div class="callout"><b>Getting there, in one paragraph.</b> Iki and Tsushima are served from Fukuoka's Hakata port (jet-foil about 1 h and 2 h 15 min; car ferries slower) and by air; the Gotō from Nagasaki port (jet-foil about 1 h 25 min to Fukue, ferries slower) and by air from Fukuoka and Nagasaki; Hirado by road across the bridge, with local boats to its outer islands. Search the island name plus 時刻表 for the timetable and 欠航 on the morning you travel.</div>`;

const NUMBERS = `<div class="nums">
<div class="num"><div class="v">${list.length}</div><div class="l">Inhabited islands</div><div class="s">in Nagasaki Prefecture</div></div>
<div class="num"><div class="v">${tiny.length}</div><div class="l">Under 100 people</div><div class="s">${Math.round(tiny.length / list.length * 100)}%</div></div>
<div class="num"><div class="v">${fmt(byPop[0].pop)}</div><div class="l">Largest</div><div class="s">${esc(byPop[0].name)}</div></div>
<div class="num"><div class="v">${areaFmt(T['対馬島']?.area)}</div><div class="l">km² · Tsushima</div><div class="s">the biggest island here</div></div>
<div class="num"><div class="v">4</div><div class="l">Groups</div><div class="s">Gotō · Hirado · Iki · Tsushima</div></div>
</div>
<p class="nums-src">Source: SHIMADAS (Japan Islands Center, 2019 edition), 2015 census and GSI figures; Nakadōri from ja.wikipedia (2010 census).</p>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">On the boat</div><div class="jp">ジェットフォイル</div><div class="ro">jettofoiru</div><div class="en">Jet-foil — the fast boat; the car ferry (フェリー) is half the price and twice the time</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">On the board</div><div class="jp">欠航</div><div class="ro">kekkō</div><div class="en">Cancelled — the outer islands lose sailings to wind more than anywhere</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">In the Gotō</div><div class="jp">教会</div><div class="ro">kyōkai</div><div class="en">Church — ask before entering, and not during Mass</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>`;

const FAQ = [
  ['How many islands does Nagasaki have?', `The prefecture claims the most islands in Japan; ${list.length} of them are inhabited according to the SHIMADAS roster used here, ${tiny.length} with fewer than a hundred people.`],
  ['Which Nagasaki island should I visit?', 'Iki for a day trip from Fukuoka (beaches, shōchū, easy). The Gotō — Fukue and Nakadōri — for the churches and a slower week. Tsushima if you want scale and wildlife and do not mind two hours on a boat. Hirado if you have a car and a day.'],
  ['How do I get to the Gotō Islands?', 'Jet-foil from Nagasaki port to Fukue (about 1 h 25 min) or car ferry (about 3 h); flights from Fukuoka and Nagasaki to Fukue; a ferry from Sasebo to Uku, Ojika and Nakadōri. Timetables are on the operators\' sites in Japanese.'],
  ['Are the population figures current?', 'They are the 2015 census as printed in the 2019 edition of SHIMADAS (Nakadōri: 2010, from the Japanese Wikipedia). All of these islands have fewer people now.'],
];
const NEXT = `<div class="nb"><a href="japan-inhabited-islands.html"><b>Every inhabited island in Japan</b><span>The national table these ${list.length} come from.</span></a><a href="seto-inland-sea-islands.html"><b>Islands of the Seto Inland Sea</b><span>The other regional table — 110 islands, short ferries.</span></a><a href="${prefPage}"><b>Nagasaki</b><span>The prefecture guide.</span></a></div>`;

const TITLE = `Nagasaki's Islands: All ${list.length} Inhabited Ones — Gotō, Hirado, Iki, Tsushima (2026)`;
const DESC = `Every inhabited island of Nagasaki Prefecture — ${list.length} of them, grouped into the Gotō, Hirado, Iki, Tsushima and the bay islands — sortable by population and area, with how each group is reached.`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('hero').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };
const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('hero').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'hero', stamp: '長崎', stampSmall: 'ISLANDS', kicker: `Japan · Nagasaki · ${list.length} inhabited islands · updated ${date}`, title: 'The islands of Nagasaki', tag: `Goto, Hirado, Iki, Tsushima and the bay islands — all ${list.length} inhabited ones, with people and size.` })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">Nagasaki has more inhabited islands than any other prefecture in Japan — ${list.length} in this table — and they sort themselves into four groups a traveller can actually use: the Goto and their churches, Hirado behind its bridge, Iki an hour from Fukuoka, and Tsushima out toward Korea.</p>
      <p>The Nagasaki slice of our national island table: same source, same numbers, grouped and with the boats explained.</p>
      <div class="chips"><span class="chip">${list.length} islands</span><span class="chip">4 groups</span><span class="chip">${tiny.length} under 100 people</span><span class="chip">largest ${esc(byPop[0].name)}</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#groups">The four groups ↓</a><a class="btn light" href="#table">The table — all ${list.length}</a><a class="btn light" href="japan-inhabited-islands.html">All of Japan's islands</a><a class="btn light" href="seto-inland-sea-islands.html">The Seto Inland Sea islands</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['church', 'iki', 'hisaka'])}
  ${section('01', 'how', 'Why Nagasaki has so many', HOW)}
  ${section('02', 'numbers', 'The shape of it', NUMBERS)}
  ${section('03', 'groups', 'The four groups, and the rest', GROUPSEC)}
  ${section('04', 'table', `The table: all ${list.length}`, TABLE)}
  ${section('05', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('06', FAQ)}
  ${section('07', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: <i>SHIMADAS</i> (Japan Islands Center, 2019 edition) for the roster and figures (2015 census, GSI); Nakadōri from the Japanese Wikipedia (2010 census, infobox area) because the roster extraction missed it. Only published figures are reproduced, no text. English article links verified by prefecture; a blank means unverified, not absent; several same-named small islands could not be told apart and carry no link. Photos are Creative Commons — credits under each image.</p>
</main>
${footer()}
<script>
(function(){var t=document.getElementById('ntable');if(!t)return;var tb=t.tBodies[0],rows=Array.prototype.slice.call(tb.rows),g='all',q='',dir={};
t.querySelectorAll('th.sortable').forEach(function(th){th.addEventListener('click',function(){var k=th.dataset.k,asc=!dir[k];dir={};dir[k]=asc;t.querySelectorAll('th.sortable').forEach(function(x){x.textContent=x.textContent.replace(/[▾▴]$/,'').trim()+' ▾';});th.textContent=th.textContent.replace(/[▾▴]$/,'').trim()+(asc?' ▴':' ▾');rows.sort(function(a,b){return (asc?1:-1)*(Number(a.dataset[k])-Number(b.dataset[k]));});rows.forEach(function(r){tb.appendChild(r);});});});
function apply(){rows.forEach(function(r){var ok=(g==='all'||r.dataset.g===g)&&(!q||r.dataset.q.indexOf(q)>=0);r.style.display=ok?'':'none';});}
var f=document.getElementById('nfilter');f.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');g=b.dataset.g;apply();});
document.getElementById('nsearch').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();apply();});})();
</script>
<!-- 計測 (2026-08-23): これが無いと pv_blog__<slug> も aff_* も飛ばず、記事別レポートに行が出ない -->
<script src="blog-quiz.js" defer><\/script>
</body>
</html>
`;
fs.writeFileSync(PAGE, html);
console.log(`built ${SLUG}.html: ${list.length} islands; groups`, GROUPS.map(g => g + '=' + list.filter(i => i.group === g).length).join(' '));

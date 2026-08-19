#!/usr/bin/env node
// Regional child of the islands hub: every inhabited island of the Seto Inland Sea, from blog/data/islands.json.
// Usage: node scripts/build-islands-seto.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'seto-inland-sea-islands', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/islands.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const all = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(i => i.name && i.pop != null && i.area != null);
const PREF = { '兵庫県': ['Hyogo', 'hyogo'], '岡山県': ['Okayama', 'okayama'], '広島県': ['Hiroshima', 'hiroshima'], '山口県': ['Yamaguchi', 'yamaguchi'], '香川県': ['Kagawa', 'kagawa'], '愛媛県': ['Ehime', 'ehime'], '徳島県': ['Tokushima', 'tokushima'], '大分県': ['Oita', 'oita'] };
// islands in those prefectures that face other seas — excluded by name
const NOT_SETO = new Set(['日振島', '戸島', '嘉島', '九島', '見島', '櫃島', '青海島', '角島', '蓋井島', '六連島', '出羽島', '伊島', '竹ケ島', '黒島', '津久見島', '保戸島', '大入島', '屋形島', '深島']);
const RELEASED = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'blog/v2-release.json'), 'utf8')).prefectures);
const list = all.filter(i => PREF[i.pref] && !NOT_SETO.has(i.ja) && !(i.pref === '大分県' && i.ja !== '姫島') && !(i.pref === '愛媛県' && i.ja === '大島' && i.pop !== 2504) && !(i.pref === '徳島県' && i.pop === 4459));
for (const i of list) { i.prefEn = PREF[i.pref][0]; i.prefSlug = PREF[i.pref][1]; }
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const areaFmt = (a) => a == null ? '—' : (a >= 10 ? a.toFixed(0) : a.toFixed(2));
const P = (k) => CREDITS[SLUG][k];
const byPop = [...list].sort((a, b) => b.pop - a.pop);
const tiny = list.filter(i => i.pop < 100);
const prefLink = (i) => RELEASED.has(i.prefSlug) ? `${i.prefSlug}-v2.html` : `${i.prefSlug}.html`;
const SPOT = { '島田島': 'spots/shimadajima-island.html' };
const tr = (i) => `<tr data-pref="${esc(i.prefEn)}" data-pop="${i.pop}" data-area="${i.area}" data-q="${esc((i.name + ' ' + i.ja + ' ' + i.prefEn).toLowerCase())}">
<td>${SPOT[i.ja] ? `<a href="${SPOT[i.ja]}">${esc(i.name)}</a>` : esc(i.name)}<span class="pk">${esc(i.ja)}</span></td>
<td><a href="${prefLink(i)}">${esc(i.prefEn)}</a></td>
<td class="num">${fmt(i.pop)}</td><td class="num">${areaFmt(i.area)}</td>
<td>${i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">Wikipedia</a>` : ''}</td></tr>`;
const PREFS = ['Hyogo', 'Okayama', 'Hiroshima', 'Yamaguchi', 'Kagawa', 'Ehime', 'Tokushima', 'Oita'];

const TABLE = `<div class="prose"><p>Every inhabited island of the Inland Sea in the SHIMADAS roster, by prefecture. Sort by people or size, or type a name. "Read more" links to the English Wikipedia article where we could verify one.</p></div>
<div class="filters" id="sfilter"><button aria-pressed="true" data-p="all">All ${list.length}</button>${PREFS.map(p => `<button aria-pressed="false" data-p="${p}">${p} (${list.filter(i => i.prefEn === p).length})</button>`).join('')}<input type="search" id="ssearch" placeholder="Search an island…" aria-label="Search islands"></div>
<div class="tbl-wrap" style="max-height:70vh;overflow-y:auto"><table class="tbl" id="stable"><thead><tr><th>Island</th><th>Prefecture</th><th class="sortable" data-k="pop">People ▾</th><th class="sortable" data-k="area">km² ▾</th><th>Read more</th></tr></thead><tbody>
${[...list].sort((a, b) => PREFS.indexOf(a.prefEn) - PREFS.indexOf(b.prefEn) || b.pop - a.pop).map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} islands. Population and area are the figures printed in SHIMADAS (2019 edition; 2015 census and GSI). Islands of these prefectures that face the Sea of Japan, the Pacific or the Bungo Channel are left out.</p>`;

const card = (key, title, body) => `<div class="card"><div class="imgw">${img(SLUG, key, title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;
const T = Object.fromEntries(list.map(i => [i.ja, i]));
const START = `<div class="prose"><p>The Inland Sea is the easiest place in Japan to island-hop, and the five below are the ones to learn it on: frequent boats, somewhere to eat, English on at least some signs. Then the table takes over.</p></div>
<div class="cards">
${card('naoshima', 'Naoshima', `The art island — Benesse, the Chichu museum, the pumpkin on the pier — and still a working town of ${fmt(T['直島']?.pop)}. Ferries from Takamatsu and Uno all day.`)}
${card('angel', 'Shōdoshima', `The big one: ${fmt(T['小豆島']?.pop)} people, olives, soy sauce, a gorge, and a sandbar you can walk at low tide. Buses on the island; boats from Takamatsu, Okayama and Kobe.`)}
${card('itsukushima', 'Miyajima (Itsukushima)', `The floating torii and ${fmt(T['厳島']?.pop)} residents behind the crowds. Ten minutes by ferry from Miyajimaguchi; stay overnight and the day-trippers vanish.`)}
${card('oyamazumi', 'Ōmishima', `On the Shimanami cycling route between Onomichi and Imabari; ${fmt(T['大三島']?.pop)} people and the shrine that guards the whole sea, with the country's largest collection of samurai armour.`)}
${card('hero', 'Ogijima', `${fmt(T['男木島']?.pop)} people on a hill so steep there are no cars, forty minutes from Takamatsu, on the same boat as Megijima. What the small islands feel like.`)}
${card('ferry', 'The rest of them', `${list.length - 5} more, most reached from Takamatsu, Okayama, Onomichi, Imabari, Hiroshima or Iwakuni by boats that also carry the post and the schoolchildren. Sort the table by people and start near the top.`)}
</div>`;

const HOW = `<div class="prose">
<p>The Seto Inland Sea — the sheltered water between Honshu, Shikoku and Kyushu — has more inhabited islands than any other stretch of Japan's coast: <b>${list.length}</b> in the SHIMADAS roster, across ${PREFS.length} prefectures, from Awaji with ${fmt(byPop[0].pop)} people down to islets of ${fmt(byPop[byPop.length - 1].pop)}. Three bridge systems cross it (Akashi–Naruto, Seto-Ōhashi, Shimanami), which means a handful of these islands you can drive or cycle to; the rest are boat-only, and the boats are short.</p>
<p>This is the Inland Sea slice of our <a href="japan-inhabited-islands.html">table of every inhabited island in Japan</a>. Same source — the SHIMADAS reference the Japan Islands Center publishes, never translated — same columns, one region.</p>
</div>
<div class="callout"><b>Which islands count.</b> All inhabited islands in Hyōgo, Okayama, Hiroshima, Kagawa and Ehime that lie in the Inland Sea, plus the Suō-nada islands of Yamaguchi, Himeshima in Ōita and Shimadajima at Naruto. Islands of the same prefectures that face the Sea of Japan (Mishima, Tsunoshima), the Pacific (Ishima) or the Bungo Channel (Hotojima) are not here — they are in the national table.</div>`;

const NUMBERS = `<div class="nums">
<div class="num"><div class="v">${list.length}</div><div class="l">Inhabited islands</div><div class="s">in the Inland Sea</div></div>
<div class="num"><div class="v">${tiny.length}</div><div class="l">Under 100 people</div><div class="s">${Math.round(tiny.length / list.length * 100)}% of them</div></div>
<div class="num"><div class="v">${fmt(byPop[0].pop)}</div><div class="l">Largest</div><div class="s">${esc(byPop[0].name)}, ${esc(byPop[0].prefEn)}</div></div>
<div class="num"><div class="v">${PREFS.reduce((b, p) => list.filter(i => i.prefEn === p).length > list.filter(i => i.prefEn === b).length ? p : b, PREFS[0])}</div><div class="l">Most islands</div><div class="s">${Math.max(...PREFS.map(p => list.filter(i => i.prefEn === p).length))} of them</div></div>
<div class="num"><div class="v">3</div><div class="l">Bridge routes</div><div class="s">Akashi–Naruto · Seto-Ōhashi · Shimanami</div></div>
</div>
<p class="nums-src">Source: SHIMADAS (Japan Islands Center, 2019 edition), 2015 census and GSI figures.</p>`;

const PLAN = `<div class="prose"><ul>
<li><b>Ports that matter:</b> Takamatsu (Naoshima, Shōdoshima, Megijima/Ogijima, Teshima), Uno in Okayama (Naoshima, Teshima), Onomichi and Imabari (the Shimanami islands, by bike or boat), Hiroshima and Miyajimaguchi (Miyajima, Ninoshima), Yanai and Iwakuni (the Yamaguchi islands), Kobe (Shōdoshima by jet-foil).</li>
<li><b>Timetables</b> are on the operator's site in Japanese; search the island's name plus 時刻表. Small islands get four to eight sailings a day, the last often before 18:00.</li>
<li><b>Bikes:</b> the Shimanami Kaidō (Onomichi–Imabari, about 70 km) is the one route where you can hop islands without a boat at all; rental stations at both ends and on the islands.</li>
<li><b>Art festival years</b> (Setouchi Triennale, next in 2028) triple the boats and the crowds on the Kagawa islands; every other year they are ordinary places again.</li>
<li><b>Sleeping:</b> Shōdoshima, Naoshima and Miyajima have hotels; almost everything else is a minshuku or nothing — book ahead and confirm dinner.</li>
</ul></div>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">At the port</div><div class="jp">次の便は何時ですか？</div><div class="ro">Tsugi no bin wa nanji desu ka?</div><div class="en">What time is the next boat?</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">On the board</div><div class="jp">欠航</div><div class="ro">kekkō</div><div class="en">Cancelled — the word to check on a windy morning</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">The sea itself</div><div class="jp">瀬戸内海</div><div class="ro">Setonaikai</div><div class="en">The Inland Sea — 瀬戸 (seto) is a strait, 内海 (naikai) an inland sea</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>`;

const FAQ = [
  ['How many islands are in the Seto Inland Sea?', `Roughly 700 islands in total; ${list.length} of them are inhabited according to the SHIMADAS roster used here, ${tiny.length} with fewer than a hundred residents.`],
  ['Which Seto Inland Sea island should I visit first?', 'Naoshima if you want art and English signage; Shōdoshima if you want a real island with buses, food and beaches; Miyajima if you are already in Hiroshima. Ōmishima and the Shimanami route if you cycle. Ogijima or Megijima for a first taste of a small island, forty minutes from Takamatsu.'],
  ['Can you visit the Seto Inland Sea islands without a car?', 'Yes — better without one. Ferries leave from city ports (Takamatsu, Uno, Onomichi, Imabari, Hiroshima) and most islands are walkable or have a bus or bike rental. The Shimanami Kaidō lets you cycle island to island over the bridges.'],
  ['When is the Setouchi Triennale?', 'Every three years, in spring, summer and autumn sessions on the Kagawa islands; the next edition after 2025 is 2028. Outside festival years the same islands are quiet and the boats far fewer.'],
  ['Are the population figures current?', 'They are the 2015 census figures as printed in the 2019 edition of SHIMADAS. Every small island here has fewer people now; treat the numbers as upper bounds.'],
];
const NEXT = `<div class="nb"><a href="japan-inhabited-islands.html"><b>Every inhabited island in Japan</b><span>The national table these ${list.length} come from.</span></a><a href="kagawa-v2.html"><b>Kagawa</b><span>Takamatsu, udon, and the art islands' home prefecture.</span></a><a href="ehime-v2.html"><b>Ehime</b><span>Imabari, the Shimanami Kaidō and the western Inland Sea.</span></a></div>`;

const TITLE = `Islands of the Seto Inland Sea: All ${list.length} Inhabited Ones, With Population and Size (2026)`;
const DESC = `Every inhabited island of Japan's Seto Inland Sea — ${list.length} across Hyōgo, Okayama, Hiroshima, Yamaguchi, Kagawa, Ehime, Tokushima and Ōita — sortable by population and area, with the five to start on and how the ferries work.`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('hero').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };
const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('hero').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'hero', stamp: '瀬戸', stampSmall: 'INLAND SEA', kicker: `Japan · Seto Inland Sea · ${list.length} inhabited islands · updated ${date}`, title: 'The islands of the Seto Inland Sea', tag: `All ${list.length} inhabited ones — from Awaji to islets of a dozen people — and the five to start on.` })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">The Inland Sea is where Japan keeps its islands close together: ${list.length} inhabited ones between Kobe and Kyushu, most of them a short ferry from a city port, three of them reachable by bridge. This is all of them, with the population and area beside each name.</p>
      <p>The famous few — Naoshima, Shōdoshima, Miyajima — are here, and so are the ${tiny.length} islands with fewer than a hundred residents that share the same boats and get none of the visitors.</p>
      <div class="chips"><span class="chip">${list.length} islands</span><span class="chip">${PREFS.length} prefectures</span><span class="chip">${tiny.length} under 100 people</span><span class="chip">3 bridge routes</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#start">The five to start on ↓</a><a class="btn light" href="#table">The table — all ${list.length}</a><a class="btn light" href="#plan">Ports, boats and bikes</a><a class="btn light" href="japan-inhabited-islands.html">All of Japan's islands</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['ferry', 'angel', 'itsukushima'])}
  ${section('01', 'how', 'What counts as the Inland Sea here', HOW)}
  ${section('02', 'numbers', 'The shape of it', NUMBERS)}
  ${section('03', 'start', 'The five to start on', START)}
  ${section('04', 'table', `The table: all ${list.length}`, TABLE)}
  ${section('05', 'plan', 'Ports, boats and bikes', PLAN)}
  ${section('06', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('07', FAQ)}
  ${section('08', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: <i>SHIMADAS</i> (Japan Islands Center, 2019 edition) for the roster and figures (2015 census, GSI); only published figures are reproduced, no text. English article links verified against the English Wikipedia by prefecture; a blank means unverified, not absent. Photos are Creative Commons — credits under each image.</p>
</main>
${footer()}
<script>
(function(){var t=document.getElementById('stable');if(!t)return;var tb=t.tBodies[0],rows=Array.prototype.slice.call(tb.rows),pf='all',q='',dir={};
t.querySelectorAll('th.sortable').forEach(function(th){th.addEventListener('click',function(){var k=th.dataset.k,asc=!dir[k];dir={};dir[k]=asc;t.querySelectorAll('th.sortable').forEach(function(x){x.textContent=x.textContent.replace(/[▾▴]$/,'').trim()+' ▾';});th.textContent=th.textContent.replace(/[▾▴]$/,'').trim()+(asc?' ▴':' ▾');rows.sort(function(a,b){return (asc?1:-1)*(Number(a.dataset[k])-Number(b.dataset[k]));});rows.forEach(function(r){tb.appendChild(r);});});});
function apply(){rows.forEach(function(r){var ok=(pf==='all'||r.dataset.pref===pf)&&(!q||r.dataset.q.indexOf(q)>=0);r.style.display=ok?'':'none';});}
var f=document.getElementById('sfilter');f.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');pf=b.dataset.p;apply();});
document.getElementById('ssearch').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();apply();});})();
</script>
</body>
</html>
`;
fs.writeFileSync(PAGE, html);
console.log(`built ${SLUG}.html: ${list.length} islands, ${tiny.length} under 100`);

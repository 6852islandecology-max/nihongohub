#!/usr/bin/env node
// Regional child of the islands hub: Tokyo's islands — the Izu chain and the Ogasawara (Bonin) group.
// Usage: node scripts/build-islands-izu.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'izu-ogasawara-islands', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/islands.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const all = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(i => i.name && i.pop != null && i.area != null && i.pref === '東京都');
const SETS = {
  'Izu — the near islands': ['大島', '利島', '新島', '式根島', '神津島'],
  'Izu — the far islands': ['三宅島', '御蔵島', '八丈島', '青ヶ島'],
  'Ogasawara (Bonin)': ['父島', '母島'],
  'Outposts — no civilians': ['硫黄島', '南鳥島'],
};
// how you get there from Tokyo (Takeshiba pier unless said otherwise); approximate, from the operators' timetables
const ACCESS = {
  '大島': 'Jet-foil about 1 h 45 · overnight ferry 6 h · 25-min flight from Chōfu',
  '利島': 'Jet-foil about 2 h 25 · overnight ferry',
  '新島': 'Jet-foil about 2 h 20–2 h 50 · overnight ferry · 40-min flight from Chōfu',
  '式根島': 'Jet-foil about 3 h · overnight ferry',
  '神津島': 'Jet-foil about 3 h 35 · overnight ferry · 45-min flight from Chōfu',
  '三宅島': 'Overnight ferry about 6 h 30 · 50-min flight from Chōfu',
  '御蔵島': 'Overnight ferry about 7 h 30 · helicopter from Miyakejima',
  '八丈島': '55-min flight from Haneda · overnight ferry about 10 h',
  '青ヶ島': 'Helicopter from Hachijōjima 20 min · boat about 3 h, often cancelled',
  '父島': 'Ogasawara-maru, 24 h, about one sailing a week · no airport',
  '母島': 'Hahajima-maru, 2 h from Chichijima',
  '硫黄島': 'No civilian access — Self-Defense Forces base',
  '南鳥島': 'No civilian access — SDF, coast guard and weather station',
};
const list = [];
for (const [g, names] of Object.entries(SETS)) for (const i of all) if (names.includes(i.ja)) { i.group = g; list.push(i); }
const GROUPS = Object.keys(SETS);
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const areaFmt = (a) => a == null ? '—' : (a >= 10 ? a.toFixed(0) : a.toFixed(2));
const P = (k) => CREDITS[SLUG][k];
const civ = list.filter(i => i.group !== 'Outposts — no civilians');
const byPop = [...civ].sort((a, b) => b.pop - a.pop);
const T = Object.fromEntries(list.map(i => [i.ja, i]));
const RELEASED = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'blog/v2-release.json'), 'utf8')).prefectures);
const TOKYO = RELEASED.has('tokyo') ? 'tokyo-v2.html' : 'tokyo.html';
const tr = (i) => `<tr data-g="${esc(i.group)}" data-pop="${i.pop}" data-area="${i.area}" data-q="${esc((i.name + ' ' + i.ja + ' ' + i.group).toLowerCase())}">
<td>${esc(i.name)}<span class="pk">${esc(i.ja)}</span></td><td>${esc(ACCESS[i.ja] || '')}<span class="pk">${esc(i.group)}</span></td><td class="num">${fmt(i.pop)}</td><td class="num">${areaFmt(i.area)}</td>
<td>${i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">Wikipedia</a>` : ''}</td></tr>`;

const TABLE = `<div class="prose"><p>Every island of Tokyo Metropolis with people on it, north to south, with how you get there. The two outposts at the bottom have staff, not residents.</p></div>
<div class="filters" id="jfilter"><button aria-pressed="true" data-g="all">All ${list.length}</button>${GROUPS.map(g => `<button aria-pressed="false" data-g="${g}">${g} (${list.filter(i => i.group === g).length})</button>`).join('')}<input type="search" id="jsearch" placeholder="Search an island…" aria-label="Search islands"></div>
<div class="tbl-wrap"><table class="tbl" id="jtable"><thead><tr><th>Island</th><th>Getting there · group</th><th class="sortable" data-k="pop">People ▾</th><th class="sortable" data-k="area">km² ▾</th><th>Read more</th></tr></thead><tbody>
${[...list].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || SETS[a.group].indexOf(a.ja) - SETS[b.group].indexOf(b.ja)).map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} islands. Population and area are the figures printed in SHIMADAS (2019 edition; 2015 census and GSI), except Shikinejima, which the extraction missed and is taken from the Japanese Wikipedia article (about 550 people). Iwo Jima's ${fmt(T['硫黄島']?.pop)} and Minamitorishima's ${fmt(T['南鳥島']?.pop)} are stationed personnel. Travel times are approximate and from Takeshiba pier in Tokyo unless stated.</p>`;

const card = (key, title, body) => `<div class="card"><div class="imgw">${img(SLUG, key, title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;
const GROUPSEC = `<div class="prose"><p>Thirteen islands, one prefecture, and a thousand kilometres between the first and the last. These are the ones people go for.</p></div>
<div class="cards">
${card('chichijima', 'Chichijima and the Ogasawara', `A thousand kilometres south of Tokyo, no airport, and one ship: the Ogasawara-maru takes 24 hours and sails about once a week, so the shortest trip is six days. Chichijima (${fmt(T['父島']?.pop)} people) is a World Natural Heritage island with whales, endemic snails and the Minamijima lagoon; Hahajima (${fmt(T['母島']?.pop)}) is two more hours south. "Bonin" is old English for <i>bunin</i>, 無人 — uninhabited, which they were until the 1830s.`)}
${card('aogashima', 'Aogashima', `${fmt(T['青ヶ島']?.pop)} people on a double volcano — a cone inside a caldera inside the sea — and the smallest village in Japan by population. Reached from Hachijōjima by a 20-minute helicopter (nine seats, book a month ahead) or a boat that is cancelled roughly half the time. Steam vents cook your dinner at the sauna.`)}
${card('hachijo', 'Hachijōjima', `The easy far island: 55 minutes from Haneda, three flights a day, ${fmt(T['八丈島']?.pop)} people, hot springs, Hachijō-Fuji (854 m) to climb before lunch, and the island where exiles from Edo were sent. Overnight ferry from Takeshiba if you like ten hours at sea.`)}
${card('kozu', 'Niijima, Shikinejima and Kōzushima', `The middle three, reached by the same jet-foil. Niijima (${fmt(T['新島']?.pop)} people) is a surf island with a six-kilometre white beach; Shikinejima is small and has free hot springs in the rocks by the sea; Kōzushima (${fmt(T['神津島']?.pop)}) is a certified dark-sky island with Mount Tenjō above the village. Ōshima Island (${fmt(T['大島']?.pop)} people, Mount Mihara) is the first stop and the one you can do in a day.`)}
${card('miyake', 'Miyakejima and Mikurajima', `Miyakejima (${fmt(T['三宅島']?.pop)}) is the volcano that evacuated its whole population in 2000 and let them back in 2005; the island is a bird reserve and a diving spot. Mikurajima next door (${fmt(T['御蔵島']?.pop)} people) is where you swim with wild dolphins, and it is on the same overnight ferry.`)}
${card('mihara', 'Ōshima', `Closest and biggest of the Izu islands: ${fmt(T['大島']?.pop)} people, ${areaFmt(T['大島']?.area)} km², Mount Mihara's crater walk, three million camellia trees, and 1 h 45 by jet-foil from Tokyo or 45 minutes from Atami. The one Izu island you can do as a day trip.`)}
</div>`;

const HOW = `<div class="prose">
<p>Tokyo Metropolis runs from Shinjuku to an atoll 1,800 km out in the Pacific. In between are ${civ.length} islands with people on them: the nine Izu islands strung south from Sagami Bay, and the two inhabited Ogasawara islands a day's sailing beyond. Every one is administered from Tokyo, most are reached from Takeshiba pier by the Hamamatsuchō station, and they could hardly be more different from each other — Ōshima is a day trip; Chichijima needs a week.</p>
<p>This is the Tokyo slice of our <a href="japan-inhabited-islands.html">table of every inhabited island in Japan</a>: same source, same columns, with the boats and flights added, because here the way you get there is the whole story. If you came for the anime settings, <a href="tokyo-izu-islands-anime.html">that article is here</a>.</p>
</div>
<div class="callout"><b>Book the boat first, then everything else.</b> The Izu jet-foils and the Ogasawara-maru sell out on holidays and stop for typhoons; Aogashima's boat runs about half the days it is scheduled. Plan the crossing, keep a spare day at the far end, and check 欠航 (cancellations) on the operator's page the morning you travel.</div>`;

const NUMBERS = `<div class="nums">
<div class="num"><div class="v">${civ.length}</div><div class="l">Inhabited islands</div><div class="s">+ 2 outposts</div></div>
<div class="num"><div class="v">24 h</div><div class="l">Tokyo → Chichijima</div><div class="s">the only way there</div></div>
<div class="num"><div class="v">${fmt(T['青ヶ島']?.pop)}</div><div class="l">People on Aogashima</div><div class="s">Japan's smallest village</div></div>
<div class="num"><div class="v">${fmt(byPop[0].pop)}</div><div class="l">Largest</div><div class="s">${esc(byPop[0].name)}</div></div>
<div class="num"><div class="v">1,850 km</div><div class="l">Minamitorishima</div><div class="s">still Tokyo</div></div>
</div>
<p class="nums-src">Source: SHIMADAS (Japan Islands Center, 2019 edition), 2015 census and GSI figures; Shikinejima from Wikipedia.</p>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">On the board</div><div class="jp">欠航</div><div class="ro">kekkō</div><div class="en">Cancelled — the word that decides Izu and Ogasawara trips</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">The pier</div><div class="jp">竹芝</div><div class="ro">Takeshiba</div><div class="en">The Tokyo pier the island boats leave from</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">The name</div><div class="jp">無人</div><div class="ro">mujin / bunin</div><div class="en">Uninhabited — the "Bonin" in Bonin Islands</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>`;

const FAQ = [
  ['Which islands belong to Tokyo?', `The Izu Islands — Ōshima, Toshima, Niijima, Shikinejima, Kōzushima, Miyakejima, Mikurajima, Hachijōjima and Aogashima — and the Ogasawara (Bonin) Islands, of which Chichijima and Hahajima are inhabited. Iwo Jima and Minamitorishima are also Tokyo but have only stationed staff.`],
  ['How do I get to the Izu Islands from Tokyo?', 'Jet-foils and overnight ferries from Takeshiba pier (Hamamatsuchō station), some also from Atami and Shimoda; small planes from Chōfu airfield to Ōshima, Niijima, Kōzushima and Miyakejima; jets from Haneda to Hachijōjima.'],
  ['How do I get to the Ogasawara Islands?', 'Only by the Ogasawara-maru from Takeshiba: 24 hours to Chichijima, about one sailing a week, so a round trip takes six days at least. There is no airport. Hahajima is a further two hours by the Hahajima-maru.'],
  ['Can I visit Aogashima?', 'Yes — a 20-minute helicopter from Hachijōjima (book early, nine seats) or the boat, which is cancelled about half the time. Give yourself spare days on both ends.'],
  ['Are the population figures current?', 'They are the 2015 census as printed in the 2019 edition of SHIMADAS; most islands have fewer people now.'],
];
const NEXT = `<div class="nb"><a href="japan-inhabited-islands.html"><b>Every inhabited island in Japan</b><span>The national table these ${list.length} come from.</span></a><a href="tokyo-izu-islands-anime.html"><b>Tokyo's anime islands</b><span>Five Izu settings you can reach by ferry.</span></a><a href="sea-of-japan-islands.html"><b>Sea of Japan islands</b><span>Sado, the Oki, Rebun and Rishiri.</span></a></div>`;

const TITLE = `Izu and Ogasawara Islands: Every Inhabited Island of Tokyo, With How to Get There (2026)`;
const DESC = `All ${civ.length} inhabited islands of Tokyo Metropolis — Ōshima to Aogashima and Chichijima–Hahajima — with population, area, and the jet-foil, ferry, flight or 24-hour ship that gets you to each.`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('hero').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };
const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('hero').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'hero', stamp: '伊豆', stampSmall: 'TOKYO ISLANDS', kicker: `Japan · Tokyo Metropolis · ${civ.length} inhabited islands · updated ${date}`, title: 'Izu and Ogasawara islands', tag: `Every island of Tokyo with people on it, from a day trip to a week at sea.` })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">Tokyo has ${civ.length} inhabited islands and they run a thousand kilometres out to sea: Ōshima, which you can do in a day; the surf and hot-spring islands in the middle; Hachijōjima an hour's flight away; Aogashima, ${fmt(T['青ヶ島']?.pop)} people inside a volcano; and Chichijima and Hahajima, twenty-four hours by the only ship. Same prefecture, different worlds.</p>
      <p>The Tokyo slice of our national island table — same numbers, plus how you actually get to each one, because that is the whole question here.</p>
      <div class="chips"><span class="chip">${civ.length} inhabited</span><span class="chip">${GROUPS.length} groups</span><span class="chip">1 h 45 to 24 h from Tokyo</span><span class="chip">largest ${esc(byPop[0].name)}</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#groups">Ogasawara · Aogashima · Hachijō ↓</a><a class="btn light" href="#table">The table — all ${list.length}</a><a class="btn light" href="japan-inhabited-islands.html">All of Japan's islands</a><a class="btn light" href="${TOKYO}">Tokyo prefecture guide</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['aogashima', 'hahajima', 'niijima'])}
  ${section('01', 'how', 'A prefecture that runs out to sea', HOW)}
  ${section('02', 'numbers', 'The shape of it', NUMBERS)}
  ${section('03', 'groups', 'The islands people go for', GROUPSEC)}
  ${section('04', 'table', `The table: all ${list.length}`, TABLE)}
  ${section('05', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('06', FAQ)}
  ${section('07', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: <i>SHIMADAS</i> (Japan Islands Center, 2019 edition) for the roster and figures (2015 census, GSI); only published figures are reproduced, no text. Shikinejima is added from the Japanese Wikipedia article because the extraction skipped it. Travel times are rounded from the operators' published timetables (Tōkai Kisen, Ogasawara Kaiun, New Central Airservice, ANA, Tokyo Island Shuttle) and change by season. Photos are Creative Commons or public domain — credits under each image.</p>
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

#!/usr/bin/env node
// Build blog/japan-inhabited-islands.html (v2 design) from blog/data/islands.json.
// The hub: every inhabited island in the SHIMADAS list, sortable, with the "how much English
// with the population and area beside each name, plus a link where an English article exists.
// Links out to the existing assets: the 47 prefecture guides and the Tokushima island spot pages.
// Usage: node scripts/build-islands.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, fig, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'japan-inhabited-islands', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/islands.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const list = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(i => i.name && i.pop != null && i.area != null);
const P = (k) => CREDITS[SLUG][k];

// prefecture -> region + english slug (the 47 guides already on the site)
const PREF = {
  '北海道': ['Hokkaido', 'hokkaido', 'Hokkaido'],
  '青森県': ['Aomori', 'aomori', 'Tohoku'], '岩手県': ['Iwate', 'iwate', 'Tohoku'], '宮城県': ['Miyagi', 'miyagi', 'Tohoku'], '秋田県': ['Akita', 'akita', 'Tohoku'], '山形県': ['Yamagata', 'yamagata', 'Tohoku'], '福島県': ['Fukushima', 'fukushima', 'Tohoku'],
  '茨城県': ['Ibaraki', 'ibaraki', 'Kanto'], '栃木県': ['Tochigi', 'tochigi', 'Kanto'], '群馬県': ['Gunma', 'gunma', 'Kanto'], '埼玉県': ['Saitama', 'saitama', 'Kanto'], '千葉県': ['Chiba', 'chiba', 'Kanto'], '東京都': ['Tokyo', 'tokyo', 'Kanto'], '神奈川県': ['Kanagawa', 'kanagawa', 'Kanto'],
  '新潟県': ['Niigata', 'niigata', 'Chubu'], '富山県': ['Toyama', 'toyama', 'Chubu'], '石川県': ['Ishikawa', 'ishikawa', 'Chubu'], '福井県': ['Fukui', 'fukui', 'Chubu'], '山梨県': ['Yamanashi', 'yamanashi', 'Chubu'], '長野県': ['Nagano', 'nagano', 'Chubu'], '岐阜県': ['Gifu', 'gifu', 'Chubu'], '静岡県': ['Shizuoka', 'shizuoka', 'Chubu'], '愛知県': ['Aichi', 'aichi', 'Chubu'],
  '三重県': ['Mie', 'mie', 'Kansai'], '滋賀県': ['Shiga', 'shiga', 'Kansai'], '京都府': ['Kyoto', 'kyoto', 'Kansai'], '大阪府': ['Osaka', 'osaka', 'Kansai'], '兵庫県': ['Hyogo', 'hyogo', 'Kansai'], '奈良県': ['Nara', 'nara', 'Kansai'], '和歌山県': ['Wakayama', 'wakayama', 'Kansai'],
  '鳥取県': ['Tottori', 'tottori', 'Chugoku'], '島根県': ['Shimane', 'shimane', 'Chugoku'], '岡山県': ['Okayama', 'okayama', 'Chugoku'], '広島県': ['Hiroshima', 'hiroshima', 'Chugoku'], '山口県': ['Yamaguchi', 'yamaguchi', 'Chugoku'],
  '徳島県': ['Tokushima', 'tokushima', 'Shikoku'], '香川県': ['Kagawa', 'kagawa', 'Shikoku'], '愛媛県': ['Ehime', 'ehime', 'Shikoku'], '高知県': ['Kochi', 'kochi', 'Shikoku'],
  '福岡県': ['Fukuoka', 'fukuoka', 'Kyushu'], '佐賀県': ['Saga', 'saga', 'Kyushu'], '長崎県': ['Nagasaki', 'nagasaki', 'Kyushu'], '熊本県': ['Kumamoto', 'kumamoto', 'Kyushu'], '大分県': ['Oita', 'oita', 'Kyushu'], '宮崎県': ['Miyazaki', 'miyazaki', 'Kyushu'], '鹿児島県': ['Kagoshima', 'kagoshima', 'Kyushu'], '沖縄県': ['Okinawa', 'okinawa', 'Okinawa'],
};
const REGIONS = ['Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu', 'Okinawa'];
// islands that already have their own page on this site
const SPOT_PAGES = { '伊島': 'spots/ishima-island.html', '竹ヶ島': 'spots/takegashima-island.html', '島田島': 'spots/shimadajima-island.html' };
const RELEASED = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'blog/v2-release.json'), 'utf8')).prefectures);
const prefLink = (jaPref) => { const p = PREF[jaPref]; if (!p) return ''; const slug = p[1]; return RELEASED.has(slug) ? `${slug}-v2.html` : `${slug}.html`; };

for (const i of list) { const p = PREF[i.pref] || ['', '', '']; i.prefEn = p[0]; i.region = p[2]; }
const known = list.filter(i => i.wikiEn).length;
const noEn = list.filter(i => !i.wikiEn);
const tiny = list.filter(i => i.pop < 100);
const byPop = [...list].sort((a, b) => a.pop - b.pop);
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const areaFmt = (a) => a == null ? '—' : (a >= 10 ? a.toFixed(0) : a.toFixed(2));
// the small end of the list: inhabited, reachable, and too small for anyone to have written a guide to
const SMALL = list.filter(i => i.pop < 100).sort((a, b) => a.pop - b.pop);

const tr = (i) => {
  const link = SPOT_PAGES[i.ja], pl = prefLink(i.pref);
  const nameCell = link ? `<a href="${link}">${esc(i.name)}</a>` : (i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">${esc(i.name)}</a>` : esc(i.name));
  return `<tr data-region="${esc(i.region)}" data-pop="${i.pop}" data-area="${i.area}" data-en="${i.wikiEn ? 1 : 0}" data-q="${esc((i.name + ' ' + i.ja + ' ' + i.prefEn).toLowerCase())}">
<td>${nameCell}<span class="pk">${esc(i.ja)}</span></td>
<td>${pl ? `<a href="${pl}">${esc(i.prefEn)}</a>` : esc(i.prefEn)}<span class="pk">${esc(i.region)}</span></td>
<td class="num">${fmt(i.pop)}</td>
<td class="num">${areaFmt(i.area)}</td>
<td>${i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">Wikipedia</a>` : ''}</td>
</tr>`;
};

const TABLE = `<div class="prose"><p>Sort by population or size, filter by region, or type a name. "Read more" links to the English Wikipedia article where we could verify one; a blank means we could not match it confidently, not that none exists.</p></div>
<div class="filters" id="isfilter"><button aria-pressed="true" data-r="all">All ${list.length}</button>${REGIONS.map(r => `<button aria-pressed="false" data-r="${r}">${r}</button>`).join('')}<button aria-pressed="false" data-r="tiny">Under 100 people (${tiny.length})</button><input type="search" id="issearch" placeholder="Search an island or prefecture…" aria-label="Search islands"></div>
<div class="tbl-wrap" style="max-height:70vh;overflow-y:auto"><table class="tbl" id="istable">
<thead><tr><th>Island</th><th>Prefecture</th><th class="sortable" data-k="pop">People ▾</th><th class="sortable" data-k="area">km² ▾</th><th>Read more</th></tr></thead>
<tbody>
${[...list].sort((a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || b.pop - a.pop).map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} inhabited islands. Population, households, area, coastline and elevation are the figures printed in <i>SHIMADAS</i> (Japan Islands Center, 2019 edition), which takes them from the 2015 national census and Geospatial Information Authority mapping — so they are a decade old and every small island has lost people since. "Read more" links to the English Wikipedia article where we could verify one.</p>`;

const HOW = `${fig(SLUG, 'ferry')}
<div class="prose">
<p>Japan counts <b>over 14,000 islands</b>. Only a few hundred have people living on them, and that list is the useful one: an island with residents has a boat, somewhere to stay or at least somewhere to eat, and a reason to exist that is not just a rock with a name.</p>
<p>The roster here is the inhabited-island list from <i>SHIMADAS</i> (シマダス), the reference the Japan Islands Center publishes — the book Japanese island travellers actually use, and one that has never been translated. There is no equivalent in English: the English Wikipedia's list of Japanese islands gives names and little else, and every "hidden islands of Japan" article is one writer's shortlist of the same dozen places.</p>
<p>So this is the plain thing nobody has put online in English — <b>all ${list.length} inhabited islands</b>, with the population and area printed beside each one, sortable, with the prefecture guide and, where one exists, the English Wikipedia article one click away.</p>
</div>
<div class="callout"><b>Two things to know before you use the numbers.</b> They are the 2015 census figures as printed in the 2019 edition, so every small island has fewer people now than the table says — treat each one as an upper bound. And the romanised names are derived from each island's Japanese reading, so a few will not match the spelling a ferry company uses; the kanji under each name is the reliable one.</div>`;

const smallestArea = [...list].sort((a, b) => a.area - b.area)[0];
const NUMBERS = `<div class="nums">
<div class="num"><div class="v">${list.length}</div><div class="l">Inhabited islands</div><div class="s">with figures published in SHIMADAS</div></div>
<div class="num"><div class="v">${tiny.length}</div><div class="l">Under 100 people</div><div class="s">a hamlet, not a town</div></div>
<div class="num"><div class="v">${fmt(byPop[0].pop)}</div><div class="l">Smallest population</div><div class="s">${esc(byPop[0].name)}, ${esc(byPop[0].prefEn)}</div></div>
<div class="num"><div class="v">${areaFmt(smallestArea.area)}</div><div class="l">Smallest island, km²</div><div class="s">${esc(smallestArea.name)}, ${esc(smallestArea.prefEn)}</div></div>
<div class="num"><div class="v">${REGIONS.filter(r => list.some(i => i.region === r)).length}</div><div class="l">Regions</div><div class="s">Hokkaido to Okinawa</div></div>
</div>
<p class="nums-src">Source: SHIMADAS (Japan Islands Center, 2019 edition); its figures come from the 2015 national census and Geospatial Information Authority mapping.</p>`;

const card = (key, title, body) => `<div class="card"><div class="imgw">${img(SLUG, key, title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;

const START = `<div class="prose"><p>If you have never taken a ferry to a small Japanese island, do not start with the ones at the bottom of the table. Start with an island that has a published timetable in English, somewhere to sleep, and a boat that runs more than twice a day — then go smaller next time.</p></div>
<div class="cards">
${card('naoshima', 'Start here: the Seto Inland Sea', 'The calm water between Honshu, Shikoku and Kyushu is dense with inhabited islands and short ferry hops — the art islands are the famous ones, but the same boats stop at ordinary fishing islands where nobody gets off. Highest ratio of "small island" to "easy to reach" in Japan.')}
${card('gotosat', 'Then: the offshore groups', 'Gotō and Hirado off Nagasaki, the Oki Islands off Shimane, Sado off Niigata, the Amami and Okinawa chains. Bigger islands with bus networks and hotels, reached by a longer ferry or a short flight — a full trip rather than a day out.')}
${card('anan', 'Small and close: Tokushima', 'Three of the islands in this table already have their own guide on this site — <a href="spots/ishima-island.html">Ishima</a> (165 people, no cars), <a href="spots/takegashima-island.html">Takegashima</a> and <a href="spots/shimadajima-island.html">Shimadajima</a> — all reachable from the Tokushima coast in a morning.')}
</div>`;

const rowsSmall = SMALL.slice(0, 30).map(i => `<tr><td>${esc(i.name)}<span class="pk">${esc(i.ja)}</span></td><td>${esc(i.prefEn)}</td><td class="num">${fmt(i.pop)}</td><td class="num">${areaFmt(i.area)}</td><td>${i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">Wikipedia</a>` : ''}</td></tr>`).join('\n');
const SMALLEST = `<div class="prose"><p>${SMALL.length} of the ${list.length} have fewer than a hundred residents. These are the smallest — places with a dozen people, a pier and a boat a few times a day. Nobody writes travel guides to islands this size in any language, which is most of what makes them worth knowing about.</p></div>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Island</th><th>Prefecture</th><th>People</th><th>km²</th><th>Read more</th></tr></thead><tbody>
${rowsSmall}
</tbody></table></div>
<p class="credits">The 30 smallest by population; filter the main table by "Under 100 people" for all ${SMALL.length}.</p>
<div class="callout"><b>How to actually plan one.</b> Search the island's Japanese name plus <b>フェリー</b> (ferry) or <b>定期船</b> (scheduled boat) for the timetable, and the name plus <b>民宿</b> (minshuku, family-run lodging) for somewhere to stay — small islands rarely appear on booking sites. Ferries cancel in bad weather and often stop early; on an island with no lodging you are committed to the last boat. On the smallest there is no shop and no vending machine, so bring water.</div>`;

const ETIQUETTE = `<div class="prose">
<p>An island with 40 residents is not an attraction. It is 40 people's home, and you will meet most of them.</p>
<ul>
<li><b>Greet people.</b> On an island this small, walking past someone in silence is the odd thing to do. <i>Konnichiwa</i> is enough.</li>
<li><b>Ask before photographing houses, boats or people.</b> The village is somebody's front garden.</li>
<li><b>Take your rubbish back with you.</b> Small islands ship their waste out by boat and pay for it by weight.</li>
<li><b>Book lodging and meals ahead.</b> Many islands have one minshuku and no shop; turning up unannounced at dinner time is a real problem for someone.</li>
<li><b>Watch the last ferry.</b> It is earlier than you think, and it does not wait.</li>
</ul>
</div>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">At the pier</div><div class="jp">最終便は何時ですか？</div><div class="ro">Saishūbin wa nanji desu ka?</div><div class="en">What time is the last boat?</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">On the timetable</div><div class="jp">欠航</div><div class="ro">kekkō</div><div class="en">Cancelled (weather) — the word to look for before you travel</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">Where you sleep</div><div class="jp">民宿</div><div class="ro">minshuku</div><div class="en">Family-run lodging — often the only option on a small island</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>
<div class="tbl-wrap" style="margin-top:18px"><table class="tbl"><thead><tr><th>Japanese</th><th>Reading</th><th>Meaning</th></tr></thead><tbody>
<tr><td>離島</td><td>ritō</td><td>remote/offshore island</td></tr><tr><td>有人島 / 無人島</td><td>yūjintō / mujintō</td><td>inhabited / uninhabited island</td></tr><tr><td>定期船</td><td>teikisen</td><td>scheduled boat service</td></tr><tr><td>フェリー / 高速船</td><td>ferī / kōsokusen</td><td>car ferry / fast boat</td></tr><tr><td>港</td><td>minato</td><td>port</td></tr><tr><td>時刻表</td><td>jikokuhyō</td><td>timetable</td></tr><tr><td>欠航</td><td>kekkō</td><td>cancelled (sailing)</td></tr><tr><td>民宿</td><td>minshuku</td><td>family-run lodging</td></tr><tr><td>島民</td><td>tōmin</td><td>islander, resident</td></tr>
</tbody></table></div>`;


const FAQ = [
  ['How many inhabited islands does Japan have?', `Japan has more than 14,000 islands in total, but only a few hundred are inhabited. This page lists the ${list.length} inhabited islands in the SHIMADAS roster for which population and area figures are published — excluding Honshu, Hokkaido, Kyushu, Shikoku and Okinawa's main island, which are the country itself rather than "islands" in the travel sense.`],
  ['What is the smallest inhabited island in Japan?', `Of the islands in this list, the smallest population is ${fmt(byPop[0].pop)} on ${esc(byPop[0].name)} in ${esc(byPop[0].prefEn)}, and ${tiny.length} islands have fewer than a hundred residents. The figures are from the 2015 census as printed in 2019, so several are smaller now.`],
  ['Can foreign visitors go to these islands?', 'Yes. Inhabited Japanese islands are ordinary parts of their prefecture — no permit, no restriction. What limits you is practical: ferry frequency, weather cancellations, and whether there is anywhere to sleep. A handful of islands are private or have restricted landing; those are not in this list.'],
  ['How do I find the ferry timetable?', 'Search the island\'s Japanese name plus フェリー or 定期船. Timetables are almost always on the operator\'s or the town\'s own site, in Japanese, and change with the season. Check 欠航 (cancellations) the morning you travel.'],
  ['Are the population figures current?', 'No — they are the 2015 census figures as printed in the 2019 edition of SHIMADAS. Small islands have lost people steadily since, so treat every number as an upper bound and the smallest islands as approximate.'],
  ['Which island should I visit first?', 'One in the Seto Inland Sea. The ferries are short and frequent, several islands have English signage because of the art festival, and the ordinary fishing islands are on the same routes. Save the offshore groups — Gotō, Oki, Sado, Amami — for a trip rather than a day.'],
  ['Why do some islands have no "Read more" link?', 'Because we could not verify an English Wikipedia article for that island with confidence. Many Japanese islands share a name — fourteen are called Ōshima — and the English Wikipedia often covers an island under its municipality\'s name instead. Where the match was ambiguous we left the cell blank rather than link to the wrong place. A blank does not mean nothing exists in English.'],
];

const NEXT = `<div class="nb"><a href="index.html"><b>All 47 prefecture guides</b><span>Each island's prefecture, with what to see, eat and say.</span></a><a href="spots/ishima-island.html"><b>Ishima, Tokushima</b><span>165 people, no cars — one island in full.</span></a><a href="tokyo-izu-islands-anime.html"><b>The Izu Islands</b><span>Tokyo's own island chain, a ferry ride from the city.</span></a></div>`;

const TITLE = `Every Inhabited Island in Japan: All ${list.length}, With Population and Size (2026)`;
const DESC = `A sortable table of all ${list.length} inhabited islands in Japan — population, area, prefecture, and a link where an English article exists. Built from SHIMADAS, the Japanese island reference that has never been translated.`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('hero').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };

const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('hero').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'hero', stamp: '島', stampSmall: 'ISLANDS', kicker: `Japan · ${list.length} inhabited islands · updated ${date}`, title: 'Every inhabited island in Japan', tag: 'All of them, with how many people live there — the list that exists in Japanese and nowhere else.' })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">Japan has over 14,000 islands. A few hundred have people living on them — a ferry, a school, one shop, a harbour. This is all ${list.length} of them in one sortable table, with the population and the area beside each name.</p>
      <p>The roster comes from <i>SHIMADAS</i>, the island reference the Japan Islands Center publishes and Japanese island travellers actually use. It has never been translated. We kept only its published figures, matched each island to its Japanese Wikipedia article to get the reading and the English article where one exists, and linked every island to its prefecture guide.</p>
      <div class="chips"><span class="chip">${list.length} islands</span><span class="chip">${tiny.length} under 100 people</span><span class="chip">smallest ${fmt(byPop[0].pop)} people</span><span class="chip">9 regions</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#table">The table — all ${list.length} ↓</a><a class="btn light" href="#smallest">The smallest inhabited islands</a><a class="btn light" href="#start">Where to start</a><a class="btn light" href="#etiquette">How to behave on a 40-person island</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['setouchi', 'aogashima', 'shikine'])}

  ${section('01', 'how', 'Where this list comes from', HOW)}
  ${section('02', 'numbers', 'The shape of it', NUMBERS)}
  ${section('03', 'table', `The table: all ${list.length} inhabited islands`, TABLE)}
  ${section('04', 'smallest', 'The smallest inhabited islands', SMALLEST)}
  ${section('05', 'start', 'Where to start, if this is your first one', START)}
  ${section('06', 'etiquette', 'How to behave on an island of forty people', ETIQUETTE)}
  ${section('07', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('08', FAQ)}
  ${section('09', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: island roster and figures — <i>SHIMADAS: A Guide to the Islands of Japan</i> (日本の島ガイド シマダス), Japan Islands Center, 2019 edition (ISBN 978-4-931230-38-5); its figures come from the 2015 national census (population, households), the Geospatial Information Authority of Japan (area, elevation) and coastal statistics (coastline). Only published figures are reproduced here; no text from the book is used. Readings and English article links were matched to each island's Japanese Wikipedia article and verified by prefecture, because many Japanese islands share a name — 14 are called Ōshima. Where two islands claimed the same article, both links were dropped rather than guessed. A blank in "Read more" means we could not verify an English article for that island, not that none exists. Photos are Creative Commons — credits under each image.</p>
</main>
${footer()}

<script>
(function(){
  var t=document.getElementById('istable'); if(!t) return;
  var tb=t.tBodies[0], rows=Array.prototype.slice.call(tb.rows), region='all', q='', dir={};
  t.querySelectorAll('th.sortable').forEach(function(th){
    th.addEventListener('click',function(){
      var k=th.dataset.k, asc=!dir[k]; dir={}; dir[k]=asc;
      t.querySelectorAll('th.sortable').forEach(function(x){ x.textContent=x.textContent.replace(/[▾▴]$/,'').trim()+' ▾'; });
      th.textContent=th.textContent.replace(/[▾▴]$/,'').trim()+(asc?' ▴':' ▾');
      rows.sort(function(a,b){ return (asc?1:-1)*(Number(a.dataset[k])-Number(b.dataset[k])); });
      rows.forEach(function(r){tb.appendChild(r);});
    });
  });
  function apply(){ rows.forEach(function(r){ var ok=(region==='all'||(region==='tiny'?Number(r.dataset.pop)<100:r.dataset.region===region))&&(!q||r.dataset.q.indexOf(q)>=0); r.style.display=ok?'':'none'; }); }
  var f=document.getElementById('isfilter');
  f.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return; f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false');}); b.setAttribute('aria-pressed','true'); region=b.dataset.r; apply(); });
  document.getElementById('issearch').addEventListener('input',function(e){ q=e.target.value.trim().toLowerCase(); apply(); });
})();
</script>
</body>
</html>
`;
fs.writeFileSync(PAGE, html);
console.log(`built ${SLUG}.html: ${list.length} islands, ${tiny.length} under 100 people, ${list.filter(i=>i.wikiEn).length} with a verified English article`);
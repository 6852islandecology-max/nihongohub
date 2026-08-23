#!/usr/bin/env node
// Build blog/japan-aquariums-compared.html (v2 design) from blog/data/aquariums.json + photo credits.
// Idempotent, whole-page generation. Usage: node scripts/build-aquariums.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, fig, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'japan-aquariums-compared', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/aquariums.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const list = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const yen = (n) => '¥' + Number(n).toLocaleString('en-US');
const price = (a) => a.adult == null ? '—' : a.adult_max ? `${yen(a.adult)}–${yen(a.adult_max)}` : yen(a.adult);
const REGIONS = ['Hokkaido', 'Tohoku', 'Kanto', 'Hokuriku', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu', 'Okinawa'];
const rows = [...list].sort((a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || a.name.localeCompare(b.name));
const priced = list.filter(a => a.adult != null);
const cheapest = [...priced].sort((a, b) => a.adult - b.adult).slice(0, 8);
const dearest = [...priced].sort((a, b) => (b.adult_max || b.adult) - (a.adult_max || a.adult)).slice(0, 5);
const median = priced.map(a => a.adult).sort((a, b) => a - b)[Math.floor(priced.length / 2)];
const P = (k) => CREDITS[SLUG][k];

const tr = (a) => `<tr data-region="${esc(a.region)}" data-price="${a.adult ?? 99999}" data-q="${esc((a.name + ' ' + a.ja + ' ' + a.pref + ' ' + a.city).toLowerCase())}">
<td><a href="${esc(a.url)}" rel="noopener nofollow">${esc(a.name)}</a><span class="pk">${esc(a.ja)} · ${esc(a.pref)}</span></td>
<td class="num">${price(a)}${a.adult_note ? `<span class="pk" style="font:12px Karla,sans-serif;white-space:normal">${esc(a.adult_note)}</span>` : ''}</td>
<td>${esc(a.hours)}<span class="pk">Closed: ${esc(a.closed)}</span></td>
<td>${esc(a.access)}</td>
<td>${esc(a.highlight)}</td>
</tr>`;

const TABLE = `<div class="prose"><p>Click <b>Adult ticket</b> to sort by price, filter by region, or type a name. Every aquarium links to its official site — that is where today's calendar of hours and prices lives.</p></div>
<div class="filters" id="aqfilter"><button aria-pressed="true" data-r="all">All ${list.length}</button>${REGIONS.map(r => `<button aria-pressed="false" data-r="${r}">${r}</button>`).join('')}<input type="search" id="aqsearch" placeholder="Search a name or prefecture…" aria-label="Search aquariums"></div>
<div class="tbl-wrap"><table class="tbl" id="aqtable">
<thead><tr><th>Aquarium</th><th class="sortable" title="Click to sort by price">Adult ticket ▾</th><th>Hours · closed</th><th>Getting there</th><th>Why go</th></tr></thead>
<tbody>
${rows.map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} JAZA member aquariums. Adult (high-school-age and up) walk-up price from each official site, checked ${date}; date-based prices shown as a range. Hours are the regular pattern — every one changes hours for Golden Week, summer and New Year, so check the calendar linked in the name.</p>
<div class="callout">Across the ${priced.length} that sell walk-up tickets, the median adult price is <b>${yen(median)}</b>. The cheapest are all public or freshwater houses — ${cheapest.map(a => `${esc(a.name)} (${yen(a.adult)})`).join(', ')}. The most expensive are the resort parks with marine-mammal shows — ${dearest.map(a => `${esc(a.name)} (${price(a)})`).join(', ')}.</div>`;

const card = (key, title, body, alt) => `<div class="card"><div class="imgw">${img(SLUG, key, alt || title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;

const PICKS = `<div class="prose"><p>The table answers "how much and when". These are the questions people actually type into a search box.</p></div>
<div class="cards">
${card('notojima', 'Whale sharks', 'Four JAZA aquariums keep whale sharks: <b>Okinawa Churaumi</b> (the Kuroshio Sea tank in every photo), <b>Osaka Kaiyukan</b> (the 9 m-deep Pacific tank), <b>Notojima</b> on the Noto Peninsula and <b>Io World</b> in Kagoshima. Churaumi and Kaiyukan are the destinations; Notojima and Kagoshima are the ones without a crowd.')}
${card('kamogawa', 'Orcas', 'Only three places in Japan have orcas: <b>Kamogawa Sea World</b> (Chiba), the <b>Port of Nagoya Public Aquarium</b> and <b>Kobe Suma Sea World</b>. Whether you want to see orcas in a pool is a fair question to ask yourself; if you do, those are the three.')}
${card('kamo', 'Jellyfish', '<b>Kamo Aquarium</b> in Tsuruoka, Yamagata, rebuilt itself around jellyfish and has a 5 m circular tank of moon jellies that people cross the country for. <b>Kyoto Aquarium</b>\'s Kurage Wonder and <b>Sumida</b>\'s jellyfish lab are the easy city options.')}
${card('sumida', 'For adults, or a rainy evening', '<b>AOAO SAPPORO</b> is open until 22:00 in a downtown tower; <b>átoa</b> in Kobe is closer to an art installation; <b>NIFREL</b> lights small tanks like gallery pieces; <b>Maxell Aqua Park Shinagawa</b> runs a sound-and-light dolphin show inside a hotel; <b>Sumida</b> and <b>Kyoto</b> extend hours in summer for lantern-lit evenings. Not where you go for animal diversity — where you go for a beautiful hour indoors.')}
${card('nagoya', 'For kids', '<b>Hakkeijima Sea Paradise</b> is four aquarium buildings and a fairground on one island (¥3,500 Aqua Resorts Pass, rides extra). <b>Kamogawa</b> and <b>Kobe Suma</b> are the show parks; <b>Umitamago</b> (Oita) and <b>Uminonakamichi</b> (Fukuoka) are the Kyushu equivalents with touch pools; <b>Nagoya</b> has Japan\'s largest dolphin pool. In Tokyo without a car, <b>Shinagawa Aquarium</b> (¥1,350) is the value pick.')}
${card('tuna', 'Cheap and genuinely good', 'The public and freshwater houses are the bargains: <b>Tokyo Sea Life Park</b> at Kasai (¥700, the bluefin tuna doughnut tank, closed Wednesdays), <b>Saitama Aquarium</b> (¥400), Yamanashi\'s <b>Mori no Naka no Suizokukan</b> (¥420), <b>Himeji City Aquarium</b> (¥600), <b>Chitose</b> (¥800, windows into a real salmon river), <b>Nagasaki Penguin Aquarium</b> (¥800, nine species) and the <b>Lake Biwa Museum</b> (¥840).')}
</div>`;

const TOKYO = `<div class="prose"><p>Six JAZA aquariums sit inside Tokyo, and they are not interchangeable.</p></div>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Aquarium</th><th>Adult</th><th>Pick it when</th><th>Skip it when</th></tr></thead><tbody>
<tr><td>Sumida (Skytree Town)</td><td class="num">¥2,700</td><td>You are already at Skytree; you want penguins close up and a stylish hour</td><td>You want big fish — the tanks are small</td></tr>
<tr><td>Sunshine (Ikebukuro)</td><td class="num">¥2,600–3,200</td><td>You want the rooftop Aqua Ring of sea lions swimming overhead</td><td>You are price-sensitive on a weekend — it is the priciest of the six</td></tr>
<tr><td>Maxell Aqua Park (Shinagawa)</td><td class="num">¥2,800</td><td>Evening, date, no plan — inside a hotel next to Shinagawa Station, opens late</td><td>You dislike shows and lighting effects</td></tr>
<tr><td>Tokyo Sea Life Park (Kasai)</td><td class="num">¥700</td><td>You want the most animals per yen in Tokyo, and the tuna tank</td><td>It is Wednesday (closed) or you want a polished experience</td></tr>
<tr><td>Shinagawa Aquarium (Omori-Kaigan)</td><td class="num">¥1,350</td><td>Kids, budget, a tunnel tank and a dolphin pool without the resort price</td><td>It is Tuesday (closed)</td></tr>
<tr><td>HANA-BIYORI (Yomiuriland)</td><td class="num">¥800</td><td>You are going to the flower greenhouse anyway; the tanks are a bonus</td><td>You want an aquarium — it is a garden with tanks in it</td></tr>
</tbody></table></div>
<div class="prose"><p>Kawasaki's <b>Kawasui</b> (¥2,200, right outside JR Kawasaki Station, open to 20:00) is a seventh option a few minutes out of Tokyo, and it is river-themed rather than marine — Tama River to the Amazon, with capybaras.</p></div>`;

const KANSAI = `<div class="figs2">${fig(SLUG, 'kyoto')}${fig(SLUG, 'toba')}</div>
<div class="prose"><p><b>Kaiyukan</b> is the one to build a day around: the route spirals down around a central Pacific tank with whale sharks, and the price is date-based (¥2,800–3,200 in August). <b>NIFREL</b> is Kaiyukan's smaller sister at Expocity, better for a short visit. <b>Kyoto Aquarium</b> is a 15-minute walk from Kyoto Station and its Japanese giant salamander tank is the reason to go — the animals come from Kyoto's own Kamo River system, many of them hybrids, and the exhibit explains the problem of introduced Chinese giant salamanders honestly. In Kobe, <b>Suma Sea World</b> (2024) is the show park and <b>átoa</b> is the art one. <b>Toba Aquarium</b> in Mie is a different animal altogether: about 1,200 species, no fixed route, and the only dugong on display in Japan.</p></div>`;

const NATIVE = `<div class="prose"><p>Most big-city aquariums are built around the Pacific and the tropics — whale sharks, coral, penguins from the southern hemisphere. If what you want is to see what actually lives in Japan's rivers and coasts, the list looks different, and cheaper.</p></div>
<div class="cards">
${card('biwako', 'Lake Biwa Museum (Shiga)', 'Lake Biwa is Japan\'s oldest lake and has its own endemic fish — the Biwa trout, several gobies and minnows found nowhere else. The museum\'s aquarium wing (¥840) is the only place they are shown together.')}
${card('salamander', 'Kyoto Aquarium', 'The Japanese giant salamander exhibit above: local animals, honest labelling about hybrids, and the best place in a city to meet the world\'s second-largest amphibian.')}
${card('aquamarine', 'Aquamarine Fukushima', 'The triangular tunnel where the warm Kuroshio and cold Oyashio currents meet off Fukushima, and one of the few places to see live sanma (Pacific saury), which the aquarium was first to breed.')}
</div>
<div class="prose"><ul>
<li><b>Chitose Aquarium</b> (Hokkaido) — underwater windows into the actual Chitose River; in autumn you watch wild salmon run past the glass.</li>
<li><b>Mori no Naka no Suizokukan</b> (Yamanashi) — a freshwater house fed by Fuji spring water, with a two-layer doughnut tank so the big fish circle around the small ones.</li>
<li><b>Kawasemi Aquarium</b> (Inawashiro), <b>Nakagawa Aquarium</b> (Tochigi), <b>Saitama Aquarium</b>, <b>Hekinan Seaside Aquarium</b> (Aichi) and <b>Osakana-kan</b> (Ehime) — small regional freshwater houses, each showing its own river system.</li>
<li><b>Miyajima Public Aquarium</b> — the finless porpoise of the Seto Inland Sea, and how oysters are farmed. Closed for renovation from 1 December 2026 to 31 March 2027.</li>
</ul></div>`;

const HOW = `${fig(SLUG, 'aquamarine')}
<div class="prose">
<p>JAZA is the national association; membership means a facility signs up to its animal-welfare and husbandry standards, and its public member list is the closest thing Japan has to an official register of aquariums. We took the <a href="https://www.jaza.jp/search-enkan" rel="noopener">JAZA member search</a> as the master list — ${list.length} aquariums as of August 2026 — and then read each facility's own site for the adult walk-up price, hours, closed days and access. Nothing in the table comes from a third-party listing.</p>
<ul>
<li><b>Some famous aquariums are not JAZA members and so are not in the table.</b> Enoshima Aquarium (Kanagawa), Shimonoseki's Kaikyokan, Aqua World Oarai (Ibaraki), Sendai Umino-Mori, Numazu Deep Sea Aquarium and several others were not on the member list when we checked. That is a fact about membership, not a judgement about the aquariums; several of them are excellent.</li>
<li><b>One member is no longer open to the public.</b> Tokai University Marine Science Museum in Shizuoka ended general admission on 31 October 2024 and now works as a research and education facility. It stays in the table with no price so you do not plan a trip around it.</li>
</ul></div>
<div class="callout"><b>Read the price column carefully.</b> A growing number of aquariums — Kaiyukan, Sunshine, Kobe Suma, SEA LIFE Nagoya, Ise — use <b>date-based pricing</b>: the same ticket costs more on weekends and school holidays. We show those as a range. Where an aquarium is part of a resort (Hakkeijima, HANA-BIYORI), we show the aquarium-only ticket and say so.</div>`;

const TICKETS = `<div class="prose"><ul>
<li><b>Last entry</b> is usually 30–60 minutes before closing. The table shows opening hours; assume the door shuts earlier.</li>
<li><b>Date-based prices</b> (Kaiyukan, Sunshine, Kobe Suma, Ise, SEA LIFE Nagoya) are shown on a calendar on the official site. Weekdays outside school holidays are the cheap end of the range.</li>
<li><b>Online tickets</b> exist for most of the big ones and are usually the same price or slightly cheaper; a few (Kaiyukan, LEGOLAND/SEA LIFE) charge a fee for buying at the window.</li>
<li><b>Closed days</b>: the public aquariums close one weekday a week (Kasai Wednesday, Shinagawa and Himeji Tuesday, Biwa Museum Monday); the resort ones close only for maintenance. Everything changes hours for Golden Week, mid-August and New Year.</li>
<li><b>Combination tickets</b> with the surrounding attraction are common — Nagoya (aquarium + port museum + observation deck), Kagoshima (aquarium + zoo), Churaumi (inside Ocean Expo Park). Only worth it if you would visit the other place anyway.</li>
</ul></div>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">At the ticket desk</div><div class="jp">大人一枚ください</div><div class="ro">Otona ichimai kudasai</div><div class="en">One adult ticket, please</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">On the sign</div><div class="jp">最終入館</div><div class="ro">saishū nyūkan</div><div class="en">Last entry — usually 30–60 min before closing</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">The animal</div><div class="jp">ジンベエザメ</div><div class="ro">jinbeezame</div><div class="en">Whale shark — the word on every Churaumi and Kaiyukan sign</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>
<div class="tbl-wrap" style="margin-top:18px"><table class="tbl"><thead><tr><th>Japanese</th><th>Reading</th><th>Meaning</th></tr></thead><tbody>
<tr><td>水族館</td><td>suizokukan</td><td>aquarium</td></tr><tr><td>入館料</td><td>nyūkan-ryō</td><td>admission fee</td></tr><tr><td>大人 / 小人</td><td>otona / shōnin</td><td>adult / child (on price boards)</td></tr><tr><td>休館日</td><td>kyūkan-bi</td><td>closed day</td></tr><tr><td>年中無休</td><td>nenjū mukyū</td><td>open all year</td></tr><tr><td>年間パスポート</td><td>nenkan pasupōto</td><td>annual pass</td></tr><tr><td>シャチ / イルカ</td><td>shachi / iruka</td><td>orca / dolphin</td></tr><tr><td>クラゲ</td><td>kurage</td><td>jellyfish</td></tr><tr><td>オオサンショウウオ</td><td>ōsanshōuo</td><td>Japanese giant salamander</td></tr><tr><td>触ってもいいですか</td><td>sawatte mo ii desu ka</td><td>May I touch it? (touch pools)</td></tr>
</tbody></table></div>`;

const FAQ = [
  ['What is the best aquarium in Japan?', 'For sheer scale, Okinawa Churaumi and Osaka Kaiyukan — both keep whale sharks in tanks big enough to look natural. For a single-theme aquarium that people travel for, Kamo Aquarium\'s jellyfish. For seeing Japan\'s own species, the Lake Biwa Museum and Kyoto Aquarium\'s giant salamanders.'],
  ['How much does an aquarium cost in Japan?', `Across the ${priced.length} JAZA aquariums that sell walk-up tickets, adult prices run from ${yen(cheapest[0].adult)} (${esc(cheapest[0].name)}) to ${price(dearest[0]).split('–').pop()} (${esc(dearest[0].name)} on peak dates); the median is around ${yen(median)}. Public and freshwater aquariums are ¥400–900, city aquariums ¥1,300–2,700, resort parks with marine-mammal shows ¥3,000 and up.`],
  ['Which aquariums in Japan have whale sharks?', 'Okinawa Churaumi, Osaka Kaiyukan, Notojima (Ishikawa) and Kagoshima\'s Io World.'],
  ['Which aquariums in Japan have orcas?', 'Kamogawa Sea World (Chiba), the Port of Nagoya Public Aquarium and Kobe Suma Sea World.'],
  ['Are there aquariums in Tokyo?', 'Six JAZA members: Sumida (Skytree), Sunshine (Ikebukuro), Maxell Aqua Park (Shinagawa), Tokyo Sea Life Park (Kasai), Shinagawa Aquarium (Omori-Kaigan) and the tanks inside HANA-BIYORI at Yomiuriland — plus Kawasui in Kawasaki just outside. Sumida and Sunshine for atmosphere, Kasai for value and the tuna tank.'],
  ['Why isn\'t Enoshima Aquarium (or Kaikyokan, Oarai, Sendai) in the table?', 'Because they were not JAZA members when we built the list, and the list is defined by membership so that every entry is checked the same way. They are real, and some are very good.'],
  ['Do aquarium prices in Japan change by date?', 'At some, yes — Kaiyukan, Sunshine, Kobe Suma, Ise and SEA LIFE Nagoya use calendars where weekends and school holidays cost more. The table shows those as a range.'],
];

const NEXT = `<div class="nb"><a href="wildlife-watching-japan.html"><b>Wildlife watching in Japan</b><span>Where to see Japan's animals in the wild, by prefecture.</span></a><a href="japan-100-castles-goshuin.html"><b>Japan's 100 castles stamp rally</b><span>Another nationwide list worth collecting.</span></a><a href="eki-stamps-japan.html"><b>Eki stamps</b><span>Free station-stamp souvenirs, almost everywhere the trains go.</span></a></div>`;

const TITLE = 'Every JAZA Aquarium in Japan Compared: Prices, Hours & What to See (2026)';
const DESC = `All ${list.length} JAZA member aquariums in Japan in one table — adult ticket price, hours, closed days, nearest station and what each is for — from the official sites, with picks for adults, kids, whale sharks, jellyfish, orcas and Japan's own freshwater fish.`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('churaumi2').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };

const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('churaumi2').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'churaumi2', stamp: '水', stampSmall: 'AQUARIUMS', kicker: `Japan · ${list.length} JAZA aquariums · updated ${date}`, title: 'Every aquarium in Japan, compared', tag: 'Prices, hours and what each one is for — read from the official sites, not from a top-seven list.' })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">Japan has more public aquariums per person than almost anywhere, and most "best aquariums in Japan" lists pick seven famous ones and stop. This page does the boring thing instead: every aquarium that belongs to JAZA, the Japanese Association of Zoos and Aquariums — ${list.length} of them — in one sortable table.</p>
      <p>Adult ticket, hours, closed days, nearest station and the one reason to go, all read from each aquarium's own site. Then which ones are for adults, which for kids, where the whale sharks and orcas are, and — because this site is run by a biologist — which aquariums actually show you what lives in Japan's rivers and seas.</p>
      <div class="chips"><span class="chip">${list.length} aquariums</span><span class="chip">median adult ticket ${yen(median)}</span><span class="chip">cheapest ${yen(cheapest[0].adult)}</span><span class="chip">4 with whale sharks</span><span class="chip">3 with orcas</span><span class="chip">checked ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#table">The table — all ${list.length}, sortable ↓</a><a class="btn light" href="#picks">Whale sharks · orcas · jellyfish · kids</a><a class="btn light" href="#tokyo">Tokyo's six, compared</a><a class="btn light" href="#native">The ones with Japan's own fish</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['kaiyukan', 'toba', 'biwako'])}

  ${section('01', 'how', 'How this list was built — and who is missing', HOW)}
  ${section('02', 'table', `The table: all ${list.length}, sortable by price`, TABLE)}
  ${section('03', 'picks', 'Which one, for what', PICKS)}
  ${section('04', 'tokyo', 'Tokyo has six — how to choose', TOKYO)}
  ${section('05', 'kansai', 'Osaka, Kyoto, Kobe, Toba', KANSAI)}
  ${section('06', 'native', 'The aquariums that show Japan\'s own fish', NATIVE)}
  ${section('07', 'tickets', 'Tickets, dynamic pricing and last entry', TICKETS)}
  ${section('08', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('09', FAQ)}
  ${section('10', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: the <a href="https://www.jaza.jp/search-enkan" rel="noopener">JAZA member facility list</a> (aquarium section, read August 2026) and each aquarium's official admission, hours and access pages, linked from the table. Prices are adult walk-up rates in yen; date-based prices are the range on the official calendar for August 2026; the table is re-checked monthly. Tokai University Marine Science Museum's closure to the public is from its own notice. Photos are Creative Commons — credits under each image; animal photos show the species, not necessarily an animal at the aquarium named unless the caption says so.</p>
</main>
${footer()}
<script>
(function(){
  var t=document.getElementById('aqtable'); if(!t) return;
  var tb=t.tBodies[0], rows=Array.prototype.slice.call(tb.rows), asc=true, region='all', q='';
  var th=t.querySelector('th.sortable');
  th.addEventListener('click',function(){ rows.sort(function(a,b){return (asc?1:-1)*(Number(a.dataset.price)-Number(b.dataset.price));}); asc=!asc; th.textContent='Adult ticket '+(asc?'▾':'▴'); rows.forEach(function(r){tb.appendChild(r);}); });
  function apply(){ rows.forEach(function(r){ var ok=(region==='all'||r.dataset.region===region)&&(!q||r.dataset.q.indexOf(q)>=0); r.style.display=ok?'':'none'; }); }
  var f=document.getElementById('aqfilter');
  f.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return; f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false');}); b.setAttribute('aria-pressed','true'); region=b.dataset.r; apply(); });
  document.getElementById('aqsearch').addEventListener('input',function(e){ q=e.target.value.trim().toLowerCase(); apply(); });
})();
</script>
<!-- 計測 (2026-08-23): これが無いと pv_blog__<slug> も aff_* も飛ばず、記事別レポートに行が出ない -->
<script src="blog-quiz.js" defer><\/script>
</body>
</html>
`;
fs.writeFileSync(PAGE, html);
console.log(`built ${SLUG}.html (v2 design): ${list.length} rows, checked ${date}, median ${yen(median)}`);

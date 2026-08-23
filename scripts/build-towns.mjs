#!/usr/bin/env node
// Build blog/japan-towns-to-live.html (v2 design) from blog/data/towns.json — the 60 municipalities that
// Japan Living Fit compares, with only the real-data columns (census, JMA, MLIT land price, Bunkacho).
// Usage: node scripts/build-towns.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'japan-towns-to-live', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/towns.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const JLF = 'https://jlf-app.vercel.app/?src=nhb_towns';
const list = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const P = (k) => CREDITS[SLUG][k];
const fmt = (n, dp = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: dp, minimumFractionDigits: dp });
const yen = (n) => n == null ? '—' : '¥' + Math.round(n).toLocaleString('en-US');
const CLUSTERS = ['Water town', 'Castle town', 'Satoyama', 'Onsen town', 'Island & coast', 'Cool north', 'Everyday city', 'Rail city'];
const CL_DESC = {
  'Water town': 'built around a canal, a lake or a spring-fed river', 'Castle town': 'a preserved castle-town core, often with an original keep', 'Satoyama': 'rice, forest and a small town in between',
  'Onsen town': 'a hot-spring town you would live in, not just visit', 'Island & coast': 'sea on at least one side', 'Cool north': 'Tōhoku and Hokkaido — real winters, real summers', 'Everyday city': 'ordinary regional cities that work', 'Rail city': 'the big hubs, for comparison',
};
const tags = (t) => [t.judenken ? `${t.judenken} preserved district${t.judenken > 1 ? 's' : ''}` : '', t.castle ? 'original castle keep' : '', t.national_treasures ? `${t.national_treasures} National Treasure${t.national_treasures > 1 ? 's' : ''}` : '', t.coastal ? 'coastal' : ''].filter(Boolean).join(' · ');
const tokyoLand = 0; // not in dataset; we state Tokyo comparison in prose from MLIT public figures only where sourced

const tr = (t) => `<tr data-cl="${esc(t.cluster)}" data-pop="${t.population ?? 0}" data-jan="${t.jan_temp ?? 99}" data-aug="${t.aug_temp ?? 99}" data-snow="${t.max_snow ?? -1}" data-land="${t.land_median ?? 9e9}" data-hub="${t.hub_min ?? 999}" data-q="${esc((t.name + ' ' + t.ja + ' ' + t.pref + ' ' + t.cluster).toLowerCase())}">
<td>${esc(t.name)}<span class="pk">${esc(t.ja)} · ${esc(t.pref)}</span></td>
<td>${esc(t.cluster)}${tags(t) ? `<span class="pk">${esc(tags(t))}</span>` : ''}</td>
<td class="num">${fmt(t.population)}</td>
<td class="num">${t.jan_temp == null ? '—' : fmt(t.jan_temp, 1) + '° / ' + fmt(t.aug_temp, 1) + '°'}${t.max_snow != null ? `<span class="pk" style="font:12px Karla,sans-serif">snow max ${fmt(t.max_snow)} cm</span>` : ''}</td>
<td class="num">${yen(t.land_median)}</td>
<td class="num">${fmt(t.hub_min)} min<span class="pk" style="font:12px Karla,sans-serif">to ${esc(t.nearest_hub || '')}</span></td>
</tr>`;

const TABLE = `<div class="prose"><p>Sort by any number, filter by the kind of town, or type a name. Every figure is a published one: population from the 2025 census count, temperatures from the Japan Meteorological Agency station (30-year normals, January mean / August mean), land price the median of the government's official appraisal points in the municipality (¥ per m², January 2025), and minutes by road to the nearest major hub from the town's population-weighted centre.</p></div>
<div class="filters" id="twfilter"><button aria-pressed="true" data-c="all">All ${list.length}</button>${CLUSTERS.map(c => `<button aria-pressed="false" data-c="${c}">${c}</button>`).join('')}<input type="search" id="twsearch" placeholder="Search a town or prefecture…" aria-label="Search towns"></div>
<div class="tbl-wrap"><table class="tbl" id="twtable">
<thead><tr><th>Town</th><th>Kind</th><th class="sortable" data-k="pop">People ▾</th><th class="sortable" data-k="jan">Jan / Aug °C ▾</th><th class="sortable" data-k="land">Land ¥/m² ▾</th><th class="sortable" data-k="hub">To a big city ▾</th></tr></thead>
<tbody>
${[...list].sort((a, b) => CLUSTERS.indexOf(a.cluster) - CLUSTERS.indexOf(b.cluster) || a.name.localeCompare(b.name)).map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} municipalities. Population: e-Stat 2025 census count. Climate: JMA station normals (a neighbouring station where the town has none — Omihachiman uses Hikone). Land: MLIT official land-price survey L01, median of points in the municipality, valid 1 Jan 2025. Access: minutes to the nearest designated city or metropolitan centre from the population-weighted centre. Preserved districts, original keeps and National Treasures: Agency for Cultural Affairs lists.</p>`;

const card = (t, body) => t?.photo ? `<div class="card"><div class="imgw">${img(SLUG, t.photo, `${t.name}, ${t.pref}`)}</div><div class="b"><h3>${esc(t.name)} <span style="font:400 15px Karla,sans-serif;color:var(--muted)">${esc(t.pref)}</span></h3><p>${body}</p><div class="row"><a href="${JLF}&town=${t.slug}">See it in Japan Living Fit</a></div></div><div class="cred">${credit(SLUG, t.photo)}</div></div>` : '';
const T = Object.fromEntries(list.map(t => [t.slug, t]));
const n = (t) => `${fmt(t.population)} people · ${fmt(t.jan_temp, 1)}°/${fmt(t.aug_temp, 1)}° · land ${yen(t.land_median)}/m² · ${fmt(t.hub_min)} min to ${esc(t.nearest_hub)}`;

const WATER = `<div class="prose"><p>Omihachiman is the town people mean when they say they want somewhere small, old and near water without being a museum: a merchant quarter of white-walled storehouses along a moat that once fed Lake Biwa, still a working town of ${fmt(T.omihachiman.population)}, and 46 minutes from Kyoto. Japan Living Fit files it under <b>water towns</b> — places whose shape comes from a canal, a lake or spring-fed rivers. These are the others in that drawer.</p></div>
<div class="cards">
${card(T.omihachiman, `The Hachiman-bori moat and a preserved merchant district. ${n(T.omihachiman)}.`)}
${card(T.mishima, `Spring water from Mount Fuji runs in open channels through the middle of town; the Shinkansen stops here. ${n(T.mishima)}.`)}
${card(T.matsue, `A castle city between a lake and a lagoon, with an original keep that is a National Treasure. ${n(T.matsue)}.`)}
${card(T.yanagawa, `A grid of canals in the flat Chikugo delta, still poled by boat. ${n(T.yanagawa)}.`)}
${card(T.gujo, `A mountain town whose streets run with channelled river water; famous for its all-night summer dance. ${n(T.gujo)}.`)}
${card(T.ogaki, `The "water capital" of Gifu — springs and canals inside an ordinary working city. ${n(T.ogaki)}.`)}
</div>`;

const CASTLE = `<div class="prose"><p>The other drawer people open after Omihachiman is <b>castle towns</b>: a preserved historic core around a keep, small enough to walk. Five of these still have their original wooden keep — not a concrete rebuild — which is rarer than it sounds: only twelve survive in the whole country.</p></div>
<div class="cards">
${card(T.hikone, `Original keep (National Treasure), a castle-town grid, and Lake Biwa. ${n(T.hikone)}.`)}
${card(T.inuyama, `The oldest original keep in Japan above the Kiso River, 30 minutes from Nagoya. ${n(T.inuyama)}.`)}
${card(T.hirosaki, `Original keep, apple orchards, and one of the great cherry-blossom parks. ${n(T.hirosaki)}.`)}
${card(T.takayama, `Two preserved merchant districts in the mountains of Gifu; snow in winter. ${n(T.takayama)}.`)}
${card(T.hagi, `Four preserved districts and a samurai quarter on the Sea of Japan coast. ${n(T.hagi)}.`)}
${card(T.matsumoto, `The black castle, an alpine backdrop, and a proper city around it. ${n(T.matsumoto)}.`)}
</div>`;

const HOW = `<div class="prose">
<p>This list is not ours to invent. It is the sixty municipalities that <a href="${JLF}">Japan Living Fit</a> compares — a small tool built by this site that asks eight questions and returns the towns whose data fits your answers. The sixty were chosen to cover the kinds of place foreigners actually ask about (a small historic town near a city, a hot-spring town you could live in, an island, a real winter, a big hub for comparison), not to be a top-60.</p>
<p>What makes the list worth publishing on its own is the data behind it. For every town the tool holds the census population, the weather station's 30-year normals, the government's official land-price points, minutes to the nearest big city, and — from the Agency for Cultural Affairs — whether it has a preserved historic district, an original castle keep, or a National Treasure building. Those are the columns below. Nothing here is a vibe score.</p>
</div>
<div class="callout"><b>What the tool does that this page cannot.</b> The table shows the towns; the tool matches them to a person — how much winter you can take, whether you need to live without a car, how far from an international airport is too far. If you want the answer rather than the list, <a href="${JLF}">take the eight questions</a> (two minutes, no sign-up).</div>`;

const READ = `<div class="prose">
<h3>Population</h3><p>Under about 60,000 and a town has one of most things — one big supermarket, one hospital, one high school worth the name. The water and castle towns above sit between ${fmt(Math.min(...list.filter(t => ['Water town', 'Castle town'].includes(t.cluster)).map(t => t.population)))} and ${fmt(Math.max(...list.filter(t => ['Water town', 'Castle town'].includes(t.cluster)).map(t => t.population)))}; the rail cities are there so you can see what a real city's numbers look like beside them.</p>
<h3>January and August</h3><p>The two numbers that decide whether you will be happy. A January mean below zero (Hirosaki, Obihiro, Iiyama) means snow that stays; an August mean above 28° (Kyoto, Kumamoto, Yanagawa) means a summer you organise your day around. The snow column is the deepest snow on the ground in an average year.</p>
<h3>Land price</h3><p>The official appraisal median in yen per square metre. It is not a house price, but it moves with one: ${yen(list.find(t => t.slug === 'kyoto')?.land_median)} in Kyoto against ${yen(T.omihachiman.land_median)} in Omihachiman, ${yen(T.hagi.land_median)} in Hagi. Rural land is cheap everywhere; what varies is whether there is a job and a train.</p>
<h3>Minutes to a big city</h3><p>Road minutes from where people in the town actually live to the nearest designated city or metropolitan centre. Under an hour and the big city's hospitals, airport and international schools are yours too; over two and they are a trip.</p>
</div>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">The word for it</div><div class="jp">移住</div><div class="ro">ijū</div><div class="en">Moving to a new place to live — every town has an ijū desk for newcomers</div><div class="row"><a href="../quiz.html?topic=life">Test yourself</a></div></div>
<div class="ph"><div class="k">At the town office</div><div class="jp">空き家バンク</div><div class="ro">akiya banku</div><div class="en">The town's list of empty houses for sale or rent</div><div class="row"><a href="../quiz.html?topic=life">Test yourself</a></div></div>
<div class="ph"><div class="k">The honest question</div><div class="jp">冬はどのくらい雪が降りますか？</div><div class="ro">Fuyu wa dono kurai yuki ga furimasu ka?</div><div class="en">How much snow do you get in winter?</div><div class="row"><a href="../quiz.html?topic=life">Test yourself</a></div></div>
</div>`;

const FAQ = [
  ['What is the best small town to live in Japan?', 'There is no single answer, which is why the table exists. Omihachiman, Hikone and Mishima are the usual first picks for a small historic town within an hour of a big city; Matsue and Hirosaki for a real castle city further out; Takayama and Hagi if you want the preserved streets and do not mind distance. The eight-question tool linked above turns your own priorities into a shortlist.'],
  ['Where do these numbers come from?', 'Census population (e-Stat, 2025), JMA station normals for temperature and snow, the MLIT official land-price survey (median of appraisal points, January 2025), road minutes to the nearest major city from the population-weighted centre, and the Agency for Cultural Affairs lists for preserved districts, original castle keeps and National Treasures.'],
  ['Is Omihachiman a good place to live?', `By the numbers: ${fmt(T.omihachiman.population)} people, January mean ${fmt(T.omihachiman.jan_temp, 1)}°, August ${fmt(T.omihachiman.aug_temp, 1)}°, deepest snow about ${fmt(T.omihachiman.max_snow)} cm, land ${yen(T.omihachiman.land_median)}/m², 46 minutes to Kyoto, one nationally preserved historic district. It is the model most other "small historic town near a city" wishes are measured against.`],
  ['Can a foreigner just move to one of these towns?', 'Visa first, town second: you need a status of residence that lets you live in Japan at all, and most of these towns have no employer sponsoring foreign staff. People who make it work are usually already in Japan (spouse, permanent resident, remote worker on a valid status) and move within the country. Every town in the list has a municipal newcomers\' desk (移住相談窓口).'],
  ['Why is Kyoto in a list of small towns?', 'The rail cities — Kyoto, Kanazawa, Fukuoka, Sapporo and the rest — are there for scale, so you can see what a real city\'s population, prices and climate look like beside the towns. Filter them out with the "Kind" buttons.'],
];

const NEXT = `<div class="nb"><a href="${JLF}"><b>Japan Living Fit</b><span>Eight questions, sixty towns, your shortlist.</span></a><a href="moving-to-japan-guide.html"><b>Moving to Japan: the timeline</b><span>What actually has to happen, in what order.</span></a><a href="index.html"><b>All 47 prefecture guides</b><span>Each town's prefecture in full.</span></a></div>`;

const TITLE = 'Sixty Japanese Towns You Could Actually Live In — Omihachiman and the Others, With the Numbers (2026)';
const DESC = `The 60 municipalities Japan Living Fit compares — water towns like Omihachiman, castle towns, onsen towns, islands — in one sortable table: population, January and August temperatures, snow, land price and minutes to a big city, all from official sources.`;
const heroKey = 'omihachiman';
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P(heroKey).file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };

const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P(heroKey).file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: heroKey, stamp: '住', stampSmall: 'LIVE HERE', kicker: `Japan · 60 towns · updated ${date}`, title: 'Sixty towns you could actually live in', tag: 'Omihachiman and the others — with the census, the weather station and the land-price survey, not adjectives.' })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">Ask where to live in Japan and you get Tokyo, Osaka, Fukuoka. Ask people who have lived here a while and a different list comes out: Omihachiman, Hikone, Mishima, Matsue, Takayama — small historic towns with a train to a real city. This is sixty of them, with the numbers that decide whether the idea survives a winter.</p>
      <p>The list is the one behind <a href="${JLF}">Japan Living Fit</a>, this site's eight-question tool. Every column is an official figure — population, weather, land price, distance, heritage — and every town links to the tool, which is where the matching happens.</p>
      <div class="chips"><span class="chip">${list.length} towns</span><span class="chip">${list.filter(t => t.cluster === 'Water town').length} water towns</span><span class="chip">${list.filter(t => t.castle).length} original castle keeps</span><span class="chip">${list.filter(t => t.judenken).length} with preserved districts</span><span class="chip">${list.filter(t => t.coastal).length} coastal</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#water">Towns like Omihachiman ↓</a><a class="btn light" href="#castle">Castle towns with a real keep</a><a class="btn light" href="#table">The table — all 60</a><a class="btn light" href="${JLF}">Take the 8 questions instead</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['mishima', 'matsue', 'hikone'])}

  ${section('01', 'how', 'Where this list comes from', HOW)}
  ${section('02', 'water', 'Towns like Omihachiman: the water towns', WATER)}
  ${section('03', 'castle', 'Castle towns with an original keep', CASTLE)}
  ${section('04', 'table', 'The table: all 60', TABLE)}
  ${section('05', 'read', 'How to read the numbers', READ)}
  ${section('06', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('07', FAQ)}
  ${section('08', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: population — e-Stat 2025 census counts by municipality; climate — Japan Meteorological Agency 1991–2020 normals for the town's station or the nearest station (noted in the tool); land — MLIT National Land Numerical Information L01 (official land-price survey), median of appraisal points within the municipality, valid 1 January 2025; access — road minutes from the population-weighted centre (e-Stat 250 m mesh) to the nearest designated city or metropolitan centre; heritage — Agency for Cultural Affairs lists of Important Preservation Districts, extant original castle keeps and National Treasure buildings. The town descriptions are ours; the numbers are theirs. Photos are Creative Commons — credits under each image.</p>
</main>
${footer()}
<script>
(function(){
  var t=document.getElementById('twtable'); if(!t) return;
  var tb=t.tBodies[0], rows=Array.prototype.slice.call(tb.rows), cl='all', q='', dir={};
  t.querySelectorAll('th.sortable').forEach(function(th){ th.addEventListener('click',function(){ var k=th.dataset.k, asc=!dir[k]; dir={}; dir[k]=asc; t.querySelectorAll('th.sortable').forEach(function(x){x.textContent=x.textContent.replace(/[▾▴]$/,'').trim()+' ▾';}); th.textContent=th.textContent.replace(/[▾▴]$/,'').trim()+(asc?' ▴':' ▾'); rows.sort(function(a,b){return (asc?1:-1)*(Number(a.dataset[k])-Number(b.dataset[k]));}); rows.forEach(function(r){tb.appendChild(r);}); }); });
  function apply(){ rows.forEach(function(r){ var ok=(cl==='all'||r.dataset.cl===cl)&&(!q||r.dataset.q.indexOf(q)>=0); r.style.display=ok?'':'none'; }); }
  var f=document.getElementById('twfilter'); f.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return; f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false');}); b.setAttribute('aria-pressed','true'); cl=b.dataset.c; apply(); });
  document.getElementById('twsearch').addEventListener('input',function(e){ q=e.target.value.trim().toLowerCase(); apply(); });
})();
</script>
<!-- 計測 (2026-08-23): これが無いと pv_blog__<slug> も aff_* も飛ばず、記事別レポートに行が出ない -->
<script src="blog-quiz.js" defer><\/script>
</body>
</html>
`;
fs.writeFileSync(PAGE, html);
console.log(`built ${SLUG}.html: ${list.length} towns`);

#!/usr/bin/env node
// Build blog/japan-zoos-compared.html (v2 design) from blog/data/zoos.json (JAZA member zoos).
// Usage: node scripts/build-zoos.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'japan-zoos-compared', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/zoos.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const list = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const yen = (n) => '¥' + Number(n).toLocaleString('en-US');
const price = (a) => a.adult == null ? '—' : a.adult === 0 ? 'Free' : yen(a.adult);
const REGIONS = ['Hokkaido', 'Tohoku', 'Kanto', 'Hokuriku', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu', 'Okinawa'];
const rows = [...list].sort((a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || a.name.localeCompare(b.name));
const priced = list.filter(a => a.adult != null), free = list.filter(a => a.adult === 0), paid = priced.filter(a => a.adult > 0);
const median = paid.map(a => a.adult).sort((a, b) => a - b)[Math.floor(paid.length / 2)];
const dearest = [...paid].sort((a, b) => b.adult - a.adult).slice(0, 5);
const unverified = list.filter(a => !a.verified);
const P = (k) => CREDITS[SLUG][k];

const tr = (a) => `<tr data-region="${esc(a.region)}" data-price="${a.adult ?? 99999}" data-q="${esc((a.name + ' ' + a.ja + ' ' + a.pref + ' ' + a.city).toLowerCase())}">
<td><a href="${esc(a.url)}" rel="noopener nofollow">${esc(a.name)}</a><span class="pk">${esc(a.ja)} · ${esc(a.pref)}</span></td>
<td class="num">${price(a)}${!a.verified ? `<span class="pk" style="font:12px Karla,sans-serif;white-space:normal;color:var(--seal)">not re-read this month — confirm on the official site</span>` : (a.note && !/verify|official|prior|404|unreachable/.test(a.note) ? `<span class="pk" style="font:12px Karla,sans-serif;white-space:normal">${esc(a.note)}</span>` : '')}</td>
<td>${esc(a.hours || '—')}<span class="pk">Closed: ${esc(a.closed || '—')}</span></td>
<td>${esc(a.highlight)}</td>
</tr>`;

const TABLE = `<div class="prose"><p>Click <b>Adult ticket</b> to sort by price (free ones first), filter by region, or type a name. Every zoo links to its official site — that is where today's calendar lives, and where the ${unverified.length} entries we could not read by machine this month should be double-checked.</p></div>
<div class="filters" id="zfilter"><button aria-pressed="true" data-r="all">All ${list.length}</button>${REGIONS.map(r => `<button aria-pressed="false" data-r="${r}">${r}</button>`).join('')}<button aria-pressed="false" data-r="free">Free entry (${free.length})</button><input type="search" id="zsearch" placeholder="Search a name or prefecture…" aria-label="Search zoos"></div>
<div class="tbl-wrap"><table class="tbl" id="ztable">
<thead><tr><th>Zoo</th><th class="sortable" title="Click to sort by price">Adult ticket ▾</th><th>Hours · closed</th><th>Why go</th></tr></thead>
<tbody>
${rows.map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} JAZA member zoos and animal parks. Adult walk-up price from each official site, read ${date}; safari parks are shown with the drive-through fee where that is the normal ticket. Hours are the regular pattern — nearly every zoo shortens hours in winter and closes one weekday; the calendar on the official site is the only reliable answer for a given date.</p>
<div class="callout">Across the ${paid.length} that charge, the median adult ticket is <b>${yen(median)}</b> — a city zoo in Japan costs about what a coffee and a sandwich cost. <b>${free.length} are free.</b> The expensive end is the safari parks and animal theme parks — ${dearest.map(a => `${esc(a.name)} (${yen(a.adult)})`).join(', ')}.</div>`;

const card = (key, title, body) => `<div class="card"><div class="imgw">${img(SLUG, key, title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;

const HONEST = `<div class="prose">
<p>Search "zoos in Japan" in English and one of the suggested queries is <i>why are Japanese zoos so bad</i>. It deserves a straight answer, and the person writing this page is a biologist who has worked with captive and wild animals, so here it is.</p>
<p>The reputation comes from the older municipal zoos: concrete and steel enclosures built in the 1950s–70s, small by modern standards, sometimes still in use. That criticism is fair where it applies. What it misses is how much has changed and how uneven the picture is. <b>Asahiyama</b> reinvented itself around behavioural exhibits and became the model the rest of the country copied; <b>Zoorasia</b>, <b>Tama</b>, <b>Noichi</b>, <b>Toyama Family Park</b> and the rebuilt <b>Kyoto</b> and <b>Morioka</b> are landscape zoos by any standard; and the JAZA membership that defines this list carries welfare and husbandry rules that non-member roadside "zoos" do not.</p>
<p>A practical rule: the newer the enclosure, the better it is likely to be, and the zoos that talk about their conservation breeding — Tsushima leopard cats, rock ptarmigan, crested ibis, giant salamanders — are the ones putting money where it matters. Where an old bear pit survives, it is usually because a city zoo is free or nearly free and cannot fund a rebuild; several in this table are exactly that.</p>
</div>`;

const NATIVE = `<div class="prose"><p>Most people go to a zoo to see elephants and giraffes. If you go to a Japanese zoo to see <b>Japan's own animals</b> — the ones you will not meet at home and are unlikely to meet in the wild — these are the ones to know.</p></div>
<div class="cards">
${card('tsushima', 'Tsushima leopard cat', 'About a hundred survive on Tsushima. The breeding programme spreads them across Fukuoka City Zoo, Inokashira, Toyama Family Park, Kyoto and a few others; Fukuoka and Inokashira are the reliable places to see one.')}
${card('serow', 'Japanese serow', 'The mountain "goat-antelope" of Honshu\'s forests, a national natural monument. Toyama Family Park, Omachi Alpine Museum, Tama and several Tōhoku zoos keep them; in the wild you need luck and a cold morning.')}
${card('hero', 'Cold-climate natives', 'Kushiro Zoo keeps red-crowned cranes and Hokkaido species in the marsh country they come from; Asahiyama and Maruyama in Hokkaido, and Toyama, Ishikawa and Omachi in the Alps, keep rock ptarmigan and other high-altitude birds few zoos outside Japan hold.')}
</div>
<div class="prose"><ul>
<li><b>Crested ibis (toki)</b> — extinct in the wild in Japan by 2003, re-established from Chinese birds; <b>Ishikawa Zoo</b> is the one place the public can see them outside Sado.</li>
<li><b>Japanese giant salamander</b> — <b>Hiroshima Asa Zoo</b> has bred them since the 1970s; also at Kyoto Aquarium (see our aquarium table).</li>
<li><b>Iriomote cat</b> — none in any zoo; the ~100 animals are all wild on Iriomote. Do not believe a sign that says otherwise.</li>
<li><b>Ryukyu species</b> — <b>Okinawa Zoo & Museum</b> for the Amami rabbit, Ryukyu boars and native reptiles.</li>
</ul></div>`;

const PICKS = `<div class="prose"><p>The questions people actually type, answered from the table.</p></div>
<div class="cards">
${card('koala', 'The big three city zoos', '<b>Higashiyama</b> (Nagoya, ¥500) has the biggest collection and koalas; <b>Tama</b> (Tokyo, ¥600) is a hillside park with the lion bus and an insect garden; <b>Ueno</b> (¥600) is the historic one in the middle of the city. All three are cheap because they are municipal.')}
${card('nogeyama', 'Free, and genuinely good', `${free.length} zoos in the table charge nothing. <b>Nogeyama</b> in Yokohama is a full zoo above the harbour; <b>Edogawa</b>, <b>Yumemigasaki</b> and <b>Kiryugaoka</b> are the free neighbourhood ones around Tokyo; <b>Okazaki</b> keeps elephants and giraffes with no ticket booth. Filter the table by "Free entry".`)}
${card('fuji', 'Safari parks', 'Drive-through, in your own car or the park\'s bus: <b>Fuji Safari</b> under the mountain is the biggest, <b>Gunma</b>, <b>Nasu</b>, <b>Himeji Central Park</b>, <b>Akiyoshidai</b>, <b>Kyushu African Safari</b> and <b>Iwate</b> are the regional ones. Prices are ¥2,600–4,400 and include the loop.')}
${card('tama', 'For a whole day', 'Tama, Zoorasia, Higashiyama, Tobe, Noichi and Toyohashi are the ones with the space to lose a day in — hills, woods, and enclosures you walk between rather than past.')}
</div>`;

const HOW = `<div class="prose">
<p>The list is the zoo half of the <a href="https://www.jaza.jp/search-enkan" rel="noopener">JAZA member roster</a> — the Japanese Association of Zoos and Aquariums, whose members sign up to shared welfare and husbandry standards. That gives ${list.length} zoos and animal parks, from Ueno to a squirrel garden in Machida, and leaves out roadside animal attractions that are not members. We then read each zoo's own site for the adult ticket, hours and closed days. The aquarium half of the same roster is <a href="japan-aquariums-compared.html">its own table</a>.</p>
<p>Two honesty notes. Where a site could not be read by machine this month (${unverified.length} of them — a couple were down or moved), the row says so and carries the last published price; the table is re-checked monthly. And the "why go" column is ours; the numbers are theirs.</p>
</div>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">At the gate</div><div class="jp">大人一枚お願いします</div><div class="ro">Otona ichimai onegai shimasu</div><div class="en">One adult, please</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">On the sign</div><div class="jp">入園無料</div><div class="ro">nyūen muryō</div><div class="en">Free entry — you will see it more often than you expect</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">The word</div><div class="jp">動物園</div><div class="ro">dōbutsuen</div><div class="en">Zoo — literally "animal garden"</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>`;

const FAQ = [
  ['What is the best zoo in Japan?', 'For exhibits, Asahiyama in Hokkaido — the behaviour-based enclosures every other zoo copied. For scale and value, Higashiyama in Nagoya, Tama in Tokyo and Zoorasia in Yokohama. For Japan\'s own species, Toyama Family Park, Kushiro, Ishikawa and Fukuoka.'],
  ['How much does a zoo cost in Japan?', `Municipal zoos are cheap: the median adult ticket across the ${paid.length} paid JAZA zoos is ${yen(median)}, and ${free.length} are free. Safari parks and animal theme parks are ¥2,600–5,300.`],
  ['Are there free zoos in Japan?', `Yes — ${free.length} in the JAZA list, including Nogeyama (Yokohama), Edogawa and Yumemigasaki (Tokyo/Kawasaki), Kiryugaoka, Okazaki, Satsukiyama and Takaoka. Filter the table by "Free entry".`],
  ['Why do people say Japanese zoos are bad?', 'Because some older municipal zoos still have small concrete enclosures from the 1950s–70s. It is fair where it applies and out of date as a generalisation: the JAZA members rebuilt around behaviour and landscape (Asahiyama, Zoorasia, Tama, Noichi, Kyoto, Morioka), and the ones that talk about conservation breeding are spending on it. Newer enclosure, better zoo, is a reliable rule.'],
  ['Which zoo has pandas?', 'As of 2026, none of the JAZA zoos in this table keep giant pandas: Ueno\'s last pair returned to China in early 2026, Adventure World\'s in 2025, and Kobe\'s Tan Tan died in 2024. Check the official sites for any new loan.'],
  ['Which Japanese zoos are closed?', 'The Japan Monkey Centre in Inuyama closed for a long renewal from 11 July 2026. Several small zoos (Obihiro, Omoriyama, Toyama) open only at weekends or shorter hours in winter — the table notes it, the calendar has the dates.'],
];
const NEXT = `<div class="nb"><a href="japan-aquariums-compared.html"><b>Every aquarium in Japan, compared</b><span>The other half of the JAZA roster, same table.</span></a><a href="wildlife-watching-japan.html"><b>Wildlife watching in Japan</b><span>The same animals, in the wild.</span></a><a href="index.html"><b>All 47 prefecture guides</b><span>Each zoo's prefecture in full.</span></a></div>`;

const TITLE = `Every JAZA Zoo in Japan Compared: Prices, Hours, Which Are Free — and an Honest Answer on Welfare (2026)`;
const DESC = `All ${list.length} JAZA member zoos and animal parks in Japan in one sortable table — adult ticket, hours, closed days, what each is for — with the ${free.length} that are free, where to see Japan's own species, and a biologist's answer to "why are Japanese zoos so bad".`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('hero').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };
const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('hero').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'hero', stamp: '動', stampSmall: 'ZOOS', kicker: `Japan · ${list.length} JAZA zoos · updated ${date}`, title: 'Every zoo in Japan, compared', tag: `Prices, hours, the ${free.length} that are free — and a straight answer to the question people actually search.` })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">Japan's zoos are cheap, plentiful and uneven — a ¥500 municipal zoo with a world-class primate house can share a prefecture with a concrete bear pit from 1965. This is every zoo in the JAZA roster, ${list.length} of them, in one table, so you can tell which is which before you go.</p>
      <p>Adult ticket, hours, closed days and what each one is for, read from the official sites; then which are free, where Japan's own species are, which safari parks are worth the drive, and an honest paragraph on welfare from a biologist.</p>
      <div class="chips"><span class="chip">${list.length} zoos</span><span class="chip">${free.length} free</span><span class="chip">median ticket ${yen(median)}</span><span class="chip">7 safari parks</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#table">The table — all ${list.length} ↓</a><a class="btn light" href="#honest">Are Japanese zoos bad?</a><a class="btn light" href="#native">Japan's own animals</a><a class="btn light" href="#picks">Free · big three · safari</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['tama', 'koala', 'fuji'])}
  ${section('01', 'how', 'How this list was built', HOW)}
  ${section('02', 'honest', 'Are Japanese zoos bad? An honest answer', HONEST)}
  ${section('03', 'table', `The table: all ${list.length}, sortable by price`, TABLE)}
  ${section('04', 'picks', 'Which one, for what', PICKS)}
  ${section('05', 'native', 'Where to see Japan\'s own animals', NATIVE)}
  ${section('06', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('07', FAQ)}
  ${section('08', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: the <a href="https://www.jaza.jp/search-enkan" rel="noopener">JAZA member facility list</a> (zoo section, read August 2026) and each zoo's official admission, hours and access pages, linked from the table. Prices are adult walk-up rates in yen; rows marked "not re-read this month" carry the last published price and are flagged for the next monthly check. Animal photos show the species, not necessarily an animal at the zoo named unless the caption says so. Photos are Creative Commons — credits under each image.</p>
</main>
${footer()}
<script>
(function(){var t=document.getElementById('ztable');if(!t)return;var tb=t.tBodies[0],rows=Array.prototype.slice.call(tb.rows),asc=true,region='all',q='';var th=t.querySelector('th.sortable');
th.addEventListener('click',function(){rows.sort(function(a,b){return (asc?1:-1)*(Number(a.dataset.price)-Number(b.dataset.price));});asc=!asc;th.textContent='Adult ticket '+(asc?'▾':'▴');rows.forEach(function(r){tb.appendChild(r);});});
function apply(){rows.forEach(function(r){var ok=(region==='all'||(region==='free'?r.dataset.price==='0':r.dataset.region===region))&&(!q||r.dataset.q.indexOf(q)>=0);r.style.display=ok?'':'none';});}
var f=document.getElementById('zfilter');f.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');region=b.dataset.r;apply();});
document.getElementById('zsearch').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();apply();});})();
</script>
<!-- 計測 (2026-08-23): これが無いと pv_blog__<slug> も aff_* も飛ばず、記事別レポートに行が出ない -->
<script src="blog-quiz.js" defer><\/script>
</body>
</html>
`;
fs.writeFileSync(PAGE, html);
console.log(`built ${SLUG}.html: ${list.length} zoos, ${free.length} free, median ${yen(median)}, unverified ${unverified.length}`);

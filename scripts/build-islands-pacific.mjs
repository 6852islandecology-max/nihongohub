#!/usr/bin/env node
// Regional child of the islands hub: the inhabited islands of Japan's Pacific coast, Sanriku to Hyūga —
// everything not covered by the Seto, Nagasaki, Sea of Japan, Izu–Ogasawara and Nansei pages.
// Usage: node scripts/build-islands-pacific.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, esc, head, nav, hero, mosaic, section, faqSection, footer, img, credit, CREDITS } from './v2-shell.mjs';
const SLUG = 'pacific-coast-islands', URL_ = `https://www.nihongo-hub.com/blog/${SLUG}.html`;
const DATA = path.join(ROOT, 'blog/data/islands.json'); const PAGE = path.join(ROOT, `blog/${SLUG}.html`);
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PUBLISHED = '2026-08-19';
const all = JSON.parse(fs.readFileSync(DATA, 'utf8')).filter(i => i.name && i.pop != null && i.area != null);
// entries: name, or [name, area] when the name is shared within the prefecture
const SETS = {
  'Sanriku & Matsushima Bay': { prefs: ['宮城県'], names: ['大島', '出島', '江島', '金華山', '田代島', '網地島', '宮戸島', '桂島', '野々島', '寒風沢島', '朴島'] },
  'Sagami & Suruga Bay': { prefs: ['神奈川県', '静岡県'], names: ['城ケ島', '江の島', '初島'] },
  'Mikawa & Ise Bay': { prefs: ['愛知県', '三重県'], names: ['佐久島', '日間賀島', '篠島', '答志島', '神島', '菅島', '坂手島'] },
  'Shima & Kii': { prefs: ['三重県', '和歌山県'], names: ['渡鹿野島', '間崎島', '賢島', '紀伊大島', '中ノ島'] },
  'Tokushima & Kōchi': { prefs: ['徳島県', '高知県'], names: ['伊島', '竹ケ島', '中ノ島', '柏島', '大島', '沖の島', '鵜来島'] },
  'Bungo Channel': { prefs: ['愛媛県', '大分県'], names: ['日振島', '戸島', '嘉島', '九島', ['大島', 0.75], '黒島', '津久見島', '保戸島', '大入島', ['大島', 1.63], '屋形島', '深島'] },
  'Hyūga': { prefs: ['宮崎県'], names: ['島野浦島', '青島', '大島', '築島'] },
};
const PREF_EN = { '宮城県': 'Miyagi', '神奈川県': 'Kanagawa', '静岡県': 'Shizuoka', '愛知県': 'Aichi', '三重県': 'Mie', '和歌山県': 'Wakayama', '徳島県': 'Tokushima', '高知県': 'Kochi', '愛媛県': 'Ehime', '大分県': 'Oita', '宮崎県': 'Miyazaki' };
const PREF_SLUG = { '宮城県': 'miyagi', '神奈川県': 'kanagawa', '静岡県': 'shizuoka', '愛知県': 'aichi', '三重県': 'mie', '和歌山県': 'wakayama', '徳島県': 'tokushima', '高知県': 'kochi', '愛媛県': 'ehime', '大分県': 'oita', '宮崎県': 'miyazaki' };
const list = [];
for (const [g, def] of Object.entries(SETS)) for (const n of def.names) {
  const [ja, area] = Array.isArray(n) ? n : [n, null];
  const hits = all.filter(i => def.prefs.includes(i.pref) && i.ja === ja && (area == null || Math.abs(i.area - area) < 0.01) && !i.group);
  if (hits.length !== 1) { console.error('match', hits.length, g, ja); if (!hits.length) continue; }
  const hit = hits[0]; hit.group = g; hit.prefEn = PREF_EN[hit.pref]; list.push(hit);
}
const GROUPS = Object.keys(SETS);
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const areaFmt = (a) => a == null ? '—' : (a >= 10 ? a.toFixed(0) : a.toFixed(2));
const P = (k) => CREDITS[SLUG][k];
const byPop = [...list].sort((a, b) => b.pop - a.pop); const tiny = list.filter(i => i.pop < 100);
const T = (ja, pref) => list.find(i => i.ja === ja && (!pref || i.pref === pref));
const RELEASED = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'blog/v2-release.json'), 'utf8')).prefectures);
const prefLink = (i) => RELEASED.has(PREF_SLUG[i.pref]) ? `${PREF_SLUG[i.pref]}-v2.html` : `${PREF_SLUG[i.pref]}.html`;
const tr = (i) => `<tr data-g="${esc(i.group)}" data-pop="${i.pop}" data-area="${i.area}" data-q="${esc((i.name + ' ' + i.ja + ' ' + i.prefEn + ' ' + i.group).toLowerCase())}">
<td>${esc(i.name)}<span class="pk">${esc(i.ja)}</span></td><td><a href="${prefLink(i)}">${esc(i.prefEn)}</a><span class="pk">${esc(i.group)}</span></td><td class="num">${fmt(i.pop)}</td><td class="num">${areaFmt(i.area)}</td>
<td>${i.wikiEn ? `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(i.wikiEn)}" rel="noopener nofollow">Wikipedia</a>` : ''}</td></tr>`;

const TABLE = `<div class="prose"><p>Every inhabited island on the Pacific side of Honshu, Shikoku and eastern Kyushu that is not in one of the other regional tables, north to south. Sort by people or size, or type a name.</p></div>
<div class="filters" id="jfilter"><button aria-pressed="true" data-g="all">All ${list.length}</button>${GROUPS.map(g => `<button aria-pressed="false" data-g="${g}">${g} (${list.filter(i => i.group === g).length})</button>`).join('')}<input type="search" id="jsearch" placeholder="Search an island…" aria-label="Search islands"></div>
<div class="tbl-wrap" style="max-height:70vh;overflow-y:auto"><table class="tbl" id="jtable"><thead><tr><th>Island</th><th>Prefecture · group</th><th class="sortable" data-k="pop">People ▾</th><th class="sortable" data-k="area">km² ▾</th><th>Read more</th></tr></thead><tbody>
${[...list].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || b.pop - a.pop).map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} islands. Population and area are the figures printed in SHIMADAS (2019 edition; 2015 census and GSI), with two areas (Kashikojima, Ōshima in Sukumo) and two names (Himakajima, Masakijima) corrected against the Japanese Wikipedia articles where the extraction misread them. Ajishima, which the extraction missed, is added from the Japanese Wikipedia article (247 people, 2020 census). Tebajima off Mugi (Tokushima) and one small island off Uwajima are inhabited but missing or unverifiable in our extraction and are left out. Enoshima, Jōgashima, Kashikojima, Kashiwajima, the Sukumo Ōshima and Aoshima are joined to the mainland by bridge.</p>`;

const card = (key, title, body) => `<div class="card"><div class="imgw">${img(SLUG, key, title)}</div><div class="b"><h3>${title}</h3><p>${body}</p></div><div class="cred">${credit(SLUG, key)}</div></div>`;
const GROUPSEC = `<div class="prose"><p>There is no one trip here; these are islands you add to a trip you are already making. North to south:</p></div>
<div class="cards">
${card('tashiro', 'Tashirojima and the Sanriku islands', `Off Ishinomaki, the cat island: ${fmt(T('田代島').pop)} people and several times that many cats, an hour's ferry from the city. Next to it Kinkasan, a sacred mountain-island with ${fmt(T('金華山').pop)} residents, deer and a shrine; Ajishima (${fmt(T('網地島').pop)} people) is on the same boat. Further north Ōshima at Kesennuma (${fmt(T('大島', '宮城県').pop)} people, now bridged) and Izushima and Enoshima off Onagawa. All of them were hit by the 2011 tsunami; all are back.`)}
${card('matsushima', 'Matsushima Bay', `The famous bay is 260 islets, and four of them have villages: Katsurashima (${fmt(T('桂島').pop)} people), Nonoshima, Sabusawajima — the old Edo-period port, ${fmt(T('寒風沢島').pop)} people — and Hōjima with ${fmt(T('朴島').pop)}. The town boat from Shiogama calls at all four in under an hour, and almost none of the sightseeing-cruise passengers get off. Miyatojima to the east (${fmt(T('宮戸島').pop)}) is bridged and has the Ōtakamori lookout.`)}
${card('enoshima', 'Enoshima and Jōgashima', `Tokyo's islands-for-an-afternoon. Enoshima (${fmt(T('江の島').pop)} people) is a shrine hill at the end of a footbridge from Fujisawa, an hour from Shinjuku; Jōgashima (${fmt(T('城ケ島').pop)}) is the rock at the tip of the Miura Peninsula, bridged, with the Umanose arch and tuna lunches in Misaki. Hatsushima, ${fmt(T('初島').pop)} people, is the ferry island off Atami.`)}
${card('himaka', 'Mikawa Bay and Toba', `Himakajima (${fmt(T('日間賀島').pop)} people on less than a square kilometre), Shinojima and Sakushima are the Aichi islands, twenty minutes from the Chita peninsula — octopus and fugu on the first two, art on the third. Across the strait the Toba islands: Tōshijima (${fmt(T('答志島').pop)}, the biggest), Sugashima, Sakatejima and Kamishima, which is Mishima's <i>The Sound of Waves</i> and the island where the Ise and Mikawa bays meet.`)}
${card('kii', 'Shima and Kii', `Kashikojima is the bridged island in Ago Bay with the hotel the 2016 G7 used; Masakijima and Watakanojima are its small neighbours. Kii Ōshima (${fmt(T('紀伊大島').pop)} people), off Kushimoto at the southern tip of Honshu, is bridged, and is where the Ottoman frigate Ertuğrul was wrecked in 1890 — the reason every Turkish visitor to Japan knows the name. Nakanoshima at Katsuura is a hotel island with a hot spring.`)}
${card('hoto', 'Shikoku and the Bungo Channel', `Kashiwajima (${fmt(T('柏島').pop)} people) at the south-western end of Shikoku has the clearest water on Honshu–Shikoku and is bridged; Okinoshima and Ugurushima beyond it are the boat-only ones. Across the channel Ōita's Hotojima (${fmt(T('保戸島').pop)} people) is a tuna-fishing village stacked three storeys up a hillside, and Ōnyūjima is ten minutes from Saiki. Ehime's Uwa Sea side has Hiburishima, Tojima, Kashima and Kushima. Tokushima's Ishima and Takegashima face the open Pacific; Miyazaki's Shimanoura (${fmt(T('島野浦島').pop)}) and Aoshima (${fmt(T('青島').pop)} people and a shrine) close the list.`)}
</div>`;

const HOW = `<div class="prose">
<p>Japan's Pacific coast has surprisingly few islands. From Sanriku to Miyazaki it is a long, exposed shore with deep water offshore, and the islands that exist sit in the bays — Matsushima, Sagami, Mikawa and Ise, Ago, the Uwa Sea, the Bungo Channel — not out in the ocean. ${list.length} of them have people, and most of those are a few hundred each. Only four pass a thousand.</p>
<p>This is the last slice of our <a href="japan-inhabited-islands.html">table of every inhabited island in Japan</a>: what is left after the <a href="seto-inland-sea-islands.html">Seto Inland Sea</a>, <a href="nagasaki-islands.html">Nagasaki</a>, the <a href="sea-of-japan-islands.html">Sea of Japan</a>, <a href="izu-ogasawara-islands.html">Izu and Ogasawara</a> and the <a href="nansei-islands.html">Nansei Islands</a> are taken out. Same source, same columns. Lake Biwa's Okishima and the Amakusa and Yatsushiro-sea islands of Kumamoto and Kagoshima are inland-sea or East China Sea and stay in the national table.</p>
</div>
<div class="callout"><b>Most of these are half-day trips.</b> Enoshima, Jōgashima, Kashikojima, Kii Ōshima, Kashiwajima and Miyatojima are bridged; the Matsushima Bay, Aichi, Toba and Onagawa islands are ten- to forty-minute boats from towns you would visit anyway. The exceptions — Okinoshima off Sukumo, Hiburishima off Uwajima, Kinkasan — need a timetable and, out of season, a phone call.</div>`;

const NUMBERS = `<div class="nums">
<div class="num"><div class="v">${list.length}</div><div class="l">Inhabited islands</div><div class="s">Sanriku to Hyūga</div></div>
<div class="num"><div class="v">${tiny.length}</div><div class="l">Under 100 people</div><div class="s">${Math.round(tiny.length / list.length * 100)}%</div></div>
<div class="num"><div class="v">${fmt(byPop[0].pop)}</div><div class="l">Largest</div><div class="s">${esc(byPop[0].name)}</div></div>
<div class="num"><div class="v">${list.filter(i => i.pop >= 1000).length}</div><div class="l">Over 1,000 people</div><div class="s">the rest are villages</div></div>
<div class="num"><div class="v">${fmt(T('田代島').pop)}</div><div class="l">People on Tashirojima</div><div class="s">outnumbered by cats</div></div>
</div>
<p class="nums-src">Source: SHIMADAS (Japan Islands Center, 2019 edition), 2015 census and GSI figures.</p>`;

const SPEAK = `<div class="speak">
<div class="ph"><div class="k">Asking</div><div class="jp">島に渡る船</div><div class="ro">shima ni wataru fune</div><div class="en">The boat over to the island — what to say at a small-town tourist desk</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">The sea</div><div class="jp">太平洋</div><div class="ro">Taiheiyō</div><div class="en">The Pacific — 太平 is "great peace", which it is not in typhoon season</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
<div class="ph"><div class="k">On the pier</div><div class="jp">渡船</div><div class="ro">tosen</div><div class="en">A small passenger boat — the word on the timetable for the village ferries</div><div class="row"><a href="../quiz.html?topic=travel">Test yourself</a></div></div>
</div>`;

const FAQ = [
  ['Which Japanese islands are near Tokyo?', 'On the mainland coast: Enoshima (Fujisawa), Jōgashima (Miura) and Hatsushima (off Atami) — all under two hours from Shinjuku. Tokyo\'s own islands, the Izu and Ogasawara chains, are south of Sagami Bay and have their own table.'],
  ['How do I get to Tashirojima, the cat island?', 'Ferry from Ishinomaki (Ajishima Line), about 45 minutes to an hour; two or three sailings a day, more in summer. There are no shops to speak of, so bring what you need.'],
  ['Can I visit the islands in Matsushima Bay?', 'Yes — the Shiogama city boat (Urato islands line) calls at Katsurashima, Nonoshima, Sabusawajima and Hōjima, about 25 minutes to the first and under an hour to the last. The sightseeing cruises from Matsushima pier do not stop.'],
  ['Which islands on this list are bridged?', 'Enoshima, Jōgashima, Kashikojima, Kii Ōshima, Nakanoshima (Katsuura, by hotel boat), Kashiwajima, Ōshima in Sukumo, Ōshima in Kesennuma, Miyatojima and Aoshima.'],
  ['Are the population figures current?', 'They are the 2015 census as printed in the 2019 edition of SHIMADAS; most islands have fewer people now.'],
];
const NEXT = `<div class="nb"><a href="japan-inhabited-islands.html"><b>Every inhabited island in Japan</b><span>The national table these ${list.length} come from.</span></a><a href="izu-ogasawara-islands.html"><b>Izu and Ogasawara</b><span>Tokyo's islands, a day trip to a week.</span></a><a href="seto-inland-sea-islands.html"><b>Islands of the Seto Inland Sea</b><span>110 islands, short ferries.</span></a></div>`;

const TITLE = `Pacific Coast Islands of Japan: Tashirojima, Matsushima Bay, Enoshima, Toba, Kashiwajima and Every Other Inhabited One (${list.length}) (2026)`;
const DESC = `All ${list.length} inhabited islands on Japan's Pacific coast from Sanriku to Miyazaki — the cat island, the Matsushima Bay villages, Enoshima and Jōgashima, the Aichi and Toba islands, Kii Ōshima, Kashiwajima and the Bungo Channel — sortable by population and area, with how each is reached.`;
const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: TITLE, datePublished: PUBLISHED, dateModified: date, description: DESC, url: URL_, mainEntityOfPage: URL_, inLanguage: 'en', image: `https://www.nihongo-hub.com/blog/${P('hero').file}`, isPartOf: { '@type': 'WebSite', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, author: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' }, publisher: { '@type': 'Organization', name: 'NihongoHub', url: 'https://www.nihongo-hub.com/' } };
const html = `${head({ url: URL_, title: TITLE, description: DESC, ogImage: `https://www.nihongo-hub.com/blog/${P('hero').file}`, ld })}
<body>
${nav()}
${hero({ slug: SLUG, key: 'hero', stamp: '太平', stampSmall: 'PACIFIC COAST', kicker: `Japan · Pacific coast · ${list.length} inhabited islands · updated ${date}`, title: 'Pacific coast islands', tag: `The cat island, the Matsushima villages, Enoshima, Toba, Kashiwajima — every inhabited island on the open-ocean side.` })}
<main class="wrap">
  <div class="sum">
    <div>
      <p class="lede">The Pacific side of Japan has ${list.length} inhabited islands between Sanriku and Miyazaki, and almost all of them hide in bays: the four villages inside Matsushima Bay, the cat island off Ishinomaki, Enoshima and Jōgashima an hour from Tokyo, the octopus and fugu islands of Mikawa Bay, the Toba islands, Kii Ōshima at the bottom of Honshu, Kashiwajima at the end of Shikoku, and the tuna village of Hotojima across the channel.</p>
      <p>The last slice of our national island table — same numbers, grouped by bay, with the boats and bridges.</p>
      <div class="chips"><span class="chip">${list.length} islands</span><span class="chip">${GROUPS.length} groups</span><span class="chip">${tiny.length} under 100 people</span><span class="chip">largest ${esc(byPop[0].name)}</span><span class="chip">updated ${date}</span></div>
    </div>
    <div class="locbox"><div class="lbl">Jump to<b>What you came for</b></div><div style="display:grid;gap:8px;margin-top:64px">
      <a class="btn" href="#groups">Cat island · Matsushima · Enoshima ↓</a><a class="btn light" href="#table">The table — all ${list.length}</a><a class="btn light" href="japan-inhabited-islands.html">All of Japan's islands</a><a class="btn light" href="izu-ogasawara-islands.html">Tokyo's own islands</a>
    </div></div>
  </div>
  ${mosaic(SLUG, ['matsushima', 'jogashima', 'toshi'])}
  ${section('01', 'how', 'The open-ocean side', HOW)}
  ${section('02', 'numbers', 'The shape of it', NUMBERS)}
  ${section('03', 'groups', 'The islands, north to south', GROUPSEC)}
  ${section('04', 'table', `The table: all ${list.length}`, TABLE)}
  ${section('05', 'japanese', 'The Japanese you\'ll actually use', SPEAK)}
  ${faqSection('06', FAQ)}
  ${section('07', 'next', 'Read next', NEXT)}
  <p class="disc">Sources: <i>SHIMADAS</i> (Japan Islands Center, 2019 edition) for the roster and figures (2015 census, GSI); only published figures are reproduced, no text. Grouping by bay is ours; ferry times are rounded from the operators' timetables and change by season. English article links verified by prefecture; a blank means unverified. Photos are Creative Commons — credits under each image.</p>
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

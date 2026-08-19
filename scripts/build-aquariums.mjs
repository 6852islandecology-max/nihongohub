#!/usr/bin/env node
// Render the aquarium comparison table (and derived quick facts) from blog/data/aquariums.json into
// blog/japan-aquariums-compared.html between <!--aquarium-table--> ... <!--/aquarium-table--> markers,
// and the "checked" date line. Idempotent. Usage: node scripts/build-aquariums.mjs [--date YYYY-MM-DD]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const ROOT = path.join(os.homedir(), '.secretary/projects/nihongohub');
const DATA = path.join(ROOT, 'blog/data/aquariums.json'); const PAGE = path.join(ROOT, 'blog/japan-aquariums-compared.html');
const args = process.argv.slice(2); const d = new Date();
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const list = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const yen = (n) => '¥' + Number(n).toLocaleString('en-US');
const price = (a) => a.adult == null ? '—' : a.adult_max ? `${yen(a.adult)}–${yen(a.adult_max)}` : yen(a.adult);
const REGIONS = ['Hokkaido', 'Tohoku', 'Kanto', 'Hokuriku', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu', 'Okinawa'];
const rows = [...list].sort((a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || a.name.localeCompare(b.name));
const tr = (a) => `<tr data-region="${esc(a.region)}" data-price="${a.adult ?? 99999}">
<td><a href="${esc(a.url)}" target="_blank" rel="noopener nofollow">${esc(a.name)}</a><span class="pk">${esc(a.ja)}</span></td>
<td>${esc(a.pref)}<span class="pk">${esc(a.region)}</span></td>
<td data-sort="${a.adult ?? 99999}">${price(a)}${a.adult_note ? `<span class="pk">${esc(a.adult_note)}</span>` : ''}</td>
<td>${esc(a.hours)}<span class="pk">Closed: ${esc(a.closed)}</span></td>
<td>${esc(a.access)}</td>
<td>${esc(a.highlight)}</td>
</tr>`;
const table = `<!--aquarium-table-->
<div class="ktable-wrap"><table class="ktable aqtable" id="aqtable">
<thead><tr><th data-k="name">Aquarium</th><th data-k="pref">Prefecture</th><th data-k="price" class="sortable" title="Click to sort by price">Adult ticket ▾</th><th>Hours · closed</th><th>Getting there</th><th>Why go</th></tr></thead>
<tbody>
${rows.map(tr).join('\n')}
</tbody></table></div>
<p class="credits">${list.length} JAZA member aquariums. Adult (high-school-age and up) walk-up price from each official site, checked ${date}; date-based prices shown as a range. Hours are the regular pattern — every one of these changes hours for Golden Week, summer and New Year, so check the calendar linked in the name.</p>
<!--/aquarium-table-->`;
let html = fs.readFileSync(PAGE, 'utf8');
if (!/<!--aquarium-table-->[^]*?<!--\/aquarium-table-->/.test(html)) throw new Error('markers not found in page');
html = html.replace(/<!--aquarium-table-->[^]*?<!--\/aquarium-table-->/, table);
// derived facts (cheapest / most expensive) between <!--aq-facts--> markers if present
const priced = list.filter(a => a.adult != null);
const cheapest = [...priced].sort((a, b) => a.adult - b.adult).slice(0, 8);
const dearest = [...priced].sort((a, b) => (b.adult_max || b.adult) - (a.adult_max || a.adult)).slice(0, 5);
const median = priced.map(a => a.adult).sort((a, b) => a - b)[Math.floor(priced.length / 2)];
const facts = `<!--aq-facts-->
<p>Across the ${priced.length} that sell walk-up tickets, the median adult price is <b>${yen(median)}</b>. The cheapest are all public or freshwater houses — ${cheapest.map(a => `${esc(a.name)} (${yen(a.adult)})`).join(', ')}. The most expensive are the resort parks with marine-mammal shows — ${dearest.map(a => `${esc(a.name)} (${price(a)})`).join(', ')}.</p>
<!--/aq-facts-->`;
if (/<!--aq-facts-->[^]*?<!--\/aq-facts-->/.test(html)) html = html.replace(/<!--aq-facts-->[^]*?<!--\/aq-facts-->/, facts);
html = html.replace(/(<div class="updated">UPDATED )\d{4}-\d{2}-\d{2}/, `$1${date}`);
html = html.replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/, `"dateModified":"${date}"`);
fs.writeFileSync(PAGE, html);
console.log(`built ${list.length} rows into ${path.basename(PAGE)} (checked ${date}); median ${yen(median)}`);

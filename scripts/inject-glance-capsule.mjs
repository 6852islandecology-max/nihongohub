#!/usr/bin/env node
/*
 * inject-glance-capsule.mjs
 * Cognitive-load reducer: injects a compact, visual "at a glance" capsule
 * (5-axis text bars + top eat/see) right after the lede of every prefecture
 * guide, in all language variants that exist on disk.
 *
 * - Data source: explore-data.js (window.NH_EXTRA) — stats + first food/culture.
 * - No images, no extra CSS file: emoji + text bars (▰▱) render everywhere.
 * - Idempotent: wrapped in <!--glance--> ... <!--/glance--> markers, replaced on re-run.
 * - Only touches files that exist; pages without a .lede are skipped.
 *
 * Usage: node scripts/inject-glance-capsule.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');
const DRY = process.argv.includes('--dry');

const raw = readFileSync(join(ROOT, 'explore-data.js'), 'utf8');
const NH = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
const ENRICHED = JSON.parse(readFileSync(join(ROOT, 'blog', 'guides-enriched.json'), 'utf8'));

const LANGS = [
  { dir: '.',  axis: ['Food','Culture','City','Access','Nature'], eat: 'Eat', see: 'See' },
  { dir: 'es', axis: ['Comida','Cultura','Ciudad','Acceso','Naturaleza'], eat: 'Prueba', see: 'Visita' },
  { dir: 'id', axis: ['Makanan','Budaya','Kota','Akses','Alam'], eat: 'Coba', see: 'Lihat' },
  { dir: 'th', axis: ['อาหาร','วัฒนธรรม','เมือง','การเดินทาง','ธรรมชาติ'], eat: 'ลอง', see: 'ชม' },
  { dir: 'zh', axis: ['美食','文化','城市','交通','自然'], eat: '必嚐', see: '必看' },
];
const ICONS = ['🍜','🏯','🏙','🚄','🌿'];
const KEYS = ['food','culture','city','access','nature'];

const bar = (n) => '▰'.repeat(Math.max(0, Math.min(5, n))) + '▱'.repeat(5 - Math.max(0, Math.min(5, n)));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function capsule(p, L, slug) {
  const stats = p.stats || {};
  const chips = KEYS.map((k, i) =>
    `<span style="white-space:nowrap" title="${L.axis[i]} ${stats[k] || 0}/5">${ICONS[i]} <span style="font-size:11px;color:#796c5c">${L.axis[i]}</span> <span style="color:#bf3325;letter-spacing:1px">${bar(stats[k] || 0)}</span></span>`
  ).join(' ');
  const eat = p.food && p.food[0] ? p.food[0].name : '';
  const see = p.culture && p.culture[0] ? p.culture[0].name : '';
  const facts = [eat ? `🥢 ${L.eat}: <b>${esc(eat)}</b>` : '', see ? `📍 ${L.see}: <b>${esc(see)}</b>` : '']
    .filter(Boolean).join(' &nbsp;·&nbsp; ');
  const ph = ENRICHED[slug] && ENRICHED[slug].deeper_phrase;
  const phrase = ph && ph.jp
    ? `<div style="margin-top:2px;color:#4a4036" title="${esc(ph.en || '')}">🗣 <b lang="ja">${esc(ph.jp)}</b> <span style="color:#796c5c">${esc(ph.ro || '')}</span></div>`
    : '';
  return `<!--glance-->
<div style="background:#fdfaf3;border:2px solid #e6ddd0;border-radius:12px;padding:11px 14px;margin:14px 0;font-size:13.5px;line-height:1.9">
<div style="display:flex;flex-wrap:wrap;gap:2px 16px">${chips}</div>
${facts ? `<div style="margin-top:4px;color:#4a4036">${facts}</div>` : ''}${phrase}</div>
<!--/glance-->`;
}

let changed = 0, skipped = 0;
for (const [slug, p] of Object.entries(NH)) {
  for (const L of LANGS) {
    const file = join(BLOG, L.dir, `${slug}.html`);
    if (!existsSync(file)) continue;
    let html = readFileSync(file, 'utf8');
    if (!/<p class="lede">[\s\S]*?<\/p>/.test(html)) { skipped++; continue; }
    const before = html;
    html = html.replace(/\n?<!--glance-->[\s\S]*?<!--\/glance-->/g, '');
    html = html.replace(/(<p class="lede">[\s\S]*?<\/p>)/, `$1\n${capsule(p, L, slug)}`);
    if (html !== before) {
      if (!DRY) writeFileSync(file, html);
      changed++;
    }
  }
}
console.log(`[inject-glance-capsule] files-${DRY ? 'would-change' : 'changed'}=${changed} skipped-no-lede=${skipped}`);

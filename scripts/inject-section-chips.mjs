#!/usr/bin/env node
/*
 * inject-section-chips.mjs
 * Cognitive-load reducer #2: at the top of each "What to see" / "What to eat"
 * section of every prefecture guide (all languages), injects a scannable row
 * of chips naming the items covered — ★ well-known, 💎 lesser-known — so a
 * reader gets the list without reading the prose. Data: explore-data.js.
 *
 * Idempotent via <!--chips-see--> / <!--chips-eat--> markers.
 * Only injects when the language's section heading is found verbatim.
 *
 * Usage: node scripts/inject-section-chips.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');
const DRY = process.argv.includes('--dry');

const raw = readFileSync(join(ROOT, 'explore-data.js'), 'utf8');
const NH = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

// Exact h2 text per language (verified against generated pages).
const LANGS = [
  { dir: '.',  see: 'What to see', eat: 'What to eat' },
  { dir: 'es', see: 'Qué ver', eat: 'Qué comer' },
  { dir: 'id', see: 'Yang wajib dilihat', eat: 'Yang wajib dicoba' },
  { dir: 'th', see: 'ต้องไปดู', eat: 'ต้องกิน' },
  { dir: 'zh', see: '必看景點', eat: '必吃美食' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const chipRow = (items, marker) => {
  const chips = (items || []).slice(0, 6).map((it) =>
    `<span style="display:inline-block;background:#f4efe5;border:1.5px solid #e6ddd0;border-radius:999px;padding:3px 11px;margin:3px 4px 3px 0;font-size:12.5px;white-space:nowrap" title="${esc(it.note || '')}">${it.tag === 'hidden' ? '💎' : '★'} ${esc(it.name)}</span>`
  ).join('');
  return chips ? `<!--${marker}-->\n<div style="margin:10px 0 4px;line-height:2">${chips}</div>\n<!--/${marker}-->` : '';
};

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const inject = (html, heading, block, marker) => {
  if (!block) return html;
  html = html.replace(new RegExp(`\\n?<!--${marker}-->[\\s\\S]*?<!--/${marker}-->`, 'g'), '');
  const h2re = new RegExp(`(<h2[^>]*>${reEsc(heading)}</h2>)`);
  if (!h2re.test(html)) return html;
  return html.replace(h2re, `$1\n${block}`);
};

let changed = 0, noHeading = 0;
for (const [slug, p] of Object.entries(NH)) {
  for (const L of LANGS) {
    const file = join(BLOG, L.dir, `${slug}.html`);
    if (!existsSync(file)) continue;
    let html = readFileSync(file, 'utf8');
    const before = html;
    html = inject(html, L.see, chipRow(p.culture, 'chips-see'), 'chips-see');
    html = inject(html, L.eat, chipRow(p.food, 'chips-eat'), 'chips-eat');
    if (html !== before) {
      if (!DRY) writeFileSync(file, html);
      changed++;
    } else if (!html.includes('<!--chips-see-->') && !html.includes('<!--chips-eat-->')) {
      noHeading++;
    }
  }
}
console.log(`[inject-section-chips] files-${DRY ? 'would-change' : 'changed'}=${changed} no-matching-heading=${noHeading}`);

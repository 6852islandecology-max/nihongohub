#!/usr/bin/env node
// Photo-density audit for English blog articles: words per <img>, dateModified presence.
// Reference band from the 2026-08-19 SERP audit: pages ranking top-5 in the collectible cluster sit at 36–215 words/photo.
// Usage: node scripts/photo-density-audit.mjs [--top N] [--md]   (--md prints a markdown table for the tracking file)
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const BLOG = path.join(os.homedir(), '.secretary/projects/nihongohub/blog');
const args = process.argv.slice(2); const top = Number(args[args.indexOf('--top') + 1]) || 15; const md = args.includes('--md');
const rows = [];
for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.html') && f !== 'index.html')) {
  const html = fs.readFileSync(path.join(BLOG, f), 'utf8');
  if (/<meta name="robots" content="noindex/.test(html)) continue;
  const words = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const imgs = (html.match(/<img\s/g) || []).length;
  const mod = (html.match(/"dateModified":"(\d{4}-\d{2}-\d{2})"/) || [])[1] || '';
  rows.push({ f: f.replace(/\.html$/, ''), words, imgs, wpp: Math.round(words / Math.max(imgs, 1)), mod });
}
rows.sort((a, b) => b.wpp - a.wpp);
const total = rows.length, le2 = rows.filter(r => r.imgs <= 2).length, noMod = rows.filter(r => !r.mod).length, inBand = rows.filter(r => r.wpp <= 215).length;
if (md) {
  console.log(`| 記事 | 語数 | 画像 | 語/枚 | dateModified |\n|---|---|---|---|---|`);
  rows.slice(0, top).forEach(r => console.log(`| ${r.f} | ${r.words} | ${r.imgs} | ${r.wpp} | ${r.mod || '—'} |`));
} else {
  rows.slice(0, top).forEach(r => console.log(`${String(r.wpp).padStart(5)} w/photo  ${String(r.imgs).padStart(2)} img  ${String(r.words).padStart(5)} w  ${r.mod || '----------'}  ${r.f}`));
}
console.log(`\n英語記事 ${total} 本: 画像2枚以下 ${le2} / 215語以内(上位帯) ${inBand} / dateModified なし ${noMod}`);

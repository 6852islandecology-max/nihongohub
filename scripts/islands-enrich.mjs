#!/usr/bin/env node
// Build blog/data/islands.json from the SHIMADAS CSV (published numbers only) + verified Wikipedia links.
//
// Why Wikipedia: one lookup per island gives BOTH the English name (for romanisation) and the
// "is there an English page at all" signal that defines how undiscovered an island is in English.
// We never copy SHIMADAS prose — only the published numbers (area / population / households /
// coastline / elevation), which come from national statistics (2015 census, GSI) via the book.
// ASTI lat/lon are NOT exported: that dataset forbids redistribution of the data alone.
//
// 90+ island names repeat across Japan (大島 x14, 黒島 x8 ...), so a bare title lookup is wrong
// about a fifth of the time. Every match is verified: no disambiguation page, and the article
// intro must mention the island's prefecture. Unverified -> wikiJa/wikiEn stay null.
//
// Usage: node scripts/islands-enrich.mjs [--limit N] [--refresh]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { hepburn } from './kana.mjs';
const HOME = os.homedir();
const CSV = path.join(HOME, '成果物/Research/shimadas-islands-csv/shimadas_inhabited_full.csv');
const OUT = path.join(HOME, '.secretary/projects/nihongohub/blog/data/islands.json');
const CACHE = path.join(HOME, '.secretary/projects/nihongohub/blog/data/islands-wiki-cache.json');
const UA = 'NihongoHub-islands/1.0 (https://www.nihongo-hub.com; contact: support@nihongo-hub.com)';
const args = process.argv.slice(2);
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const refresh = args.includes('--refresh');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\r') { }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h.replace(/^﻿/, ''), r[i] ?? ''])));
}
const num = (v) => { const s = String(v ?? '').replace(/,/g, '').trim(); return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null; };
// index-derived prefecture errors in the CSV (所在地 OCR broken -> wrong index page): fix by island name
const PREF_FIX = { '淡路島': '兵庫県', '沼島': '兵庫県', '男鹿島': '兵庫県', '家島': '兵庫県', '坊勢島': '兵庫県', '西島': '兵庫県' };
const cleanPref = (p, name) => PREF_FIX[name] || String(p || '').replace(/\(.*?\)/g, '').trim();       // 宮城県(推定) -> 宮城県
const prefStem = (p) => cleanPref(p).replace(/[都道府県]$/, '');                // 宮城県 -> 宮城 (北海道 -> 北海)

const all = parseCsv(fs.readFileSync(CSV, 'utf8'));
const islands = all.filter(r => r['ブロック種別'] !== '地区集計(親島の市町/地区別)' && r['島名'] && !/^要確認/.test(r['島名判定'] || ''));
console.log('inhabited island rows:', islands.length);

const cache = (!refresh && fs.existsSync(CACHE)) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const api = async (params, host = 'ja') => {
  const u = new URL(`https://${host}.wikipedia.org/w/api.php`);
  u.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString();
  const r = await fetch(u, { headers: { 'user-agent': UA } });
  await sleep(110);
  return r.json();
};
// fetch a page and check it is an island article for this prefecture
async function check(title, pref) {
  const j = await api({ action: 'query', titles: title, prop: 'langlinks|pageprops|extracts', lllang: 'en', lllimit: '1', redirects: '1', exintro: '1', explaintext: '1', exchars: '600' });
  const p = j?.query?.pages?.[0];
  if (!p || p.missing || p.pageprops?.disambiguation !== undefined) return null;
  const intro = (p.extract || '').slice(0, 600);
  const stem = prefStem(pref);
  if (stem && !intro.includes(stem) && !p.title.includes(stem)) return null;   // wrong 大島
  // reject administrative articles: the prefecture itself, a district, a city/town/village
  if (/[都道府県郡市区町村]$/.test(p.title.replace(/\s*\(.*\)$/, ''))) return null;
  if (/^(都道府県|日本の(市町村|地方)|.{1,6}[郡市区町村])$/.test(p.title)) return null;
  if (!/島|嶼|礁/.test(p.title) && !/^[^。]{0,60}島/.test(intro)) return null;   // island articles only (対馬-type titles pass if the first sentence says 島)
  const reading = (intro.match(/^[^（(]{1,20}[（(]([ぁ-んー・]{2,20})/) || [])[1] || '';
  return { ja: p.title, en: p.langlinks?.[0]?.title || null, reading: reading.split('・')[0] };
}
async function wiki(name, pref) {
  const key = `${name}|${cleanPref(pref)}`;
  if (cache[key]) return cache[key];
  let rec = null;
  try {
    rec = await check(name, pref);
    if (!rec) {                                                                 // fall back to search within the prefecture
      const s = await api({ action: 'query', list: 'search', srsearch: `${name} ${cleanPref(pref)} 島`, srlimit: '3' });
      for (const hit of (s?.query?.search || [])) {
        if (!hit.title.includes(name.replace(/島$/, '')) && !name.includes(hit.title.replace(/島$/, ''))) continue;
        rec = await check(hit.title, pref); if (rec) break;
      }
    }
  } catch (e) { rec = { ja: null, en: null, err: String(e.message || e) }; }
  cache[key] = rec || { ja: null, en: null };
  return cache[key];
}

const out = [];
let n = 0;
for (const r of islands) {
  if (n >= limit) break; n++;
  const ja = r['島名'], pref = cleanPref(r['都道府県'], ja);
  const w = await wiki(ja, pref);
  let romaji = (r['ローマ字'] || '').trim();
  romaji = romaji ? romaji.charAt(0) + romaji.slice(1).toLowerCase() : '';
  const enTitle = w.en ? w.en.replace(/\s*\(.*\)$/, '').replace(/,\s*[A-Z].*$/, '') : '';
  const yomi = w.reading || r['よみ'] || '';                                       // the verified article's reading beats the OCR'd CSV one
  const fromKana = hepburn(yomi);
  out.push({
    ja, yomi, name: enTitle || fromKana || romaji || '', pref,
    area: num(r['面積_km2_補正']) ?? num(r['面積_km2']), pop: num(r['人口']),
    households: num(r['世帯数']), coast: num(r['周囲_km']), elev: num(r['標高_m']),
    popChange: num(r['人口増減_対H22']), visitors: num(r['来島者_人']),
    wikiJa: w.ja || null, wikiEn: w.en || null,
  });
  if (n % 25 === 0) { fs.writeFileSync(CACHE, JSON.stringify(cache)); console.log(' ', n, '/', islands.length); }
}
fs.writeFileSync(CACHE, JSON.stringify(cache));
// supplement: islands the CSV extraction missed. Figures and source are given per row (not SHIMADAS).
const EXTRA = path.join(HOME, '.secretary/projects/nihongohub/blog/data/islands-extra.json');
if (fs.existsSync(EXTRA)) for (const x of JSON.parse(fs.readFileSync(EXTRA, 'utf8'))) if (!out.some(i => i.ja === x.ja && i.pref === x.pref)) out.push(x);
// an article claimed by more than one island cannot identify either of them
const claims = {};
for (const i of out) if (i.wikiJa) (claims[i.wikiJa] ||= []).push(i);
let dropped = 0;
for (const [t, group] of Object.entries(claims)) if (group.length > 1) { for (const i of group) { i.wikiJa = null; i.wikiEn = null; dropped++; } console.log('  ambiguous, dropped:', t, '<-', group.map(g => g.ja + '/' + g.pref).join(', ')); }
if (dropped) console.log(`  dropped ${dropped} ambiguous matches`);
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const withEn = out.filter(i => i.wikiEn).length, withJa = out.filter(i => i.wikiJa).length;
console.log(`wrote ${out.length} islands -> ${OUT}`);
console.log(`  ja wikipedia verified: ${withJa} · en page: ${withEn} (${Math.round(withEn / out.length * 100)}%) · no en page: ${out.length - withEn}`);
console.log(`  usable (area+pop+name): ${out.filter(i => i.area && i.pop && i.name).length} · no name at all: ${out.filter(i => !i.name).length}`);

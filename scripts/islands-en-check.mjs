#!/usr/bin/env node
// Second pass over blog/data/islands.json: decide, for each island, whether the ENGLISH Wikipedia
// has an article about the place at all.
//
// The naive test (does the Japanese island article carry an "en" interwiki link?) is wrong in a way
// that matters: Japanese Wikipedia often has a separate article for the island (直島) and for the
// municipality (直島町), and the English article — "Naoshima, Kagawa" — is linked to the municipality.
// Naoshima is one of the most-visited islands in Japan; calling it "not in English" would be false.
// So when there is no interwiki link we search the English Wikipedia by name and verify the hit
// mentions the prefecture and is about a place.
//
// Usage: node scripts/islands-en-check.mjs [--limit N] [--refresh]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const HOME = os.homedir();
const DATA = path.join(HOME, '.secretary/projects/nihongohub/blog/data/islands.json');
const CACHE = path.join(HOME, '.secretary/projects/nihongohub/blog/data/islands-en-cache.json');
const UA = 'NihongoHub-islands/1.0 (https://www.nihongo-hub.com; contact: support@nihongo-hub.com)';
const args = process.argv.slice(2);
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const refresh = args.includes('--refresh');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const PREF_EN = { '北海道': 'Hokkaido', '青森県': 'Aomori', '岩手県': 'Iwate', '宮城県': 'Miyagi', '秋田県': 'Akita', '山形県': 'Yamagata', '福島県': 'Fukushima', '茨城県': 'Ibaraki', '栃木県': 'Tochigi', '群馬県': 'Gunma', '埼玉県': 'Saitama', '千葉県': 'Chiba', '東京都': 'Tokyo', '神奈川県': 'Kanagawa', '新潟県': 'Niigata', '富山県': 'Toyama', '石川県': 'Ishikawa', '福井県': 'Fukui', '山梨県': 'Yamanashi', '長野県': 'Nagano', '岐阜県': 'Gifu', '静岡県': 'Shizuoka', '愛知県': 'Aichi', '三重県': 'Mie', '滋賀県': 'Shiga', '京都府': 'Kyoto', '大阪府': 'Osaka', '兵庫県': 'Hyogo', '奈良県': 'Nara', '和歌山県': 'Wakayama', '鳥取県': 'Tottori', '島根県': 'Shimane', '岡山県': 'Okayama', '広島県': 'Hiroshima', '山口県': 'Yamaguchi', '徳島県': 'Tokushima', '香川県': 'Kagawa', '愛媛県': 'Ehime', '高知県': 'Kochi', '福岡県': 'Fukuoka', '佐賀県': 'Saga', '長崎県': 'Nagasaki', '熊本県': 'Kumamoto', '大分県': 'Oita', '宮崎県': 'Miyazaki', '鹿児島県': 'Kagoshima', '沖縄県': 'Okinawa' };

const api = async (params, host) => {
  const u = new URL(`https://${host}.wikipedia.org/w/api.php`);
  u.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString();
  const r = await fetch(u, { headers: { 'user-agent': UA } });
  await sleep(110);
  return r.json();
};
// strip the -jima/-shima/-tō suffix so "Yashirojima" also matches "Suō-Ōshima"-style titles by stem
const stem = (n) => String(n || '').toLowerCase().replace(/[ōō]/g, 'o').replace(/[ūū]/g, 'u').replace(/[^a-z]/g, '')
  .replace(/(jima|shima|to|island|islands)$/, '');

const list = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const cache = (!refresh && fs.existsSync(CACHE)) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
let n = 0, found = 0, checked = 0;
for (const i of list) {
  if (i.wikiEn) { i.enSource = 'interwiki'; continue; }        // already linked from the Japanese article
  if (!i.name) { i.enSource = null; continue; }
  if (n >= limit) break; n++;
  const prefEn = PREF_EN[i.pref] || '';
  const key = `${i.name}|${prefEn}`;
  if (cache[key] === undefined) {
    let hit = null;
    try {
      const s = await api({ action: 'query', list: 'search', srsearch: `${i.name} ${prefEn} Japan island`, srlimit: '4' }, 'en');
      const cands = (s?.query?.search || []).map(h => h.title);
      const want = stem(i.name);
      for (const t of cands) {
        const ts = stem(t.split(',')[0]);
        if (!want || !ts) continue;
        if (!(ts === want || ts.includes(want) || want.includes(ts))) continue;
        const j = await api({ action: 'query', titles: t, prop: 'extracts|pageprops', exintro: '1', explaintext: '1', exchars: '500' }, 'en');
        const p = j?.query?.pages?.[0];
        if (!p || p.missing || p.pageprops?.disambiguation !== undefined) continue;
        const intro = p.extract || '';
        if (prefEn && !intro.includes(prefEn)) continue;                       // must be the right prefecture
        if (!/\b(island|islands|town|village|city|municipality)\b/i.test(intro)) continue;
        hit = p.title; break;
      }
    } catch (e) { hit = null; }
    cache[key] = hit;
    checked++;
    if (checked % 25 === 0) { fs.writeFileSync(CACHE, JSON.stringify(cache)); console.log('  checked', checked); }
  }
  if (cache[key]) { i.wikiEn = cache[key]; i.enSource = 'search'; found++; }
  else i.enSource = null;
}
fs.writeFileSync(CACHE, JSON.stringify(cache));
fs.writeFileSync(DATA, JSON.stringify(list, null, 1));
const usable = list.filter(i => i.name && i.pop != null && i.area != null);
console.log(`english-page pass: ${checked} searched, ${found} extra articles found`);
console.log(`  of ${usable.length} usable islands: ${usable.filter(i => i.wikiEn).length} have an English article, ${usable.filter(i => !i.wikiEn).length} do not`);

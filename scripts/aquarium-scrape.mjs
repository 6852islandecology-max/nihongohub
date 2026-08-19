#!/usr/bin/env node
// Collect admission / hours / closed-day / access snippets from each aquarium's OFFICIAL site.
// Reads blog/data/aquariums.json (name, url, ...), crawls the homepage + up to N linked info pages
// (料金 / 営業 / 休館 / アクセス / ticket / hours / access), and writes candidate snippets to
// blog/data/aquariums-scrape.json for human review. Never writes prices into aquariums.json itself.
// Usage: node scripts/aquarium-scrape.mjs [id ...]   (no ids = all)
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const ROOT = path.join(os.homedir(), '.secretary/projects/nihongohub');
const DATA = path.join(ROOT, 'blog/data/aquariums.json'); const OUT = path.join(ROOT, 'blog/data/aquariums-scrape.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 NihongoHub-research (contact: support@nihongo-hub.com)';
const list = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function get(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' }, redirect: 'follow', signal: ctl.signal });
    const buf = Buffer.from(await r.arrayBuffer()); const ct = r.headers.get('content-type') || '';
    let enc = (ct.match(/charset=([\w-]+)/i) || [])[1] || (buf.slice(0, 3000).toString('latin1').match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
    enc = enc.toLowerCase(); if (enc === 'x-sjis' || enc === 'shift-jis' || enc === 'sjis') enc = 'shift_jis'; if (enc === 'x-euc-jp') enc = 'euc-jp';
    let html; try { html = new TextDecoder(enc).decode(buf); } catch { html = buf.toString('utf8'); }
    return { ok: r.ok, status: r.status, url: r.url, html };
  } catch (e) { return { ok: false, status: 0, url, html: '', err: String(e.message || e) }; } finally { clearTimeout(t); }
}
const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d|td|th|dt|dd)>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&yen;/g, '¥').replace(/[ \t　]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
const LINK_RE = /料金|入館|入場|チケット|ticket|price|fee|admission|営業|開館|時間|hours|休館|アクセス|access|交通|ご利用案内|利用案内|guide|visit/i;
function links(html, base) {
  const out = new Set();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1], label = m[2].replace(/<[^>]+>/g, '').trim();
    if (!(LINK_RE.test(label) || LINK_RE.test(href))) continue;
    if (/\.(pdf|jpg|png|zip)$/i.test(href) || /^(mailto|tel|javascript)/i.test(href)) continue;
    try { const u = new URL(href, base); if (u.hostname === new URL(base).hostname) out.add(u.href.split('#')[0]); } catch { }
  }
  return [...out].slice(0, 8);
}
const PICK = {
  price: /(大人|おとな|一般|成人|adult|高校生以上|中学生以上|18歳以上|16歳以上)[^\n]{0,40}?(¥|￥|円|yen|JPY)?\s?[\d,]{3,6}\s?(円|yen|JPY)?|[\d,]{3,6}\s?(円|yen)[^\n]{0,20}(大人|おとな|一般|adult)/i,
  hours: /(\d{1,2}[:：]\d{2}\s?[~〜～-]\s?\d{1,2}[:：]\d{2})|(開館|営業|open)[^\n]{0,30}\d{1,2}[:：時]/i,
  closed: /(休館|定休|休園|closed|年中無休|無休)[^\n]{0,60}/i,
  access: /(駅|station)[^\n]{0,60}(徒歩|分|min|walk|バス|bus)|(徒歩|walk)[^\n]{0,40}(駅|station)/i,
};
function snippets(t) {
  const lines = t.split('\n').map(s => s.trim()).filter(s => s.length > 1 && s.length < 220);
  const res = {}; for (const [k, re] of Object.entries(PICK)) { if (k === 'price') continue; res[k] = [...new Set(lines.filter(l => re.test(l)))].slice(0, 6); }
  // price: keyword line + up to 3 following lines (tables split label and amount into separate cells)
  const KW = /(大人|おとな|一般|成人|adult|高校生以上|中学生以上|18歳以上|16歳以上|入館料|入場料|admission)/i, NUM = /[\d,]{3,6}\s?(円|yen|JPY|¥)|[¥￥]\s?[\d,]{3,6}/i;
  const pr = [];
  lines.forEach((l, i) => { if (!KW.test(l)) return; const w = lines.slice(i, i + 4).join(' ｜ '); if (NUM.test(w)) pr.push(w.slice(0, 220)); });
  res.price = [...new Set(pr)].slice(0, 6);
  return res;
}
const out = { ...prev };
for (const a of list) {
  if (only.length && !only.includes(a.id)) continue;
  const rec = { checked: new Date().toISOString().slice(0, 10), pages: [] };
  const home = await get(a.url);
  if (!home.ok) { rec.error = `home ${home.status} ${home.err || ''}`; out[a.id] = rec; console.log('ERR ', a.id, rec.error); continue; }
  const targets = [home.url, ...links(home.html, home.url)];
  const seen = new Set();
  for (const u of targets) {
    if (seen.has(u)) continue; seen.add(u);
    const r = u === home.url ? home : await get(u); await sleep(400);
    if (!r.ok) continue;
    const s = snippets(text(r.html)); const n = Object.values(s).reduce((x, y) => x + y.length, 0);
    if (n) rec.pages.push({ url: r.url, ...s });
  }
  out[a.id] = rec; console.log('OK  ', a.id.padEnd(22), rec.pages.length, 'pages');
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log('->', OUT);

#!/usr/bin/env node
// Build a contact sheet of Wikimedia Commons candidates for a query so a human (or Claude) can pick by eye
// before fetch-photos-multi.mjs pins the choice with an exact-title `must`. Free licences only.
// Usage: node scripts/photo-candidates.mjs "<query>" [--n 12] [--out path.jpg]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import sharp from 'sharp';
const args = process.argv.slice(2); const q = args[0]; if (!q) { console.error('query required'); process.exit(1); }
const n = Number(args[args.indexOf('--n') + 1]) || 12;
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(os.tmpdir(), 'cands-' + q.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) + '.jpg');
const UA = 'NihongoHub-photos/1.0 (https://www.nihongo-hub.com; contact: support@nihongo-hub.com)';
const FREE = /cc[- ]by|cc0|cc-zero|public domain|^pd/i;
const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&gsrlimit=${n * 2}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=400&iiextmetadatafilter=LicenseShortName|Artist`;
const j = await (await fetch(u, { headers: { 'user-agent': UA } })).json();
const pages = Object.values(j.query?.pages || {}).filter(p => { const ii = p.imageinfo?.[0]; const lic = ii?.extmetadata?.LicenseShortName?.value || ''; return ii && ii.width >= 900 && FREE.test(lic) && /\.(jpe?g|png)$/i.test(p.title); }).slice(0, n);
const W = 360, H = 270; const tiles = [];
for (let i = 0; i < pages.length; i++) {
  const ii = pages[i].imageinfo[0];
  try {
    const buf = Buffer.from(await (await fetch(ii.thumburl, { headers: { 'user-agent': UA } })).arrayBuffer());
    const img = await sharp(buf).resize(W, H, { fit: 'cover' }).toBuffer();
    const label = Buffer.from(`<svg width="${W}" height="22"><rect width="${W}" height="22" fill="black"/><text x="4" y="16" font-size="13" fill="white" font-family="sans-serif">${i} ${pages[i].title.replace(/^File:/, '').replace(/[<>&]/g, '').slice(0, 44)}</text></svg>`);
    tiles.push(await sharp(img).composite([{ input: label, top: 0, left: 0 }]).toBuffer());
  } catch (e) { }
}
if (!tiles.length) { console.log("no free candidates for", q); process.exit(0); }
const cols = 3, rows = Math.ceil(tiles.length / cols);
const sheet = sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: 'white' } });
await sheet.composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).jpeg({ quality: 80 }).toFile(out);
pages.forEach((p, i) => console.log(i, p.title.replace(/^File:/, ''), '|', p.imageinfo[0].width + 'x' + p.imageinfo[0].height, '|', p.imageinfo[0].extmetadata?.LicenseShortName?.value));
console.log('sheet ->', out);

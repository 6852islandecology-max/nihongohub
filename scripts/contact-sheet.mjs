#!/usr/bin/env node
// Build one contact-sheet PNG of every injected lead photo, labeled by slug,
// for a fast human quality review. Output: blog/img/_contact-sheet.png
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const BLOG = path.join(os.homedir(), '.secretary/projects/nihongohub/blog');
const IMGDIR = path.join(BLOG, 'img');
const OUT = path.join(IMGDIR, '_contact-sheet.png');

const files = fs.readdirSync(IMGDIR).filter(f => f.endsWith('.webp')).sort();
const COLS = 6, CW = 300, IH = 169, LH = 26, CH = IH + LH;
const ROWS = Math.ceil(files.length / COLS);
const W = COLS * CW, H = ROWS * CH;

const cells = [];
const labels = [];
for (let i = 0; i < files.length; i++) {
  const col = i % COLS, row = Math.floor(i / COLS);
  const x = col * CW, y = row * CH;
  const buf = await sharp(path.join(IMGDIR, files[i])).resize(CW - 8, IH - 8, { fit: 'cover' }).png().toBuffer();
  cells.push({ input: buf, left: x + 4, top: y + 4 });
  const slug = files[i].replace(/\.webp$/, '').replace(/-/g, ' ').slice(0, 46);
  labels.push(`<text x="${x + 6}" y="${y + IH + 17}" font-family="sans-serif" font-size="12" fill="#222">${slug.replace(/&/g, '&amp;')}</text>`);
}
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<rect width="${W}" height="${H}" fill="#f4efe5"/>${labels.join('')}</svg>`;
await sharp(Buffer.from(svg)).composite(cells).png().toFile(OUT);
console.log(`Contact sheet: ${path.relative(process.cwd(), OUT)}  (${files.length} images, ${W}x${H})`);

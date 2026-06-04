/* make-characters-transparent.mjs
 * Remove the white background from the polished chibi character PNGs (akari, yukika)
 * WITHOUT erasing white parts of the art (Yukika's white hair/wings).
 * Strategy: flood-fill from the image borders over near-white pixels only; interior
 * whites (enclosed by the dark-outlined art) are kept. Soft-feather the cut edge.
 *
 * Run: node scripts/make-characters-transparent.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '..', 'assets', 'characters');
const NAMES = ['akari', 'yukika'];

const NEAR = 238;   // pixel counts as background-white if R,G,B all >= NEAR
const SOFT = 224;   // edge pixels >= SOFT adjacent to cut get partial alpha

async function process(name) {
  const src = join(DIR, name + '.png');
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const idx = (x, y) => (y * W + x) * 4;
  const isNearWhite = (i, thr) => data[i] >= thr && data[i + 1] >= thr && data[i + 2] >= thr;

  const bg = new Uint8Array(W * H); // 1 = background (flood-reached)
  const stack = [];
  // seed from all border pixels that are near-white
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) { const p = y * W + x; if (isNearWhite(idx(x, y), NEAR)) { bg[p] = 1; stack.push(p); } }
  }
  for (let y = 0; y < H; y++) {
    for (const x of [0, W - 1]) { const p = y * W + x; if (!bg[p] && isNearWhite(idx(x, y), NEAR)) { bg[p] = 1; stack.push(p); } }
  }
  // flood fill (4-neighbour)
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p - x) / W;
    const nb = [];
    if (x > 0) nb.push(p - 1);
    if (x < W - 1) nb.push(p + 1);
    if (y > 0) nb.push(p - W);
    if (y < H - 1) nb.push(p + W);
    for (const q of nb) {
      if (bg[q]) continue;
      if (isNearWhite(q * 4, NEAR)) { bg[q] = 1; stack.push(q); }
    }
  }

  // apply alpha: background → transparent; feather pixels touching background that are lightish
  let cut = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (bg[p]) { data[i + 3] = 0; cut++; continue; }
    // feather: if this kept pixel is lightish and adjacent to a transparent bg pixel, soften
    const x = p % W, y = (p - x) / W;
    const touchesBg = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
    if (touchesBg && isNearWhite(i, SOFT)) data[i + 3] = 90;
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(src);
  console.log(`${name}: ${W}x${H}, ${(cut / (W * H) * 100).toFixed(1)}% made transparent`);
}

for (const n of NAMES) await process(n);
console.log('Done.');

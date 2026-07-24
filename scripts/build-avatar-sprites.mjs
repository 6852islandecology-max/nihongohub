/* build-avatar-sprites.mjs — regenerates the 15 player avatars (5 hair x 3 skin)
   to the 2026-06-10 pixel-art standard (same rules as build-hero-sprites.mjs):
   warm dark outline / 3-tone shading, top-left light / brows + eye catchlight + blush.
   16x20 grid, 4px cells -> 64x80 viewBox, same filenames — no code changes needed.
   Originals backed up in design-proposals/backup-orig-avatars/.
   Run: node scripts/build-avatar-sprites.mjs */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CELL = 4, W = 16, H = 20;

const ROWS = [
"..OOOOOOOOOOOO..",   //  0 hair top
".OHHHHHHHHHHHHO.",   //  1
".OHhhHHHHHHhhHO.",   //  2 hair highlight
".OHSSSSSSSSSSHO.",   //  3 hairline
".OSHHSSSSHHSSSO.",   //  4 brows
".OSWPSSSSWPSSSO.",   //  5 eyes (catchlight)
".OSPPSSSSPPSSSO.",   //  6
".OSCSSSsSSSCSSO.",   //  7 blush + nose shadow
".OSSSSSmmSSSSSO.",   //  8 mouth
".OSSSssssssSSSO.",   //  9 chin shading
"..OOOOsSSsOOOO..",   // 10 neck
".OTTUUUUUUUUTTO.",   // 11 shoulders (chest highlight)
"OTTTUUUUUUUUTTTO",   // 12 arms out
"OTTTTTTTTTTTTtTO",   // 13 torso
"OTTTTTTTTTTTTtTO",   // 14
"OSSGGGGggGGGGSSO",   // 15 belt + hands
".OONNNNNNNNNNOO.",   // 16 hips
"..ONNNNOONNNNO..",   // 17 legs
"..OKKKKOOKKKKO..",   // 18 boots
"..OOOOO..OOOOO.."    // 19
];

const HAIR = [
  { id: 'h1', name: 'Black',  H: '#1a1410', h: '#3a342c' },
  { id: 'h2', name: 'Brown',  H: '#6b4a2e', h: '#8a6648' },
  { id: 'h3', name: 'Blonde', H: '#e8c378', h: '#f5dca0' },
  { id: 'h4', name: 'Red',    H: '#a14524', h: '#c46a40' },
  { id: 'h5', name: 'Blue',   H: '#4267a8', h: '#6a8cc8' }
];
const SKIN = [
  { id: 's1', name: 'Fair',  S: '#f2d4b8', s: '#d4a880', C: '#eda88a', m: '#8e5a3a' },
  { id: 's2', name: 'Olive', S: '#c89878', s: '#a87058', C: '#c07a52', m: '#704530' },
  { id: 's3', name: 'Dark',  S: '#8b5a3c', s: '#6a3a20', C: '#7a4226', m: '#4a2818' }
];
const COMMON = {
  O: '#2a1a0c', W: '#ffffff', P: '#1a1208',
  T: '#7a8c60', t: '#5f7048', U: '#94a878',   // tunic (keeps legacy green identity)
  G: '#e0a634', g: '#b8842a',                  // belt
  N: '#3f4a6b', K: '#4a3220'                   // pants / boots
};

for (const hair of HAIR) {
  for (const skin of SKIN) {
    const pal = Object.assign({}, COMMON, { H: hair.H, h: hair.h, S: skin.S, s: skin.s, C: skin.C, m: skin.m });
    ROWS.forEach((r, i) => {
      if (r.length !== W) throw new Error(`row ${i} length ${r.length}`);
      for (const ch of r) if (ch !== '.' && !pal[ch]) throw new Error(`row ${i}: unknown "${ch}"`);
    });
    let body = '';
    for (let y = 0; y < H; y++) {
      let x = 0;
      while (x < W) {
        const c = ROWS[y][x];
        if (c === '.') { x++; continue; }
        let x2 = x;
        while (x2 + 1 < W && ROWS[y][x2 + 1] === c) x2++;
        body += `<rect x="${x*CELL}" y="${y*CELL}" width="${(x2-x+1)*CELL}" height="${CELL}" fill="${pal[c]}"/>\n`;
        x = x2 + 1;
      }
    }
    const svg = `<svg viewBox="0 0 ${W*CELL} ${H*CELL}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n<title>Avatar ${hair.name} hair, ${skin.name} skin</title>\n${body}</svg>\n`;
    const out = join(ROOT, 'assets', 'avatars', `avatar-${hair.id}-${skin.id}.svg`);
    writeFileSync(out, svg);
    console.log(`OK avatar-${hair.id}-${skin.id}.svg`);
  }
}
console.log('15 avatars done');

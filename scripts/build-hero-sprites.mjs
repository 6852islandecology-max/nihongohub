/* build-hero-sprites.mjs — generates rpg-n5.svg .. rpg-n1.svg (hero stages 1-5).
   Style: 2026-06-10 pixel-art standard (design-proposals/pixel-art-2026-06-10.html 案A本線):
   warm dark outline / 3-tone shading, top-left light / readable face (brows + eye catchlight + blush)
   + 案C theme accessories as stage differentiation (scarf, headband, satchel, scroll, mantle, sparkles).
   24x32 grid, 4px cells -> 96x128 viewBox (same as the originals; rpg.html untouched).
   Originals backed up in design-proposals/backup-orig-heroes/.
   Run: node scripts/build-hero-sprites.mjs   (writes SVGs to project root + _hero-maps.json for QA) */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CELL = 4, W = 24, H = 32;

// shared palette letters; T/t/U (outfit) and extras overridden per stage
const COMMON = {
  O:'#2a1a0c',                      // warm outline
  S:'#f2c892', s:'#d9a268',         // skin / shadow
  W:'#ffffff', P:'#1a1208', C:'#e8987a', m:'#8e5a3a',
  H:'#4a2e14', h:'#6f4a1e',         // hair / highlight
  G:'#e0a634', g:'#b8842a',         // gold / shadow
  N:'#3f4a6b', n:'#333d59',         // pants
  K:'#6a4525', k:'#4a2f18',         // leather / wood
  R:'#c0392b', r:'#8e2a20',         // red
  D:'#7c2d3a', d:'#5e1f2a'          // maroon mantle (stage 4)
};

const BASE = [
"......OOOOOOOOOOOO......",   //  0 hair top
".....OHHHHHHHHHHHHO.....",   //  1
".....OHhhHHHHHHhhHO.....",   //  2 hair highlight
".....OHhHHHHHHHHhHO.....",   //  3
".....OHSSSSSSSSSSHO.....",   //  4 hairline
".....OSHHSSSSHHSSSO.....",   //  5 brows
".....OSWPSSSSWPSSSO.....",   //  6 eyes (catchlight)
".....OSPPSSSSPPSSSO.....",   //  7
".....OSCSSSsSSSCSSO.....",   //  8 blush + nose shadow
".....OSSSSSmmSSSSSO.....",   //  9 mouth
".....OSSSssssssSSSO.....",   // 10 chin shading
"......OOOsSSSSsOOO......",   // 11 neck
"....OOTUUUUUUUUUUTOO....",   // 12 shoulders (chest highlight)
"...OTTTUUUUUUUUUUTTTO...",   // 13
"...OTTTTTTTTTTTTTTtTO...",   // 14 torso
"...OTTTTTTTTTTTTTTtTO...",   // 15
"...OTTTTTTTTTTTTTTtTO...",   // 16
"...OSSGGGGGggGGGGGSSO...",   // 17 belt + hands
"....OONNNNNNNNNNNNOO....",   // 18 hips
"....OONNNNNNNNNNNNOO....",   // 19
".....ONNNNNOONNNNNO.....",   // 20 legs
".....ONNNnNOONNNnNO.....",   // 21
".....ONNNnNOONNNnNO.....",   // 22
".....OKKKKKOOKKKKKO.....",   // 23 boots
".....OKKKKKOOKKKKKO.....",   // 24
"....OKKKKKKOOKKKKKKO....",   // 25
"....OOOOOOO..OOOOOOO....",   // 26
"........................",
"........................",
"........................",
"........................",
"........................"
];

function withRows(overrides){
  const rows = BASE.slice();
  for (const [i, row] of Object.entries(overrides)) rows[i] = row;
  return rows;
}

const STAGES = {
  // Stage 1 (N5) はじめての冒険者 — plain tan tunic, rope belt, no extras
  'rpg-n5': {
    pal: { T:'#8a6f4d', t:'#6e5638', U:'#a08a64' },
    rows: withRows({
      17: "...OSSKKKKKkkKKKKKSSO..."   // rope belt instead of gold
    })
  },
  // Stage 2 (N4) 旅の修行者 — blue-grey tunic + red scarf + satchel (案C取り込み)
  'rpg-n4': {
    pal: { T:'#5a6a80', t:'#46525f', U:'#74889f' },
    rows: withRows({
      11: ".....ORRRRRRRRRRRRO.....",  // scarf
      12: "....ORrRRRRRRRRRRrRO....",
      13: "...OTTRRUUUUUUUUUTTTO...",  // scarf tail over chest
      14: "...OTTTRrTTTTTTTTTtTO...",
      15: "...OTTTrTTTTTTTTTTtTO...",
      18: "....OONNNNNNNNNKkNOO...."   // satchel at right hip
    })
  },
  // Stage 3 (N3) 言葉の探検家 — green explorer + red headband + map scroll + satchel
  'rpg-n3': {
    pal: { T:'#4f7a4a', t:'#3c5f3a', U:'#6b9a62' },
    rows: withRows({
      3:  ".....ORrRRRRRRRRrRO.....",  // headband
      18: "....OOWWNNNNNNNKkNOO...."   // scroll (left hip) + satchel (right)
    })
  },
  // Stage 4 (N2) 日本語の使者 — navy robe + maroon mantle + gold hem + scroll
  'rpg-n2': {
    pal: { T:'#3d4f7c', t:'#2f3d61', U:'#5a70a3' },
    rows: withRows({
      12: "....OODDDDDDDDDDDDOO....",  // shoulder mantle
      13: "...ODDDDDDDDDDDDDDdDO...",
      14: "...OTTTUUUUUUUUUUTTTO...",  // robe chest
      18: "....OOWWTTTTTTTTTTOO....",  // long robe + scroll
      19: "....OOGgGGGGGGGGGgOO...."   // gold hem
    })
  },
  // Stage 5 (N1) 伝説の日本語マスター — ivory robe + red cape + gold headband + emblem + sparkles
  'rpg-n1': {
    pal: { T:'#ead9b8', t:'#c9b08a', U:'#f8efdc' },
    rows: withRows({
      2:  "..W..OHhhHHHHHHhhHO.....",  // sparkle (left, rows 2-4)
      3:  ".WWW.OGgGGGGGGGGgGO.....",  // gold headband + sparkle arm
      4:  "..W..OHSSSSSSSSSSHO.....",
      8:  ".....OSCSSSsSSSCSSO..W..",  // sparkle (right, rows 8-10)
      9:  ".....OSSSSSmmSSSSSO.WWW.",
      10: ".....OSSSssssssSSSO..W..",
      12: "....OORRRRRRRRRRRROO....",  // red cape mantle
      13: "...ORRRRRRRRRRRRRRrRO...",
      14: "...OTTTUUUUUUUUUUTTTO...",
      15: "...OTTTTTTGGggTTTTtTO...",  // gold chest emblem
      18: "....OOTTTTTTTTTTTTOO....",  // long robe
      19: "....OOGgGGGGGGGGGgOO...."   // gold hem
    })
  }
};

const maps = {};
for (const [name, st] of Object.entries(STAGES)) {
  const pal = Object.assign({}, COMMON, st.pal);
  const rows = st.rows;
  rows.forEach((r, i) => {
    if (r.length !== W) throw new Error(`${name} row ${i} length ${r.length} != ${W}`);
    for (const ch of r) if (ch !== '.' && !pal[ch]) throw new Error(`${name} row ${i}: unknown char "${ch}"`);
  });
  let body = '';
  for (let y = 0; y < rows.length; y++) {
    let x = 0;
    while (x < W) {
      const c = rows[y][x];
      if (c === '.') { x++; continue; }
      let x2 = x;
      while (x2 + 1 < W && rows[y][x2 + 1] === c) x2++;
      body += `<rect x="${x*CELL}" y="${y*CELL}" width="${(x2-x+1)*CELL}" height="${CELL}" fill="${pal[c]}"/>\n`;
      x = x2 + 1;
    }
  }
  const svg = `<svg viewBox="0 0 ${W*CELL} ${H*CELL}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n${body}</svg>\n`;
  writeFileSync(join(ROOT, `${name}.svg`), svg);
  maps[name] = { rows, pal };
  console.log(`OK ${name}.svg (${svg.length} bytes)`);
}
writeFileSync(join(ROOT, 'design-proposals', '_hero-maps.json'), JSON.stringify(maps, null, 0));
console.log('QA maps -> design-proposals/_hero-maps.json');

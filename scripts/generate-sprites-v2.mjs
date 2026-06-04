/**
 * generate-sprites-v2.mjs
 * Pure SVG sprite generator — no API needed.
 * Creates high-quality pixel art for:
 *   - rpg-n5.svg through rpg-n1.svg  (protagonist stage sprites)
 *   - assets/characters/akari.svg    (fox spirit NPC)
 *   - assets/characters/yukika.svg   (crane spirit NPC)
 *   - assets/avatars/*.svg           (15 player avatar variants)
 *   - og-default.svg                 (social OG image — convert to PNG for production)
 *
 * Usage: node scripts/generate-sprites-v2.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function mkdirp(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }

// 4px per logical pixel
function r(lx, ly, lw, lh, fill) {
  return `<rect x="${lx*4}" y="${ly*4}" width="${lw*4}" height="${lh*4}" fill="${fill}"/>`;
}
function svg(w, h, body) {
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n${body}\n</svg>`;
}

// ── Common building blocks ─────────────────────────────────────────────────

// 24×32 logical pixel character → 96×128 SVG
function head({ hair, skin, eyeColor = '#6080d8', expression = 'smile' }) {
  const skinDark = darken(skin, 0.15);
  const exMouth = expression === 'smile'
    ? r(4, 12, 8, 1, '#b06050') + r(4, 13, 1, 1, '#b06050') + r(11, 13, 1, 1, '#b06050')
    : r(5, 12, 6, 1, '#b06050');
  return [
    // hair top
    r(2, 0, 12, 3, hair),
    // hair sides
    r(2, 2, 2, 5, hair), r(12, 2, 2, 5, hair),
    // face
    r(3, 2, 10, 10, skin),
    // ears
    r(2, 4, 1, 3, skin), r(13, 4, 1, 3, skin),
    // eyebrows
    r(4, 3, 3, 1, hair), r(9, 3, 3, 1, hair),
    // eyes (white)
    r(4, 4, 3, 2, '#fff'), r(9, 4, 3, 2, '#fff'),
    // pupils
    r(5, 4, 2, 2, '#1a1208'), r(10, 4, 2, 2, '#1a1208'),
    // iris
    r(5, 5, 1, 1, eyeColor), r(10, 5, 1, 1, eyeColor),
    // highlight
    r(6, 4, 1, 1, '#fff'), r(11, 4, 1, 1, '#fff'),
    // nose
    r(7, 8, 2, 2, skinDark),
    // mouth
    exMouth,
    // neck
    r(6, 13, 4, 2, skin),
  ].join('\n');
}

function darken(hex, amount) {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.round(((c >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((c >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((c & 0xff) * (1 - amount)));
  return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,'0')}`;
}

// ── Protagonist Stage Sprites ───────────────────────────────────────────────

const HAIR_N = '#3a2510'; // protagonist dark brown hair
const SKIN_N = '#f2c892';

function protagonistHead(extras = '') {
  return head({ hair: HAIR_N, skin: SKIN_N }) + '\n' + extras;
}

// N5: Peasant traveler — gray tunic, brown pants, wooden staff
function makeN5() {
  const h = protagonistHead();
  const body = [
    // gray-green tunic
    r(3, 15, 10, 9, '#7a9060'),
    // collar shadow
    r(6, 15, 4, 3, '#5a7040'),
    // left arm
    r(1, 15, 2, 7, '#7a9060'), r(1, 22, 2, 3, SKIN_N),
    // right arm (grips staff)
    r(13, 15, 2, 7, '#7a9060'), r(13, 22, 2, 3, SKIN_N),
    // belt
    r(3, 23, 10, 2, '#7a4520'), r(7, 23, 2, 1, '#c8a030'),
    // brown pants
    r(4, 25, 4, 6, '#7a5a3a'), r(8, 25, 4, 6, '#7a5a3a'),
    // boots
    r(3, 30, 5, 2, '#3a2a18'), r(8, 30, 5, 2, '#3a2a18'),
    // wooden staff (right side, tall)
    r(15, 0, 2, 32, '#a07040'), r(15, 0, 1, 32, '#c8a050'),
    r(14, 0, 4, 1, '#8b6535'), // staff tip
  ];
  return svg(96, 128, h + '\n' + body.join('\n'));
}

// N4: Scout — leather vest, dagger, simple cape
function makeN4() {
  const h = protagonistHead();
  const body = [
    // leather vest over tunic
    r(3, 15, 10, 9, '#8b6545'),
    // tunic underlay
    r(4, 15, 8, 9, '#9a8060'),
    // vest shading
    r(3, 15, 2, 9, '#6a4525'), r(11, 15, 2, 9, '#6a4525'),
    // collar
    r(6, 15, 4, 2, '#7a5535'),
    // short cape behind
    r(2, 14, 12, 8, '#5a6a80'),
    // left arm
    r(1, 15, 2, 8, '#8b6545'), r(1, 22, 2, 3, SKIN_N),
    // right arm
    r(13, 15, 2, 8, '#8b6545'), r(13, 22, 2, 3, SKIN_N),
    // belt with dagger
    r(3, 23, 10, 2, '#4a3010'), r(7, 23, 2, 1, '#c8a030'),
    // dagger hilt at belt left
    r(3, 21, 2, 3, '#c8a030'), r(3, 24, 1, 3, '#8b6535'),
    // dark pants + boots
    r(4, 25, 4, 6, '#4a4560'), r(8, 25, 4, 6, '#4a4560'),
    r(3, 30, 5, 2, '#2a2a40'), r(8, 30, 5, 2, '#2a2a40'),
    // boot trim
    r(3, 29, 5, 1, '#6080a8'), r(8, 29, 5, 1, '#6080a8'),
  ];
  return svg(96, 128, h + '\n' + body.join('\n'));
}

// N3: Fighter — chainmail + sword + shield
function makeN3() {
  const h = protagonistHead();
  const body = [
    // chainmail body (silver-blue)
    r(3, 15, 10, 10, '#6878a0'),
    // chainmail texture dots
    r(4, 16, 1, 1, '#7888b0'), r(6, 16, 1, 1, '#7888b0'), r(8, 16, 1, 1, '#7888b0'), r(10, 16, 1, 1, '#7888b0'),
    r(5, 18, 1, 1, '#7888b0'), r(7, 18, 1, 1, '#7888b0'), r(9, 18, 1, 1, '#7888b0'),
    r(4, 20, 1, 1, '#7888b0'), r(6, 20, 1, 1, '#7888b0'), r(8, 20, 1, 1, '#7888b0'), r(10, 20, 1, 1, '#7888b0'),
    // shoulders
    r(2, 15, 2, 4, '#8898b8'), r(12, 15, 2, 4, '#8898b8'),
    // belt
    r(3, 24, 10, 2, '#4a3010'), r(7, 24, 2, 1, '#c8a030'),
    // left arm (shield side)
    r(0, 15, 3, 9, '#6878a0'), r(0, 22, 3, 3, SKIN_N),
    // shield (large, on left arm)
    r(-1, 14, 5, 10, '#4a6090'), r(0, 15, 3, 8, '#5a70a8'),
    r(0, 19, 3, 1, '#c8a030'), r(1, 16, 1, 6, '#c8a030'), // cross
    // right arm (sword side)
    r(13, 15, 3, 9, '#6878a0'), r(13, 22, 3, 3, SKIN_N),
    // sword hilt (raised right)
    r(14, 11, 2, 5, '#c8a030'), r(12, 13, 6, 2, '#c8a030'),
    // sword blade
    r(14, 6, 2, 5, '#d8d8e8'), r(14, 5, 2, 1, '#a0a8c0'),
    // pants (armored)
    r(4, 26, 4, 5, '#4a5070'), r(8, 26, 4, 5, '#4a5070'),
    // boots (greaves)
    r(3, 29, 5, 3, '#3a3858'), r(8, 29, 5, 3, '#3a3858'),
    r(3, 28, 5, 1, '#8898c8'), r(8, 28, 5, 1, '#8898c8'),
  ];
  return svg(96, 128, h + '\n' + body.join('\n'));
}

// N2: Knight — full plate armor, great sword
function makeN2() {
  const h = protagonistHead();
  const body = [
    // plate breastplate (dark blue-gray)
    r(2, 15, 12, 11, '#505878'),
    // breastplate highlight
    r(3, 15, 10, 1, '#6878a0'), r(2, 16, 1, 9, '#6878a0'), r(13, 16, 1, 9, '#6878a0'),
    // breastplate cross stripe
    r(7, 16, 2, 10, '#6878a0'),
    // pauldrons (shoulder plates)
    r(1, 14, 4, 5, '#7888a8'), r(11, 14, 4, 5, '#7888a8'),
    r(1, 14, 4, 1, '#9098c8'), r(11, 14, 4, 1, '#9098c8'),
    // gorget (neck guard)
    r(6, 13, 4, 3, '#6878a0'),
    // belt + skirt
    r(2, 25, 12, 2, '#c8a030'),
    r(2, 27, 12, 3, '#404860'),
    // leg plates
    r(3, 26, 4, 5, '#505878'), r(9, 26, 4, 5, '#505878'),
    r(3, 25, 4, 1, '#8090b8'), r(9, 25, 4, 1, '#8090b8'),
    // sabatons (boots)
    r(2, 30, 6, 2, '#404060'), r(8, 30, 6, 2, '#404060'),
    r(2, 29, 6, 1, '#6878a0'), r(8, 29, 6, 1, '#6878a0'),
    // left arm (gauntlet)
    r(0, 15, 2, 9, '#6878a0'), r(0, 22, 2, 4, '#505878'),
    // right arm (great sword)
    r(14, 15, 2, 9, '#6878a0'), r(14, 22, 2, 4, '#505878'),
    // great sword (large, beside character)
    r(16, 0, 3, 32, '#c8c8d8'), // blade
    r(16, 0, 1, 32, '#e8e8f0'), // highlight
    r(17, 31, 2, 1, '#a0a0b0'), // tip
    r(14, 7, 9, 2, '#c8a030'), // crossguard
    r(18, 8, 2, 4, '#8b6535'), // grip
    r(17, 12, 4, 2, '#c8a030'), // pommel
  ];
  return svg(96, 128, h + '\n' + body.join('\n'));
}

// N1: Legendary Master — golden armor, glowing katana, dragon elements
function makeN1() {
  const h = protagonistHead();
  const body = [
    // golden breastplate
    r(2, 15, 12, 11, '#c8a030'),
    r(3, 15, 10, 1, '#e8c050'),
    r(2, 16, 1, 9, '#e8c050'),
    r(13, 16, 1, 9, '#e8c050'),
    r(7, 16, 2, 10, '#e8c050'),
    // ruby gems
    r(6, 18, 4, 2, '#c83030'),
    // dragon scale shoulder plates
    r(0, 13, 4, 7, '#e8a020'),
    r(12, 13, 4, 7, '#e8a020'),
    r(0, 13, 4, 1, '#f0c040'), r(12, 13, 4, 1, '#f0c040'),
    r(0, 16, 4, 1, '#f0c040'), r(12, 16, 4, 1, '#f0c040'),
    // dragon wing-cape
    r(0, 14, 2, 14, '#8a1a1a'),
    r(14, 14, 2, 14, '#8a1a1a'),
    // aura glow (faint ring behind)
    r(4, 13, 8, 1, '#f0c04040'),
    // neck guard
    r(6, 12, 4, 4, '#c8a030'),
    // belt (golden)
    r(2, 25, 12, 3, '#c8a030'),
    r(7, 26, 2, 1, '#e83030'),
    // leg plates (gold)
    r(3, 27, 4, 4, '#c8a030'), r(9, 27, 4, 4, '#c8a030'),
    r(3, 26, 4, 1, '#e8c040'), r(9, 26, 4, 1, '#e8c040'),
    // golden boots
    r(2, 30, 6, 2, '#a87820'), r(8, 30, 6, 2, '#a87820'),
    r(2, 29, 6, 1, '#e8c040'), r(8, 29, 6, 1, '#e8c040'),
    // left gauntlet
    r(-1, 15, 3, 11, '#c8a030'), r(-1, 24, 3, 4, '#a87820'),
    // right gauntlet
    r(14, 15, 3, 11, '#c8a030'), r(14, 24, 3, 4, '#a87820'),
    // legendary katana (glowing, vertical right)
    r(17, 0, 2, 28, '#e0f0ff'), // blade glow
    r(17, 0, 1, 28, '#ffffff'), // core
    r(18, 27, 1, 1, '#c0d0e0'), // tip
    r(15, 8, 8, 2, '#c8a030'), // tsuba (guard)
    r(17, 10, 2, 5, '#8b2525'), // tsuka (handle, red wrapping)
    r(17, 10, 1, 1, '#c8a030'), r(17, 12, 1, 1, '#c8a030'), r(17, 14, 1, 1, '#c8a030'), // tsuka gold
    r(16, 15, 4, 2, '#c8a030'), // kashira (pommel)
    // energy aura sparkles
    r(15, 2, 1, 1, '#80c0ff'), r(19, 5, 1, 1, '#80c0ff'),
    r(14, 7, 1, 1, '#80c0ff'), r(21, 4, 1, 1, '#80c0ff'),
    // crown/diadem
    r(4, 0, 8, 2, '#c8a030'),
    r(6, -1, 4, 1, '#c8a030'),
    r(7, 0, 2, 2, '#e83030'), // ruby center
    r(5, 0, 2, 1, '#e8c040'), r(9, 0, 2, 1, '#e8c040'),
  ];
  return svg(96, 128, h + '\n' + body.join('\n'));
}

// ── NPC Sprites ─────────────────────────────────────────────────────────────

// Akari — fox spirit shrine maiden (white+orange, fox ears)
function makeAkari() {
  const SKIN = '#f5e0c8';
  const WHITE = '#f8f4e8';
  const ORANGE = '#e86020';
  const RED = '#c83030';
  const GOLD = '#d8a020';
  const elems = [
    // white long hair
    r(2, 1, 12, 13, WHITE),
    r(1, 5, 2, 20, WHITE), r(13, 5, 2, 20, WHITE),
    // fox ears (pointy, above head)
    r(3, 0, 3, 4, WHITE), r(10, 0, 3, 4, WHITE),
    r(4, 0, 1, 2, ORANGE), r(11, 0, 1, 2, ORANGE), // inner ear orange
    // face
    r(3, 4, 10, 9, SKIN),
    // ears (side)
    r(2, 6, 1, 3, SKIN), r(13, 6, 1, 3, SKIN),
    // eyebrows (thin, elegant)
    r(4, 5, 3, 1, '#8a6040'), r(9, 5, 3, 1, '#8a6040'),
    // eyes (warm brown)
    r(4, 6, 3, 2, '#fff'), r(9, 6, 3, 2, '#fff'),
    r(5, 6, 2, 2, '#3a2010'), r(10, 6, 2, 2, '#3a2010'),
    r(5, 7, 1, 1, '#c06030'), r(10, 7, 1, 1, '#c06030'), // warm iris
    r(6, 6, 1, 1, '#fff'), r(11, 6, 1, 1, '#fff'), // highlight
    // blush marks (fox feature)
    r(3, 9, 2, 1, '#f0a080'), r(11, 9, 2, 1, '#f0a080'),
    // nose (small)
    r(7, 9, 2, 1, '#d49070'),
    // smile
    r(5, 11, 6, 1, '#c07060'),
    r(5, 12, 1, 1, '#c07060'), r(10, 12, 1, 1, '#c07060'),
    // neck
    r(7, 13, 2, 2, SKIN),
    // white under-kimono
    r(6, 14, 4, 1, WHITE),
    // red outer kimono
    r(3, 15, 10, 11, RED),
    r(3, 15, 2, 11, '#a02020'), r(11, 15, 2, 11, '#a02020'), // shading
    // white collar (V-shape)
    r(5, 15, 3, 5, WHITE), r(8, 15, 3, 5, WHITE),
    r(6, 20, 4, 6, WHITE),
    // golden obi (sash)
    r(3, 22, 10, 2, GOLD),
    r(3, 22, 10, 1, '#f0c040'), // obi highlight
    // sleeves (wide, traditional)
    r(0, 15, 4, 9, RED), r(12, 15, 4, 9, RED),
    r(0, 23, 4, 3, WHITE), r(12, 23, 3, 3, WHITE), // sleeve opening white
    // hands (holding ofuda — paper charm)
    r(0, 24, 3, 2, SKIN), r(13, 24, 3, 2, SKIN),
    // ofuda (white paper talisman) in right hand
    r(14, 21, 3, 6, '#f8f4e0'), r(14, 21, 1, 6, '#e0d8b0'),
    r(15, 22, 1, 1, RED), r(15, 24, 1, 1, RED), // red kanji marks
    // hakama (white skirt)
    r(3, 26, 10, 6, WHITE), r(3, 26, 1, 6, '#d8d4c8'), r(12, 26, 1, 6, '#d8d4c8'),
    // split line center
    r(8, 26, 1, 6, '#d8d4c8'),
    // tabi socks + geta sandals
    r(4, 30, 4, 2, WHITE), r(8, 30, 4, 2, WHITE),
    r(4, 31, 4, 1, '#c8b080'), r(8, 31, 4, 1, '#c8b080'), // geta wood
    // fox tail hint (behind, lower)
    r(1, 21, 2, 8, WHITE), r(0, 24, 2, 5, '#f0e8d8'),
    r(14, 19, 2, 10, WHITE), r(13, 22, 2, 7, '#f0e8d8'),
    // spirit sparkles
    r(0, 3, 1, 1, '#f0c040'), r(15, 7, 1, 1, '#f0c040'),
    r(1, 12, 1, 1, '#f0c040'), r(15, 14, 1, 1, '#f0c040'),
  ];
  return svg(96, 128, elems.join('\n'));
}

// Yukika — crane nature spirit (white+blue, elegant, feathery)
function makeYukika() {
  const SKIN = '#f0ede8';
  const WHITE = '#f5f8f0';
  const BLUE = '#6090c8';
  const BLUE_L = '#a0c0e8';
  const RED_T = '#c83020'; // crane top-knot
  const TEAL = '#4080a0';
  const elems = [
    // white hair (sleek)
    r(4, 1, 8, 13, WHITE),
    r(3, 3, 2, 12, WHITE), r(11, 3, 2, 12, WHITE),
    // crane top-knot (red spot on forehead — crane feature)
    r(7, 1, 2, 2, RED_T),
    // hair flows behind
    r(3, 10, 2, 16, WHITE), r(11, 10, 2, 16, WHITE),
    // face (slightly paler, serene)
    r(4, 3, 8, 10, SKIN),
    // ears
    r(3, 5, 1, 4, SKIN), r(12, 5, 1, 4, SKIN),
    // eyebrows (arched, graceful)
    r(5, 4, 3, 1, '#8090a0'), r(8, 4, 3, 1, '#8090a0'),
    // eyes (pale blue-gray, calm)
    r(5, 5, 3, 2, '#fff'), r(9, 5, 3, 2, '#fff'),
    r(6, 5, 2, 2, '#4870b0'), r(10, 5, 2, 2, '#4870b0'),
    r(6, 6, 1, 1, '#70a0d8'), // iris lighter
    r(10, 6, 1, 1, '#70a0d8'),
    r(7, 5, 1, 1, '#fff'), r(11, 5, 1, 1, '#fff'), // highlight
    // nose (delicate)
    r(8, 8, 1, 2, '#d8cfc0'),
    // smile (serene)
    r(6, 11, 4, 1, '#b0a090'),
    // neck
    r(7, 13, 2, 2, SKIN),
    // inner robe (white)
    r(6, 14, 4, 2, WHITE),
    // outer robe (light teal/blue)
    r(2, 15, 12, 12, TEAL),
    r(2, 15, 1, 12, '#306080'), r(13, 15, 1, 12, '#306080'),
    // white collar
    r(5, 15, 3, 6, WHITE), r(8, 15, 3, 6, WHITE),
    r(7, 21, 2, 6, WHITE), // continues down center
    // feathery sleeve pattern (blue gradient)
    r(-1, 14, 4, 12, BLUE),
    r(-1, 14, 4, 1, BLUE_L),
    r(-1, 17, 4, 1, BLUE_L),
    r(-1, 20, 4, 1, BLUE_L),
    r(-1, 23, 4, 1, BLUE_L),
    r(13, 14, 4, 12, BLUE),
    r(13, 14, 4, 1, BLUE_L),
    r(13, 17, 4, 1, BLUE_L),
    r(13, 20, 4, 1, BLUE_L),
    r(13, 23, 4, 1, BLUE_L),
    // white feather tips at sleeve ends
    r(-1, 22, 4, 4, WHITE),
    r(13, 22, 4, 4, WHITE),
    // hands
    r(-1, 25, 4, 2, SKIN), r(13, 25, 4, 2, SKIN),
    // blue obi (sash) with white bow
    r(3, 23, 10, 2, BLUE),
    r(5, 23, 6, 1, BLUE_L), // highlight
    // white bow center back (just a hint)
    r(7, 23, 2, 2, WHITE),
    // skirt/hakama (flowing, blue-white gradient)
    r(3, 25, 10, 7, '#e8f0f8'),
    r(3, 25, 2, 7, WHITE), r(11, 25, 2, 7, WHITE),
    r(5, 25, 2, 7, BLUE_L), r(9, 25, 2, 7, BLUE_L),
    // tabi + sandals
    r(4, 31, 4, 1, WHITE), r(8, 31, 4, 1, WHITE),
    r(4, 31, 4, 1, '#b0a080'),
    r(8, 31, 4, 1, '#b0a080'),
    // crane wing accent (floating feathers around)
    r(-3, 15, 2, 6, WHITE), r(-3, 16, 2, 1, BLUE_L),
    r(17, 17, 2, 5, WHITE), r(17, 18, 2, 1, BLUE_L),
    r(-3, 22, 2, 4, WHITE),
    r(17, 23, 2, 3, WHITE),
    // spirit particle sparkles
    r(-2, 5, 1, 1, '#a0d0ff'), r(17, 8, 1, 1, '#a0d0ff'),
    r(0, 14, 1, 1, '#a0d0ff'), r(15, 20, 1, 1, '#a0d0ff'),
    r(-1, 28, 1, 1, '#a0d0ff'),
  ];
  return svg(96, 128, elems.join('\n'));
}

// ── Avatar Sprites (64×80 viewBox, 4px per pixel, 16×20 logical grid) ──────

const HAIR_COLORS = [
  { id: 'h1', fill: '#1a1410', shade: '#0a0a08', name: 'Black' },
  { id: 'h2', fill: '#6b4a2e', shade: '#4a3020', name: 'Brown' },
  { id: 'h3', fill: '#e8c378', shade: '#c8a348', name: 'Blonde' },
  { id: 'h4', fill: '#a14524', shade: '#7a2510', name: 'Red' },
  { id: 'h5', fill: '#4267a8', shade: '#2a4578', name: 'Blue' },
];

const SKIN_TONES = [
  { id: 's1', fill: '#f2d4b8', shade: '#d4a880', name: 'Fair' },
  { id: 's2', fill: '#c89878', shade: '#a87058', name: 'Olive' },
  { id: 's3', fill: '#8b5a3c', shade: '#6a3a20', name: 'Dark' },
];

function makeAvatar(hair, skin) {
  // 16×20 logical pixels → 64×80 SVG
  function ra(lx, ly, lw, lh, fill) {
    return `<rect x="${lx*4}" y="${ly*4}" width="${lw*4}" height="${lh*4}" fill="${fill}"/>`;
  }
  const H = hair.fill, HS = hair.shade;
  const S = skin.fill, SS = skin.shade;
  const TUNIC = '#7a8c60';
  const TUNIC_D = '#5a6c40';
  const PANTS = '#4a5878';
  const BOOT = '#2a2010';

  const elems = [
    // hair (top)
    ra(3, 0, 10, 2, H),
    ra(2, 1, 2, 5, H), ra(12, 1, 2, 5, H),
    ra(3, 1, 10, 4, H),
    ra(2, 4, 2, 1, HS),
    ra(12, 4, 2, 1, HS),
    // face
    ra(3, 2, 10, 8, S),
    // ears
    ra(2, 4, 1, 3, S), ra(13, 4, 1, 3, S),
    // eyebrows
    ra(4, 3, 3, 1, HS), ra(9, 3, 3, 1, HS),
    // eyes
    ra(4, 4, 3, 2, '#fff'), ra(9, 4, 3, 2, '#fff'),
    ra(5, 4, 2, 2, '#1a1208'), ra(10, 4, 2, 2, '#1a1208'),
    ra(5, 5, 1, 1, '#6080d0'), ra(10, 5, 1, 1, '#6080d0'),
    ra(6, 4, 1, 1, '#fff'), ra(11, 4, 1, 1, '#fff'),
    // nose
    ra(7, 7, 2, 1, SS),
    // mouth (neutral smile)
    ra(5, 9, 6, 1, '#c07060'),
    ra(5, 10, 1, 1, '#c07060'), ra(10, 10, 1, 1, '#c07060'),
    // neck
    ra(7, 10, 2, 2, S),
    // tunic
    ra(3, 12, 10, 8, TUNIC),
    ra(3, 12, 2, 8, TUNIC_D), ra(11, 12, 2, 8, TUNIC_D),
    ra(7, 12, 2, 4, '#9aac70'), // V collar highlight
    // belt
    ra(3, 19, 10, 1, '#7a4520'),
    ra(7, 19, 2, 1, '#c8a030'),
    // arms
    ra(1, 12, 2, 8, TUNIC), ra(13, 12, 2, 8, TUNIC),
    ra(1, 18, 2, 2, S), ra(13, 18, 2, 2, S),
    // pants
    ra(4, 20, 4, 5, PANTS), ra(8, 20, 4, 5, PANTS),
    ra(4, 24, 1, 1, '#3a4868'), ra(11, 24, 1, 1, '#3a4868'),
    // boots
    ra(3, 24, 5, 1, BOOT), ra(8, 24, 5, 1, BOOT),
    ra(3, 23, 5, 1, '#4a3828'), ra(8, 23, 5, 1, '#4a3828'),
  ];
  return `<svg viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n<title>Avatar ${hair.name} hair, ${skin.name} skin</title>\n${elems.join('\n')}\n</svg>`;
}

// ── OG Image (1200×630) ─────────────────────────────────────────────────────

function makeOgImage() {
  // Japan RPG themed banner: torii gate + pixel characters + NihongoHub text
  // viewBox: 0 0 1200 630
  const elems = [
    // Background gradient (dark indigo → deep blue sky)
    `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0e1526"/>
        <stop offset="60%" stop-color="#1a2a50"/>
        <stop offset="100%" stop-color="#0a0e1c"/>
      </linearGradient>
      <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e8a020" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#e8a020" stop-opacity="0"/>
      </linearGradient>
    </defs>`,
    `<rect width="1200" height="630" fill="url(#sky)"/>`,
    // Moon
    `<circle cx="600" cy="140" r="70" fill="#f0e0a0" opacity="0.15"/>`,
    `<circle cx="600" cy="140" r="55" fill="#f0e0a0" opacity="0.25"/>`,
    `<circle cx="600" cy="140" r="40" fill="#f0e8c0" opacity="0.5"/>`,
    // Torii gate (centered, iconic)
    // Top horizontal beam
    `<rect x="370" y="180" width="460" height="24" rx="4" fill="#c03020"/>`,
    `<rect x="356" y="196" width="488" height="20" rx="4" fill="#c83020"/>`,
    // Second horizontal beam
    `<rect x="395" y="248" width="410" height="18" rx="3" fill="#c03020"/>`,
    // Left pillar
    `<rect x="400" y="264" width="40" height="270" fill="#c03020"/>`,
    `<rect x="400" y="264" width="8" height="270" fill="#d84030"/>`,
    // Right pillar
    `<rect x="760" y="264" width="40" height="270" fill="#c03020"/>`,
    `<rect x="760" y="264" width="8" height="270" fill="#d84030"/>`,
    // Left leg support
    `<rect x="390" y="180" width="20" height="24" fill="#c03020"/>`,
    `<rect x="400" y="172" width="20" height="24" fill="#c03020"/>`,
    `<rect x="790" y="180" width="20" height="24" fill="#c03020"/>`,
    `<rect x="780" y="172" width="20" height="24" fill="#c03020"/>`,
    // Torii glow behind
    `<rect x="390" y="172" width="420" height="8" fill="url(#glow)"/>`,
    // Ground / floor
    `<rect x="0" y="520" width="1200" height="110" fill="#0a0c14"/>`,
    `<rect x="0" y="512" width="1200" height="16" fill="#161a2a"/>`,
    // Stone path tiles (pixel art style)
    `<rect x="480" y="520" width="240" height="8" fill="#1e2235"/>`,
    `<rect x="500" y="528" width="200" height="8" fill="#1a1e30"/>`,
    // Stars (scattered)
    ...Array.from({length: 40}, (_, i) => {
      const x = (i * 137 + 50) % 1100 + 50;
      const y = (i * 97 + 30) % 280 + 20;
      const s = (i % 3 === 0) ? 4 : 2;
      const op = 0.3 + (i % 5) * 0.1;
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#e8e8f0" opacity="${op.toFixed(1)}"/>`;
    }),
    // NihongoHub logo text (pixel art style, large)
    // Main title
    `<text x="600" y="440" font-family="'Press Start 2P',monospace" font-size="52"
     fill="#e8a020" text-anchor="middle" dominant-baseline="middle"
     style="paint-order:stroke;stroke:#0a0c14;stroke-width:4">NihongoHub</text>`,
    // Subtitle
    `<text x="600" y="490" font-family="'Press Start 2P',monospace" font-size="16"
     fill="#8090c0" text-anchor="middle" dominant-baseline="middle">
     MASTER JAPANESE · EXPLORE JAPAN</text>`,
    // Japanese subtitle
    `<text x="600" y="348" font-family="'Noto Sans JP',sans-serif" font-size="22"
     fill="#c8a060" text-anchor="middle" dominant-baseline="middle">
     ⛩ 日本語を学ぶ · 日本を探索する ⛩</text>`,
    // Pixel art character silhouettes (left and right of torii)
    // Left character (small adventurer)
    `<rect x="330" y="460" width="8" height="8" fill="#f2c892"/>`,
    `<rect x="326" y="468" width="16" height="12" fill="#7a9060"/>`,
    `<rect x="322" y="480" width="8" height="16" fill="#4a5878"/>`,
    `<rect x="334" y="480" width="8" height="16" fill="#4a5878"/>`,
    `<rect x="322" y="468" width="4" height="10" fill="#7a9060"/>`,
    `<rect x="338" y="468" width="4" height="10" fill="#7a9060"/>`,
    // staff
    `<rect x="344" y="444" width="4" height="52" fill="#a07040"/>`,
    // Right character (armored knight)
    `<rect x="862" y="460" width="8" height="8" fill="#f2c892"/>`,
    `<rect x="858" y="468" width="16" height="12" fill="#6878a0"/>`,
    `<rect x="854" y="480" width="8" height="16" fill="#4a5070"/>`,
    `<rect x="866" y="480" width="8" height="16" fill="#4a5070"/>`,
    `<rect x="854" y="468" width="4" height="10" fill="#6878a0"/>`,
    `<rect x="870" y="468" width="4" height="10" fill="#6878a0"/>`,
    // sword
    `<rect x="878" y="440" width="4" height="56" fill="#d0d8e8"/>`,
    `<rect x="874" y="452" width="12" height="4" fill="#c8a030"/>`,
    // Decorative pixel border
    `<rect x="0" y="0" width="1200" height="8" fill="#c8a030"/>`,
    `<rect x="0" y="622" width="1200" height="8" fill="#c8a030"/>`,
    `<rect x="0" y="0" width="8" height="630" fill="#c8a030"/>`,
    `<rect x="1192" y="0" width="8" height="630" fill="#c8a030"/>`,
    // Inner border
    `<rect x="8" y="8" width="1184" height="4" fill="#8b6030"/>`,
    `<rect x="8" y="618" width="1184" height="4" fill="#8b6030"/>`,
    `<rect x="8" y="8" width="4" height="614" fill="#8b6030"/>`,
    `<rect x="1188" y="8" width="4" height="614" fill="#8b6030"/>`,
  ];
  return `<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n${elems.join('\n')}\n</svg>`;
}

// ── Write all files ──────────────────────────────────────────────────────────

function write(path, content) {
  writeFileSync(path, content, 'utf8');
  console.log('  wrote', path.replace(ROOT + '/', ''));
}

console.log('Generating sprites…');

// Protagonist stages
write(join(ROOT, 'rpg-n5.svg'), makeN5());
write(join(ROOT, 'rpg-n4.svg'), makeN4());
write(join(ROOT, 'rpg-n3.svg'), makeN3());
write(join(ROOT, 'rpg-n2.svg'), makeN2());
write(join(ROOT, 'rpg-n1.svg'), makeN1());
console.log('✓ Protagonist sprites (5)');

// NPC characters
mkdirp(join(ROOT, 'assets/characters'));
write(join(ROOT, 'assets/characters/akari.svg'), makeAkari());
write(join(ROOT, 'assets/characters/yukika.svg'), makeYukika());
console.log('✓ NPC sprites (2)');

// Avatars
const AVATAR_DIR = join(ROOT, 'assets/avatars');
mkdirp(AVATAR_DIR);
for (const hair of HAIR_COLORS) {
  for (const skin of SKIN_TONES) {
    write(join(AVATAR_DIR, `avatar-${hair.id}-${skin.id}.svg`), makeAvatar(hair, skin));
  }
}
console.log('✓ Avatar sprites (15)');

// OG image
write(join(ROOT, 'og-default.svg'), makeOgImage());
console.log('✓ OG image SVG');
console.log('');
console.log('Done! Convert og-default.svg → og-default.png (1200×630) for social sharing.');
console.log('Recommended: npx sharp-cli og-default.svg -o og-default.png -f png');

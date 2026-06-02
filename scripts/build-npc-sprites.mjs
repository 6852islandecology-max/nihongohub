/**
 * Build hand-authored 16x16 pixel-art (ドット絵) sprites for the Explore
 * RPG guide NPCs: Akari (fox = culture) and Yukika (crane = nature).
 *
 * Same grid + palette is mirrored inline in prefectures.html (npcSVG()).
 * Run:  node scripts/build-npc-sprites.mjs
 * Out:  ../../成果物/Marketing/NihongoHub/MK-29-assets/rpg-dot/{akari,yukika}.svg
 *
 * No image-generation API needed — pure SVG <rect>, matches wildlife.html.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PAL = {
  ".": null,        // transparent
  o: "#16100a",     // ink outline
  // Akari (fox)
  f: "#d9622b", w: "#fdfaf3", g: "#e0a634", e: "#2a1c10",
  // Yukika (crane)
  c: "#fdfaf3", k: "#16100a", r: "#bf3325", G: "#3fae6b",
};

const AKARI = [
  "................",
  "...o........o...",
  "..ofo......ofo..",
  "..offo....offo..",
  "..offffffffo....",
  ".offffffffffo...",
  "offffffffffffo..",
  "offfffggffffffo.",
  "offweffffffewffo",
  "offffwwwwwwffffo",
  ".offwwwwwwwwffo.",
  "..offwwoowwffo..",
  "..offfwwwwfffo..",
  "...offffffffo...",
  "....oooooooo....",
  "................",
];

const YUKIKA = [
  "......rr........",
  ".....orro.......",
  ".....occo.......",
  "....occcco......",
  "...occcccco.....",
  "...occkkcco.....",
  "...occcccco.....",
  "....occcco......",
  ".....occo.......",
  ".....occo.......",
  "..occcccccco....",
  ".occcccccccco...",
  ".oGccccccccGo...",
  ".oGGccccccGGo...",
  "..oGGGGGGGGo....",
  "...oooooooo.....",
];

function toSVG(grid) {
  let r = "";
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const col = PAL[row[x]];
      if (col) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${col}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges" role="img">${r}</svg>`;
}

const outDir = "C:\\Users\\Yurik\\成果物\\Marketing\\NihongoHub\\MK-29-assets\\rpg-dot";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "akari.svg"), toSVG(AKARI));
writeFileSync(join(outDir, "yukika.svg"), toSVG(YUKIKA));
console.log("wrote akari.svg + yukika.svg to", outDir);

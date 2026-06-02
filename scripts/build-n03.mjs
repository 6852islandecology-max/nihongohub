/**
 * Build a per-prefecture municipality file for the Explore drill-down.
 *
 * Input : a GeoJSON of one prefecture's municipalities (N03-derived).
 *         Download N03 from MLIT (https://nlftp.mlit.go.jp/ksj/) — see data/n03/README.md.
 * Step  : simplify with mapshaper (must be installed: `npm i -g mapshaper`),
 *         then project lng/lat → a 0..100 viewBox and emit SVG path "d".
 * Output: data/n03/<slug>.json  (format documented in data/n03/README.md)
 *
 * Usage:
 *   node scripts/build-n03.mjs --in n03_tokyo.geojson --slug tokyo --nameField N03_004
 *
 * This is the production pipeline; it needs the input file + mapshaper present.
 * (tokyo-sample.json is a hand-made placeholder so the renderer can be demoed first.)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}
const IN = arg("in");
const SLUG = arg("slug");
const NAME_FIELD = arg("nameField", "N03_004");
if (!IN || !SLUG) {
  console.error("Usage: node scripts/build-n03.mjs --in <geojson> --slug <slug> [--nameField N03_004]");
  process.exit(2);
}

// 1) simplify with mapshaper → temp geojson
const tmp = `._n03_${SLUG}.geojson`;
try {
  execFileSync("mapshaper", [IN, "-simplify", "5%", "keep-shapes", "-o", "format=geojson", tmp], { stdio: "inherit" });
} catch (e) {
  console.error("mapshaper failed — is it installed? (npm i -g mapshaper). Error:", e.message);
  process.exit(1);
}

// 2) project lng/lat → 0..100 viewBox (simple equirectangular, fine at prefecture scale)
const gj = JSON.parse(readFileSync(tmp, "utf8"));
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
const eachCoord = (geom, fn) => {
  const walk = (c) => Array.isArray(c[0]) ? c.forEach(walk) : fn(c);
  walk(geom.coordinates);
};
gj.features.forEach(f => eachCoord(f.geometry, ([x, y]) => {
  if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
}));
const W = maxX - minX || 1, H = maxY - minY || 1, S = 100 / Math.max(W, H);
const px = (x) => +(((x - minX) * S)).toFixed(2);
const py = (y) => +(((maxY - y) * S)).toFixed(2); // flip Y for screen

function ringToPath(ring) {
  return ring.map(([x, y], i) => `${i ? "L" : "M"}${px(x)},${py(y)}`).join(" ") + " Z";
}
function geomToPath(geom) {
  const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
  return polys.map(poly => ringToPath(poly[0])).join(" "); // outer rings only
}

const areas = gj.features.map(f => ({
  name: String(f.properties[NAME_FIELD] || f.properties.name || "—"),
  romaji: "",
  blurb: "",
  d: geomToPath(f.geometry),
}));

writeFileSync(`data/n03/${SLUG}.json`, JSON.stringify({
  pref: SLUG, viewBox: "0 0 100 100", areas,
}, null, 1));
rmSync(tmp, { force: true });
console.log(`wrote data/n03/${SLUG}.json (${areas.length} municipalities). Add romaji/blurb manually or via a follow-up pass.`);

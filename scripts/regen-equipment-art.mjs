/**
 * regen-equipment-art.mjs — regenerate the 188 equipment item sprites
 * (47 prefectures × weapon/head/body/feet) to the 2026-06-10 pixel-art standard.
 *
 * Approach (quality gate): the LLM does NOT write SVG. It returns a 16x16 pixel map
 * (text grid + palette) as JSON; this script validates it and renders the SVG itself,
 * so outline color, cell size, viewBox and crispEdges are machine-guaranteed.
 * Originals backed up in design-proposals/backup-orig-equipment/.
 *
 * Standard: warm dark outline #2a1a0c closing the silhouette / 3-tone shading,
 * light from top-left / ONE centred motif with 1-2 cells of margin / 4-7 colors.
 *
 * Model: claude-sonnet-4-6 (Haiku v1 quality was the problem). Est. cost ≈ $2-3.
 *
 * Run: node scripts/regen-equipment-art.mjs            # full 188
 *      node scripts/regen-equipment-art.mjs --slot=weapon
 *      node scripts/regen-equipment-art.mjs --pref=miyagi
 *      node scripts/regen-equipment-art.mjs --limit=8   # smoke test
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

function loadEnv() {
  try {
    const text = readFileSync(fileURLToPath(new URL("../.env", import.meta.url)), "utf8");
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch (e) {}
}
loadEnv();
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error("ANTHROPIC_API_KEY missing"); process.exit(1); }

const args = process.argv.slice(2);
const ONLY_SLOT = (args.find(a => a.startsWith("--slot=")) || "").split("=")[1] || null;
const ONLY_PREF = (args.find(a => a.startsWith("--pref=")) || "").split("=")[1] || null;
const LIMIT = parseInt((args.find(a => a.startsWith("--limit=")) || "").split("=")[1] || "0", 10);
const ONLY_LIST = (args.find(a => a.startsWith("--list=")) || "").split("=")[1]; // "slot/slug,slot/slug"
const LIST_SET = ONLY_LIST ? new Set(ONLY_LIST.split(",")) : null;
const CONCURRENCY = 4;
const MODEL = "claude-sonnet-4-6";
const OUTLINE = "#2a1a0c";
const CELL = 4, GRID = 16;

const ROOT = new URL("../", import.meta.url);

function loadEquipment() {
  const src = readFileSync(fileURLToPath(new URL("../data/equipment-metadata.js", import.meta.url)), "utf8");
  const win = {};
  (function(window){ eval(src); })(win);
  return win.NH_EQUIPMENT;
}
const EQUIPMENT = loadEquipment();

const SLOT_RULES = {
  weapon: "A hand-held weapon/tool shown at a slight diagonal or upright so blade/head and handle/grip read clearly as two zones.",
  head:   "Headgear (helmet, hood, mask, hat) seen from the front, sitting on an invisible head: dome/brim shape with an opening or face-hole hinted by shading.",
  body:   "A garment (robe, coat, armor, apron) front view, hanging as if on an invisible torso: shoulders wider than waist, sleeves or collar visible.",
  feet:   "A PAIR of footwear (boots, sandals, geta) side-by-side, side or 3/4 view, soles at the bottom edge of the motif."
};

function buildPrompt(slot, slug, item) {
  return `You are a senior 16-bit JRPG pixel artist. Design ONE equipment-item sprite as a PIXEL MAP (not SVG).

ITEM
- Name: ${item.name.en} / ${item.name.ja}
- Theme: ${item.desc} (prefecture: ${slug}, Japan)
- Slot: ${slot} — ${SLOT_RULES[slot]}
- Rarity: ${item.rarity} (legendary/epic may add ONE small gold or gem accent; common stays humble)

CANVAS & STYLE RULES (mandatory)
1. Grid is exactly 16 columns x 16 rows. "." = transparent background.
2. "O" is the outline color (fixed ${OUTLINE}); the motif's silhouette MUST be closed by O cells so it pops on any background.
3. ONE centred motif only. Leave 1-2 empty (".") cells of margin on every side. No floor, no background scene, no text.
4. 3-tone shading: each main material gets base + shadow + highlight, light always from the TOP-LEFT.
5. Palette: 4 to 7 colors besides O. Pick letters A-N (single uppercase, never O), define each as a hex. Prefer warm, slightly desaturated JRPG tones that read on a dark brown UI.
6. The item must be recognizable at 48px: favour a bold silhouette over interior detail. Cultural motif (the Japanese theme) expressed through shape and 1-2 accent cells, not clutter.

OUTPUT — exactly this line protocol, nothing else (no JSON, no markdown, no commentary):
PALETTE
A #rrggbb
B #rrggbb
(one line per color you use)
GRID
................
(exactly 16 lines, each exactly 16 characters, using only . O and your palette letters.
 Output ALL 16 rows — never skip a row, even when it is fully transparent "................")
END`;
}

async function callModel(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return (j.content && j.content[0] && j.content[0].text || "").trim();
}

function validate(map) {
  if (!map || typeof map !== "object") return "not an object";
  const { palette, rows } = map;
  if (!palette || !rows) return "missing palette/rows";
  if (!Array.isArray(rows) || rows.length !== GRID) return `rows length ${rows && rows.length}`;
  for (let i = 0; i < GRID; i++) {
    if (typeof rows[i] !== "string" || rows[i].length !== GRID) return `row ${i} length ${rows[i] && rows[i].length}`;
  }
  for (const [k, v] of Object.entries(palette)) {
    if (!/^[A-N]$/.test(k)) return `bad palette key "${k}"`;
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) return `bad color "${v}"`;
  }
  let filled = 0, outline = 0;
  for (const row of rows) {
    for (const c of row) {
      if (c === ".") continue;
      filled++;
      if (c === "O") { outline++; continue; }
      if (!palette[c]) return `unknown char "${c}"`;
    }
  }
  if (filled < 40) return `too sparse (${filled} cells)`;
  if (filled > 230) return `too dense (${filled} cells)`;
  if (outline < 12) return `outline too thin (${outline} O cells)`;
  return null;
}

function renderSVG(map, title) {
  const pal = Object.assign({ O: OUTLINE }, map.palette);
  let body = "";
  for (let y = 0; y < GRID; y++) {
    let x = 0;
    while (x < GRID) {
      const c = map.rows[y][x];
      if (c === ".") { x++; continue; }
      let x2 = x;
      while (x2 + 1 < GRID && map.rows[y][x2 + 1] === c) x2++;
      body += `<rect x="${x*CELL}" y="${y*CELL}" width="${(x2-x+1)*CELL}" height="${CELL}" fill="${pal[c]}"/>\n`;
      x = x2 + 1;
    }
  }
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n<title>${title}</title>\n${body}</svg>\n`;
}

function parseProtocol(text) {
  const t = text.replace(/```[a-z]*\n?/g, "").trim();
  const pi = t.indexOf("PALETTE");
  const gi = t.indexOf("GRID");
  if (pi < 0 || gi < 0 || gi < pi) throw new Error("PALETTE/GRID markers missing");
  const palette = {};
  for (const line of t.slice(pi + 7, gi).split(/\r?\n/)) {
    const m = line.trim().match(/^([A-N])\s+(#[0-9a-fA-F]{6})$/);
    if (m) palette[m[1]] = m[2].toLowerCase();
  }
  const after = t.slice(gi + 4);
  const stop = after.indexOf("END");
  const body = (stop >= 0 ? after.slice(0, stop) : after);
  const rows = [];
  for (const raw of body.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    if (!/^[.OA-N]+$/.test(line)) continue; // skip stray prose lines
    // auto-repair: pad missing trailing dots / trim excess transparent edge
    if (line.length < GRID) line = line + ".".repeat(GRID - line.length);
    if (line.length > GRID) {
      const cut = line.slice(GRID);
      if (/^[.]+$/.test(cut)) line = line.slice(0, GRID);
    }
    rows.push(line);
    if (rows.length === GRID) break;
  }
  // auto-repair: models often omit trailing fully-transparent rows — pad up to 3 of them
  while (rows.length >= GRID - 3 && rows.length < GRID) rows.push(".".repeat(GRID));
  return { palette, rows };
}

async function generateOne(job) {
  const { slot, slug, item } = job;
  let feedback = "", lastErr = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const text = await callModel(buildPrompt(slot, slug, item) + feedback);
      const map = parseProtocol(text);
      const err = validate(map);
      if (err) {
        lastErr = err;
        feedback = `\n\nPREVIOUS ATTEMPT REJECTED: ${err}. Fix it and output the PALETTE/GRID/END protocol again.`;
        continue;
      }
      const svg = renderSVG(map, `${item.name.en} (${item.rarity})`);
      const out = fileURLToPath(new URL(`assets/equipment/${slot}/${slug}.svg`, ROOT));
      writeFileSync(out, svg, "utf8");
      return { ok: true, slot, slug, attempt };
    } catch (e) {
      lastErr = String(e.message).slice(0, 160);
      feedback = `\n\nPREVIOUS ATTEMPT FAILED: ${lastErr.slice(0,120)}. Output only the PALETTE/GRID/END protocol.`;
      if (attempt === 3) break;
      await new Promise(r => setTimeout(r, 1200 * attempt));
    }
  }
  return { ok: false, slot, slug, error: `3x: ${lastErr}` };
}

// build job list
const jobs = [];
for (const slug of Object.keys(EQUIPMENT)) {
  if (ONLY_PREF && slug !== ONLY_PREF) continue;
  for (const slot of ["weapon", "head", "body", "feet"]) {
    if (ONLY_SLOT && slot !== ONLY_SLOT) continue;
    if (LIST_SET && !LIST_SET.has(`${slot}/${slug}`)) continue;
    jobs.push({ slot, slug, item: EQUIPMENT[slug][slot] });
  }
}
const list = LIMIT ? jobs.slice(0, LIMIT) : jobs;
console.log(`Regenerating ${list.length} sprites with ${MODEL} (concurrency ${CONCURRENCY})...`);

for (const slot of ["weapon", "head", "body", "feet"]) {
  const d = fileURLToPath(new URL(`assets/equipment/${slot}/`, ROOT));
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

let done = 0, fail = 0;
const failures = [];
async function worker(queue) {
  while (queue.length) {
    const job = queue.shift();
    const r = await generateOne(job);
    done++;
    if (!r.ok) { fail++; failures.push(r); }
    console.log(`[${done}/${list.length}] ${r.ok ? "OK " : "FAIL"} ${job.slot}/${job.slug}${r.attempt > 1 ? ` (attempt ${r.attempt})` : ""}${r.error ? " :: " + r.error : ""}`);
  }
}
const queue = list.slice();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

console.log(`\nDONE: ${done - fail}/${list.length} ok, ${fail} failed`);
if (failures.length) {
  console.log("Failures (originals left in place):");
  for (const f of failures) console.log(`  - ${f.slot}/${f.slug}: ${f.error}`);
}

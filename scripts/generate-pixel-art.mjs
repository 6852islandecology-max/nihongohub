/**
 * Generate 16x16 pixel-art SVG sprites for 47 prefectures × 4 equipment slots
 * + 15 avatar base sprites (5 hair × 3 skin colors).
 *
 * Uses Anthropic Haiku 4.5 to generate SVG markup directly (no OpenAI/DALL-E needed).
 * Each sprite is 64x64 viewBox with 16x16 logical pixel grid (4px per pixel).
 *
 * Cost estimate: ~$1.50 total (203 sprites × ~500 input + 1000 output tokens × Haiku 4.5)
 *
 * Run: node scripts/generate-pixel-art.mjs           # full batch
 *      node scripts/generate-pixel-art.mjs --slot=weapon  # just weapons
 *      node scripts/generate-pixel-art.mjs --avatars-only
 *      node scripts/generate-pixel-art.mjs --dry-run
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// minimal .env loader
function loadEnv() {
  try {
    const p = fileURLToPath(new URL("../.env", import.meta.url));
    const text = readFileSync(p, "utf8");
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
const DRY_RUN = args.includes("--dry-run");
const AVATARS_ONLY = args.includes("--avatars-only");
const ONLY_SLOT = (args.find(a => a.startsWith("--slot=")) || "").split("=")[1] || null;
const CONCURRENCY = 3;

const ROOT = new URL("../", import.meta.url);
const ASSETS = new URL("assets/", ROOT);

// Load equipment metadata in Node (it uses window.NH_EQUIPMENT)
function loadEquipment() {
  const src = readFileSync(fileURLToPath(new URL("../data/equipment-metadata.js", import.meta.url)), "utf8");
  const win = {};
  // eslint-disable-next-line no-eval
  (function(window){ eval(src); })(win);
  return win.NH_EQUIPMENT;
}
const EQUIPMENT = loadEquipment();

// Hair & skin palettes for avatars
const HAIR_COLORS = [
  { id: "h1", name: "black",    hex: "#1a1410" },
  { id: "h2", name: "brown",    hex: "#6b4a2e" },
  { id: "h3", name: "blonde",   hex: "#e8c378" },
  { id: "h4", name: "red",      hex: "#a14524" },
  { id: "h5", name: "blue",     hex: "#4267a8" }
];
const SKIN_COLORS = [
  { id: "s1", name: "fair",     hex: "#f2d4b8" },
  { id: "s2", name: "olive",    hex: "#c89878" },
  { id: "s3", name: "dark",     hex: "#8b5a3c" }
];

// Rarity → frame color (used downstream in CSS, but referenced in prompt for consistency)
const RARITY_HEX = {
  common: "#9b9285", rare: "#4d8fbf", epic: "#a056d2", legendary: "#e0a634"
};

function ensureDir(url){
  const p = fileURLToPath(url);
  try { mkdirSync(p, { recursive: true }); } catch(e){}
}

function buildEquipmentPrompt(slug, slot, meta) {
  return `You are a 16-bit JRPG pixel-art designer. Generate ONE valid SVG sprite of an equipment item.

ITEM: ${meta.name.en} (${meta.name.ja})
SLOT: ${slot}
DESCRIPTION: ${meta.desc}
RARITY: ${meta.rarity} (frame color: ${RARITY_HEX[meta.rarity]})
PREFECTURE: ${slug}

STRICT REQUIREMENTS:
1. Output ONLY the SVG string starting with "<svg" and ending with "</svg>". NO markdown fences, NO explanation.
2. viewBox="0 0 64 64". Each "pixel" is a 4x4 <rect>. Total 16x16 logical pixel grid.
3. shape-rendering="crispEdges" on the root <svg>.
4. Transparent background (no full-canvas rect at z-0).
5. Strict palette: 4–6 colors max. Use the rarity frame color (${RARITY_HEX[meta.rarity]}) as the dominant accent or border.
6. Centered composition. Symbol must be recognizable at 32x32 thumbnail.
7. For ${slot}: ${
    slot === 'weapon' ? 'side-on item silhouette, blade/handle/grip clearly distinct' :
    slot === 'head'   ? 'front-facing helm/mask/crown/hood, symmetrical' :
    slot === 'body'   ? 'front-facing torso garment outline, symmetrical' :
    /* feet */          'pair of footwear, side-on or front-on, symmetrical'
  }
8. Use these tags only: <svg>, <g>, <rect>, <title>. No <text>, no <image>, no external refs.
9. Add <title>${meta.name.en}</title> right after the opening <svg> for accessibility.

Output ONLY the SVG markup, nothing else.`;
}

function buildAvatarPrompt(hair, skin) {
  return `You are a 16-bit JRPG pixel-art designer. Generate ONE valid SVG sprite of a player avatar (base, no equipment).

CHARACTER: full-body adventurer, front-facing, neutral pose
HAIR: ${hair.name} (${hair.hex})
SKIN: ${skin.name} (${skin.hex})

STRICT REQUIREMENTS:
1. Output ONLY the SVG string starting with "<svg" and ending with "</svg>". NO markdown fences.
2. viewBox="0 0 64 64". 4x4 px "pixels", 16x16 grid total.
3. shape-rendering="crispEdges" on root <svg>.
4. Transparent background.
5. Proportions: head ~5x5 px, torso ~5x6 px, legs ~5x5 px, arms 1-2 px wide on each side.
6. Clear face area (2 dark eye pixels, 1 mouth pixel).
7. Default plain outfit: simple tunic in muted color (#8a7355 or similar earth tone) so equipment overlays remain visible.
8. Use these tags only: <svg>, <g>, <rect>, <title>. No <text>, no <image>.
9. Add <title>Avatar ${hair.name} hair, ${skin.name} skin</title> after opening <svg>.

Output ONLY the SVG markup, nothing else.`;
}

async function callHaiku(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const e = new Error(`HTTP ${res.status}`);
    e.body = body.slice(0, 300);
    e.retriable = res.status >= 500 || res.status === 429;
    throw e;
  }
  const data = await res.json();
  const text = (data.content || []).map(b => b.type === "text" ? b.text : "").join("\n").trim();
  // strip markdown fence
  let svg = text.replace(/^```\w*\s*|\s*```$/g, "").trim();
  const start = svg.indexOf("<svg");
  const end = svg.lastIndexOf("</svg>");
  if (start === -1 || end === -1) throw new Error("no SVG markup");
  return svg.slice(start, end + 6);
}

async function withRetry(fn, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      if (!e.retriable && i === attempts - 1) throw e;
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  throw last;
}

// Build job list
const jobs = [];

if (!AVATARS_ONLY) {
  const slots = ONLY_SLOT ? [ONLY_SLOT] : ["weapon", "head", "body", "feet"];
  for (const [slug, items] of Object.entries(EQUIPMENT)) {
    for (const slot of slots) {
      if (!items[slot]) continue;
      const out = new URL(`assets/equipment/${slot}/${slug}.svg`, ROOT);
      if (existsSync(fileURLToPath(out))) continue; // skip if already generated
      jobs.push({
        type: "equipment",
        slug, slot,
        meta: items[slot],
        out,
        label: `${slot}/${slug}`
      });
    }
  }
}

if (!ONLY_SLOT || AVATARS_ONLY) {
  for (const h of HAIR_COLORS) {
    for (const s of SKIN_COLORS) {
      const out = new URL(`assets/avatars/avatar-${h.id}-${s.id}.svg`, ROOT);
      if (existsSync(fileURLToPath(out))) continue;
      jobs.push({
        type: "avatar",
        hair: h, skin: s,
        out,
        label: `avatar/${h.id}-${s.id}`
      });
    }
  }
}

console.log(`${jobs.length} sprites queued (skipping ${203 - jobs.length} already existing).`);
const costEst = (jobs.length * (500 + 1000) / 1000 / 1000) * 5; // very rough
console.log(`Estimated cost: ~$${costEst.toFixed(2)}`);

if (DRY_RUN) {
  console.log("--dry-run: not calling API");
  process.exit(0);
}

// Ensure output directories
ensureDir(new URL("assets/avatars/", ROOT));
for (const slot of ["weapon", "head", "body", "feet"]) {
  ensureDir(new URL(`assets/equipment/${slot}/`, ROOT));
}

let done = 0;
let errors = 0;

async function runJob(j) {
  const prompt = j.type === "equipment"
    ? buildEquipmentPrompt(j.slug, j.slot, j.meta)
    : buildAvatarPrompt(j.hair, j.skin);
  const svg = await withRetry(() => callHaiku(prompt));
  writeFileSync(fileURLToPath(j.out), svg);
  done++;
  console.log(`✅ [${done}/${jobs.length}] ${j.label}`);
}

async function worker(queue) {
  while (queue.length) {
    const j = queue.shift();
    if (!j) break;
    try { await runJob(j); }
    catch (e) { errors++; console.error(`❌ ${j.label}: ${e.message}`); }
  }
}

const queue = jobs.slice();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

// Manifest
const manifest = {
  generatedAt: new Date().toISOString(),
  totalSprites: 203,
  avatars: HAIR_COLORS.flatMap(h => SKIN_COLORS.map(s => `avatars/avatar-${h.id}-${s.id}.svg`)),
  equipment: Object.fromEntries(
    Object.keys(EQUIPMENT).map(slug => [slug, {
      weapon: `equipment/weapon/${slug}.svg`,
      head:   `equipment/head/${slug}.svg`,
      body:   `equipment/body/${slug}.svg`,
      feet:   `equipment/feet/${slug}.svg`
    }])
  ),
  palette: { hair: HAIR_COLORS, skin: SKIN_COLORS, rarity: RARITY_HEX }
};
writeFileSync(fileURLToPath(new URL("assets/manifest.json", ROOT)), JSON.stringify(manifest, null, 2));

console.log(`\n✓ Done. ${done} success / ${errors} errors. Manifest: assets/manifest.json`);

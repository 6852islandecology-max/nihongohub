/**
 * Enrich 44 auto-generated prefecture guides with additional sections.
 * For each non-full prefecture, generate JSON:
 *   { hidden_gems: string[3], culture_extras: string[2], seasonal_tip: string, etiquette: string, deeper_phrase: {jp,ro,en} }
 * Output: blog/guides-enriched.json
 *
 * Run: node scripts/enrich-guides.mjs
 * Cost: ~$0.50 (44 prefectures × Haiku 4.5 single-shot, ~500 input + ~400 output tokens each)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { GUIDES } from "../blog/guides-data.js";

// minimal .env loader (handles "KEY=value" and "KEY="value"" with CR/LF)
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
  } catch (e) { console.warn(".env not loaded:", e.message); }
}
loadEnv();

const OUT = new URL("../blog/guides-enriched.json", import.meta.url);
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error("ANTHROPIC_API_KEY missing in .env"); process.exit(1); }

const CONCURRENCY = 6;
const RETRIES = 3;

function buildPrompt(g) {
  return `You write travel-guide enrichments for Japanese learners visiting ${g.romaji} (${g.kanji}), Japan.

CONTEXT ABOUT THIS PREFECTURE (already in our article):
- Region: ${g.region}
- Lede: ${g.lede}
- Intro: ${g.intro}
- See list: ${(g.see||[]).join("; ")}
- Eat: ${g.eat || "n/a"}
- Getting there: ${g.getting || "n/a"}
- When to go: ${g.when || "n/a"}

Generate EXTRA original content (no overlap with above) as JSON:
{
  "hidden_gems": [<3 lesser-known but real spots/experiences in this prefecture, each 1 short sentence with the name in **bold**, ~25 words>],
  "culture_extras": [<2 short paragraphs (~40 words each) about authentic local culture, craft, or daily-life facts a traveler would actually notice>],
  "seasonal_tip": "<one practical sentence about a specific seasonal consideration (weather, timing, crowds) — concrete and dated where possible>",
  "etiquette": "<one practical etiquette note specific to this prefecture or its main attractions — concrete situation>",
  "deeper_phrase": { "jp":"<Japanese phrase, JLPT N5-N4 level>", "ro":"<romaji>", "en":"<English meaning>" }
}

STRICT RULES:
- Real places only, no fiction.
- No anime, manga, brand names, or copyrighted material.
- The phrase must be different from any phrase the user has already seen.
- ALL fields required. Reply with ONLY the JSON object, no markdown fences.`;
}

async function callOnce(g) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: buildPrompt(g) }],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data = await res.json();
  const text = (data.content||[]).map(b => b.type==="text" ? b.text : "").join("\n");
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  const first = cleaned.indexOf("{"), last = cleaned.lastIndexOf("}");
  if (first === -1 || last <= first) throw new Error("no JSON object");
  return JSON.parse(cleaned.slice(first, last+1));
}

async function withRetry(g) {
  let lastErr;
  for (let i = 0; i < RETRIES; i++) {
    try { return await callOnce(g); }
    catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 500 * Math.pow(2, i))); }
  }
  throw lastErr;
}

async function runConcurrent(items, fn, n) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= items.length) break;
      try {
        results[i] = await fn(items[i]);
        console.log(`✅ [${i+1}/${items.length}] ${items[i].slug}`);
      } catch (e) {
        console.error(`❌ [${i+1}/${items.length}] ${items[i].slug}: ${e.message}`);
        results[i] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

const targets = GUIDES.filter(g => !g.full);
console.log(`Enriching ${targets.length} prefectures with concurrency ${CONCURRENCY}…`);

const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

const remaining = targets.filter(g => !existing[g.slug]);
console.log(`${Object.keys(existing).length} already enriched, ${remaining.length} new to fetch`);

const results = await runConcurrent(remaining, withRetry, CONCURRENCY);

const merged = { ...existing };
remaining.forEach((g, i) => { if (results[i]) merged[g.slug] = results[i]; });

writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`\n✓ Wrote ${Object.keys(merged).length} enrichments to blog/guides-enriched.json`);

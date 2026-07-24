/**
 * Regenerate the prefecture-guide translations from the English source with a
 * stronger model (OpenRouter free, Qwen3 first). Root-cause fix for the systematic
 * food/produce/proper-noun mistranslations found by verify-translations-llm.mjs.
 *
 * STAGING ONLY — writes blog/translations/<lang>.regen.json (does NOT overwrite the
 * live <lang>.json). Review/diff, then adopt by replacing the live file (merging the
 * untouched fields: see[] place names + blurb, which are kept as-is).
 *
 * One batched call per (lang, chunk). Run:
 *   OPENROUTER_API_KEY=... [CHUNK=10] node scripts/regen-translations.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { GUIDES } from "../blog/guides-data.js";

const ROOT = new URL("../", import.meta.url);
function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    for (const ln of readFileSync(new URL(".env", ROOT), "utf8").split(/\r?\n/)) {
      const m = ln.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && m[1] === name) return m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return "";
}
const OR_KEY = readEnv("OPENROUTER_API_KEY");
const ANTHROPIC_KEY = readEnv("ANTHROPIC_API_KEY");
const PROVIDER = process.env.PROVIDER || "openrouter";
const ANTHROPIC_MODEL = readEnv("ANTHROPIC_MODEL") || "claude-sonnet-4-6";
if (PROVIDER === "anthropic" ? !ANTHROPIC_KEY : !OR_KEY) { console.error(`key for provider '${PROVIDER}' not set`); process.exit(1); }
function robustJson(text) {
  try { return JSON.parse(text); } catch {}
  try { return JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim()); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error("no JSON in response");
}
const OR_MODELS = (readEnv("OPENROUTER_MODEL") ||
  "qwen/qwen3-next-80b-a3b-instruct:free,openai/gpt-oss-120b:free,google/gemma-4-31b-it:free,meta-llama/llama-3.3-70b-instruct:free")
  .split(",").map((s) => s.trim()).filter(Boolean);
const LANG_NAME = { id: "Indonesian", es: "Spanish (neutral)", th: "Thai", zh: "Traditional Chinese" };
const LANGS = ["id", "es", "th", "zh"];
const CHUNK = Number(process.env.CHUNK || 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FIELDS = ["lede", "intro", "eat", "getting", "when", "tip"];

function srcFor(slugs) {
  const out = {};
  for (const g of slugs) {
    const o = {};
    for (const f of FIELDS) if (g[f]) o[f] = g[f];
    if (g.word?.en) o.word_meaning = g.word.en;
    out[g.slug] = o;
  }
  return out;
}

const PROMPT = (lang, src) => `Translate these Japan travel-guide fields from English into ${LANG_NAME[lang]}. Produce accurate, natural, native-quality translations.

ACCURACY RULES (these were mistranslated before — get them right):
- "cherries" = the FRUIT (さくらんぼ), NOT cherry blossoms.
- "leek" (ネギ) is NOT garlic and NOT onion.
- "mikan" = mandarin orange, NOT pomelo. "taimeshi" = sea-bream rice (tai = sea bream, not swordfish).
- "Inland Sea" = the Seto Inland Sea (a sea), NOT a lake.
- Keep place names / proper nouns in their standard target-language form (e.g. Tokyo, Kitakata, Kenroku-en); do NOT translate a place name into its literal meaning (Kitakata is a city name, not "north").
- Keep Japanese food/romaji terms recognizable (soba, udon, zunda, imoni, champon, Hida beef), adding a short gloss where the English does.
- Keep numbers, durations and transport modes (Shinkansen, train, bus) exact.
- Do NOT add information that is not in the English.

Return ONLY JSON: { "<slug>": { "lede":"", "intro":"", "eat":"", "getting":"", "when":"", "tip":"", "word_meaning":"" }, ... } with the SAME slugs and only the fields present in the input. No commentary.

ENGLISH SOURCE:
${JSON.stringify(src, null, 1)}`;

let lastModel = "";
async function callOR(prompt) {
  let lastErr;
  for (const model of OR_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${OR_KEY}`, "X-Title": "NihongoHub translation regen" },
        body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) { lastErr = new Error(`HTTP ${res.status} (${model}): ${(await res.text()).slice(0, 160)}`); continue; }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (!text) { lastErr = new Error(`empty (${model})`); continue; }
      let obj; try { obj = JSON.parse(text); } catch { obj = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim()); }
      lastModel = model; return obj;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("all models failed");
}

async function callAnthropic(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  lastModel = ANTHROPIC_MODEL;
  return robustJson((data.content || []).map((b) => b.text || "").join(""));
}
const generate = (prompt) => (PROVIDER === "anthropic" ? callAnthropic(prompt) : callOR(prompt));

mkdirSync(new URL("_qa/translation-regen-sonnet/", ROOT), { recursive: true });
for (const lang of LANGS) {
  const out = {};
  for (let i = 0; i < GUIDES.length; i += CHUNK) {
    const chunk = GUIDES.slice(i, i + CHUNK);
    process.stdout.write(`  ${lang} [${i + 1}-${i + chunk.length}/${GUIDES.length}]... `);
    try {
      const obj = await generate(PROMPT(lang, srcFor(chunk)));
      Object.assign(out, obj);
      console.log(`[${lastModel}] ${Object.keys(obj).length} prefs`);
    } catch (e) { console.log(`FAIL: ${e.message}`); }
    if (i + CHUNK < GUIDES.length) await sleep(1500);
  }
  writeFileSync(new URL(`_qa/translation-regen-sonnet/${lang}.json`, ROOT), JSON.stringify(out, null, 1));
  console.log(`${lang}: wrote ${Object.keys(out).length} prefs -> _qa/translation-regen-sonnet/${lang}.json`);
}
console.log("\nregen done (STAGING). Review/diff vs live <lang>.json before adopting.");

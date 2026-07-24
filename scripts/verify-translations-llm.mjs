/**
 * Translation ACCURACY check (semantic) for the prefecture guides — complements the
 * heuristic scripts/verify-translations.mjs (which only checks length/missing/nouns).
 *
 * Compares each English source field (blog/guides-data.js) to its translation
 * (blog/translations/<lang>.json) with a different LLM (OpenRouter free) and flags
 * ONLY accuracy problems: mistranslation, omission, addition, wrong number/name/term.
 * Place names left in English (see[]) and legitimate localization (Tokyo->東京) are
 * NOT problems. Style/naturalness is out of scope.
 *
 * Read-only: writes a review report, never edits translations.
 *   -> scripts/translation-qa-report.json (+ console summary)
 * One batched call per language (rate-limit friendly).
 * Run: OPENROUTER_API_KEY=... node scripts/verify-translations-llm.mjs [pref1 pref2 ...]
 */
import { readFileSync, writeFileSync } from "node:fs";
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
if (!OR_KEY) { console.error("OPENROUTER_API_KEY not set (env or .env)."); process.exit(1); }
const OR_MODELS = (readEnv("OPENROUTER_MODEL") ||
  "openai/gpt-oss-120b:free,qwen/qwen3-next-80b-a3b-instruct:free,google/gemma-4-31b-it:free,meta-llama/llama-3.3-70b-instruct:free")
  .split(",").map((s) => s.trim()).filter(Boolean);

const LANG_NAME = { id: "Indonesian", es: "Spanish", th: "Thai", zh: "Traditional Chinese" };
const LANGS = ["id", "es", "th", "zh"];
const ARGV = process.argv.slice(2);
const ALL_SLUGS = GUIDES.map((g) => g.slug); // every prefecture with an English source
const SAMPLE = ARGV.length ? ARGV : ALL_SLUGS;
const CHUNK = Number(process.env.CHUNK || 16);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FIELDS = ["lede", "intro", "eat", "getting", "when", "tip"];
const BY = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));

function pairsFor(tr, slugs) {
  const out = {};
  for (const slug of slugs) {
    const g = BY[slug]; const t = tr[slug];
    if (!g || !t) continue;
    const fields = {};
    for (const f of FIELDS) if (g[f] && t[f]) fields[f] = { en: g[f], tr: t[f] };
    if (g.word?.en && t.word_meaning) fields.word_meaning = { en: g.word.en, tr: t.word_meaning };
    out[slug] = fields;
  }
  return out;
}

const PROMPT = (lang, pairs) => `You are a meticulous bilingual translation QA reviewer (${LANG_NAME[lang]} <-> English) for a Japan travel guide.

For each prefecture and field, compare the English "en" source to the "${lang}" translation "tr". Flag ONLY genuine ACCURACY problems:
- mistranslation (translation means something different from the English)
- omission (information in the English is missing from the translation)
- addition (translation states information not in the English)
- a wrong number, place name, or Japanese term

Do NOT flag: style/fluency/naturalness; place names or proper nouns deliberately left in English/romaji; legitimate localization of a name into the target script (e.g. Tokyo -> 東京 in Chinese); minor rewording that keeps the meaning.

Return ONLY JSON: an object mapping prefecture slug -> { field -> { "severity": "high"|"low", "issue": "<short description in Japanese>" } }, including ONLY fields with a real problem. Omit clean prefectures. If nothing is wrong, return {}.

DATA:
${JSON.stringify(pairs, null, 1)}`;

async function callOR(prompt) {
  let lastErr;
  for (const model of OR_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${OR_KEY}`, "X-Title": "NihongoHub translation QA" },
        body: JSON.stringify({ model, temperature: 0.1, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) { lastErr = new Error(`HTTP ${res.status} (${model}): ${(await res.text()).slice(0, 160)}`); continue; }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (!text) { lastErr = new Error(`empty (${model})`); continue; }
      let obj; try { obj = JSON.parse(text); } catch { obj = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim()); }
      return { obj, model };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("all models failed");
}

const report = { scope: SAMPLE.length === ALL_SLUGS.length ? "all" : SAMPLE, langs: LANGS, chunk: CHUNK, results: {} };
let total = 0;
for (const lang of LANGS) {
  const tr = JSON.parse(readFileSync(new URL(`blog/translations/${lang}.json`, ROOT), "utf8"));
  const slugs = SAMPLE.filter((s) => BY[s] && tr[s]);
  const merged = {}; let model = "";
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const chunk = slugs.slice(i, i + CHUNK);
    process.stdout.write(`  ${lang} [${i + 1}-${i + chunk.length}/${slugs.length}]... `);
    try {
      const r = await callOR(PROMPT(lang, pairsFor(tr, chunk)));
      model = r.model; Object.assign(merged, r.obj);
      console.log(`[${r.model}] ${Object.values(r.obj).reduce((a, p) => a + Object.keys(p).length, 0)}`);
    } catch (e) { console.log(`FAIL: ${e.message}`); }
    if (i + CHUNK < slugs.length) await sleep(1500);
  }
  const n = Object.values(merged).reduce((a, p) => a + Object.keys(p).length, 0);
  total += n; report.results[lang] = { model, issues: merged };
  console.log(`${lang} total: ${n} field issue(s)`);
}
writeFileSync(new URL("scripts/translation-qa-report.json", ROOT), JSON.stringify(report, null, 2));
console.log(`\n${total} semantic issues flagged across ${LANGS.length} langs × up to ${SAMPLE.length} prefs -> scripts/translation-qa-report.json`);

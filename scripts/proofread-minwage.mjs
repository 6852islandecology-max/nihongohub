/**
 * Proofread the minimum-wage article translations with Google Gemini (free tier),
 * a different, multilingual-strong model — to fix any unnatural phrasing in the
 * machine translations (id/es/th, optionally en).
 *
 * It does NOT touch the live site. It reads the current strings from build-minwage.mjs,
 * asks Gemini for a more natural native version of each (preserving numbers, HTML,
 * Japanese terms, URLs and proper nouns exactly), and writes a suggestions file per
 * language for human review. Apply the good ones into build-minwage.mjs, then rebuild.
 *
 * Setup (free, ~2 min, owner): create a key at https://aistudio.google.com/apikey
 *   then add to .env:   GEMINI_API_KEY=...   (optionally GEMINI_MODEL=gemini-2.5-flash)
 *
 * Run: node scripts/proofread-minwage.mjs            # default langs: id es th
 *      node scripts/proofread-minwage.mjs id es th en
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { T } from "./build-minwage.mjs";

const ROOT = new URL("../", import.meta.url);

// --- key: env first, then .env file ---
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
// Provider: OpenRouter (free models) preferred if its key is present, else Gemini direct.
const OR_KEY = readEnv("OPENROUTER_API_KEY");
const GEMINI_KEY = readEnv("GEMINI_API_KEY");
const PROVIDER = OR_KEY ? "openrouter" : (GEMINI_KEY ? "gemini" : "");
const GEMINI_MODEL = readEnv("GEMINI_MODEL") || "gemini-2.5-flash";
const OR_MODELS = (readEnv("OPENROUTER_MODEL") ||
  "google/gemini-2.0-flash-exp:free,google/gemini-flash-1.5:free,meta-llama/llama-3.3-70b-instruct:free")
  .split(",").map((s) => s.trim()).filter(Boolean);
if (!PROVIDER) {
  console.error(`\nNo LLM key found. Provide ONE of:\n  · OPENROUTER_API_KEY  (free models — recommended; reuse your existing OpenRouter key)\n  · GEMINI_API_KEY      (free key at https://aistudio.google.com/apikey)\nSet it in the environment or in ${new URL(".env", ROOT).pathname.slice(1)}, then re-run.\n`);
  process.exit(1);
}

const LANG_NAME = { en: "English", id: "Indonesian", es: "Spanish (neutral, Latin-American-friendly)", th: "Thai" };
const targets = (process.argv.slice(2).length ? process.argv.slice(2) : ["id", "es", "th"]).filter((l) => l in T && l !== "en" || l === "en");

// fields that are proper nouns / structural — never send to the editor
const SKIP = new Set(["htmlLang", "g2sub", "g3sub"]);

// flatten a T[lang] object into {key: string} (arrays -> col0.., faqNq/faqNa)
function flatten(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP.has(k)) continue;
    if (Array.isArray(v)) {
      if (k === "faq") v.forEach(([q, a], i) => { out[`faq${i}_q`] = q; out[`faq${i}_a`] = a; });
      else v.forEach((s, i) => { out[`${k}${i}`] = String(s); });
    } else if (typeof v === "string") {
      out[k] = v;
    }
  }
  return out;
}

const PROMPT = (lang, cur, en) => `You are a professional native ${LANG_NAME[lang]} copy editor reviewing machine-translated strings for a web article about Japan's prefectural minimum wage.

Rewrite each value below so it reads naturally and idiomatically to a native ${LANG_NAME[lang]} speaker. Fix awkward phrasing, grammar, and unnatural word choices.

STRICT — preserve EXACTLY, unchanged:
- every ¥ amount, number, percentage and date (e.g. ¥1,226, +66, 6.3%, Oct 2025)
- every HTML tag and its attributes (e.g. <em>...</em>, <a href="..." ...>...</a>)
- every URL
- every Japanese term written in kanji/kana (e.g. 雇用契約書, 特定技能, 地域別最低賃金, 漢字（かんじ）)
- proper nouns: Tokyo, Kochi, Miyazaki, Okinawa, MHLW, Wise, NihongoHub, JLPT, tokutei ginō
Do NOT add, remove, or reorder information. Keep roughly the same length.

Return ONLY a JSON object with the SAME KEYS, each value the improved ${LANG_NAME[lang]} string. No comments, no markdown.

${LANG_NAME[lang]} strings to edit (JSON):
${JSON.stringify(cur, null, 1)}

English reference for meaning only (do not output, do not copy English wording):
${JSON.stringify(en, null, 1)}`;

function parseJson(text) {
  try { return JSON.parse(text); }
  catch { return JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim()); }
}
let lastModel = "";
async function callLLM(prompt) {
  if (PROVIDER === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
    const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } };
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    lastModel = GEMINI_MODEL;
    return parseJson(data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "");
  }
  // OpenRouter (OpenAI-compatible) — try free models in order until one answers.
  let lastErr;
  for (const model of OR_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${OR_KEY}`, "X-Title": "NihongoHub i18n proofread" },
        body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) { lastErr = new Error(`OpenRouter HTTP ${res.status} (${model}): ${(await res.text()).slice(0, 200)}`); continue; }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (!text) { lastErr = new Error(`empty content (${model})`); continue; }
      lastModel = model;
      return parseJson(text);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("all OpenRouter models failed");
}

const enFlat = flatten(T.en);
let changed = 0;
for (const lang of targets) {
  if (!(lang in T)) { console.warn(`skip ${lang}: no such language in T`); continue; }
  const cur = flatten(T[lang]);
  process.stdout.write(`proofreading ${lang} (${Object.keys(cur).length} fields) via ${PROVIDER}... `);
  let sug;
  try { sug = await callLLM(PROMPT(lang, cur, enFlat)); }
  catch (e) { console.error(`FAILED: ${e.message}`); continue; }
  const diff = {};
  for (const k of Object.keys(cur)) {
    if (sug[k] && sug[k] !== cur[k]) { diff[k] = { from: cur[k], to: sug[k] }; changed++; }
  }
  const outPath = new URL(`scripts/minwage-proofread-${lang}.json`, ROOT);
  writeFileSync(outPath, JSON.stringify({ lang, model: lastModel, suggestions: sug, changed: diff }, null, 2));
  console.log(`[${lastModel}] ${Object.keys(diff).length} fields changed -> scripts/minwage-proofread-${lang}.json`);
  for (const k of Object.keys(diff).slice(0, 6)) console.log(`   · ${k}`);
}
console.log(`\ndone. Review the minwage-proofread-*.json files; apply accepted edits into build-minwage.mjs T blocks, then \`node scripts/build-minwage.mjs\` and redeploy. (${changed} total field changes proposed)`);

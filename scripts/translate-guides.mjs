/**
 * Translate all 47 prefecture guides into zh / es / th / id using Haiku 4.5.
 * Output: blog/translations/<lang>.json  (keyed by slug)
 * Each entry contains: { lede, intro, see[], eat, getting, when, word:{jp,ro,trans}, tip, blurb? }
 * Re-runnable: skips slugs already present in the target JSON unless --force given.
 *
 * Run: node --env-file=.env scripts/translate-guides.mjs            # all langs
 *      node --env-file=.env scripts/translate-guides.mjs --lang=zh  # one lang
 *
 * Cost estimate: 47 prefectures × 4 langs = 188 calls × ~$0.012 ≈ $2.30
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GUIDES } from "../blog/guides-data.js";

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
  } catch(e){}
}
loadEnv();

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error("ANTHROPIC_API_KEY missing"); process.exit(1); }

const args = process.argv.slice(2);
const ONLY_LANG = (args.find(a => a.startsWith("--lang=")) || "").split("=")[1] || null;
const FORCE = args.includes("--force");

const LANG_INFO = {
  zh: { name: "Traditional Chinese", note: "Use Taiwan-style traditional Chinese (繁體中文)." },
  es: { name: "Spanish", note: "Use neutral Latin American Spanish, polite register (usted is fine but informal tú is also OK)." },
  th: { name: "Thai", note: "Use polite Thai. Krap/Ka particles are optional." },
  id: { name: "Indonesian", note: "Use standard Bahasa Indonesia, friendly." }
};

const OUT_DIR = new URL("../blog/translations/", import.meta.url);
try { mkdirSync(fileURLToPath(OUT_DIR), { recursive: true }); } catch(e){}

const TRANSLATABLE_FIELDS = ["lede", "intro", "eat", "getting", "when", "tip", "blurb"];

function buildPrompt(g, langCode) {
  const li = LANG_INFO[langCode];
  // We translate to a JSON object preserving keys.
  const payload = {
    lede: g.lede || "",
    intro: g.intro || "",
    see: g.see || [],
    eat: g.eat || "",
    getting: g.getting || "",
    when: g.when || "",
    word_meaning: g.word ? g.word.en : "",
    tip: g.tip || "",
    blurb: g.blurb || ""
  };
  return `Translate this travel guide content into ${li.name}.
${li.note}

PRESERVE:
- Place names (Tokyo, Kyoto, Osaka Castle, Fushimi Inari, etc.) — do NOT translate them; keep romaji.
- Japanese words shown in romaji (e.g., "Nebuta Matsuri", "wanko-soba") — keep as-is.
- Tone: warm, helpful, factual.

TRANSLATE the text content of each field into natural, fluent ${li.name}. The "see" field is an array — translate each item, preserving any place names in romaji and any **bold** markers. "word_meaning" is a short English gloss for a Japanese word — translate the gloss into ${li.name}.

INPUT (JSON):
${JSON.stringify(payload, null, 2)}

OUTPUT: Reply with ONLY a JSON object with the same keys (lede, intro, see, eat, getting, when, word_meaning, tip, blurb). No markdown fences. Empty fields stay empty strings.`;
}

async function callOnce(g, langCode) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: buildPrompt(g, langCode) }],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = (data.content || []).map(b => b.type === "text" ? b.text : "").join("\n");
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  const first = cleaned.indexOf("{"), last = cleaned.lastIndexOf("}");
  if (first === -1) throw new Error("no JSON object");
  return JSON.parse(cleaned.slice(first, last + 1));
}

async function withRetry(g, langCode) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try { return await callOnce(g, langCode); }
    catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 500 * Math.pow(2, i))); }
  }
  throw lastErr;
}

async function runConcurrent(jobs, fn, n) {
  const results = new Array(jobs.length);
  let idx = 0;
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= jobs.length) break;
      try {
        results[i] = await fn(jobs[i]);
        const j = jobs[i];
        console.log(`✅ [${i+1}/${jobs.length}] ${j.lang}/${j.slug}`);
      } catch (e) {
        console.error(`❌ [${jobs[i].lang}/${jobs[i].slug}]: ${e.message}`);
        results[i] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

const langs = ONLY_LANG ? [ONLY_LANG] : ["zh", "es", "th", "id"];

for (const langCode of langs) {
  if (!LANG_INFO[langCode]) { console.error(`unknown lang ${langCode}`); continue; }
  const outFile = new URL(`${langCode}.json`, OUT_DIR);
  const existing = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
  const todo = GUIDES.filter(g => FORCE || !existing[g.slug]);
  console.log(`\n[${langCode}] ${GUIDES.length} total, ${Object.keys(existing).length} already done, ${todo.length} to fetch`);
  if (!todo.length) continue;

  const jobs = todo.map(g => ({ ...g, lang: langCode }));
  const results = await runConcurrent(jobs, async (j) => {
    const r = await withRetry(j, langCode);
    return { slug: j.slug, data: r };
  }, 2);

  const merged = { ...existing };
  results.forEach(r => { if (r) merged[r.slug] = r.data; });
  writeFileSync(outFile, JSON.stringify(merged, null, 2));
  console.log(`✓ Wrote ${Object.keys(merged).length} entries to blog/translations/${langCode}.json`);
}

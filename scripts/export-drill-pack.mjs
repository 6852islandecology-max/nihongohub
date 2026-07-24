// scripts/export-drill-pack.mjs — one-off export of validated quiz items from the
// pregenerated_quiz bank into a flat JSON, for building the printable tutor drill packs.
// Usage: node scripts/export-drill-pack.mjs N5 en  > scripts/data/drill-N5-en.json
import fs from "fs";

for (const line of fs.readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { getSupabase } = await import("../lib/supabase.js");
const CUTOFF = "2026-06-07T22:00:00Z"; // same as the served-cache cutoff (validated, clean okurigana)

const level = (process.argv[2] || "N5").toUpperCase();
const lang = (process.argv[3] || "en").toLowerCase();

const client = getSupabase();
if (!client) { console.error("Supabase not configured"); process.exit(1); }

const { data, error } = await client
  .from("pregenerated_quiz")
  .select("question_ja, reading, correct, distractors, explanation, created_at")
  .eq("level", level)
  .eq("lang", lang)
  .gte("created_at", CUTOFF)
  .order("created_at", { ascending: true })
  .limit(1000);

if (error) { console.error("query error:", error.message); process.exit(1); }

// dedupe by question_ja (keep first), drop any malformed rows
const seen = new Set();
const items = [];
for (const r of data || []) {
  const q = (r.question_ja || "").trim();
  if (!q || seen.has(q)) continue;
  if (!r.correct || !Array.isArray(r.distractors) || r.distractors.length < 1) continue;
  seen.add(q);
  items.push({
    question: q,
    reading: (r.reading || "").trim(),
    correct: r.correct,
    distractors: r.distractors,
    explanation: (r.explanation || "").trim(),
  });
}

const outPath = new URL(`./data/drill-${level}-${lang}.json`, import.meta.url);
fs.writeFileSync(outPath, JSON.stringify({ level, lang, count: items.length, items }, null, 2), "utf8");
process.stderr.write(`exported ${items.length} unique ${level}/${lang} items (of ${(data||[]).length} rows) -> ${outPath.pathname}\n`);

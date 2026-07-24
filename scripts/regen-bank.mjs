// scripts/regen-bank.mjs — one-off local regeneration of the pregenerated_quiz bank
// with the current (improved) prompt. Appends fresh rows; the cache cutoff bump in
// lib/supabase.js then excludes the older rows. Run: node scripts/regen-bank.mjs
import fs from "fs";

// load .env
for (const line of fs.readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { VALID_LEVELS, VALID_LANGS, generateQuiz } = await import("../lib/anthropic.js");
const { insertPregenerated, isSupabaseConfigured } = await import("../lib/supabase.js");

if (!isSupabaseConfigured()) { console.error("Supabase not configured"); process.exit(1); }

const PER_COMBO = parseInt(process.argv[2] || "50", 10);
// Optional targeting: REGEN_LEVELS / REGEN_LANGS (comma-separated) limit the run to
// specific buckets (e.g. top up only the thin N2/N1 pools without touching N5/N4/N3).
const LEVELS = (process.env.REGEN_LEVELS ? process.env.REGEN_LEVELS.split(",") : VALID_LEVELS)
  .map((s) => s.trim()).filter((l) => VALID_LEVELS.includes(l));
const LANGS = (process.env.REGEN_LANGS ? process.env.REGEN_LANGS.split(",") : VALID_LANGS)
  .map((s) => s.trim()).filter((l) => VALID_LANGS.includes(l));
const DELAY_MS = 150;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const summary = { generated: 0, inserted: 0, failed: 0 };
// validate=true runs the LLM single-answer validator on every item so the
// served cache is free of ambiguous / no-single-answer questions.
const VALIDATE = process.argv[3] !== "novalidate";
console.log(`REGEN START ${new Date().toISOString()} · ${PER_COMBO}/combo · ${LEVELS.length}×${LANGS.length} combos (levels=${LEVELS.join(",")} langs=${LANGS.join(",")}) · validate=${VALIDATE}`);

for (const level of LEVELS) {
  for (const lang of LANGS) {
    const items = [];
    for (let i = 0; i < PER_COMBO; i++) {
      try {
        const quiz = await generateQuiz({ level, lang, validate: VALIDATE, maxRetries: 4 });
        items.push(quiz);
        summary.generated += 1;
        await sleep(DELAY_MS);
      } catch (err) {
        summary.failed += 1;
      }
    }
    let inserted = 0;
    if (items.length > 0) {
      try { inserted = await insertPregenerated({ level, lang, items }); summary.inserted += inserted; }
      catch (err) { console.log(`  INSERT FAIL ${level}/${lang}: ${err.message}`); }
    }
    console.log(`  ${level}/${lang}: generated ${items.length}, inserted ${inserted}  [running total inserted ${summary.inserted}, failed ${summary.failed}]`);
  }
}
console.log(`REGEN DONE ${new Date().toISOString()} · generated ${summary.generated}, inserted ${summary.inserted}, failed ${summary.failed}`);

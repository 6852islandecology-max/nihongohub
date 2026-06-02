// scripts/inspect-latest.mjs
// Read the latest pregenerated_quiz row (or rows) to verify new prompt format.
// Usage: node scripts/inspect-latest.mjs [limit]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const limit = parseInt(process.argv[2] || "1", 10);
const { data, error } = await sb
  .from("pregenerated_quiz")
  .select("level, lang, question_ja, reading, correct, distractors, explanation, created_at")
  .gte("created_at", "2026-05-03T12:20:00Z")
  .order("created_at", { ascending: false })
  .limit(limit);

if (error) { console.error(error); process.exit(1); }
console.log(`Found ${data.length} new-format rows.\n`);
for (const row of data) {
  console.log(`[${row.level}/${row.lang}] @ ${row.created_at}`);
  console.log(`Q: ${row.question_ja}`);
  console.log(`R: ${row.reading}`);
  console.log(`A: ${row.correct}  D: ${JSON.stringify(row.distractors)}`);
  console.log(`E: ${row.explanation}`);
  console.log("---");
}

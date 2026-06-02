// scripts/purge-quiz-cache.mjs
// One-shot: delete ALL rows from pregenerated_quiz, then print a count.
// Used after a prompt-format change (PR-17a/b/d/PR-23 on 2026-05-03) to invalidate stale cache.
// Usage: node scripts/purge-quiz-cache.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { count: before } = await sb
  .from("pregenerated_quiz")
  .select("*", { count: "exact", head: true });
console.log(`before: ${before ?? "?"} rows`);

const { error } = await sb
  .from("pregenerated_quiz")
  .delete()
  .gte("id", 0); // covers all rows since id is bigint identity starting at 1
if (error) {
  console.error("DELETE failed:", error.message);
  process.exit(2);
}

const { count: after } = await sb
  .from("pregenerated_quiz")
  .select("*", { count: "exact", head: true });
console.log(`after:  ${after ?? "?"} rows`);
console.log("done.");

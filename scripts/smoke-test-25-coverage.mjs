// scripts/smoke-test-25-coverage.mjs
// 25 パターン (5 lang × 5 level) のキャッシュ充足を Supabase 直接クエリで確認
// IP rate limit を消費せず実施可能、Phase B 残作業 smoke test 用
// Usage: node scripts/smoke-test-25-coverage.mjs

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

const LEVELS = ["N1", "N2", "N3", "N4", "N5"];
const LANGS = ["en", "zh", "es", "th", "id"];
const FILTER_AFTER = "2026-05-03T12:20:00Z"; // cache filter (5/3 PR-17 a-e prompt 適用後)

console.log("=== NihongoHub 25-Pattern Smoke Test (Supabase Direct) ===");
console.log(`Filter: created_at >= ${FILTER_AFTER}`);
console.log("");

let totalRows = 0;
let coveredCells = 0;
const results = {};

for (const level of LEVELS) {
  results[level] = {};
  for (const lang of LANGS) {
    const { count, error } = await sb
      .from("pregenerated_quiz")
      .select("*", { count: "exact", head: true })
      .eq("level", level)
      .eq("lang", lang)
      .gte("created_at", FILTER_AFTER);
    if (error) {
      results[level][lang] = `ERR: ${error.message}`;
      continue;
    }
    results[level][lang] = count;
    totalRows += count;
    if (count > 0) coveredCells += 1;
  }
}

// Print as table
const cellWidth = 6;
process.stdout.write("Level".padEnd(cellWidth));
for (const lang of LANGS) process.stdout.write(lang.padEnd(cellWidth));
process.stdout.write("\n");

for (const level of LEVELS) {
  process.stdout.write(level.padEnd(cellWidth));
  for (const lang of LANGS) {
    const v = results[level][lang];
    const s = typeof v === "number" ? String(v) : v;
    process.stdout.write(s.padEnd(cellWidth));
  }
  process.stdout.write("\n");
}

console.log("");
console.log(`Coverage: ${coveredCells}/25 cells with at least 1 row`);
console.log(`Total rows (filtered): ${totalRows}`);

// Cum_ins target: 1500 (cum 1022 + 478 resume)
const TARGET = 1500;
console.log(`Target cum_ins (post-resume): ${TARGET}`);
console.log(`Current vs target: ${totalRows}/${TARGET} = ${(totalRows / TARGET * 100).toFixed(1)}%`);

if (coveredCells === 25) {
  console.log("✅ All 25 patterns covered (smoke test PASSED)");
} else {
  console.log(`⚠️ Missing patterns: ${25 - coveredCells} cells empty (resume prefill needed)`);
}

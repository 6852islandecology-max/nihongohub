/**
 * One-off remediation (2026-06-09): remove broken "usage"-style bank rows whose answer is a
 * bare positional number (correct "1", distractors ["2","3","4"]) and regenerate clean
 * replacements for the served cells so per-cell counts stay healthy.
 *
 * Safe by default: prints the plan and exits. Pass --apply to mutate production.
 *   node scripts/fix-numeric-bank.mjs            # dry run (counts only)
 *   node scripts/fix-numeric-bank.mjs --apply    # delete + regenerate
 *
 * Filter: correct matches /^\d+$/. These items cannot render as a valid 4-choice question.
 */
import fs from "fs";
const APPLY = process.argv.includes("--apply");
const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const l of env.split("\n")) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }

const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const CUT = "2026-06-07T22:00:00Z"; // mirrors CACHE_MIN_CREATED_AT in lib/supabase.js
const isNum = (x) => /^\d+$/.test(String(x.correct || "").trim());

// 1) enumerate
let all = [], from = 0;
while (true) {
  const r = await fetch(`${url}/rest/v1/pregenerated_quiz?select=id,level,lang,correct,created_at&order=id&offset=${from}&limit=1000`, { headers: H });
  const rows = await r.json(); if (!Array.isArray(rows) || !rows.length) break;
  all = all.concat(rows); if (rows.length < 1000) break; from += 1000;
}
const numeric = all.filter(isNum);
const servedNumeric = numeric.filter((x) => x.created_at >= CUT);
const perCell = {};
servedNumeric.forEach((x) => { const k = `${x.level}|${x.lang}`; perCell[k] = (perCell[k] || 0) + 1; });
console.log(`bank total=${all.length} numeric=${numeric.length} servedNumeric=${servedNumeric.length}`);
console.log("regen plan (served cells):", JSON.stringify(perCell));
if (!APPLY) { console.log("\nDRY RUN — pass --apply to delete + regenerate."); process.exit(0); }

// 2) delete all numeric rows by id (batches of 100)
const ids = numeric.map((x) => x.id);
let deleted = 0;
for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  const r = await fetch(`${url}/rest/v1/pregenerated_quiz?id=in.(${batch.join(",")})`, { method: "DELETE", headers: { ...H, Prefer: "count=exact" } });
  if (!r.ok) { console.error("delete batch failed", r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  deleted += batch.length;
}
console.log(`deleted ${deleted} numeric rows`);

// 3) regenerate clean replacements for served cells (usage already removed from N1/N2 prompt)
const { generateQuiz } = await import("../lib/anthropic.js");
const { insertPregenerated } = await import("../lib/supabase.js");
let inserted = 0, failed = 0;
for (const [k, want] of Object.entries(perCell)) {
  const [level, lang] = k.split("|");
  const items = [];
  let attempts = 0;
  while (items.length < want && attempts < want * 3) {
    attempts++;
    try {
      const q = await generateQuiz({ level, lang, topic: "any", validate: false });
      if (/^\d+$/.test(String(q.correct).trim())) continue; // defense
      items.push(q);
    } catch (e) { /* retry */ }
  }
  if (items.length) { try { inserted += await insertPregenerated({ level, lang, items }); } catch (e) { console.error("insert", k, e.message); } }
  if (items.length < want) failed += want - items.length;
  console.log(`  ${k}: regenerated ${items.length}/${want}`);
}
console.log(`\nDONE. deleted=${deleted} inserted=${inserted} shortfall=${failed}`);

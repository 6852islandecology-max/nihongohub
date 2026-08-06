// mark-spot-lists-2026-08-06.mjs — one-off migration.
//
// blog/blog-quiz.js used to inject "📍 Map" / "💬 Phrases" buttons into *every*
// <li> with a <b> lead-in, on every blog page, and appended the slugified filename
// as the locality. On the Amazon buying guides that turned editorial verdict bullets
// into map searches for things like "Never built anything before: Gunpla-starter-kits-guide Japan".
//
// blog-quiz.js is now opt-in: it only touches <ul class="spot-list">, and takes the
// locality from that <ul>'s data-area. This script adds those attributes to the lists
// that genuinely name places, so the prefecture and travel guides keep their map pins.
//
// Marked (rule): every <b>-lead <ul> on a 47-prefecture page, in all 5 languages.
//   data-area = the prefecture, e.g. blog/es/aichi.html -> data-area="Aichi".
// Marked (explicit): the two topical travel lists whose items are all place names.
// Everything else — buying-guide verdicts, etiquette lists, itinerary steps, feature
// bullets — is deliberately left unmarked and now renders as plain text.
//
//   node scripts/mark-spot-lists-2026-08-06.mjs [--dry]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = path.join(ROOT, "blog");
const LANG_DIRS = ["", "es", "id", "th", "zh"];
const DRY = process.argv.includes("--dry");

const PREFECTURE_SLUGS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content-pipeline", "prefecture-list.json"), "utf8"),
).prefectures.map((p) => p.slug);

// Slug -> the English prefecture name used in the map query, matching what the old
// filename-derived value produced for these pages.
const areaFor = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1);

// Non-prefecture pages (English only) whose lists are pure place names. Anchored on a
// distinctive <b> lead-in rather than an index, so re-running stays correct if the
// article gains or loses other lists.
const EXTRA = [
  { file: "daruma-markets-japan.html", anchor: "<b>Shōrinzan</b>", area: "" },
  { file: "slam-dunk-kamakura-crossing.html", anchor: "<b>Enoshima</b>", area: "Kamakura" },
];

// Attribute-less <ul> only. Every place list in the blog is written that way, and it
// makes the script idempotent: once marked, a list carries attributes and stops matching.
const UL_RE = /<ul>([\s\S]*?)<\/ul>/g;
const hasBoldLeadIn = (inner) => /<li[^>]*>\s*<b>/.test(inner);

// Only rewrite <ul>s inside <article>, matching the blog-quiz.js selector.
function articleRange(html) {
  const start = html.indexOf("<article");
  const end = html.indexOf("</article>");
  return start >= 0 && end > start ? [start, end] : null;
}

function mark(html, area, shouldMark) {
  const range = articleRange(html);
  if (!range) return { html, count: 0 };
  const [start, end] = range;
  let count = 0;
  const body = html.slice(start, end).replace(UL_RE, (full, inner) => {
    if (!hasBoldLeadIn(inner) || !shouldMark(full, inner)) return full;
    count++;
    const attrs = area ? ` class="spot-list" data-area="${area}"` : ' class="spot-list"';
    return `<ul${attrs}>${inner}</ul>`;
  });
  return { html: html.slice(0, start) + body + html.slice(end), count };
}

let files = 0;
let lists = 0;

for (const lang of LANG_DIRS) {
  const dir = lang ? path.join(BLOG, lang) : BLOG;
  for (const slug of PREFECTURE_SLUGS) {
    const file = path.join(dir, `${slug}.html`);
    if (!fs.existsSync(file)) continue;
    const before = fs.readFileSync(file, "utf8");
    const { html, count } = mark(before, areaFor(slug), () => true);
    if (!count) continue;
    if (!DRY) fs.writeFileSync(file, html);
    files++;
    lists += count;
    console.log(`  ${path.relative(ROOT, file)} — ${count} list(s), data-area="${areaFor(slug)}"`);
  }
}

for (const { file, anchor, area } of EXTRA) {
  const full = path.join(BLOG, file);
  if (!fs.existsSync(full)) {
    console.warn(`  ! ${file} not found — skipped`);
    continue;
  }
  const before = fs.readFileSync(full, "utf8");
  const { html, count } = mark(before, area, (_, inner) => inner.includes(anchor));
  if (count !== 1) {
    console.warn(`  ! ${file} — matched ${count} list(s) on ${anchor}, expected 1; skipped`);
    continue;
  }
  if (!DRY) fs.writeFileSync(full, html);
  files++;
  lists += count;
  console.log(`  ${path.relative(ROOT, full)} — 1 list, data-area="${area || "(none)"}"`);
}

console.log(`\n${DRY ? "[dry] " : ""}marked ${lists} spot list(s) across ${files} file(s)`);

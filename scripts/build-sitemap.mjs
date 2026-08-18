/**
 * Generate sitemap.xml + robots.txt for crawl optimization.
 * Includes main pages + all 47 prefecture guides + every standalone blog/*.html
 * (themed guides etc., auto-discovered), and any /blog/<lang>/ variants that
 * exist. Excludes noindex pages (municipality-demo).
 * Run: node scripts/build-sitemap.mjs
 *
 * BASE: swap to https://nihongo-hub.com once DNS points at Vercel (currently 403).
 */
import { writeFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
const isNoindex = (rel) => { try { return /name="robots" content="noindex"/.test(readFileSync(new URL(rel, ROOT), "utf8")); } catch { return true; } };
import { GUIDES } from "../blog/guides-data.js";

const BASE = "https://www.nihongo-hub.com"; // primary domain (apex 308→www). Was nihongohub-nu.vercel.app.
const ROOT = new URL("../", import.meta.url);
const LANGS = ["zh", "id", "th", "es"]; // extra language dirs under /blog/<lang>/ (all four exist and are deployed)

const main = [
  "index.html", "kana.html", "prefectures.html", "rank.html", "wildlife.html", "blog/index.html",
  // Learn it — JLPT/JFT exam-prep beachhead
  "exam-prep.html",
  // Live it / Travel it — previously orphaned territory pages (now crawlable as the "whole map")
  "where-next.html", "transfer-cost.html", "relocation-timeline.html", "tokutei-ginou-id.html",
  // About / authority surface
  "about.html", "faq.html", "contact.html", "affiliate.html",
  // App surfaces that were reachable but unlisted (2026-08-17 audit)
  "quiz.html", "rpg.html", "shadow-match.html",
];

const urls = [];
const add = (path, priority) => urls.push({ loc: `${BASE}/${path}`, priority });

// root "/" is the same document as index.html — listed once via main[] (2026-08-17)
main.forEach((p) => add(p, p === "index.html" ? "1.0" : "0.8"));
// standalone (non-prefecture) blog pages — auto-discovered from blog/*.html so
// new themed guides are never silently dropped (replaces a hardcoded 5-slug list
// that left 22 live pages, incl. top-ranking ones, out of the sitemap).
const prefectureSlugs = new Set(GUIDES.map((g) => g.slug));
const standaloneBlog = readdirSync(new URL("blog/", ROOT))
  .filter((f) => f.endsWith(".html") && f !== "index.html")
  .map((f) => f.slice(0, -5))
  .filter((slug) => !prefectureSlugs.has(slug))
  .sort();
standaloneBlog.forEach((slug) => {
  if (isNoindex(`blog/${slug}.html`)) return; // v2 pages not yet released, demos
  add(`blog/${slug}.html`, "0.8");
  // localized variants of a standalone page, when they exist (e.g., the SSW-facing wage page)
  for (const lang of ["id", "es", "th", "zh"]) {
    if (existsSync(new URL(`blog/${lang}/${slug}.html`, ROOT)) && !isNoindex(`blog/${lang}/${slug}.html`)) add(`blog/${lang}/${slug}.html`, "0.7");
  }
});
// spot pages (v2), English + language dirs, released ones only
for (const dir of ["blog/spots", ...["zh", "id", "th", "es"].map((l) => `blog/${l}/spots`)]) {
  if (!existsSync(new URL(dir + "/", ROOT))) continue;
  readdirSync(new URL(dir + "/", ROOT)).filter((f) => f.endsWith(".html")).sort().forEach((f) => { if (!isNoindex(`${dir}/${f}`)) add(`${dir}/${f}`, dir === "blog/spots" ? "0.7" : "0.6"); });
}
// English prefecture guides
GUIDES.forEach((g) => add(`blog/${g.slug}.html`, "0.7"));
// language variants (only if generated)
for (const lang of LANGS) {
  if (existsSync(new URL(`blog/${lang}/index.html`, ROOT))) add(`blog/${lang}/index.html`, "0.6");
  GUIDES.forEach((g) => {
    if (existsSync(new URL(`blog/${lang}/${g.slug}.html`, ROOT))) add(`blog/${lang}/${g.slug}.html`, "0.6");
  });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
writeFileSync(new URL("sitemap.xml", ROOT), xml);

const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /municipality-demo.html

Sitemap: ${BASE}/sitemap.xml
`;
writeFileSync(new URL("robots.txt", ROOT), robots);

console.log(`sitemap.xml written with ${urls.length} URLs + robots.txt`);

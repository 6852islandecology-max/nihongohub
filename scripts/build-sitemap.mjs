/**
 * Generate sitemap.xml + robots.txt for crawl optimization.
 * Includes main pages + all 47 prefecture guides, and any /blog/<lang>/ variants
 * that exist (zh, id). Excludes noindex pages (municipality-demo).
 * Run: node scripts/build-sitemap.mjs
 *
 * BASE: swap to https://nihongo-hub.com once DNS points at Vercel (currently 403).
 */
import { writeFileSync, existsSync } from "node:fs";
import { GUIDES } from "../blog/guides-data.js";

const BASE = "https://www.nihongo-hub.com"; // primary domain (apex 308→www). Was nihongohub-nu.vercel.app.
const ROOT = new URL("../", import.meta.url);
const LANGS = ["zh", "id"]; // extra language dirs under /blog/<lang>/

const main = ["index.html", "prefectures.html", "rank.html", "wildlife.html", "blog/index.html"];

const urls = [];
const add = (path, priority) => urls.push({ loc: `${BASE}/${path}`, priority });

add("", "1.0"); // root
main.forEach((p) => add(p, p === "index.html" ? "1.0" : "0.8"));
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

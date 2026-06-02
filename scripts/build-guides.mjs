/**
 * Generate /blog static prefecture guides from blog/guides-data.js.
 * - Emits blog/<slug>.html for every entry WITHOUT `full:true`
 *   (full:true = a richer bespoke page already exists; left untouched).
 * - Regenerates blog/index.html listing all 47, grouped by region.
 * Run: node scripts/build-guides.mjs
 */
import { writeFileSync } from "node:fs";
import { GUIDES, REGION_LABELS } from "../blog/guides-data.js";
import { EXTRA } from "../blog/guides-extra.js";
import { LANGS, translatedSlugs } from "../blog/i18n.js";

// locales (other than en) that have translated this slug
const langsFor = (slug) => LANGS.filter((l) => translatedSlugs(l.code).includes(slug));
function hreflangFor(slug) {
  const ls = langsFor(slug);
  if (!ls.length) return "";
  return `\n<link rel="alternate" hreflang="en" href="${slug}.html">\n` +
    ls.map((l) => `<link rel="alternate" hreflang="${l.htmlLang}" href="${l.code}/${slug}.html">`).join("\n");
}
function switcherFor(slug) {
  const ls = langsFor(slug);
  if (!ls.length) return "";
  return `\n  <span class="langsw"><a aria-current="page">EN</a> · ${ls.map((l) => `<a href="${l.code}/${slug}.html">${l.label}</a>`).join(" · ")}</span>`;
}

const BLOG_DIR = new URL("../blog/", import.meta.url);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const BY_SLUG = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));

const HEAD = (title, desc, extraHead = "") => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">${extraHead}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Press+Start+2P&family=DM+Sans:wght@300;400;500;600&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="blog.css">
<style>.langsw{font-family:var(--dot);font-size:13px}.langsw a{color:#fff;text-decoration:none;opacity:.8;cursor:pointer}.langsw a[aria-current]{color:var(--gold);opacity:1;font-weight:700}</style>
</head>`;

const navFor = (slug) => `<nav class="bnav">
  <a class="logo" href="../index.html">Nihongo<span>Hub</span></a>
  <a href="index.html">← All prefecture guides</a>${switcherFor(slug)}
  <a class="cta" href="../index.html#practice">FREE QUIZ</a>
</nav>`;

function articleHTML(g) {
  const title = `${g.romaji} Travel Guide for Japanese Learners (2026) — NihongoHub`;
  const desc = `${g.romaji} (${g.kanji}) for first-timers: what to see, what to eat, and a useful Japanese phrase. ${g.lede}`;
  const see = g.see.map((s) => `<li>${esc(s)}</li>`).join("");
  const x = EXTRA[g.slug] || {};
  const historyBlock = x.history ? `\n  <h2>History &amp; background</h2>\n  <p>${esc(x.history)}</p>` : "";
  const seasonsBlock = x.seasons ? `\n  <h2>When to go — season by season</h2>\n  <p>${esc(x.seasons)}</p>` : "";
  const itineraryBlock = x.itinerary ? `\n  <h2>A suggested visit</h2>\n  <p>${esc(x.itinerary)}</p>` : "";
  const gettingBlock = (g.getting || g.when) ? `
  <h2>Getting there &amp; when to go</h2>
  ${g.getting ? `<p><b>Getting there:</b> ${esc(g.getting)}</p>` : ""}
  ${g.when ? `<p><b>Best time:</b> ${esc(g.when)}</p>` : ""}` : "";
  const wordBlock = g.word ? `
  <div class="jpbox">
    <b>LOCAL WORD</b>
    <div class="jp">${esc(g.word.jp)}</div>
    <div class="romaji">${esc(g.word.ro)} — ${esc(g.word.en)}</div>
  </div>` : "";
  const tipBlock = g.tip ? `<div class="aff" style="background:#eef7ef;border-color:var(--green)"><b style="font-family:inherit;color:var(--green)">💡 Good to know</b><p style="margin:6px 0 0">${esc(g.tip)}</p></div>` : "";
  const rel = (g.related || []).map((s) => BY_SLUG[s]).filter(Boolean);
  const relatedBlock = rel.length ? `
  <h2>Related guides</h2>
  <div class="cards">${rel.map((r) => `<a class="bcard" href="${r.slug}.html"><span class="bk">${esc(r.kanji)}</span><div class="br">${esc(r.romaji.toUpperCase())}</div></a>`).join("")}</div>` : "";
  return `${HEAD(title, desc, hreflangFor(g.slug))}
<body>
${navFor(g.slug)}
<article class="wrap">
  <div class="tag">▶ ${REGION_LABELS[g.region]} · ${esc(g.romaji.toUpperCase())} ${esc(g.kanji)}</div>
  <h1>${esc(g.romaji)} Travel Guide for Japanese Learners</h1>
  <p class="lede">${esc(g.lede)}</p>
  <p>${esc(g.intro)}</p>
${historyBlock}

  <h2>What to see</h2>
  <ul>${see}</ul>

  <h2>What to eat</h2>
  <p>${esc(g.eat)}</p>
${gettingBlock}
${seasonsBlock}
${itineraryBlock}

  <div class="jpbox">
    <b>LEARN THE JAPANESE</b>
    <div class="jp">${esc(g.phrase.jp)}</div>
    <div class="romaji">${esc(g.phrase.ro)} — "${esc(g.phrase.en)}"</div>
  </div>
${wordBlock}
${tipBlock}

  <div class="aff">
    <span class="pr">PR</span> <b style="font-family:inherit">Plan your stay</b>
    <div>
      <a href="https://www.booking.com/country/jp.html" target="_blank" rel="sponsored noopener">Find places to stay in Japan →</a>
    </div>
    <p class="disclose">Some links above are affiliate links. We may earn a commission at no extra cost to you. We only list services we'd use ourselves.</p>
  </div>

  <div class="cta-box">
    <a href="../prefectures.html?pref=${g.slug}">⚔️ Open ${esc(g.romaji)} on the Explore map →</a>
  </div>
${relatedBlock}

  <div class="sources">
    Source: <a href="https://www.japan.travel/en/destinations/" target="_blank" rel="noopener">Japan National Tourism Organization (JNTO)</a>.
    Facts kept to well-established highlights and checked against official tourism information; opinions are our own.
  </div>
</article>
<footer>© 2026 NihongoHub · <a href="index.html">All guides</a> · <a href="../index.html">Home</a></footer>
</body>
</html>
`;
}

function indexHTML() {
  const order = ["hokkaido", "tohoku", "kanto", "chubu", "kansai", "chugoku", "shikoku", "kyushu-okinawa"];
  const byRegion = {};
  for (const g of GUIDES) (byRegion[g.region] ||= []).push(g);
  const sections = order.map((r) => {
    const cards = (byRegion[r] || []).map((g) => {
      const tagline = g.full ? esc(g.blurb) : esc(g.lede);
      return `<a class="bcard" href="${g.slug}.html"><span class="bk">${esc(g.kanji)}</span><div class="br">${esc(g.romaji.toUpperCase())}</div><p>${tagline}</p></a>`;
    }).join("");
    return `<h2>${REGION_LABELS[r]}</h2><div class="cards">${cards}</div>`;
  }).join("\n");

  const title = "Japan Prefecture Travel Guides for Japanese Learners — NihongoHub";
  const desc = "Free, honest travel guides to all 47 of Japan's prefectures, written for Japanese learners. Where to go, what to eat, and the Japanese phrases that help.";
  return `${HEAD(title, desc)}
<body>
<nav class="bnav">
  <a class="logo" href="../index.html">Nihongo<span>Hub</span></a>
  <a href="../prefectures.html">🗾 Explore map</a>
  <a class="cta" href="../index.html#practice">FREE QUIZ</a>
</nav>
<div class="wrap">
  <div class="tag">▶ PREFECTURE GUIDES</div>
  <h1>Japan, one prefecture at a time</h1>
  <p class="lede">Free, honest travel guides for Japanese learners — all 47 prefectures. Where to go, what to eat, and the Japanese that actually helps on the trip.</p>
  ${sections}
  <div class="cta-box"><a href="../prefectures.html">⚔️ See them on the Explore map →</a></div>
</div>
<footer>© 2026 NihongoHub · <a href="../index.html">Home</a> · <a href="../prefectures.html">Explore</a></footer>
</body>
</html>
`;
}

let emitted = 0;
for (const g of GUIDES) {
  if (g.full) continue; // bespoke page exists; don't overwrite
  writeFileSync(new URL(`${g.slug}.html`, BLOG_DIR), articleHTML(g));
  emitted++;
}
writeFileSync(new URL("index.html", BLOG_DIR), indexHTML());
console.log(`generated ${emitted} guide pages + index (total ${GUIDES.length} prefectures listed)`);

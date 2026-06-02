/**
 * Generate localized guides under /blog/<lang>/ (zh-Hant, id).
 * - One article per slug present in i18n.js T[lang]  (pilot set).
 * - A localized index listing those articles.
 * - hreflang alternates + a language switcher linking en / zh / id.
 * Japanese learning content (phrase/word in kana-kanji) stays Japanese.
 * Run: node scripts/build-i18n.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { GUIDES, REGION_LABELS } from "../blog/guides-data.js";
import { LANGS, UI, T, translatedSlugs } from "../blog/i18n.js";

const BLOG = new URL("../blog/", import.meta.url);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const BY_SLUG = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));
const ALL = [{ code: "en" }, ...LANGS];

// hreflang block for a given slug, across every locale that has it (en always).
function hreflang(slug) {
  const link = (code, href) => `<link rel="alternate" hreflang="${code === "en" ? "en" : LANGS.find(l=>l.code===code).htmlLang}" href="${href}">`;
  const out = [link("en", `../${slug}.html`)];
  for (const l of LANGS) if (translatedSlugs(l.code).includes(slug)) out.push(link(l.code, l.code === CUR ? `${slug}.html` : `../${l.code}/${slug}.html`));
  return out.join("\n");
}
let CUR = "en";

function switcher(slug, cur) {
  // links to other locales that have this slug; en lives one level up.
  const items = [`<a href="../${slug}.html"${cur==="en"?' aria-current="page"':''}>EN</a>`];
  for (const l of LANGS) {
    if (!translatedSlugs(l.code).includes(slug)) continue;
    const href = l.code === cur ? `${slug}.html` : `../${l.code}/${slug}.html`;
    items.push(`<a href="${href}"${cur===l.code?' aria-current="page"':''}>${l.label}</a>`);
  }
  return `<span class="langsw">${items.join(" · ")}</span>`;
}

function articleHTML(lang, slug) {
  CUR = lang;
  const u = UI[lang], g = BY_SLUG[slug], t = T[lang][slug];
  const title = `${g.romaji} — ${u.h1Tail} | NihongoHub`;
  const see = t.see.map((s) => `<li>${esc(s)}</li>`).join("");
  const rel = (g.related || []).map((s) => BY_SLUG[s]).filter((r) => r && translatedSlugs(lang).includes(r.slug));
  const relatedBlock = rel.length ? `\n  <h2>${u.related}</h2>\n  <div class="cards">${rel.map((r)=>`<a class="bcard" href="${r.slug}.html"><span class="bk">${esc(r.kanji)}</span><div class="br">${esc(r.romaji.toUpperCase())}</div></a>`).join("")}</div>` : "";
  return `<!DOCTYPE html>
<html lang="${LANGS.find(l=>l.code===lang).htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(t.lede)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(t.lede)}">
${hreflang(slug)}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Press+Start+2P&family=DM+Sans:wght@400;600&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+TC:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../blog.css">
<style>.langsw{font-family:var(--dot);font-size:13px}.langsw a{color:#fff;text-decoration:none;opacity:.8}.langsw a[aria-current]{color:var(--gold);opacity:1;font-weight:700}</style>
</head>
<body>
<nav class="bnav">
  <a class="logo" href="../../index.html">Nihongo<span>Hub</span></a>
  <a href="index.html">${u.allGuides}</a>
  ${switcher(slug, lang)}
  <a class="cta" href="../../index.html#practice">${u.freeQuiz}</a>
</nav>
<article class="wrap">
  <div class="tag">▶ ${REGION_LABELS[g.region]} · ${esc(g.romaji.toUpperCase())} ${esc(g.kanji)}</div>
  <h1>${esc(g.romaji)}</h1>
  <p class="lede">${esc(t.lede)}</p>
  <p>${esc(t.intro)}</p>

  <h2>${u.history}</h2>
  <p>${esc(t.history)}</p>

  <h2>${u.whatToSee}</h2>
  <ul>${see}</ul>

  <h2>${u.whatToEat}</h2>
  <p>${esc(t.eat)}</p>

  <h2>${u.gettingWhen}</h2>
  <p><b>${u.gettingThere}:</b> ${esc(t.gettingThere)}</p>
  <p><b>${u.bestTime}:</b> ${esc(t.bestTime)}</p>

  <h2>${u.seasons}</h2>
  <p>${esc(t.seasons)}</p>

  <h2>${u.suggested}</h2>
  <p>${esc(t.itinerary)}</p>

  <div class="jpbox">
    <b>${u.learn}</b>
    <div class="jp">${esc(g.phrase.jp)}</div>
    <div class="romaji">${esc(g.phrase.ro)} — ${esc(t.phraseGloss)}</div>
  </div>
  <div class="jpbox">
    <b>${u.localWord}</b>
    <div class="jp">${esc(g.word.jp)}</div>
    <div class="romaji">${esc(g.word.ro)} — ${esc(t.wordEn)}</div>
  </div>
  <div class="aff" style="background:#eef7ef;border-color:var(--green)"><b style="font-family:inherit;color:var(--green)">💡 ${u.goodToKnow}</b><p style="margin:6px 0 0">${esc(t.tip)}</p></div>

  <div class="aff">
    <span class="pr">PR</span> <b style="font-family:inherit">${u.planStay}</b>
    <div><a href="https://www.booking.com/country/jp.html" target="_blank" rel="sponsored noopener">${u.findStay}</a></div>
    <p class="disclose">${u.disclose}</p>
  </div>

  <div class="cta-box"><a href="../../prefectures.html?pref=${g.slug}">${u.openMap(g.romaji)}</a></div>
${relatedBlock}

  <div class="sources">${u.source}: <a href="https://www.japan.travel/en/destinations/" target="_blank" rel="noopener">JNTO</a>. ${u.sourceTail}</div>
</article>
<footer>© 2026 NihongoHub · <a href="index.html">${u.allGuides.replace("← ","")}</a> · <a href="../../index.html">Home</a></footer>
</body>
</html>
`;
}

function indexHTML(lang) {
  const u = UI[lang];
  const slugs = translatedSlugs(lang);
  const cards = slugs.map((s) => { const g = BY_SLUG[s]; const t = T[lang][s];
    return `<a class="bcard" href="${s}.html"><span class="bk">${esc(g.kanji)}</span><div class="br">${esc(g.romaji.toUpperCase())}</div><p>${esc(t.lede)}</p></a>`; }).join("");
  return `<!DOCTYPE html>
<html lang="${LANGS.find(l=>l.code===lang).htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(u.indexH1)} — NihongoHub</title>
<meta name="description" content="${esc(u.indexLede)}">
<link rel="alternate" hreflang="en" href="../index.html">
${LANGS.map(l=>`<link rel="alternate" hreflang="${l.htmlLang}" href="${l.code===lang?'index.html':`../${l.code}/index.html`}">`).join("\n")}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Press+Start+2P&family=DM+Sans:wght@400;600&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+TC:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../blog.css">
<style>.langsw{font-family:var(--dot);font-size:13px}.langsw a{color:#fff;text-decoration:none;opacity:.8}.langsw a[aria-current]{color:var(--gold);opacity:1;font-weight:700}</style>
</head>
<body>
<nav class="bnav">
  <a class="logo" href="../../index.html">Nihongo<span>Hub</span></a>
  <a href="../../prefectures.html">${u.exploreMap}</a>
  <span class="langsw"><a href="../index.html">EN</a> · ${LANGS.map(l=>`<a href="${l.code===lang?'index.html':`../${l.code}/index.html`}"${l.code===lang?' aria-current="page"':''}>${l.label}</a>`).join(" · ")}</span>
  <a class="cta" href="../../index.html#practice">${u.freeQuiz}</a>
</nav>
<div class="wrap">
  <div class="tag">${u.indexTag}</div>
  <h1>${esc(u.indexH1)}</h1>
  <p class="lede">${esc(u.indexLede)}</p>
  <div class="cards">${cards}</div>
  <div class="cta-box"><a href="../../prefectures.html">${u.seeAll}</a></div>
</div>
<footer>© 2026 NihongoHub · <a href="../../index.html">Home</a></footer>
</body>
</html>
`;
}

let n = 0;
for (const l of LANGS) {
  mkdirSync(new URL(`${l.code}/`, BLOG), { recursive: true });
  for (const slug of translatedSlugs(l.code)) {
    writeFileSync(new URL(`${l.code}/${slug}.html`, BLOG), articleHTML(l.code, slug));
    n++;
  }
  writeFileSync(new URL(`${l.code}/index.html`, BLOG), indexHTML(l.code));
}
console.log(`generated ${n} localized articles + ${LANGS.length} localized indexes (${LANGS.map(l=>l.code).join(", ")})`);

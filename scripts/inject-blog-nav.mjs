// Inject into every blog/<prefecture>.html:
//   1) a TOC built from the article's own <h2> headings (ids auto-assigned)
//   2) a prev/next strip along the national geographic sequence
//   3) a "More in <REGION>" related-prefecture chip row
// Source of truth for ordering/names is blog/index.html, parsed at runtime.
// Idempotent: a file already carrying <!--blognav--> is skipped.
import fs from 'node:fs';
import path from 'node:path';

const BLOG = 'blog';
const idx = fs.readFileSync(path.join(BLOG, 'index.html'), 'utf8');

// Parse region sections: each <h2>REGION</h2> followed by a .cards block of <a class="bcard" href="slug.html">...<span class="bk">KANJI</span><div class="br">ENGLISH</div>
const seq = [];                 // [{slug, kanji, en, region}]
const regionRe = /<h2>([^<]+)<\/h2>\s*<div class="cards">([\s\S]*?)<\/div>\s*(?=<h2>|<div class="cta-box">)/g;
let rm;
while ((rm = regionRe.exec(idx)) !== null) {
  const region = rm[1].trim();
  const cards = rm[2];
  const cardRe = /<a class="bcard" href="([a-z]+)\.html"><span class="bk">([^<]+)<\/span><div class="br">([^<]+)<\/div>/g;
  let cm;
  while ((cm = cardRe.exec(cards)) !== null) {
    seq.push({ slug: cm[1], kanji: cm[2].trim(), en: cm[3].trim(), region });
  }
}
if (seq.length !== 47) {
  console.error(`Expected 47 prefectures, parsed ${seq.length}. Aborting.`);
  process.exit(1);
}

const bySlug = Object.fromEntries(seq.map((p, i) => [p.slug, { ...p, i }]));

function slugifyHeading(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

let modified = 0, skipped = 0;
for (const p of seq) {
  const file = path.join(BLOG, p.slug + '.html');
  if (!fs.existsSync(file)) { skipped++; continue; }
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('<!--blognav-->')) { skipped++; continue; }

  // --- 1) TOC: collect h2s, assign ids, build list ---
  const headings = [];
  html = html.replace(/<h2(\s[^>]*)?>([^<]+)<\/h2>/g, (m, attrs, text) => {
    if (/id=/.test(attrs || '')) { headings.push({ id: (attrs.match(/id="([^"]+)"/) || [])[1], text: text.trim() }); return m; }
    const id = slugifyHeading(text);
    headings.push({ id, text: text.trim() });
    return `<h2 id="${id}"${attrs || ''}>${text}</h2>`;
  });

  let toc = '';
  if (headings.length >= 2) {
    toc = `<nav class="toc" aria-label="On this page"><!--blognav-->\n  <span class="toc-h">On this page</span>\n  <ul>${headings.map(h => `<li><a href="#${h.id}">${h.text}</a></li>`).join('')}</ul>\n</nav>\n`;
  }

  // --- 2) prev/next along national sequence ---
  const i = bySlug[p.slug].i;
  const prev = i > 0 ? seq[i - 1] : null;
  const next = i < seq.length - 1 ? seq[i + 1] : null;

  // --- 3) related = same-region others (max 6) ---
  const related = seq.filter(q => q.region === p.region && q.slug !== p.slug).slice(0, 6);

  const prevNext = `<nav class="pxnav" aria-label="Browse prefectures">
  ${prev ? `<a class="pxprev" href="${prev.slug}.html"><span>← Previous</span><b>${prev.kanji} ${prev.en}</b></a>` : `<span class="pxprev pxempty"></span>`}
  <a class="pxall" href="index.html">All 47 ↑</a>
  ${next ? `<a class="pxnext" href="${next.slug}.html"><span>Next →</span><b>${next.kanji} ${next.en}</b></a>` : `<span class="pxnext pxempty"></span>`}
</nav>`;

  const relatedBlock = related.length ? `<section class="pxrel" aria-label="More in ${p.region}">
  <div class="pxrel-h">More in ${p.region}</div>
  <div class="pxrel-row">${related.map(r => `<a href="${r.slug}.html"><span class="rk">${r.kanji}</span><span class="re">${r.en}</span></a>`).join('')}</div>
</section>` : '';

  const tail = `\n${prevNext}\n${relatedBlock}\n`;

  // --- inject TOC right after the .lede paragraph ---
  if (toc) {
    html = html.replace(/(<p class="lede">[\s\S]*?<\/p>)/, `$1\n${toc}`);
  } else {
    // ensure the marker exists even when no TOC, so re-runs are skipped
    html = html.replace(/(<p class="lede">[\s\S]*?<\/p>)/, `$1\n<!--blognav-->`);
  }

  // --- inject prev/next + related right before <footer> ---
  html = html.replace(/<footer>/, `${tail}<footer>`);

  fs.writeFileSync(file, html);
  modified++;
}
console.log(`blog nav modified: ${modified}, skipped: ${skipped}, total: ${seq.length}`);

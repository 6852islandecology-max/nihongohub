// Inject Article JSON-LD into each blog/<prefecture>.html (skip index.html).
// Pulls title, description, og:image, canonical from the page itself.
import fs from 'node:fs';
import path from 'node:path';

const BLOG = 'blog';
const files = fs.readdirSync(BLOG)
  .filter(n => n.endsWith('.html') && n !== 'index.html')
  .map(n => path.join(BLOG, n));

function pick(html, re) { const m = html.match(re); return m ? m[1] : null; }

let modified = 0, skipped = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes('application/ld+json')) { skipped++; continue; }

  const title       = pick(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description = pick(html, /<meta\s+name="description"\s+content="([^"]+)"/i);
  const canonical   = pick(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const ogImage     = pick(html, /<meta\s+property="og:image"\s+content="([^"]+)"/i);

  if (!title || !canonical) { skipped++; continue; }

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title.replace(/\s+—\s+NihongoHub\s*$/, '').trim(),
    "description": description || undefined,
    "image": ogImage || undefined,
    "url": canonical,
    "mainEntityOfPage": canonical,
    "inLanguage": "en",
    "author": { "@type": "Organization", "name": "NihongoHub" },
    "publisher": {
      "@type": "Organization",
      "name": "NihongoHub",
      "url": "https://www.nihongo-hub.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.nihongo-hub.com/apple-touch-icon.png"
      }
    }
  };

  const block = `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
  const updated = html.replace(/<\/head>/i, block + '\n</head>');
  if (updated === html) { skipped++; continue; }
  fs.writeFileSync(f, updated);
  modified++;
}
console.log('Article JSON-LD modified:', modified, 'skipped:', skipped, 'total:', files.length);

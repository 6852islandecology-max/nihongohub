// Shared shell for "v2 design" data articles (aquariums, islands ...): reuses the CSS of the v2 prefecture
// pages verbatim (read from blog/tokushima-v2.html at build time so the design stays in sync), plus the
// nav / hero / footer markup. Photo credits come from blog/img-credits-multi.json.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
export const ROOT = path.join(os.homedir(), '.secretary/projects/nihongohub');
export const CREDITS = JSON.parse(fs.readFileSync(path.join(ROOT, 'blog/img-credits-multi.json'), 'utf8'));
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SRC = { find47: 'FIND/47', 'flickr/openverse': 'Flickr', wikimedia: 'Wikimedia Commons' };
export const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&family=Karla:wght@400;500;700&family=Shippori+Mincho+B1:wght@700;800&display=swap" rel="stylesheet">`;
export function v2css() {
  const src = fs.readFileSync(path.join(ROOT, 'blog/tokushima-v2.html'), 'utf8');
  const m = src.match(/<style>([\s\S]*?)<\/style>/); if (!m) throw new Error('v2 css not found');
  return m[1];
}
// extra CSS for data articles: prose, tables, filters, in-body figures
export const ARTICLE_CSS = `
.prose{max-width:76ch}.prose p{margin:0 0 14px;color:var(--ink-2)}.prose ul{margin:0 0 14px 20px;color:var(--ink-2)}.prose li{margin:4px 0}.prose h3{font-size:22px;margin:22px 0 8px}
.callout{background:var(--card);border:1px solid var(--line);border-left:5px solid var(--seal);border-radius:var(--r);padding:14px 18px;margin:18px 0;color:var(--ink-2)}
.tbl-wrap{overflow-x:auto;margin:14px 0 6px;border:1px solid var(--line);border-radius:var(--r);background:var(--card)}
.tbl{border-collapse:collapse;width:100%;font-size:14px}.tbl th,.tbl td{padding:10px 12px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}
.tbl th{background:var(--ink);color:#f5efe3;font:700 11px/1.3 Karla,sans-serif;letter-spacing:.14em;text-transform:uppercase;position:sticky;top:0}
.tbl tr:last-child td{border-bottom:0}.tbl .pk{display:block;font-size:12px;color:var(--muted);margin-top:2px}
.tbl th.sortable{cursor:pointer;text-decoration:underline dotted}.tbl td.num{font-family:Fraunces,serif;font-weight:600;font-size:16px;white-space:nowrap}
.filters{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 6px}.filters button{font:500 13px Karla,sans-serif;padding:5px 12px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--ink);cursor:pointer}
.filters button[aria-pressed=true]{background:var(--ink);color:#f5efe3;border-color:var(--ink)}
.filters input{font:14px Karla,sans-serif;padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:#fff;min-width:200px}
.fig{margin:18px 0;border-radius:var(--r);overflow:hidden;border:1px solid var(--line);background:var(--card)}.fig img{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
.fig figcaption{font-size:12px;color:var(--muted);padding:8px 12px}
.figs2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0}.figs2 .fig{margin:0}.figs2 img{aspect-ratio:4/3}
.cards .card figcaption,.cards .card .cred{font-size:11px;color:var(--muted);padding:0 18px 12px}
.big{font-family:Fraunces,serif;font-weight:700;font-size:44px;line-height:1;color:var(--accent)}
@media (max-width:820px){.figs2{grid-template-columns:1fr}.tbl{font-size:13px}}
`;
export function credit(slug, key) {
  const p = CREDITS[slug]?.[key]; if (!p) return '';
  return `${esc(p.label)} — <a href="${esc(p.source_page)}" rel="noopener nofollow">${esc(p.artist)}</a> via ${SRC[p.fetched_from] || esc(p.fetched_from)}, <a href="${esc(p.license_url || '#')}" rel="license noopener nofollow">${esc(p.license)}</a>`;
}
export function img(slug, key, alt, attrs = '') {
  const p = CREDITS[slug]?.[key]; if (!p) return '';
  return `<img src="${esc(p.file)}" width="${p.width}" height="${p.height}" alt="${esc(alt || p.label)}" loading="lazy" decoding="async" ${attrs}>`;
}
export function fig(slug, key, alt) { const p = CREDITS[slug]?.[key]; if (!p) return ''; return `<figure class="fig">${img(slug, key, alt)}<figcaption>${credit(slug, key)}</figcaption></figure>`; }
export function nav() {
  return `<nav class="nav"><a class="brand" href="../index.html">Nihongo<b>Hub</b></a><div class="links"><a href="index.html">All guides</a><a href="../prefectures.html">Play the map</a><a href="../index.html#learn">Learn Japanese</a></div><a class="cta" href="../index.html#practice">Free quiz</a></nav>`;
}
export function hero({ slug, key, stamp, stampSmall, kicker, title, tag }) {
  const p = CREDITS[slug]?.[key]; if (!p) throw new Error('hero photo missing ' + key);
  return `<header class="hero">
  <img src="${esc(p.file)}" width="${p.width}" height="${p.height}" alt="${esc(p.label)}" fetchpriority="high" decoding="async">
  <div class="cred">Photo: <a href="${esc(p.source_page)}" rel="noopener nofollow">${esc(p.artist)}</a> via ${SRC[p.fetched_from] || ''} · <a href="${esc(p.license_url)}" rel="license noopener nofollow">${esc(p.license)}</a></div>
  <div class="in"><div class="hw" style="max-width:var(--max);margin:0 auto">
    <div class="stamp" title="${esc(title)}"><span>${esc(stamp)}</span><small>${esc(stampSmall)}</small></div>
    <div><div class="kicker">${esc(kicker)}</div><h1>${title}</h1><p class="tag">${tag}</p></div>
  </div></div>
</header>`;
}
export function mosaic(slug, keys) {
  const ps = keys.map(k => [k, CREDITS[slug]?.[k]]).filter(([, p]) => p);
  return `<div class="mosaic">${ps.map(([k, p]) => `<figure>${img(slug, k)}<figcaption>${esc(p.label)}</figcaption></figure>`).join('')}</div>
<p class="credits">Photos: ${ps.map(([k]) => credit(slug, k)).join(' · ')}</p>`;
}
export function section(n, id, title, body, extra = '') { return `<section class="blk${extra ? ' ' + extra : ''}" id="${id}"><div class="h"><span class="n">${n}</span><h2>${title}</h2></div>${body}</section>`; }
export function faqSection(n, items) {
  const html = items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) };
  return section(n, 'faq', 'Common questions', html + `<script type="application/ld+json">${JSON.stringify(ld)}</script>`, 'faq');
}
export function footer(extra = '') { return `<footer>© 2026 NihongoHub · <a href="index.html">All guides</a> · <a href="../index.html">Home</a> · <a href="../affiliate.html">Affiliate disclosure</a>${extra}</footer>`; }
export function head({ url, title, description, ogImage, ld, extraCss = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:url" content="${url}"><meta property="og:type" content="article"><meta property="og:site_name" content="NihongoHub">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${ogImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${ogImage}">
${FONTS}
<style>${v2css()}${ARTICLE_CSS}${extraCss}</style>
<script defer src="/_vercel/insights/script.js"></script>
<!--evidence-ld--><script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>`;
}

#!/usr/bin/env node
// Inject in-body photos into a blog article from blog/img-credits-multi.json (fetched by fetch-photos-multi.mjs,
// eyeballed via photo-candidates.mjs). Placement = after the first </p> that follows <h2 id="anchor">.
// Idempotent: blocks are wrapped in <!--article-photos:anchor--> ... <!--/article-photos:anchor--> and replaced on re-run.
// Also bumps dateModified in the JSON-LD and the visible .updated line when something changed (unless --no-touch).
// Usage: node scripts/inject-article-photos.mjs <slug> [--report] [--no-touch]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const BLOG = path.join(os.homedir(), '.secretary/projects/nihongohub/blog');
const CREDITS = JSON.parse(fs.readFileSync(path.join(BLOG, 'img-credits-multi.json'), 'utf8'));
const SRC = { find47: 'FIND/47', 'flickr/openverse': 'Flickr', wikimedia: 'Wikimedia Commons' };

// slug -> [{ anchor: h2 id, keys: [credit keys], mode?: 'wide'|'two' }]
const PLACEMENTS = {
  'tori-no-ichi-kumade-japan': [
    { anchor: 'dates',  keys: ['dates'] },
    { anchor: 'hours',  keys: ['hours', 'stall'] },
    { anchor: 'kumade', keys: ['kumade', 'kumade3'] },
    { anchor: 'ritual', keys: ['kumade2'] },
    { anchor: 'where',  keys: ['asakusa', 'where2', 'where1'] },
    { anchor: 'kansai', keys: ['kansai'] },
    { anchor: 'okame',  keys: ['okame'] },
  ],
  'manhole-cards-japan': [
    { anchor: 'what',    keys: ['osaka'] },
    { anchor: 'collect', keys: ['yokote', 'tokorozawa'] },
    { anchor: 'lots',    keys: ['kumamoto'] },
    { anchor: 'designs', keys: ['hiroshima', 'kobe', 'toyama'] }, // sumida (Hokusai wave) dropped 2026-08-19: only free shot has the cover tiny in frame
  ],
};

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const credit = (p) => `<a href="${esc(p.source_page)}" target="_blank" rel="noopener nofollow">${esc(p.artist)}</a>, <a href="${esc(p.license_url || '#')}" target="_blank" rel="license noopener nofollow">${esc(p.license)}</a>, via ${SRC[p.fetched_from] || esc(p.fetched_from)}`;
function block(slug, pl, C) {
  const ps = pl.keys.map(k => C[k]).filter(Boolean); if (!ps.length) return '';
  const groups = []; for (let i = 0; i < ps.length; i += 2) groups.push(ps.slice(i, i + 2));
  const html = groups.map(g => {
    if (g.length === 1) { const p = g[0]; return `<div class="art-photos"><figure><img src="${esc(p.file)}" alt="${esc(p.label)}" loading="lazy" decoding="async" width="${p.width}" height="${p.height}"><figcaption>${esc(p.label)} — photo by ${credit(p)}</figcaption></figure></div>`; }
    return `<div class="art-photos two">${g.map(p => `<figure><img src="${esc(p.file)}" alt="${esc(p.label)}" loading="lazy" decoding="async" width="${p.width}" height="${p.height}"><figcaption>${esc(p.label)}</figcaption></figure>`).join('')}</div><p class="art-credits">Photos: ${g.map(p => `${esc(p.label)} — ${credit(p)}`).join(' · ')}</p>`;
  }).join('\n');
  return `<!--article-photos:${pl.anchor}-->\n${html}\n<!--/article-photos:${pl.anchor}-->`;
}
function inject(slug, { report = false, touch = true } = {}) {
  const file = path.join(BLOG, slug + '.html'); let html = fs.readFileSync(file, 'utf8'); const orig = html;
  const C = CREDITS[slug] || {}; const pls = PLACEMENTS[slug]; if (!pls) throw new Error('no PLACEMENTS for ' + slug);
  let n = 0;
  for (const pl of pls) {
    const b = block(slug, pl, C); if (!b) { console.log(`SKIP ${slug}#${pl.anchor} (no photos)`); continue; }
    const re = new RegExp('<!--article-photos:' + pl.anchor + '-->[^]*?<!--/article-photos:' + pl.anchor + '-->'); // [^] = any char incl. newline
    if (re.test(html)) { html = html.replace(re, b); n++; continue; }
    const h2 = html.search(new RegExp(`<h2[^>]*id="${pl.anchor}"`)); if (h2 < 0) { console.log(`MISS ${slug}#${pl.anchor} (no h2)`); continue; }
    const pEnd = html.indexOf('</p>', h2); if (pEnd < 0) continue;
    html = html.slice(0, pEnd + 4) + '\n' + b + html.slice(pEnd + 4); n++;
  }
  const imgs = (html.match(/<img /g) || []).length, words = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (html !== orig && touch) {
    const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // local date, not UTC
    if (/"dateModified":"\d{4}-\d{2}-\d{2}"/.test(html)) html = html.replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/, `"dateModified":"${today}"`);
    else html = html.replace(/("@type":"BlogPosting"[^{}]*?"headline":"[^"]*",)/, `$1"dateModified":"${today}",`); // add if the BlogPosting had none
    html = html.replace(/(<div class="updated">UPDATED )\d{4}-\d{2}(-\d{2})?/, `$1${today}`);
  }
  console.log(`${report ? 'REPORT' : 'WROTE'} ${slug}: ${n} blocks, ${imgs} <img>, ~${words} words -> ${Math.round(words / Math.max(imgs, 1))} words/photo`);
  if (!report && html !== orig) fs.writeFileSync(file, html);
}
const args = process.argv.slice(2); const slug = args.find(a => !a.startsWith('--'));
if (!slug) { console.error('slug required'); process.exit(1); }
inject(slug, { report: args.includes('--report'), touch: !args.includes('--no-touch') });

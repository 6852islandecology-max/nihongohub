#!/usr/bin/env node
/**
 * Make blog/<lang>/<pref>-v2.html the single URL for one translated language — the same move
 * f0f1586 made for English on 2026-09-07. Each language had its 47 prefecture guides twice
 * (classic + v2), no redirect, and the language hub pointing at the classic set.
 *
 *   node scripts/consolidate-translated-prefs.mjs <zh|es|th|id>          apply (idempotent)
 *   node scripts/consolidate-translated-prefs.mjs <zh|es|th|id> --check  report only, write nothing
 *
 * Edits (article bodies are not touched):
 *   - vercel.json: 47 permanent redirects /blog/<lang>/<pref>.html -> /blog/<lang>/<pref>-v2.html
 *   - blog/<lang>/index.html: hub links -> -v2
 *   - blog/<lang>/<pref>-v2.html: "Next door" links -> -v2; the "classic version" footer link is
 *     dropped (it would redirect to itself). scripts/build-guide-v2.mjs does the same on rebuild
 *     because it reads the redirects from vercel.json.
 *   - sitemap.xml via scripts/build-sitemap.mjs (it skips redirected URLs)
 *
 * Pace (site-maintenance-proposal-2026-09-07 §F): one language per commit, 2 weeks apart, never
 * while a Google ranking update is rolling out. Order: zh -> id -> es -> th.
 * Plan and log: 成果物/Product/nihongohub/strategy-review-2026-09-29.md, 成果物/Marketing/NihongoHub/translated-prefecture-consolidation-log.md
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const lang = process.argv[2];
const CHECK = process.argv.includes('--check');
if (!['zh', 'es', 'th', 'id'].includes(lang)) { console.error('usage: consolidate-translated-prefs.mjs <zh|es|th|id> [--check]'); process.exit(2); }

const dir = `blog/${lang}/`;
const slugs = readdirSync(ROOT + dir)
  .map((f) => (f.match(/^([a-z]+)-v2\.html$/) || [])[1])
  .filter((s) => s && existsSync(ROOT + dir + s + '.html'))
  .sort();
if (slugs.length !== 47) { console.error(`expected 47 classic+v2 pairs in ${dir}, found ${slugs.length}`); process.exit(1); }

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const report = [];
const write = (rel, before, after, what) => {
  if (before === after) return;
  report.push(`${rel}: ${what}`);
  if (!CHECK) writeFileSync(ROOT + rel, after);
};

// 1. vercel.json redirects (file is JSON.stringify(…, null, 2) + "\n"; verified round-trip 2026-09-29)
const vjRaw = readFileSync(ROOT + 'vercel.json', 'utf8');
const vj = JSON.parse(vjRaw);
vj.redirects = vj.redirects || [];
const have = new Set(vj.redirects.map((r) => r.source));
let added = 0;
for (const s of slugs) {
  const source = `/blog/${lang}/${s}.html`;
  if (have.has(source)) continue;
  vj.redirects.push({ source, destination: `/blog/${lang}/${s}-v2.html`, permanent: true });
  added++;
}
write('vercel.json', vjRaw, JSON.stringify(vj, null, 2) + (vjRaw.endsWith('\n') ? '\n' : ''), `+${added} redirects`);

// 2. language hub
const hubRel = dir + 'index.html';
const hubRaw = readFileSync(ROOT + hubRel, 'utf8');
let hub = hubRaw, hubN = 0;
for (const s of slugs) {
  hub = hub.replace(new RegExp(`href="(?:\\.\\./${lang}/)?${esc(s)}\\.html"`, 'g'), () => { hubN++; return `href="${s}-v2.html"`; });
}
write(hubRel, hubRaw, hub, `${hubN} hub links -> -v2`);

// 3. v2 pages: drop the classic footer link, then point next-door links at -v2
let pagesChanged = 0;
for (const s of slugs) {
  const rel = dir + s + '-v2.html';
  const raw = readFileSync(ROOT + rel, 'utf8');
  let html = raw.replace(new RegExp(` · <a href="\\.\\./${lang}/${esc(s)}\\.html">[^<]*</a></footer>`), '</footer>');
  for (const n of slugs) {
    html = html.replace(new RegExp(`href="\\.\\./${lang}/${esc(n)}\\.html"`, 'g'), `href="../${lang}/${n}-v2.html"`);
  }
  if (html !== raw) pagesChanged++;
  write(rel, raw, html, 'footer classic link removed / next-door -> -v2');
}

// 4. sitemap
if (!CHECK && (added || hubN || pagesChanged)) {
  execFileSync(process.execPath, [ROOT + 'scripts/build-sitemap.mjs'], { cwd: ROOT, stdio: 'inherit' });
}

console.log(`${lang}: ${slugs.length} guides, +${added} redirects, ${hubN} hub links, ${pagesChanged} v2 pages${CHECK ? ' (check only, nothing written)' : ''}`);
if (CHECK) report.forEach((l) => console.log('  would change ' + l));

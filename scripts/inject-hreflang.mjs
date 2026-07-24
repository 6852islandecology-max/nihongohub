#!/usr/bin/env node
/*
 * inject-hreflang.mjs
 * Injects reciprocal <link rel="alternate" hreflang="..."> tags into blog pages
 * for every language variant that ACTUALLY EXISTS on disk.
 *
 * Guard: a hreflang is only emitted for a slug+language when the target file
 * exists. We never point hreflang at a non-existent URL (which would tank the
 * domain's evaluation). A slug present in only one language gets no hreflang.
 *
 * Idempotent: the injected block is wrapped in <!--hreflang--> ... <!--/hreflang-->
 * markers and replaced on re-run, never duplicated.
 *
 * Usage: node scripts/inject-hreflang.mjs            (writes changes)
 *        node scripts/inject-hreflang.mjs --dry       (report only)
 *        node scripts/inject-hreflang.mjs --slugs=a,b (対象スラッグを限定)
 *
 * 2026-07-24: --slugs を追加。全体に流すと 271 ファイルを書き換えるので、
 * 一部のクラスタだけを直したいときに影響範囲を絞れるようにした。
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');
const BASE = 'https://www.nihongo-hub.com';
const DRY = process.argv.includes('--dry');
const slugArg = process.argv.find((a) => a.startsWith('--slugs='));
const ONLY = slugArg ? new Set(slugArg.slice(8).split(',').map((s) => s.trim()).filter(Boolean)) : null;

// location id -> { dir relative to blog/, urlPrefix, fallbackLang }
const LOCATIONS = [
  { id: 'en', dir: '.', urlPrefix: '/blog', fallbackLang: 'en' },
  { id: 'es', dir: 'es', urlPrefix: '/blog/es', fallbackLang: 'es' },
  { id: 'id', dir: 'id', urlPrefix: '/blog/id', fallbackLang: 'id' },
  { id: 'th', dir: 'th', urlPrefix: '/blog/th', fallbackLang: 'th' },
  { id: 'zh', dir: 'zh', urlPrefix: '/blog/zh', fallbackLang: 'zh' },
];

const htmlLang = (file) => {
  const m = readFileSync(file, 'utf8').match(/<html[^>]*\blang="([^"]+)"/i);
  return m ? m[1] : null;
};

// Build slug -> [{lang, url, file, isEn}] from existing files only.
const slugMap = new Map();
for (const loc of LOCATIONS) {
  const abs = join(BLOG, loc.dir);
  if (!existsSync(abs)) continue;
  for (const name of readdirSync(abs)) {
    if (!name.endsWith('.html') || name === 'index.html') continue;
    const file = join(abs, name);
    const slug = name.replace(/\.html$/, '');
    if (ONLY && !ONLY.has(slug)) continue;
    const lang = htmlLang(file) || loc.fallbackLang;
    const url = `${BASE}${loc.urlPrefix}/${name}`;
    if (!slugMap.has(slug)) slugMap.set(slug, []);
    slugMap.get(slug).push({ lang, url, file, isEn: loc.id === 'en' });
  }
}

let changed = 0, skipped = 0;
for (const [slug, variants] of slugMap) {
  // Guard: need at least two real language variants to justify hreflang.
  if (variants.length < 2) { skipped++; continue; }

  // Deduplicate lang codes (keep first); build the alternates block.
  const seen = new Set();
  const links = [];
  for (const v of variants) {
    if (seen.has(v.lang)) continue;
    seen.add(v.lang);
    links.push(`<link rel="alternate" hreflang="${v.lang}" href="${v.url}">`);
  }
  const en = variants.find((v) => v.isEn);
  if (en) links.push(`<link rel="alternate" hreflang="x-default" href="${en.url}">`);
  const block = `<!--hreflang-->\n${links.join('\n')}\n<!--/hreflang-->`;

  for (const v of variants) {
    let html = readFileSync(v.file, 'utf8');
    const before = html;
    // 1. Drop any previous injected marker block (idempotent re-run).
    html = html.replace(/\n?<!--hreflang-->[\s\S]*?<!--\/hreflang-->/g, '');
    // 2. Drop legacy stray hreflang <link> tags (old relative, non-self-referencing).
    html = html.replace(/[ \t]*<link\b[^>]*\bhreflang=[^>]*>[ \t]*\n?/gi, '');
    // 3. Inject the canonical absolute block before </head>.
    html = html.replace(/<\/head>/i, `${block}\n</head>`);
    if (html !== before) {
      if (!DRY) writeFileSync(v.file, html);
      changed++;
    }
  }
}

console.log(`[inject-hreflang] slugs=${slugMap.size} multilingual=${slugMap.size - skipped} single-lang-skipped=${skipped} files-${DRY ? 'would-change' : 'changed'}=${changed}`);

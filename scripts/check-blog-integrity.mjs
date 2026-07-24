#!/usr/bin/env node
// scripts/check-blog-integrity.mjs — ブログ HTML の健全性を数える。
//
// 2026-07-24 新設。build-guides.mjs（全文上書き）と inject-*.mjs（追記）が
// 同じファイルを奪い合う構造なので、順序を間違えると注入済みブロックが静かに消える。
// 消えたことに気付く手段が無かったので、数えられるようにした。
//
// 実行: node scripts/check-blog-integrity.mjs
//       node scripts/check-blog-integrity.mjs --verbose   欠落しているファイル名も出す
//
// 終了コード: 欠落があれば 1。ただし「欠落 = 異常」とは限らない
// （例: hreflang は翻訳版が実在する記事にしか付かないので、47 県以外では 0 が正しい）。
// 判断材料を出すのが目的で、合否判定ではない。

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = join(root, "blog");
const verbose = process.argv.includes("--verbose");

const files = readdirSync(BLOG).filter((f) => f.endsWith(".html"));

const CHECKS = [
  { key: "canonical", test: (h) => h.includes('rel="canonical"'), note: "inject-seo-meta が入れる。欠けると重複コンテンツ扱いになる" },
  { key: "<!--evidence-->", test: (h) => h.includes("<!--evidence-->"), note: "inject-evidence の TL;DR。47 県記事のみ" },
  { key: "<!--evidence-ld-->", test: (h) => h.includes("<!--evidence-ld-->"), note: "inject-evidence の BlogPosting JSON-LD" },
  { key: "<!--lead-photo-->", test: (h) => h.includes("<!--lead-photo-->"), note: "inject-lead-photo。画像が取れた記事のみ" },
  { key: "<!--glance-->", test: (h) => h.includes("<!--glance-->"), note: "inject-glance-capsule。47 県記事のみ" },
  { key: "<!--chips-see-->", test: (h) => h.includes("<!--chips-see-->"), note: "inject-section-chips。47 県記事のみ" },
  { key: "<!--hreflang-->", test: (h) => h.includes("<!--hreflang-->"), note: "inject-hreflang。翻訳版が実在する記事のみ" },
  { key: "<!--blognav-->", test: (h) => h.includes("<!--blognav-->"), note: "inject-blog-nav の TOC / prev-next / 関連。47 県記事のみ" },
  { key: "<nav class=\"bnav\">", test: (h) => h.includes('<nav class="bnav">'), note: "build-guides が焼き込む共通ナビ。全記事にあるべき" },
];

// 重複検出: 同じブロックが 2 回以上入っていないか（inject-blog-nav の旧バグの痕跡）
const DUPES = [
  { key: "pxnav", re: /<nav class="pxnav"/g },
  { key: "toc", re: /<nav class="toc"/g },
  { key: "pxrel", re: /<section class="pxrel"/g },
];

const missing = {};
const dupes = {};
for (const c of CHECKS) missing[c.key] = [];
for (const d of DUPES) dupes[d.key] = [];

for (const f of files) {
  const html = readFileSync(join(BLOG, f), "utf8");
  for (const c of CHECKS) if (!c.test(html)) missing[c.key].push(f);
  for (const d of DUPES) {
    const n = (html.match(d.re) || []).length;
    if (n > 1) dupes[d.key].push(`${f} (${n})`);
  }
}

console.log(`blog/*.html: ${files.length} 本\n`);
console.log("マーカーの有無");
let anyMissing = 0;
for (const c of CHECKS) {
  const n = files.length - missing[c.key].length;
  const flag = missing[c.key].length ? " ←" : "  ";
  console.log(`${flag} ${String(n).padStart(3)} / ${files.length}  ${c.key}`);
  console.log(`      ${c.note}`);
  if (missing[c.key].length) {
    anyMissing = 1;
    if (verbose) console.log(`      欠落: ${missing[c.key].join(", ")}`);
  }
}

console.log("\n重複（同一ブロックが 2 回以上）");
let anyDupe = false;
for (const d of DUPES) {
  if (dupes[d.key].length) {
    anyDupe = true;
    console.log(`  ${d.key}: ${dupes[d.key].length} 本`);
    if (verbose) console.log(`      ${dupes[d.key].join(", ")}`);
  }
}
if (!anyDupe) console.log("  なし");

console.log("\n直し方: node scripts/build-blog.mjs --dry で順序を確認してから実行する。");
process.exit(anyMissing);

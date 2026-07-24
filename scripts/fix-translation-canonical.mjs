#!/usr/bin/env node
/*
 * fix-translation-canonical.mjs
 *
 * 翻訳ページの canonical を「英語原文指し」から「自ページ指し」に直す。
 *
 * 2026-07-24 新設。blog/{es,id,th,zh}/ 220 本のうち 176 本は自言語版を canonical に
 * していたが、収集型観光クラスタ 11 スラッグ × 4 言語 = 44 本だけが英語原文を
 * 指していた。canonical が別 URL を指すと「このページは複製なので索引しなくてよい」と
 * 伝えることになり、その 44 本は検索結果に出ない。
 * 11 スラッグは実測でブログの勝ちクラスタ（マンホール/御朱印/スタンプ）の翻訳版。
 *
 * 前提: 実行前に scripts/inject-hreflang.mjs で相互 hreflang を入れておくこと。
 * canonical を自ページにするだけで hreflang が無いと、各言語版が互いに競合する。
 *
 * 対象は「blog/<lang>/ 配下で canonical が自ページを指していないもの」だけ。
 * 既に正しいページには触らない（何度実行しても安全）。
 *
 * Usage: node scripts/fix-translation-canonical.mjs --dry
 *        node scripts/fix-translation-canonical.mjs
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');
const BASE = 'https://www.nihongo-hub.com';
const DRY = process.argv.includes('--dry');
const LANGS = ['es', 'id', 'th', 'zh'];

let fixed = 0, alreadyOk = 0, noCanonical = 0;
const changes = [];

for (const lang of LANGS) {
  const dir = join(BLOG, lang);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.html')) continue;
    const file = join(dir, name);
    const html = readFileSync(file, 'utf8');
    const m = html.match(/<link rel="canonical" href="([^"]+)">/);
    if (!m) { noCanonical++; continue; }

    // index.html の正規形はディレクトリ形式（/blog/es/）。
    // scripts/inject-seo-meta.mjs の urlFor() と同じ規則に揃える。
    // これを揃えないと、既に正しい 4 本の index を「間違い」と誤検出する。
    const want = name === 'index.html'
      ? `${BASE}/blog/${lang}/`
      : `${BASE}/blog/${lang}/${name}`;
    if (m[1] === want) { alreadyOk++; continue; }

    changes.push(`blog/${lang}/${name}\n    ${m[1]}\n → ${want}`);
    if (!DRY) {
      const updated = html.replace(
        /<link rel="canonical" href="[^"]+">/,
        `<link rel="canonical" href="${want}">`,
      );
      writeFileSync(file, updated, 'utf8');
    }
    fixed++;
  }
}

if (changes.length) {
  console.log(DRY ? '--dry: 以下を書き換える（実際には書かない）' : '書き換えた:');
  changes.forEach((c) => console.log('  ' + c));
}
console.log(
  `[fix-translation-canonical] ${DRY ? 'would-fix' : 'fixed'}=${fixed} already-ok=${alreadyOk} no-canonical=${noCanonical}`,
);

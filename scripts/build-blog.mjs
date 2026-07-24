#!/usr/bin/env node
// scripts/build-blog.mjs — ブログの生成 / 注入パイプラインを 1 箇所に定義する。
//
// 2026-07-24 新設。それまで順序はコメント 2 箇所（scripts/apply-geo-summaries.mjs:8 と
// specs/2026-06-15-automation-owner-ready.md:31-37）にしか書かれておらず、しかもその記述は
// inject 10 本のうち 6 本をカバーしていなかった。npm script にも Makefile にも落ちていなかった。
//
// 実害: scripts/build-guides.mjs は blog/<slug>.html をテンプレートから全文上書きするため、
// inject-* が積んだブロックを消す。その結果、2026-07-24 時点で
//   canonical が 100 本中 43 本で欠落
//   <!--blognav--> が 320 本中 5 本にしか残っていない
// という状態になっていた。順序を守れば防げる。
//
// 使い方:
//   node scripts/build-blog.mjs --dry     まず必ずこれ。何が走るかだけ表示する
//   node scripts/build-blog.mjs           実行
//   node scripts/build-blog.mjs --from=inject-seo-meta   途中から
//   node scripts/build-blog.mjs --only=inject-hreflang   1 本だけ
//
// 実行後は必ず健全性を測ること:
//   node scripts/check-blog-integrity.mjs

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// 順序に意味がある。理由を各段に書く。
const STEPS = [
  {
    id: "build-prefectures-dataset",
    script: "scripts/build-prefectures-dataset.mjs",
    why: "explore-data.js から data/prefectures.json を作る。以降の全段の入力になる。",
    network: false,
  },
  {
    id: "apply-geo-summaries",
    script: "scripts/apply-geo-summaries.mjs",
    why: "data/geo-summaries-overlay.json で prefectures.json の summary を補完する。dataset の後、evidence の前（apply-geo-summaries.mjs:8 のコメント）。",
    network: false,
  },
  {
    id: "build-guides",
    script: "scripts/build-guides.mjs",
    why: "blog/<slug>.html をテンプレートから全文生成する。破壊的。以降の inject が全部この上に積まれるので、必ず inject より先。",
    destructive: true,
    network: false,
  },
  {
    id: "inject-seo-meta",
    script: "scripts/inject-seo-meta.mjs",
    why: "canonical / favicon / og:image / twitter:card を <head> に入れる。build-guides の HEAD() テンプレートは canonical を含まないので、ここで補う。次段の inject-article-jsonld が canonical を読むので、それより先。",
    network: false,
  },
  {
    id: "inject-article-jsonld",
    script: "scripts/inject-article-jsonld.mjs",
    why: "Article JSON-LD。ページ内の canonical を読むので inject-seo-meta の後。",
    network: false,
  },
  {
    id: "inject-evidence",
    script: "scripts/inject-evidence.mjs",
    why: "TL;DR と BlogPosting JSON-LD。inject-article-jsonld が残した素の Article を掃除して差し替える。JSON-LD の image を og-default.png に固定するので、必ず inject-lead-photo より先。",
    network: false,
  },
  {
    id: "inject-lead-photo",
    script: "scripts/inject-lead-photo.mjs",
    args: ["--all"],
    why: "リード写真の figure と og:image。JSON-LD の image を ImageObject に昇格させる。inject-evidence の後でないと og-default.png に巻き戻る（この依存はどこにも書かれていなかった）。",
    network: false,
  },
  {
    id: "inject-glance-capsule",
    script: "scripts/inject-glance-capsule.mjs",
    why: "lede 直後の 5 軸バーと eat/see カプセル。マーカー除去→再挿入で冪等。",
    network: false,
  },
  {
    id: "inject-section-chips",
    script: "scripts/inject-section-chips.mjs",
    why: "見出し直後のチップ行。マーカー除去→再挿入で冪等。",
    network: false,
  },
  {
    id: "inject-inbody",
    script: "scripts/inject-inbody.mjs",
    why: "本文中 2 枚目の写真。",
    network: false,
  },
  {
    id: "inject-blog-nav",
    script: "scripts/inject-blog-nav.mjs",
    why: "TOC と prev/next と関連リンク。blog/index.html の並び順を実行時に読むので、index が最新であること。",
    network: false,
  },
  {
    id: "inject-hreflang",
    script: "scripts/inject-hreflang.mjs",
    why: "ディスク上に実在する言語版だけ hreflang を張る。翻訳版が出揃った後の最後に回す。",
    network: false,
  },
  {
    id: "build-sitemap",
    script: "scripts/build-sitemap.mjs",
    why: "上の全段が終わってから sitemap を作り直す。",
    network: false,
  },
];

// あえてこのパイプラインに入れていないもの:
//   scripts/inject-index-cards.mjs — 差分がゼロでも毎回 Anthropic API を課金呼び出しする
//                                    (inject-index-cards.mjs:29-37)。必要なときだけ手で回す。
//   scripts/translate-*.mjs        — 翻訳は別サイクル。走らせると API コストが出る。
//   npm run blog:photos:fetch      — Wikimedia から画像を取る。ネットワークが要る。

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const fromArg = argv.find((a) => a.startsWith("--from="));
const onlyArg = argv.find((a) => a.startsWith("--only="));

let steps = STEPS;
if (onlyArg) {
  const id = onlyArg.split("=")[1];
  steps = STEPS.filter((s) => s.id === id);
  if (!steps.length) {
    console.error(`--only=${id} に一致する段がありません。使える id:`);
    STEPS.forEach((s) => console.error("  " + s.id));
    process.exit(1);
  }
} else if (fromArg) {
  const id = fromArg.split("=")[1];
  const i = STEPS.findIndex((s) => s.id === id);
  if (i < 0) {
    console.error(`--from=${id} に一致する段がありません。`);
    process.exit(1);
  }
  steps = STEPS.slice(i);
}

console.log(dry ? "=== dry run（実行しない）===" : "=== blog パイプライン実行 ===");
console.log(`${steps.length} 段\n`);

let failed = 0;
for (const [i, s] of steps.entries()) {
  const path = join(root, s.script);
  const exists = existsSync(path);
  const mark = s.destructive ? " [破壊的: HTML を全文上書き]" : "";
  console.log(`${i + 1}/${steps.length} ${s.id}${mark}`);
  console.log(`   ${s.why}`);
  if (!exists) {
    console.log(`   スキップ: ${s.script} が存在しない`);
    continue;
  }
  if (dry) {
    console.log(`   → node ${s.script}${s.args ? " " + s.args.join(" ") : ""}\n`);
    continue;
  }
  const r = spawnSync(process.execPath, [path, ...(s.args || [])], {
    cwd: root,
    stdio: "inherit",
  });
  if (r.status !== 0) {
    console.error(`   失敗: ${s.id} が exit ${r.status} を返した。ここで止める。`);
    failed = 1;
    break;
  }
  console.log("");
}

if (dry) {
  console.log("dry run 終了。実行するには --dry を外す。");
  console.log("実行後は node scripts/check-blog-integrity.mjs で健全性を測ること。");
}
process.exit(failed);

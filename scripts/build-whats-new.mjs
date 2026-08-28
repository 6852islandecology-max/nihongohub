// scripts/build-whats-new.mjs — blog/whats-new.json を生成する (2026-08-28)。
// 再訪セッション限定の "Recently added" ストリップ (blog/blog-quiz.js) のデータ元。
// git log から直近21日に「追加」された blog/*.html を新しい順に集める。
//   - トップレベルの記事だけ (サブディレクトリ除外)
//   - 翻訳ページ (zh-/es-/id-/th- 接頭辞) と県ページの v2 化 (*-v2.html) は除外
//     (v2 は既存県ページの作り直しで新記事ではない。42県が一斉に出ると枠を埋め尽くす)
//   - --diff-filter=A なので既存記事のリライトでは再掲されない (Gemini 反証 2026-08-28)
// Vercel ビルドでは実行しない (shallow clone で git 履歴が不完全)。ローカルで実行して
// JSON をコミットする。鮮度は npm test の scripts/check-whats-new.mjs が見張る。
// Usage: node scripts/build-whats-new.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_ITEMS = 6;

const log = execFileSync(
  "git",
  ["log", "--diff-filter=A", "--since=21 days ago", "--date=short",
   "--pretty=format:@%ad", "--name-only", "--", "blog/*.html"],
  { cwd: ROOT, encoding: "utf8" },
);

const seen = new Set();
const items = [];
let day = "";
for (const line of log.split(/\r?\n/)) {
  if (line.startsWith("@")) { day = line.slice(1); continue; }
  const m = line.match(/^blog\/([a-z0-9-]+\.html)$/); // トップレベルのみ
  if (!m) continue;
  const file = m[1];
  if (seen.has(file)) continue; // git log は新しい順なので初出 = 追加日
  seen.add(file);
  if (/^(zh|es|id|th)-/.test(file) || /-v2\.html$/.test(file)) continue;
  let title = "";
  try {
    const html = readFileSync(resolve(ROOT, "blog", file), "utf8");
    const t = html.match(/<title>([^<]+)<\/title>/i);
    title = t ? t[1].split("|")[0].split(" — ")[0].trim() : "";
  } catch { continue; } // 追加後に削除されたファイル
  if (!title) continue;
  items.push({ t: title.slice(0, 70), u: "/blog/" + file, d: day });
  if (items.length >= MAX_ITEMS) break;
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  items: items.map(({ t, u }) => ({ t, u })), // 配信 JSON に日付は載せない (最小限)
};
writeFileSync(resolve(ROOT, "blog", "whats-new.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`blog/whats-new.json: ${items.length} items` +
  (items.length ? " — " + items.map((i) => i.u.split("/").pop() + ` (${i.d})`).join(", ") : ""));

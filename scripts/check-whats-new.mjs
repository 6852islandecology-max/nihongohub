// scripts/check-whats-new.mjs — whats-new.json の鮮度チェック (npm test から呼ばれる)。
// 「新記事を追加したのに build-whats-new.mjs を回し忘れる」というサイレント劣化
// (Gemini 反証 2026-08-28 の指摘④) を、テスト失敗として可視化する。
// blog/*.html の最新追加日 > whats-new.json の generated なら exit 1。
// git が無い環境では黙って通す (計測はベストエフォート、テストを壊さない)。
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
try {
  const newest = execFileSync(
    "git",
    ["log", "-1", "--diff-filter=A", "--date=short", "--pretty=format:%ad", "--", "blog/*.html"],
    { cwd: ROOT, encoding: "utf8" },
  ).trim();
  const wn = JSON.parse(readFileSync(resolve(ROOT, "blog", "whats-new.json"), "utf8"));
  if (newest && wn.generated && newest > wn.generated) {
    console.error(
      `whats-new.json が古い (generated=${wn.generated}, 最新記事の追加=${newest})。\n` +
      `直し方: node scripts/build-whats-new.mjs を実行してコミットに含める。`,
    );
    process.exit(1);
  }
  console.log(`whats-new ok (generated=${wn.generated || "?"}, newest article=${newest || "none"})`);
} catch (e) {
  console.log("whats-new check skipped: " + (e && e.message ? e.message.split("\n")[0] : e));
}

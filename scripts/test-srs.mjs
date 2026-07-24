#!/usr/bin/env node
// scripts/test-srs.mjs
// lib/srs-browser.js（本番で実際に動いている SRS 実装）の単体テスト。
//
// 2026-07-24 の変更: 以前この test は lib/srs.js を対象にしていたが、lib/srs.js は
// どこからも呼ばれていないデッドコードだった（ファイル冒頭コメントが挙げる
// api/srs-due.js / api/srs-rate.js はどちらも存在しない）。
// 緑のテストが本番未使用のコードを守っている状態だったので、対象を実装側へ付け替えた。
// lib/srs.js は同日削除。経緯は docs/dead-code-inventory.md。
//
// srs-browser.js はブラウザ用 IIFE で window.NH_SRS に生やすため、
// window と localStorage を最小限だけ用意してから読み込む。
//
// 実行: node scripts/test-srs.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── ブラウザ環境の最小シム ────────────────────────────────────────────
function makeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

const win = {};
const ls = makeLocalStorage();
const src = readFileSync(join(root, "lib", "srs-browser.js"), "utf8");
new Function("window", "localStorage", src)(win, ls);

const SRS = win.NH_SRS;
if (!SRS) {
  console.error("FAIL: lib/srs-browser.js が window.NH_SRS を生やさなかった");
  process.exit(1);
}

// ── テストハーネス ──────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function ok(cond, label, detail = "") {
  if (cond) {
    passed++;
    console.log(`  PASS: ${label}${detail ? " = " + detail : ""}`);
  } else {
    failed++;
    console.log(`  FAIL: ${label}${detail ? " = " + detail : ""}`);
  }
}
function near(actual, expected, tol, label) {
  ok(Math.abs(actual - expected) <= tol, label, `${actual}（期待 ${expected} ±${tol}）`);
}

const MIN = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

// ── Case 1: initialRecord の形 ──────────────────────────────────────
console.log("\n=== Case 1: initialRecord ===");
{
  const r = SRS.initialRecord();
  ok(r.ease_factor === 2.5, "初期 EF", String(r.ease_factor));
  ok(r.interval_days === 0, "初期 interval_days", String(r.interval_days));
  ok(r.repetitions === 0, "初期 repetitions", String(r.repetitions));
  ok(r.last_review_at === null, "初期 last_review_at は null");
  ok(typeof r.next_review_at === "number", "next_review_at は数値");
}

// ── Case 2-5: 学習ステップ（ladder）────────────────────────────────
// 仕様: Again < 1m / Hard 1d / Good 3d / Easy 1w。quiz.html のボタン表記と一致させる。
// rating <= 2 または repetitions < 2 のときは常に ladder を通る。
console.log("\n=== Case 2: rating 1 (Again) は 1 分後 ===");
{
  const before = Date.now();
  const r = SRS.updateRecord(SRS.initialRecord(), 1);
  near(r.next_review_at - before, 1 * MIN, 100, "next_review_at までの ms");
  ok(r.interval_days === 0, "interval_days は 0 に丸まる", String(r.interval_days));
  ok(r.repetitions === 0, "repetitions は 0 にリセット", String(r.repetitions));
  ok(r.last_rating === 1, "last_rating を記録");
}

console.log("\n=== Case 3: rating 2 (Hard) は 1 日後、repetitions リセット ===");
{
  const before = Date.now();
  const r = SRS.updateRecord({ ease_factor: 2.5, interval_days: 10, repetitions: 5 }, 2);
  near(r.next_review_at - before, 1 * DAY, 100, "next_review_at までの ms");
  ok(r.interval_days === 1, "interval_days", String(r.interval_days));
  ok(r.repetitions === 0, "誤答扱いなので repetitions は 0 に戻る", String(r.repetitions));
}

console.log("\n=== Case 4: rating 3 (Good) 初回は 3 日後 ===");
{
  const before = Date.now();
  const r = SRS.updateRecord(SRS.initialRecord(), 3);
  near(r.next_review_at - before, 3 * DAY, 100, "next_review_at までの ms");
  ok(r.interval_days === 3, "interval_days", String(r.interval_days));
  ok(r.repetitions === 1, "repetitions が 1 に進む", String(r.repetitions));
}

console.log("\n=== Case 5: rating 4 (Easy) 2 回目までは 1 週間後 ===");
{
  const before = Date.now();
  const r = SRS.updateRecord({ ease_factor: 2.5, interval_days: 3, repetitions: 1 }, 4);
  near(r.next_review_at - before, 7 * DAY, 100, "next_review_at までの ms");
  ok(r.interval_days === 7, "interval_days", String(r.interval_days));
  ok(r.repetitions === 2, "repetitions が 2 に進む", String(r.repetitions));
}

// ── Case 6-7: repetitions >= 2 かつ Good/Easy で SM-2 に切り替わる ──
console.log("\n=== Case 6: repetitions>=2 + rating 3 で SM-2 へ。EF は据え置き ===");
{
  const r = SRS.updateRecord({ ease_factor: 2.5, interval_days: 7, repetitions: 2 }, 3);
  ok(r.interval_days === Math.round(7 * 2.5), "I = round(I * EF)", String(r.interval_days));
  // q=4 のとき EF 増分は 0.1 - (5-4)*(0.08 + (5-4)*0.02) = 0.1 - 0.1 = 0
  near(r.ease_factor, 2.5, 0.0001, "EF");
  ok(r.repetitions === 3, "repetitions", String(r.repetitions));
}

console.log("\n=== Case 7: repetitions>=2 + rating 4 で EF が 0.1 増える ===");
{
  const r = SRS.updateRecord({ ease_factor: 2.5, interval_days: 7, repetitions: 2 }, 4);
  near(r.ease_factor, 2.6, 0.0001, "EF");
  ok(r.interval_days === Math.round(7 * 2.5), "I は更新前 EF で計算される", String(r.interval_days));
}

// ── Case 8: 不正な rating ───────────────────────────────────────────
console.log("\n=== Case 8: 不正な rating は throw ===");
{
  let threw = false;
  try { SRS.updateRecord(SRS.initialRecord(), 99); } catch (e) { threw = true; }
  ok(threw, "rating 99 で throw する");

  let threw0 = false;
  try { SRS.updateRecord(SRS.initialRecord(), 0); } catch (e) { threw0 = true; }
  ok(threw0, "rating 0 で throw する");
}

// ── Case 9: EF の下限 1.3 は現行実装では到達しない ──────────────────
// SM-2 経路は rating >= 3 のときしか通らず、Q_MAP[3]=4 / Q_MAP[4]=5 なので
// EF の増分は 0 か +0.1 にしかならない。つまり srs-browser.js:43 の EF_MIN
// クランプは到達不能。バグではなく ladder 導入の副作用。仕様変更の検出用に固定する。
console.log("\n=== Case 9: SM-2 経路で EF は下がらない（EF_MIN クランプは到達不能）===");
{
  let rec = { ease_factor: 1.4, interval_days: 7, repetitions: 2 };
  for (let i = 0; i < 5; i++) rec = SRS.updateRecord(rec, 3);
  ok(rec.ease_factor >= 1.4, "rating 3 を繰り返しても EF は下がらない", String(rec.ease_factor));
}

// ── Case 10: 間違い記録ストアの往復 ─────────────────────────────────
console.log("\n=== Case 10: recordMistake / rateMistake / 卒業 ===");
{
  ls.clear();
  ok(SRS.getMistakes().length === 0, "初期状態は空");

  SRS.recordMistake({ question: "問1", options: ["a", "b"], answer: "a", level: "N5", topic: "any" });
  ok(SRS.getMistakes().length === 1, "1 件記録された");

  // 同じ問題をもう一度間違えても増えない（id は question|answer のハッシュ）
  SRS.recordMistake({ question: "問1", options: ["a", "b"], answer: "a", level: "N5", topic: "any" });
  ok(SRS.getMistakes().length === 1, "同一問題は重複追加されない");

  const id = SRS.getMistakes()[0].id;
  ok(SRS.dueMistakes().length === 1, "記録直後は復習対象");

  // Good を 3 回で卒業（repetitions >= 3 で一覧から消える）
  SRS.rateMistake(id, 3); // ladder: n=1
  SRS.rateMistake(id, 3); // ladder: n=2
  ok(SRS.getMistakes().length === 1, "2 回目までは残る");
  SRS.rateMistake(id, 3); // SM-2: n=3 → 卒業
  ok(SRS.getMistakes().length === 0, "3 回正解で一覧から消える");

  ok(SRS.rateMistake("存在しないid", 3) === null, "未知の id には null を返す");
  ok(SRS.countDueToday() === 0, "countDueToday は 0");
}

console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);

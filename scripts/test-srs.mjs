#!/usr/bin/env node
// scripts/test-srs.mjs
// PR-16 SM-2 algorithm unit tests (5 cases, no external dependencies)
// 仕様書: specs/PR-16-srs-algorithm-survey.md §6.2
// 実行: node scripts/test-srs.mjs
// 期待: 5 cases all PASS

import {
  updateSrsRecord,
  predictIntervals,
  initialSrsRecord,
  SRS_CONSTANTS,
} from "../lib/srs.js";

let passed = 0;
let failed = 0;

function assertEq(actual, expected, label) {
  const ok =
    typeof expected === "number" && typeof actual === "number"
      ? Math.abs(actual - expected) < 0.001
      : actual === expected;
  if (ok) {
    console.log(`  PASS: ${label} = ${actual}`);
    passed++;
  } else {
    console.log(`  FAIL: ${label} = ${actual}, expected ${expected}`);
    failed++;
  }
}

function assertApprox(actual, expected, tol, label) {
  if (Math.abs(actual - expected) <= tol) {
    console.log(`  PASS: ${label} = ${actual.toFixed(4)} (±${tol} of ${expected})`);
    passed++;
  } else {
    console.log(`  FAIL: ${label} = ${actual}, expected ${expected} ±${tol}`);
    failed++;
  }
}

// ---- Case 1: First review, rating=3 (good) ----
console.log("\n=== Case 1: First review, rating=good (3) ===");
{
  const record = initialSrsRecord({ user_id: "u1", quiz_id: "q1" });
  const updated = updateSrsRecord(record, 3);
  assertEq(updated.repetitions, 1, "repetitions after 1st good");
  assertEq(updated.interval_days, 1, "interval after 1st good");
  assertApprox(updated.ease_factor, 2.5, 0.001, "EF unchanged on q=4 good");
  assertEq(updated.last_rating, 3, "last_rating");
}

// ---- Case 2: Second review, rating=3 (good) ----
console.log("\n=== Case 2: Second consecutive good ===");
{
  const record = {
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 1,
  };
  const updated = updateSrsRecord(record, 3);
  assertEq(updated.repetitions, 2, "repetitions after 2nd good");
  assertEq(updated.interval_days, 6, "interval after 2nd good (SM-2 fixed = 6)");
  assertApprox(updated.ease_factor, 2.5, 0.001, "EF unchanged on q=4");
}

// ---- Case 3: 5 consecutive good (n=3,4,5 interval doubles via EF) ----
console.log("\n=== Case 3: 5 consecutive good reviews ===");
{
  let record = initialSrsRecord({ user_id: "u3", quiz_id: "q3" });
  let updated;
  for (let i = 1; i <= 5; i++) {
    updated = updateSrsRecord(record, 3);
    console.log(
      `  After review ${i}: n=${updated.repetitions}, I=${updated.interval_days}, EF=${updated.ease_factor.toFixed(4)}`,
    );
    record = updated;
  }
  // Expected: n=5
  // I(1)=1, I(2)=6, I(3)=round(6*2.5)=15, I(4)=round(15*2.5)=38, I(5)=round(38*2.5)=95
  assertEq(record.repetitions, 5, "n after 5 goods");
  assertEq(record.interval_days, 95, "I after 5 goods");
}

// ---- Case 4: Failure (rating=1 again) resets ----
console.log("\n=== Case 4: Failure resets progression ===");
{
  const record = {
    ease_factor: 2.5,
    interval_days: 38,
    repetitions: 4,
  };
  const updated = updateSrsRecord(record, 1);
  assertEq(updated.repetitions, 0, "n reset on again");
  assertEq(updated.interval_days, 1, "I reset to 1 on again");
  assertApprox(updated.ease_factor, 2.5, 0.001, "EF unchanged on failure (q<3)");
}

// ---- Case 5: rating=2 (hard, q=3) reduces EF ----
console.log("\n=== Case 5: Hard rating reduces EF ===");
{
  const record = {
    ease_factor: 2.5,
    interval_days: 6,
    repetitions: 2,
  };
  const updated = updateSrsRecord(record, 2);
  // q=3 (hard): EF = 2.5 + (0.1 - (5-3)*(0.08 + (5-3)*0.02)) = 2.5 + (0.1 - 2*0.12) = 2.5 + (-0.14) = 2.36
  assertEq(updated.repetitions, 3, "n increments on hard (still graduates)");
  assertEq(updated.interval_days, 15, "I = round(6 * 2.5) = 15");
  assertApprox(updated.ease_factor, 2.36, 0.001, "EF decreases on q=3 hard");
}

// ---- Case 6: EF floor at 1.3 ----
console.log("\n=== Case 6: EF floor at 1.3 ===");
{
  const record = {
    ease_factor: 1.35,
    interval_days: 2,
    repetitions: 2,
  };
  const updated = updateSrsRecord(record, 2); // hard
  // EF candidate = 1.35 + (-0.14) = 1.21 → floor to 1.3
  assertApprox(updated.ease_factor, 1.3, 0.001, "EF clamped to 1.3 floor");
}

// ---- Case 7: predictIntervals returns 4 entries ----
console.log("\n=== Case 7: predictIntervals ===");
{
  const record = { ease_factor: 2.5, interval_days: 6, repetitions: 2 };
  const intervals = predictIntervals(record);
  assertEq(Object.keys(intervals).length, 4, "predictIntervals key count");
  assertEq(intervals[1], "< 1m", "rating 1 label");
  assertEq(intervals[3], "~15d", "rating 3 (good) → 15d");
}

// ---- Case 8: Invalid rating throws ----
console.log("\n=== Case 8: Invalid rating ===");
{
  try {
    updateSrsRecord(initialSrsRecord({ user_id: "u8", quiz_id: "q8" }), 99);
    console.log("  FAIL: should have thrown");
    failed++;
  } catch (e) {
    if (e.message.includes("Invalid rating")) {
      console.log(`  PASS: throws on invalid rating: ${e.message}`);
      passed++;
    } else {
      console.log(`  FAIL: wrong error: ${e.message}`);
      failed++;
    }
  }
}

// ---- Summary ----
console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);

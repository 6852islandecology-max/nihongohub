// lib/srs.js
// PR-16 SRS (Spaced Repetition System) — SM-2 algorithm
// 仕様書: specs/PR-16-srs-algorithm-survey.md §3.2.2
// Phase C1 MVP (5/17-6/1) で api/srs-due.js / api/srs-rate.js から呼出
//
// SM-2 origin: Wozniak, P. A. (1985). SuperMemo 2 algorithm.
// Adapted for NihongoHub: 4-button UI (again/hard/good/easy) mapped to SM-2 quality 0-5.

/**
 * Map 4-button UI rating to SM-2 quality grade.
 *   1 (again): q=0 → reset
 *   2 (hard):  q=3 → graduate but harder schedule
 *   3 (good):  q=4 → standard progression
 *   4 (easy):  q=5 → faster progression
 */
const Q_MAP = { 1: 0, 2: 3, 3: 4, 4: 5 };

const EF_MIN = 1.3; // SM-2 lower bound for ease factor
const EF_INITIAL = 2.5; // SM-2 standard initial EF for new cards

/**
 * Update SRS record after a user rates a quiz review.
 *
 * @param {object} record - Current SRS record from `srs_reviews` table.
 *   - ease_factor (number): current EF (default 2.5 for first review)
 *   - interval_days (number): current interval in days (default 0)
 *   - repetitions (number): consecutive successful reviews (default 0)
 * @param {number} rating - User input from UI: 1=again, 2=hard, 3=good, 4=easy
 * @returns {object} Updated record fields:
 *   - ease_factor, interval_days, repetitions,
 *     last_review_at, next_review_at, last_rating, updated_at
 * @throws {Error} If rating is not 1-4
 */
export function updateSrsRecord(record, rating) {
  const q = Q_MAP[rating];
  if (q === undefined) {
    throw new Error(`Invalid rating: ${rating}. Must be 1-4 (again/hard/good/easy).`);
  }

  let EF = typeof record.ease_factor === "number" ? record.ease_factor : EF_INITIAL;
  let I = typeof record.interval_days === "number" ? record.interval_days : 0;
  let n = typeof record.repetitions === "number" ? record.repetitions : 0;

  if (q < 3) {
    // Failure (rating=1 → again): reset progression
    n = 0;
    I = 1;
  } else {
    // Success: increase interval
    n += 1;
    if (n === 1) {
      I = 1;
    } else if (n === 2) {
      I = 6;
    } else {
      I = Math.round(I * EF);
    }

    // Update EF (SM-2 formula)
    EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (EF < EF_MIN) EF = EF_MIN;
  }

  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + I * 24 * 60 * 60 * 1000);

  return {
    ease_factor: EF,
    interval_days: I,
    repetitions: n,
    last_review_at: now,
    next_review_at: nextReviewAt,
    last_rating: rating,
    updated_at: now,
  };
}

/**
 * Predict the next interval for each rating button (for UI label display).
 * Returns an object mapping rating (1-4) to interval description string.
 *
 * @param {object} record - Current SRS record (ease_factor, interval_days, repetitions)
 * @returns {object} { 1: '< 1m', 2: '~Nd', 3: '~Nd', 4: '~Nd' }
 */
export function predictIntervals(record) {
  const result = {};
  for (const rating of [1, 2, 3, 4]) {
    const sim = updateSrsRecord(record, rating);
    if (rating === 1) {
      result[rating] = "< 1m";
    } else {
      result[rating] = `~${sim.interval_days}d`;
    }
  }
  return result;
}

/**
 * Build a new SRS record for a previously-unseen quiz.
 * Used when api/srs-rate.js receives a rating for a quiz_id with no existing row.
 */
export function initialSrsRecord({ user_id, quiz_id }) {
  return {
    user_id,
    quiz_id,
    ease_factor: EF_INITIAL,
    interval_days: 0,
    repetitions: 0,
    last_review_at: null,
    next_review_at: new Date(), // due immediately
    last_rating: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export const SRS_CONSTANTS = { Q_MAP, EF_MIN, EF_INITIAL };

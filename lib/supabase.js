// [server] Vercel Serverless Functions から import される。ブラウザからは読み込まれない。
// lib/supabase.js
// Supabase クライアント + pregenerated_quiz 操作（未設定時は null を返しキャッシュスキップ）

import { createClient } from "@supabase/supabase-js";

let cached = null;

export function getSupabase() {
  if (cached !== null) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cached = false;
    return null;
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export function isSupabaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// 2026-06-08: explanation-quality + level-calibration prompt overhaul (rules 11/13/14).
// The bank was fully regenerated with the new prompt at this cutoff; older rows
// (stale okurigana / thin explanations) remain for archival but are never served.
// Previous cutoff was 2026-05-03T12:20:00Z.
const CACHE_MIN_CREATED_AT = "2026-06-07T22:00:00Z";

const SERVE_WINDOW = 30;

export async function fetchCachedQuiz({ level, lang }) {
  const client = getSupabase();
  if (!client) return null;

  // バケット全体（67〜130+ 問）を循環させるため、まず件数を数えてランダムな
  // オフセットから窓 (SERVE_WINDOW 件) を取得し、その中で JS 側 pick する。
  // 旧実装は limit(50) 固定で先頭 50 問しか配信されず、それを超える在庫が
  // 死蔵していた。count が取れない時は旧挙動 (先頭 SERVE_WINDOW 件) に退避。
  let data, error;
  const { count, error: countErr } = await client
    .from("pregenerated_quiz")
    .select("*", { count: "exact", head: true })
    .eq("level", level)
    .eq("lang", lang)
    .gte("created_at", CACHE_MIN_CREATED_AT);

  if (!countErr && count && count > 0) {
    const maxOffset = Math.max(0, count - SERVE_WINDOW);
    const offset = Math.floor(Math.random() * (maxOffset + 1));
    ({ data, error } = await client
      .from("pregenerated_quiz")
      .select("question_ja, reading, correct, distractors, explanation")
      .eq("level", level)
      .eq("lang", lang)
      .gte("created_at", CACHE_MIN_CREATED_AT)
      .order("created_at", { ascending: true })
      .order("question_ja", { ascending: true })
      .range(offset, offset + SERVE_WINDOW - 1));
  } else {
    ({ data, error } = await client
      .from("pregenerated_quiz")
      .select("question_ja, reading, correct, distractors, explanation")
      .eq("level", level)
      .eq("lang", lang)
      .gte("created_at", CACHE_MIN_CREATED_AT)
      .limit(SERVE_WINDOW));
  }

  if (error) {
    console.error("Supabase fetchCachedQuiz error:", error.message);
    return null;
  }
  if (!data || data.length === 0) return null;

  const pick = data[Math.floor(Math.random() * data.length)];
  return {
    question: pick.question_ja,
    reading: pick.reading || "",
    correct: pick.correct,
    distractors: Array.isArray(pick.distractors) ? pick.distractors : [],
    explanation: pick.explanation || "",
  };
}

export async function insertPregenerated({ level, lang, items }) {
  const client = getSupabase();
  if (!client) {
    throw new Error("Supabase is not configured");
  }
  const rows = items.map((it) => ({
    level,
    lang,
    question_ja: it.question,
    reading: it.reading || null,
    correct: it.correct,
    distractors: it.distractors,
    explanation: it.explanation || null,
  }));
  const { error, count } = await client
    .from("pregenerated_quiz")
    .insert(rows, { count: "exact" });
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return count ?? rows.length;
}

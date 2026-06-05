// api/generate.js
// POST /api/generate — キャッシュ優先 + ゲスト日次リミット + Haiku 4.5 フォールバック

import { VALID_LEVELS, VALID_LANGS, VALID_TOPICS, generateQuiz } from "../lib/anthropic.js";
import { fetchCachedQuiz, getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { checkGuestDailyLimit, extractIp } from "../lib/ratelimit.js";
import { applyCors } from "../lib/cors.js";
import { initSentry, captureApiError } from "../lib/sentry.js";
import { getAuthedUser, isAuthConfigured } from "../lib/auth.js";

// Server-side trial verification: ignores client-supplied flags, checks Supabase users table.
async function isUserTrialActive(req) {
  if (!isAuthConfigured() || !isSupabaseConfigured()) return false;
  try {
    const user = await getAuthedUser(req);
    if (!user) return false;
    const db = getSupabase();
    const { data: p } = await db.from("users")
      .select("trial_status, trial_end_date, plan").eq("id", user.id).single();
    if (!p) return false;
    if (p.plan === "pro" || p.plan === "lifetime") return true; // paid plans always unlimited
    if (p.trial_status !== "active" || !p.trial_end_date) return false;
    return new Date(p.trial_end_date).getTime() > Date.now();
  } catch (e) {
    console.error("trial verification failed, defaulting to false:", e.message);
    return false;
  }
}

export default async function handler(req, res) {
  initSentry();
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { level = "N5", lang = "en", topic = "any" } = req.body || {};
  if (!VALID_LEVELS.includes(level) || !VALID_LANGS.includes(lang) || !VALID_TOPICS.includes(topic)) {
    return res.status(400).json({ error: "Invalid level, lang, or topic parameter" });
  }

  // 1. ゲスト日次リミット（Upstash 未設定時は fail-open で通す）
  // Trial キャップ 50/日: クライアント提示フラグは無視、サーバ側 (Supabase users.trial_status) で検証
  const ip = extractIp(req);
  const isTrialActive = await isUserTrialActive(req);
  const rl = await checkGuestDailyLimit(ip, level, { isTrialActive });
  if (!rl.success) {
    return res.status(429).json({
      error: "Daily limit reached",
      limit: rl.limit,
      remaining: rl.remaining,
      reset: rl.reset,
      trial: rl.trial,
    });
  }

  // 2. キャッシュ優先（Supabase 未設定時 / トピック指定時はスキップして 3 = ライブ生成へ）
  //    キャッシュ表は topic 列を持たないため、topic !== "any" のときは必ずライブ生成して
  //    選択トピックを反映する（"any" のみキャッシュ優先でコストを抑える）。
  if (isSupabaseConfigured() && topic === "any") {
    try {
      const cached = await fetchCachedQuiz({ level, lang });
      if (cached) {
        return res.status(200).json({
          ...cached,
          source: "cached",
          remaining: rl.remaining,
        });
      }
    } catch (err) {
      console.error("Cache lookup failed, falling back to live generation:", err.message);
    }
  }

  // 3. リアルタイム Haiku 生成（フォールバック）
  try {
    const quiz = await generateQuiz({ level, lang, topic });
    return res.status(200).json({ ...quiz, source: "generated", remaining: rl.remaining });
  } catch (err) {
    if (err.code === "NO_API_KEY") {
      console.error("ANTHROPIC_API_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }
    if (err.code === "ANTHROPIC_ERROR") {
      console.error("Anthropic API error:", err.status, err.body);
      captureApiError(err, { api: "generate", level, lang, kind: "ANTHROPIC_ERROR", status: err.status });
      return res.status(502).json({ error: "AI service error", status: err.status });
    }
    if (err.code === "MALFORMED_RESPONSE") {
      console.error("Malformed AI response:", err.preview);
      captureApiError(err, { api: "generate", level, lang, kind: "MALFORMED_RESPONSE" });
      return res.status(502).json({ error: "Malformed AI response" });
    }
    console.error("generate handler error:", err);
    captureApiError(err, { api: "generate", level, lang, kind: "UNKNOWN" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

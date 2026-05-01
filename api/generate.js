// api/generate.js
// POST /api/generate — キャッシュ優先 + ゲスト日次リミット + Haiku 4.5 フォールバック

import { VALID_LEVELS, VALID_LANGS, generateQuiz } from "../lib/anthropic.js";
import { fetchCachedQuiz, isSupabaseConfigured } from "../lib/supabase.js";
import { checkGuestDailyLimit, extractIp } from "../lib/ratelimit.js";
import { applyCors } from "../lib/cors.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { level = "N5", lang = "en" } = req.body || {};
  if (!VALID_LEVELS.includes(level) || !VALID_LANGS.includes(lang)) {
    return res.status(400).json({ error: "Invalid level or lang parameter" });
  }

  // 1. ゲスト日次リミット（Upstash 未設定時は fail-open で通す）
  const ip = extractIp(req);
  const rl = await checkGuestDailyLimit(ip);
  if (!rl.success) {
    return res.status(429).json({
      error: "Daily limit reached",
      limit: rl.limit,
      remaining: rl.remaining,
      reset: rl.reset,
    });
  }

  // 2. キャッシュ優先（Supabase 未設定時はスキップして 3 に進む）
  if (isSupabaseConfigured()) {
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
    const quiz = await generateQuiz({ level, lang });
    return res.status(200).json({ ...quiz, source: "generated", remaining: rl.remaining });
  } catch (err) {
    if (err.code === "NO_API_KEY") {
      console.error("ANTHROPIC_API_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }
    if (err.code === "ANTHROPIC_ERROR") {
      console.error("Anthropic API error:", err.status, err.body);
      return res.status(502).json({ error: "AI service error", status: err.status });
    }
    if (err.code === "MALFORMED_RESPONSE") {
      console.error("Malformed AI response:", err.preview);
      return res.status(502).json({ error: "Malformed AI response" });
    }
    console.error("generate handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

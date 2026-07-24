// api/generate.js
// POST /api/generate — キャッシュ優先 + ゲスト日次リミット + Haiku 4.5 フォールバック

import { VALID_LEVELS, VALID_LANGS, VALID_TOPICS, generateQuiz } from "../lib/anthropic.js";
import { fetchCachedQuiz, getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { checkGuestDailyLimit, extractIp, FREE_LEVELS } from "../lib/ratelimit.js";
import { applyCors } from "../lib/cors.js";
import { initSentry, captureApiError } from "../lib/sentry.js";
import { getAuthedUser } from "../lib/auth.js";
import { isAuthConfigured } from "../lib/env.js";
import { entitlementFromProfile } from "../lib/billing-rules.js";

// Server-side entitlement: ignores client-supplied flags, checks the Supabase users table.
// Returns { paid, trialActive }. paid (pro/lifetime) means truly unlimited (no daily cap);
// trialActive raises the guest cap to the trial cap (50/day) but is NOT unlimited.
async function getEntitlement(req) {
  const none = { paid: false, trialActive: false };
  if (!isAuthConfigured() || !isSupabaseConfigured()) return none;
  try {
    const user = await getAuthedUser(req);
    if (!user) return none;
    const db = getSupabase();
    const { data: p } = await db.from("users")
      .select("trial_status, trial_end_date, plan").eq("id", user.id).single();
    // 判定は lib/billing-rules.js に移した（外部サービス無しでテストするため）。挙動は同じ。
    return entitlementFromProfile(p);
  } catch (e) {
    console.error("entitlement check failed, defaulting to none:", e.message);
    return none;
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

  // 1. 日次リミット（Upstash 未設定時は fail-open で通す）。判定はサーバ側 (Supabase) のみ。
  //    paid (pro/lifetime) = 真の無制限なのでリミッタを完全にバイパス。
  //    trial = ゲスト30/日 → 50/日に緩和。未ログイン/Free = ゲスト30/日。
  const ip = extractIp(req);
  const { paid, trialActive } = await getEntitlement(req);
  let rl = { success: true, remaining: null };
  if (!paid) {
    rl = await checkGuestDailyLimit(ip, level, { isTrialActive: trialActive });
    if (!rl.success) {
      return res.status(429).json({
        error: "Daily limit reached",
        limit: rl.limit,
        remaining: rl.remaining,
        reset: rl.reset,
        trial: rl.trial,
      });
    }
  }

  // 2. キャッシュ優先。キャッシュ表は topic 列を持たないため、capped レベル (N3/N2/N1) で
  //    topic 指定時はライブ生成して選択トピックを反映する。N5/N4 は日次上限が無く (FREE_LEVELS)
  //    青天井のコスト源になり得るため、topic 指定でも必ずキャッシュのみ（ライブ生成しない）。
  const useCacheOnly = topic === "any" || FREE_LEVELS.includes(level);
  if (isSupabaseConfigured() && useCacheOnly) {
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

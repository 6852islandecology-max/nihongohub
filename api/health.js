// api/health.js — 拡張版 ヘルスチェック

import { isSupabaseConfigured } from "../lib/supabase.js";
import { isRedisConfigured } from "../lib/ratelimit.js";
import { applyCors } from "../lib/cors.js";
import { initSentry, isSentryConfigured } from "../lib/sentry.js";

export default function handler(req, res) {
  initSentry();
  if (applyCors(req, res)) return;
  res.status(200).json({
    status: "ok",
    model: "claude-haiku-4-5-20251001",
    apiKeySet: !!process.env.ANTHROPIC_API_KEY,
    supabaseConfigured: isSupabaseConfigured(),
    redisConfigured: isRedisConfigured(),
    adminKeySet: !!process.env.ADMIN_KEY,
    sentryConfigured: isSentryConfigured(),
    timestamp: new Date().toISOString(),
  });
}

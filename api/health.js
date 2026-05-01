// api/health.js — 拡張版 ヘルスチェック

import { isSupabaseConfigured } from "../lib/supabase.js";
import { isRedisConfigured } from "../lib/ratelimit.js";
import { applyCors } from "../lib/cors.js";

export default function handler(req, res) {
  if (applyCors(req, res)) return;
  res.status(200).json({
    status: "ok",
    model: "claude-haiku-4-5-20251001",
    apiKeySet: !!process.env.ANTHROPIC_API_KEY,
    supabaseConfigured: isSupabaseConfigured(),
    redisConfigured: isRedisConfigured(),
    adminKeySet: !!process.env.ADMIN_KEY,
    timestamp: new Date().toISOString(),
  });
}

// lib/ratelimit.js
// Upstash Redis で IP ベースのゲスト日次リミット（未設定時は fail-open）

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const GUEST_DAILY_LIMIT = 30;

let limiter = null;

function getLimiter() {
  if (limiter !== null) return limiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiter = false;
    return null;
  }
  const redis = new Redis({ url, token });
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(GUEST_DAILY_LIMIT, "1 d"),
    analytics: true,
    prefix: "nihongohub:guest",
  });
  return limiter;
}

export function isRedisConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function extractIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

export async function checkGuestDailyLimit(ip) {
  const l = getLimiter();
  if (!l) {
    return { success: true, limit: GUEST_DAILY_LIMIT, remaining: GUEST_DAILY_LIMIT, skipped: true };
  }
  try {
    const { success, limit, remaining, reset } = await l.limit(ip);
    return { success, limit, remaining, reset, skipped: false };
  } catch (err) {
    console.error("Ratelimit check failed, fail-open:", err.message);
    return { success: true, limit: GUEST_DAILY_LIMIT, remaining: GUEST_DAILY_LIMIT, skipped: true };
  }
}

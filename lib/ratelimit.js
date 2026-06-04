// lib/ratelimit.js
// Upstash Redis で IP ベースのゲスト日次リミット（未設定時は fail-open）

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const GUEST_DAILY_LIMIT = 30;
const TRIAL_DAILY_LIMIT = 50;
const FREE_LEVELS = ['N5', 'N4'];

let limiter = null;
let trialLimiter = null;

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

function getTrialLimiter() {
  if (trialLimiter !== null) return trialLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    trialLimiter = false;
    return null;
  }
  const redis = new Redis({ url, token });
  trialLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(TRIAL_DAILY_LIMIT, "1 d"),
    analytics: true,
    prefix: "nihongohub:trial",
  });
  return trialLimiter;
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

export async function checkGuestDailyLimit(ip, level, { isTrialActive = false } = {}) {
  if (FREE_LEVELS.includes(level)) {
    return { success: true, limit: null, remaining: null, skipped: true };
  }
  const cap = isTrialActive ? TRIAL_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  const l = isTrialActive ? getTrialLimiter() : getLimiter();
  if (!l) {
    return { success: true, limit: cap, remaining: cap, skipped: true };
  }
  try {
    const { success, limit, remaining, reset } = await l.limit(ip);
    return { success, limit, remaining, reset, skipped: false, trial: isTrialActive };
  } catch (err) {
    console.error("Ratelimit check failed, fail-open:", err.message);
    return { success: true, limit: cap, remaining: cap, skipped: true };
  }
}

// api/daily-coach.js
// POST /api/daily-coach — one short, personalized coaching line for the dashboard's
// "Today's Mission" card. Haiku 4.5, server-side key. The client caches the result
// once per day per user, so this is at most ~1 call/active-user/day. Fail-soft: any
// error returns 200 with { ok:false } and the client falls back to a templated line.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { applyCors } from "../lib/cors.js";
import { extractIp } from "../lib/ratelimit.js";
import { initSentry, captureApiError } from "../lib/sentry.js";

const LANG_NAMES = { en: "English", zh: "Traditional Chinese", es: "Spanish", th: "Thai", id: "Indonesian" };
const VALID_LANGS = Object.keys(LANG_NAMES);

// Coarse per-IP daily cap so a misbehaving client can't run up cost. Fail-open if Upstash absent.
let coachLimiter = null;
function getCoachLimiter() {
  if (coachLimiter !== null) return coachLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) { coachLimiter = false; return null; }
  coachLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(20, "1 d"),
    analytics: true,
    prefix: "nihongohub:coach",
  });
  return coachLimiter;
}

function sanitize(v, max) {
  return String(v == null ? "" : v).replace(/[\r\n]+/g, " ").slice(0, max);
}

function buildPrompt(sig, langName) {
  const lines = [
    `Level: ${sig.level} (working toward ${sig.quizLevel})`,
    `Today's quiz topic: ${sig.topic}`,
    `Longest streak: ${sig.streak} days`,
    `Reviews due today: ${sig.due}`,
    `Questions answered so far today: ${sig.answeredToday}`,
  ];
  if (sig.weak) lines.push(`Weakest word right now: ${sig.weak}`);
  if (sig.article) lines.push(`Today's recommended article: ${sig.article}`);
  return [
    "You are Akari, the friendly coach mascot of NihongoHub, a Japanese-learning app.",
    `Write ONE short encouraging coaching line (max 2 sentences, under 30 words) in ${langName}.`,
    "Speak directly to the learner. Reference exactly one concrete detail from their stats below",
    "(their streak, a due review, their weak word, or today's topic) to make it feel personal.",
    "Be warm and motivating, never generic. Do not use markdown, hashtags, or emoji. Output only the line.",
    "",
    "Learner stats:",
    ...lines,
  ].join("\n");
}

export default async function handler(req, res) {
  initSentry();
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const body = req.body || {};
  const lang = VALID_LANGS.includes(body.lang) ? body.lang : "en";
  const sig = {
    level: sanitize(body.level, 4) || "N5",
    quizLevel: sanitize(body.quizLevel, 4) || "N5",
    topic: sanitize(body.topic, 24),
    streak: Math.max(0, Math.min(9999, parseInt(body.streak, 10) || 0)),
    due: Math.max(0, Math.min(9999, parseInt(body.due, 10) || 0)),
    answeredToday: Math.max(0, Math.min(9999, parseInt(body.answeredToday, 10) || 0)),
    weak: sanitize(body.weak, 80),
    article: sanitize(body.article, 60),
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ ok: false, reason: "unconfigured" });

  // Rate limit (fail-open). Client already caches 1/day; this just caps abuse.
  const l = getCoachLimiter();
  if (l) {
    try {
      const { success } = await l.limit(extractIp(req));
      if (!success) return res.status(200).json({ ok: false, reason: "rate_limited" });
    } catch (e) { /* fail-open */ }
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        messages: [{ role: "user", content: buildPrompt(sig, LANG_NAMES[lang]) }],
      }),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      captureApiError(new Error("Anthropic " + r.status), { api: "daily-coach", status: r.status, body: txt.slice(0, 200) });
      return res.status(200).json({ ok: false, reason: "ai_error" });
    }
    const data = await r.json();
    const text = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join(" ")
      .trim()
      .replace(/^["'“”]+|["'“”]+$/g, "")
      .slice(0, 200);
    if (!text) return res.status(200).json({ ok: false, reason: "empty" });
    return res.status(200).json({ ok: true, line: text });
  } catch (err) {
    captureApiError(err, { api: "daily-coach", kind: "UNKNOWN" });
    return res.status(200).json({ ok: false, reason: "exception" });
  }
}

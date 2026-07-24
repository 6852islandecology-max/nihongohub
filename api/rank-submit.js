// api/rank-submit.js — upsert the caller's anonymous score into the country/month leaderboard.
// Country comes from Vercel's edge geo header (coarse, not stored as PII beyond the 2-letter code).
import { getSupabase } from "../lib/supabase.js";
import { isAuthConfigured, isSupabaseConfigured } from "../lib/env.js";
import { methodGuard, requireAuth, parseBody } from "../lib/http.js";
import { currentPeriod } from "../lib/period.js";
import { VALID_LEVELS } from "../lib/quiz-constants.js";

export default async function handler(req, res) {
  if (methodGuard(req, res, "POST")) return;
  if (!isAuthConfigured() || !isSupabaseConfigured()) return res.status(200).json({ ok: false, skipped: true });

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = parseBody(req);
  let score = Number(body.score);
  if (!isFinite(score)) score = 0;
  score = Math.max(0, Math.min(1, score));
  // 2026-07-24: 以前は slice(0,4) で任意の 4 文字が DB に入っていた。
  // leaderboard.level は表示にしか使わないが、集計の軸になりうるので既知の値に限定する。
  // 想定外の値は null（= レベル不明）にフォールバックする。既存行の形は変えていない。
  const rawLevel = typeof body.level === "string" ? body.level.slice(0, 4) : null;
  const level = VALID_LEVELS.includes(rawLevel) ? rawLevel : null;

  const country = (req.headers["x-vercel-ip-country"] || "XX").toString().toUpperCase().slice(0, 2);
  const period = currentPeriod();

  const db = getSupabase();
  const { error } = await db.from("leaderboard").upsert({
    user_id: user.id, country, score, level, period, updated_at: new Date().toISOString()
  });
  if (error) { console.error("rank-submit:", error.message); return res.status(500).json({ error: "submit failed" }); }
  return res.status(200).json({ ok: true, country, period });
}

// api/rank-submit.js — upsert the caller's anonymous score into the country/month leaderboard.
// Country comes from Vercel's edge geo header (coarse, not stored as PII beyond the 2-letter code).
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { getAuthedUser, isAuthConfigured } from "../lib/auth.js";

function currentPeriod() {
  const d = new Date();
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAuthConfigured() || !isSupabaseConfigured()) return res.status(200).json({ ok: false, skipped: true });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  let body = {};
  try { body = typeof req.body === "object" && req.body ? req.body : JSON.parse(req.body || "{}"); } catch (e) {}
  let score = Number(body.score);
  if (!isFinite(score)) score = 0;
  score = Math.max(0, Math.min(1, score));
  const level = typeof body.level === "string" ? body.level.slice(0, 4) : null;

  const country = (req.headers["x-vercel-ip-country"] || "XX").toString().toUpperCase().slice(0, 2);
  const period = currentPeriod();

  const db = getSupabase();
  const { error } = await db.from("leaderboard").upsert({
    user_id: user.id, country, score, level, period, updated_at: new Date().toISOString()
  });
  if (error) { console.error("rank-submit:", error.message); return res.status(500).json({ error: "submit failed" }); }
  return res.status(200).json({ ok: true, country, period });
}

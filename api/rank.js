// api/rank.js — return the caller's rank/percentile within their country for the current month,
// plus an anonymized top-10 (scores only, no identities).
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { getAuthedUser, isAuthConfigured } from "../lib/auth.js";

function currentPeriod() {
  const d = new Date();
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

export default async function handler(req, res) {
  if (!isAuthConfigured() || !isSupabaseConfigured()) return res.status(200).json({ available: false });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = getSupabase();
  const period = currentPeriod();

  // my row (gives my country + score)
  const { data: me } = await db.from("leaderboard")
    .select("country, score, level").eq("user_id", user.id).eq("period", period).single();
  if (!me) return res.status(200).json({ available: true, ranked: false, period });

  const country = me.country || "XX";

  // total in my country/period
  const { count: total } = await db.from("leaderboard")
    .select("user_id", { count: "exact", head: true }).eq("country", country).eq("period", period);

  // how many score strictly higher than me → my rank = that + 1
  const { count: above } = await db.from("leaderboard")
    .select("user_id", { count: "exact", head: true })
    .eq("country", country).eq("period", period).gt("score", me.score);

  const rank = (above || 0) + 1;
  const n = total || 1;
  const percentile = n > 1 ? Math.max(1, Math.ceil((rank / n) * 100)) : 1; // "top X%"

  // anonymized top 10 (scores + level only)
  const { data: topRows } = await db.from("leaderboard")
    .select("score, level").eq("country", country).eq("period", period)
    .order("score", { ascending: false }).limit(10);
  const top10 = (topRows || []).map((r, i) => ({ rank: i + 1, score: Number(r.score), level: r.level || null }));

  return res.status(200).json({
    available: true, ranked: true, country, period,
    score: Number(me.score), level: me.level || null,
    rank, total: n, percentile, top10
  });
}

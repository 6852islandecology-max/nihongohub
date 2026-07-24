// api/rank.js — return the caller's rank/percentile within their country for the current month,
// plus an anonymized top-10 (scores only, no identities).
import { getSupabase } from "../lib/supabase.js";
import { isAuthConfigured, isSupabaseConfigured } from "../lib/env.js";
import { methodGuard, requireAuth } from "../lib/http.js";
import { currentPeriod } from "../lib/period.js";

export default async function handler(req, res) {
  // 呼び出し側は dashboard.html:720 の 1 箇所。GET。
  if (methodGuard(req, res, "GET")) return;
  if (!isAuthConfigured() || !isSupabaseConfigured()) return res.status(200).json({ available: false });

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getSupabase();
  const period = currentPeriod();

  // 2026-07-24: 以下 4 つのクエリは error を受け取っていなかった。
  // DB 障害時に rank:1 / total:1 / percentile:1 という、もっともらしいが嘘の値を
  // 200 で返していたため、error を見て { available:false } に落とすようにした。
  // available:false は dashboard.html:721 が既にカードを隠す形で扱っているので、
  // クライアント側の変更は不要（レスポンスの形も既存のものを流用している）。

  // my row (gives my country + score)
  const { data: me, error: meErr } = await db.from("leaderboard")
    .select("country, score, level").eq("user_id", user.id).eq("period", period).maybeSingle();
  if (meErr) {
    console.error("rank: my row lookup failed:", meErr.message);
    return res.status(200).json({ available: false });
  }
  if (!me) return res.status(200).json({ available: true, ranked: false, period });

  const country = me.country || "XX";

  // total in my country/period
  const { count: total, error: totalErr } = await db.from("leaderboard")
    .select("user_id", { count: "exact", head: true }).eq("country", country).eq("period", period);

  // how many score strictly higher than me → my rank = that + 1
  const { count: above, error: aboveErr } = await db.from("leaderboard")
    .select("user_id", { count: "exact", head: true })
    .eq("country", country).eq("period", period).gt("score", me.score);

  // anonymized top 10 (scores + level only)
  const { data: topRows, error: topErr } = await db.from("leaderboard")
    .select("score, level").eq("country", country).eq("period", period)
    .order("score", { ascending: false }).limit(10);

  if (totalErr || aboveErr || topErr) {
    console.error("rank: aggregate query failed:", (totalErr || aboveErr || topErr).message);
    return res.status(200).json({ available: false });
  }

  const rank = (above || 0) + 1;
  const n = total || 1;
  const percentile = n > 1 ? Math.max(1, Math.ceil((rank / n) * 100)) : 1; // "top X%"
  const top10 = (topRows || []).map((r, i) => ({ rank: i + 1, score: Number(r.score), level: r.level || null }));

  return res.status(200).json({
    available: true, ranked: true, country, period,
    score: Number(me.score), level: me.level || null,
    rank, total: n, percentile, top10
  });
}

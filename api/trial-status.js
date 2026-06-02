// api/trial-status.js — returns the caller's plan + trial state.
// Also lazily flips an elapsed trial to 'expired' (no cron needed for the flag).
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { getAuthedUser, isAuthConfigured } from "../lib/auth.js";

export default async function handler(req, res) {
  if (!isAuthConfigured() || !isSupabaseConfigured()) {
    return res.status(200).json({ plan: "free", trial_status: "never_started", days_remaining: 0 });
  }
  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = getSupabase();
  const { data: p } = await db
    .from("users").select("trial_status, trial_end_date, plan").eq("id", user.id).single();

  if (!p) return res.status(200).json({ plan: "free", trial_status: "never_started", days_remaining: 0 });

  let { trial_status, plan } = p;
  let daysRemaining = 0;
  if (trial_status === "active" && p.trial_end_date) {
    const ms = new Date(p.trial_end_date).getTime() - Date.now();
    if (ms <= 0) {
      trial_status = "expired";
      await db.from("users").update({ trial_status: "expired" }).eq("id", user.id);
      await db.from("trial_events").insert({ user_id: user.id, event_type: "trial_expired", metadata: {} });
    } else {
      daysRemaining = Math.ceil(ms / 86400000);
    }
  }
  return res.status(200).json({ plan, trial_status, days_remaining: daysRemaining });
}

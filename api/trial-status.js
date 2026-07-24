// api/trial-status.js — returns the caller's plan + trial state.
// Also lazily flips an elapsed trial to 'expired' (no cron needed for the flag).
import { getSupabase } from "../lib/supabase.js";
import { isAuthConfigured, isSupabaseConfigured } from "../lib/env.js";
import { methodGuard, requireAuth } from "../lib/http.js";

export default async function handler(req, res) {
  // 呼び出し側は index.html:1433,1479 と lib/site-chrome.js:299 の 3 箇所。すべて GET。
  if (methodGuard(req, res, "GET")) return;
  if (!isAuthConfigured() || !isSupabaseConfigured()) {
    return res.status(200).json({ plan: "free", trial_status: "never_started", days_remaining: 0 });
  }
  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getSupabase();
  const { data: p } = await db
    .from("users").select("trial_status, trial_end_date, plan, stripe_customer_id, stripe_subscription_id").eq("id", user.id).single();

  if (!p) return res.status(200).json({ plan: "free", trial_status: "never_started", days_remaining: 0, has_billing: false });

  let { trial_status, plan } = p;
  // has_billing: the user has gone through Stripe (trial-with-customer or checkout),
  // so the billing portal can manage / cancel even if a webhook hasn't flipped `plan` yet.
  const hasBilling = !!(p.stripe_customer_id || p.stripe_subscription_id);
  let daysRemaining = 0;
  if (trial_status === "active" && p.trial_end_date) {
    const ms = new Date(p.trial_end_date).getTime() - Date.now();
    if (ms <= 0) {
      trial_status = "expired";
      // 2026-07-24: .eq("trial_status","active") を追加した。
      // 以前は無条件 UPDATE だったため、同時に 2 リクエストが来ると
      // trial_expired イベントが 2 行入っていた。
      // 更新できた行がある場合だけ監査ログを書く。
      const { data: flipped } = await db
        .from("users")
        .update({ trial_status: "expired" })
        .eq("id", user.id)
        .eq("trial_status", "active")
        .select("id");
      if (flipped && flipped.length > 0) {
        await db.from("trial_events").insert({ user_id: user.id, event_type: "trial_expired", metadata: {} });
      }
    } else {
      daysRemaining = Math.ceil(ms / 86400000);
    }
  }
  return res.status(200).json({ plan, trial_status, days_remaining: daysRemaining, has_billing: hasBilling });
}

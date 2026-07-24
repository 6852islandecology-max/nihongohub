// api/trial-start.js — PR-15 Free Trial (opt-in, no credit card).
// Starts a 7-day trial for the authenticated user. Stripe customer is created
// only if Stripe is configured (so trial works even before Stripe go-live).
import { getSupabase } from "../lib/supabase.js";
import { isAuthConfigured, isSupabaseConfigured, isStripeConfigured } from "../lib/env.js";
import { methodGuard, requireAuth, getStripe } from "../lib/http.js";
import { trackFunnel } from "../lib/funnel-server.js";
import { initSentry, captureApiError } from "../lib/sentry.js";

const TRIAL_DAYS = 7;

export default async function handler(req, res) {
  initSentry();
  if (methodGuard(req, res, "POST")) return;
  if (!isAuthConfigured() || !isSupabaseConfigured()) {
    return res.status(503).json({ error: "Auth/DB not configured yet" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getSupabase(); // service-role client
  const { data: profile } = await db
    .from("users").select("trial_status, plan, stripe_customer_id").eq("id", user.id).single();

  if (profile?.trial_status === "active") return res.status(400).json({ error: "Trial already active" });
  if (profile?.trial_status === "expired") return res.status(400).json({ error: "Trial already used. Upgrade to continue." });
  if (profile?.plan && profile.plan !== "free") return res.status(400).json({ error: "Already on a paid plan" });

  // Optional: create a Stripe customer now so later Upgrade is one step.
  let stripeCustomerId = profile?.stripe_customer_id || null;
  if (!stripeCustomerId && isStripeConfigured()) {
    try {
      const stripe = await getStripe();
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id, trial_started_at: new Date().toISOString() },
      });
      stripeCustomerId = customer.id;
    } catch (e) {
      // non-fatal: trial can start without a Stripe customer.
      // 握り潰すのは意図的だが、無言だと「なぜ後で Upgrade が 2 手になるのか」が追えないので通知だけ出す。
      captureApiError(e, { api: "trial-start", step: "stripe-customer-create", userId: user.id });
      stripeCustomerId = null;
    }
  }

  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);

  const { error: upErr } = await db.from("users").update({
    trial_status: "active",
    trial_start_date: start.toISOString(),
    trial_end_date: end.toISOString(),
    ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
  }).eq("id", user.id);
  if (upErr) return res.status(500).json({ error: "Could not start trial" });

  await db.from("trial_events").insert({
    user_id: user.id,
    event_type: "trial_started",
    metadata: { stripe_customer_id: stripeCustomerId },
  });
  await trackFunnel("trial_start", user.id);

  return res.status(200).json({
    trial_status: "active",
    trial_end_date: end.toISOString(),
    days_remaining: TRIAL_DAYS,
  });
}

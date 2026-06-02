// api/trial-start.js — PR-15 Free Trial (opt-in, no credit card).
// Starts a 7-day trial for the authenticated user. Stripe customer is created
// only if Stripe is configured (so trial works even before Stripe go-live).
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { getAuthedUser, isAuthConfigured } from "../lib/auth.js";

const TRIAL_DAYS = 7;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAuthConfigured() || !isSupabaseConfigured()) {
    return res.status(503).json({ error: "Auth/DB not configured yet" });
  }

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = getSupabase(); // service-role client
  const { data: profile } = await db
    .from("users").select("trial_status, plan, stripe_customer_id").eq("id", user.id).single();

  if (profile?.trial_status === "active") return res.status(400).json({ error: "Trial already active" });
  if (profile?.trial_status === "expired") return res.status(400).json({ error: "Trial already used. Upgrade to continue." });
  if (profile?.plan && profile.plan !== "free") return res.status(400).json({ error: "Already on a paid plan" });

  // Optional: create a Stripe customer now so later Upgrade is one step.
  let stripeCustomerId = profile?.stripe_customer_id || null;
  if (!stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient(), timeout: 20000 });
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id, trial_started_at: new Date().toISOString() },
      });
      stripeCustomerId = customer.id;
    } catch (e) {
      // non-fatal: trial can start without a Stripe customer
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

  return res.status(200).json({
    trial_status: "active",
    trial_end_date: end.toISOString(),
    days_remaining: TRIAL_DAYS,
  });
}

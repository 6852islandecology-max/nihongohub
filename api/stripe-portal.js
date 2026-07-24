// api/stripe-portal.js — open the Stripe Billing Portal so Pro users can
// manage / cancel their subscription (特商法「いつでも解約」対応).
import { getSupabase } from "../lib/supabase.js";
import { isAuthConfigured, isSupabaseConfigured, isStripeConfigured, siteUrl as resolveSiteUrl } from "../lib/env.js";
import { methodGuard, requireAuth, getStripe } from "../lib/http.js";
import { initSentry, captureApiError } from "../lib/sentry.js";

export default async function handler(req, res) {
  initSentry();
  if (methodGuard(req, res, "POST")) return;
  if (!isStripeConfigured()) return res.status(503).json({ error: "Payments not configured yet" });
  if (!isAuthConfigured() || !isSupabaseConfigured()) return res.status(503).json({ error: "Auth/DB not configured yet" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getSupabase();
  const { data: profile } = await db.from("users").select("stripe_customer_id").eq("id", user.id).single();
  if (!profile?.stripe_customer_id) return res.status(400).json({ error: "No billing account" });

  const siteUrl = resolveSiteUrl(req);
  try {
    const stripe = await getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/`,
    });
    return res.status(200).json({ portal_url: session.url });
  } catch (e) {
    console.error("stripe-portal error:", e?.message);
    captureApiError(e, { api: "stripe-portal", userId: user.id });
    return res.status(502).json({ error: "Stripe: " + (e?.message || "portal failed") });
  }
}

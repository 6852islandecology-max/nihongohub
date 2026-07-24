// api/upgrade-checkout.js — create a Stripe Checkout Session for Pro or Lifetime.
// Returns { checkout_url }. Requires Stripe env + an authenticated user.
import { getSupabase } from "../lib/supabase.js";
import { isAuthConfigured, isSupabaseConfigured, isStripeConfigured, siteUrl as resolveSiteUrl } from "../lib/env.js";
import { methodGuard, requireAuth, getStripe, parseBody } from "../lib/http.js";
import { trackFunnel, FUNNEL_SOURCES } from "../lib/funnel-server.js";
import { initSentry, captureApiError } from "../lib/sentry.js";

export default async function handler(req, res) {
  initSentry();
  if (methodGuard(req, res, "POST")) return;
  if (!isStripeConfigured()) return res.status(503).json({ error: "Payments not configured yet" });
  if (!isAuthConfigured() || !isSupabaseConfigured()) return res.status(503).json({ error: "Auth/DB not configured yet" });

  // body may arrive as string on bare Vercel functions
  const body = parseBody(req);
  const plan = body?.plan;
  if (!["lifetime", "pro"].includes(plan)) return res.status(400).json({ error: "Invalid plan" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getSupabase();
  const { data: profile } = await db.from("users").select("stripe_customer_id, plan").eq("id", user.id).single();
  if (profile?.plan === "lifetime") return res.status(400).json({ error: "Already lifetime" });

  const priceId = plan === "lifetime" ? process.env.STRIPE_PRICE_LIFETIME : process.env.STRIPE_PRICE_PRO;
  if (!priceId) return res.status(503).json({ error: "Price not configured" });

  const siteUrl = resolveSiteUrl(req);
  const stripe = await getStripe();

  try {
    // ensure a customer exists AND is valid in the current Stripe mode.
    // A stored id created in test mode (or a deleted customer) will not resolve
    // under a live key, so verify it and recreate if it's stale.
    let customerId = profile?.stripe_customer_id;
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if (existing?.deleted) customerId = null;
      } catch {
        customerId = null; // wrong mode / no longer exists → recreate below
      }
    }
    if (!customerId) {
      const c = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = c.id;
      await db.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    // first-touch source captured by the client beacon (lib/site-chrome.js)
    const src = FUNNEL_SOURCES.has(body?.src) ? body.src : "other";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: plan === "lifetime" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      success_url: `${siteUrl}/?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?upgrade=cancelled`,
      metadata: { user_id: user.id, plan, src },
    });

    await trackFunnel(plan === "lifetime" ? "checkout_lifetime" : "checkout_pro", user.id, src);
    return res.status(200).json({ checkout_url: session.url });
  } catch (e) {
    // surface the Stripe error instead of crashing (e.g. bad price ID / mode mismatch)
    console.error("upgrade-checkout stripe error:", e?.message);
    captureApiError(e, { api: "upgrade-checkout", plan, userId: user.id });
    return res.status(502).json({ error: "Stripe: " + (e?.message || "checkout failed") });
  }
}

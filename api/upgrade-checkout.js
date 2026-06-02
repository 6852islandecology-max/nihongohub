// api/upgrade-checkout.js — create a Stripe Checkout Session for Pro or Lifetime.
// Returns { checkout_url }. Requires Stripe env + an authenticated user.
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { getAuthedUser, isAuthConfigured } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: "Payments not configured yet" });
  if (!isAuthConfigured() || !isSupabaseConfigured()) return res.status(503).json({ error: "Auth/DB not configured yet" });

  // body may arrive as string on bare Vercel functions
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const plan = body?.plan;
  if (!["lifetime", "pro"].includes(plan)) return res.status(400).json({ error: "Invalid plan" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = getSupabase();
  const { data: profile } = await db.from("users").select("stripe_customer_id, plan").eq("id", user.id).single();
  if (profile?.plan === "lifetime") return res.status(400).json({ error: "Already lifetime" });

  const priceId = plan === "lifetime" ? process.env.STRIPE_PRICE_LIFETIME : process.env.STRIPE_PRICE_PRO;
  if (!priceId) return res.status(503).json({ error: "Price not configured" });

  const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // ensure a customer exists
  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const c = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
    customerId = c.id;
    await db.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: plan === "lifetime" ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    success_url: `${siteUrl}/?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/?upgrade=cancelled`,
    metadata: { user_id: user.id, plan },
  });

  return res.status(200).json({ checkout_url: session.url });
}

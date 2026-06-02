// api/stripe-portal.js — open the Stripe Billing Portal so Pro users can
// manage / cancel their subscription (特商法「いつでも解約」対応).
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { getAuthedUser, isAuthConfigured } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: "Payments not configured yet" });
  if (!isAuthConfigured() || !isSupabaseConfigured()) return res.status(503).json({ error: "Auth/DB not configured yet" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = getSupabase();
  const { data: profile } = await db.from("users").select("stripe_customer_id").eq("id", user.id).single();
  if (!profile?.stripe_customer_id) return res.status(400).json({ error: "No billing account" });

  const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient(), timeout: 20000 });
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/`,
    });
    return res.status(200).json({ portal_url: session.url });
  } catch (e) {
    console.error("stripe-portal error:", e?.message);
    return res.status(502).json({ error: "Stripe: " + (e?.message || "portal failed") });
  }
}

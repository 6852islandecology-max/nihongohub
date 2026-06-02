// api/stripe-webhook.js — Stripe webhook receiver.
// Verifies signature, then updates users.plan on checkout / cancellation.
// Vercel: bodyParser disabled so we can verify the raw payload signature.
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { readRawBody } from "../lib/auth.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: "Payments not configured yet" });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = isSupabaseConfigured() ? getSupabase() : null;

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      const userId = s.client_reference_id || s.metadata?.user_id;
      const plan = s.metadata?.plan === "lifetime" ? "lifetime" : "pro";
      if (db && userId) {
        await db.from("users").update({
          plan,
          trial_status: "converted",
          stripe_customer_id: s.customer || null,
          stripe_subscription_id: s.subscription || null,
        }).eq("id", userId);
        await db.from("trial_events").insert({
          user_id: userId,
          event_type: plan === "lifetime" ? "upgraded_lifetime" : "upgraded_pro",
          metadata: { session: s.id },
        });
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      if (db && sub.customer) {
        const { data: u } = await db.from("users").select("id").eq("stripe_customer_id", sub.customer).single();
        if (u) {
          await db.from("users").update({ plan: "free", stripe_subscription_id: null }).eq("id", u.id);
          await db.from("trial_events").insert({ user_id: u.id, event_type: "cancelled_pro", metadata: {} });
        }
      }
    }
  } catch (e) {
    // acknowledge to avoid Stripe retries storm; error is logged server-side
    console.error("stripe-webhook handler error:", e?.message);
  }

  return res.status(200).json({ received: true });
}

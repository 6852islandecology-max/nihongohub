// api/trial-start.js — PR-15 Free Trial (opt-in, no credit card).
// Starts a 7-day trial for the authenticated user. Stripe customer is created
// only if Stripe is configured (so trial works even before Stripe go-live).
import { getSupabase } from "../lib/supabase.js";
import { isAuthConfigured, isSupabaseConfigured, isStripeConfigured } from "../lib/env.js";
import { methodGuard, requireAuth, getStripe, parseBody } from "../lib/http.js";
import { trackFunnel, FUNNEL_SOURCES } from "../lib/funnel-server.js";
import { initSentry, captureApiError } from "../lib/sentry.js";

const TRIAL_DAYS = 7;

// 2026-08-23: 登録がどのページ経由かを残す。Redis の日次カウンタは集計値しか持たず、
// 実登録2件(07-03/07-23)がどちらの記事から来たか後から辿れなかったため、
// 経路を Postgres 側(trial_events.metadata = JSONB)に落とす。移行 SQL は不要。
// 受け取るのはパスだけ。クエリ文字列や外部 URL は保存しない(PII を持ち込まない)。
const PATH_RE = /^\/[\w\-./]{0,120}$/;
function safePath(v) {
  return typeof v === "string" && PATH_RE.test(v) ? v : null;
}

export default async function handler(req, res) {
  initSentry();
  if (methodGuard(req, res, "POST")) return;
  if (!isAuthConfigured() || !isSupabaseConfigured()) {
    return res.status(503).json({ error: "Auth/DB not configured yet" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  // 計測は登録を壊してはいけないので、値が無い/不正でも null にして先へ進む。
  const body = parseBody(req);
  const src = FUNNEL_SOURCES.has(body?.src) ? body.src : "other";
  const land = safePath(body?.land);   // first-touch landing page (localStorage nh_land)
  const page = safePath(body?.page);   // page the signup happened on

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
    metadata: { stripe_customer_id: stripeCustomerId, src, land, page },
  });
  await trackFunnel("trial_start", user.id, src);

  return res.status(200).json({
    trial_status: "active",
    trial_end_date: end.toISOString(),
    days_remaining: TRIAL_DAYS,
  });
}

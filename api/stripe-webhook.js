// api/stripe-webhook.js — Stripe webhook receiver.
// Verifies signature, then updates users.plan on checkout / cancellation.
// Also handles Pay-it-forward gift purchases (Phase 3): issues 10 promo codes
// and sends them in an emotionally-charged Resend email to the buyer.
// Vercel: bodyParser disabled so we can verify the raw payload signature.
import { getSupabase } from "../lib/supabase.js";
import { isSupabaseConfigured } from "../lib/env.js";
import { readRawBody } from "../lib/auth.js";
import { trackFunnel, hashFunnelId } from "../lib/funnel-server.js";
import { getStripe } from "../lib/http.js";
import { isGiftPurchase } from "../lib/billing-rules.js";
import { initSentry, captureApiError } from "../lib/sentry.js";

export const config = { api: { bodyParser: false } };

// ── Pay-it-forward helpers (Phase 3) ─────────────────────────────────────────
// 10-character readable codes, ambiguous chars stripped.
const CODE_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode() {
  let s = "GIFT-";
  for (let i = 0; i < 8; i++) s += CODE_ALPHA[Math.floor(Math.random() * CODE_ALPHA.length)];
  return s;
}

// Stripe は同じイベントを再送しうる（at-least-once）。sponsor_session に checkout session id を
// 入れてインデックスも張ってあるのに、それを使った重複チェックが無かったため、再送のたびに
// 10 本の新しいコードが発行されメールも再送されていた（購入者に 20 本、30 本と届く）。
// 2026-07-24: 発行前に既存を引く。既にあればそれを返し、新規発行しない。
async function existingGiftCodes(db, sessionId) {
  if (!db || !sessionId) return [];
  const { data, error } = await db
    .from("promo_codes").select("code").eq("sponsor_session", sessionId);
  if (error) {
    // 引けなかったときに「無い」と決めつけて二重発行するより、失敗を上に伝える。
    throw error;
  }
  return (data || []).map((r) => r.code);
}

async function issueGiftCodes(db, session, count = 10) {
  if (!db) return [];
  const now = new Date();
  const until = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // codes valid 1 year to redeem
  const rows = Array.from({ length: count }).map(() => ({
    code: generateCode(),
    product: "pro_1month",
    valid_from: now.toISOString(),
    valid_until: until.toISOString(),
    sponsor_session: session.id,
    sponsor_email: session.customer_details?.email || null,
    metadata: { amount_total: session.amount_total, currency: session.currency },
  }));
  // Insert; on accidental code collision Supabase will return error — retry once.
  let { data, error } = await db.from("promo_codes").insert(rows).select("code");
  if (error) {
    rows.forEach((r) => (r.code = generateCode()));
    ({ data, error } = await db.from("promo_codes").insert(rows).select("code"));
    if (error) throw error;
  }
  return (data || []).map((r) => r.code);
}

async function sendGiftEmail(toEmail, codes) {
  if (!process.env.RESEND_API_KEY || !toEmail) return false;
  const codeBlock = codes.map((c) => `<code style="display:inline-block;background:#1a1008;border:1px solid #e8a020;color:#FFD700;padding:8px 12px;margin:4px;font-family:monospace;font-size:15px;letter-spacing:1px">${c}</code>`).join("");
  const html = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a14;color:#fdf6e3;padding:32px;border:2px solid #e8a020">
  <h1 style="color:#FFD700;font-size:24px;margin:0 0 16px;letter-spacing:1px">⛩  Thank you.</h1>
  <p style="font-size:17px;line-height:1.6;margin:0 0 18px">Your <strong style="color:#FFD700">$5</strong> just unlocked a full month of Pro for <strong style="color:#FFD700">10 learners</strong> — and you get to choose who.</p>
  <p style="font-size:16px;line-height:1.6;color:rgba(253,246,227,.85);margin:0 0 24px">Each code below is one month of NihongoHub Pro, paid for by you. Hand them to people studying Japanese — they'll never know your name unless you tell them.</p>
  <p style="font-size:15px;line-height:1.6;color:rgba(253,246,227,.7);margin:0 0 12px">Drop them wherever learners gather — your Discord, a subreddit, a friend cramming for JLPT:</p>
  <div style="background:rgba(255,215,0,.04);border-left:3px solid #FFD700;padding:14px;margin:0 0 24px">${codeBlock}</div>
  <p style="font-size:14px;line-height:1.6;color:rgba(253,246,227,.55);margin:0 0 6px">Every code redeemed = one more learner who got a fairer start.</p>
  <p style="font-size:14px;line-height:1.6;color:rgba(253,246,227,.55);margin:0">Codes are good for 1 year. Redeem at <a href="https://www.nihongo-hub.com/redeem.html" style="color:#FFD700">nihongo-hub.com/redeem</a></p>
  <p style="font-size:13px;color:rgba(253,246,227,.4);margin:28px 0 0;border-top:1px solid rgba(253,246,227,.1);padding-top:14px">— NihongoHub</p>
</div>`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "NihongoHub <gifts@mail.nihongo-hub.com>",
      reply_to: "support@nihongo-hub.com",
      to: [toEmail],
      subject: "You just sponsored 10 Japanese learners ⛩️",
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend send failed:", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  initSentry();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: "Payments not configured yet" });
  }

  const stripe = await getStripe();

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
      // Pay-it-forward gift path: $5 unlocks 10 Pro codes, emailed to the buyer.
      // Primary signal: product_type=gift_x10 metadata (set via API/Payment Link).
      // Fallback: the Stripe Payment Links dashboard UI no longer exposes a
      // metadata field, so we ALSO treat a $5.00 USD one-time payment that
      // carries no app-attached user_id/plan (normal Pro/Lifetime purchases go
      // through api/upgrade-checkout.js and always attach those) as the gift.
      // Safe because no other Stripe product is $5 (Pro $9.99 / Lifetime $149;
      // the handbook PDF is on Gumroad, not Stripe). 🚨 If a new $5 Stripe
      // product is ever added, switch to a Price-ID check or set metadata.
      // 判定そのものは lib/billing-rules.js に移した（外部サービス無しでテストするため）。挙動は同じ。
      if (isGiftPurchase(s)) {
        try {
          // 冪等性: 同じ checkout session に対するコードが既にあれば、発行もメールも計測もしない。
          const already = await existingGiftCodes(db, s.id);
          if (already.length) {
            console.log("gift_x10: already issued for session", s.id, `(${already.length} codes)`);
            return res.status(200).json({ received: true, kind: "gift_x10", duplicate: true });
          }

          const codes = await issueGiftCodes(db, s, 10);
          const buyerEmail = s.customer_details?.email || s.metadata?.buyer_email || null;
          if (codes.length && buyerEmail) {
            const sent = await sendGiftEmail(buyerEmail, codes);
            if (!sent) {
              // コードは DB に残るが購入者には届かない。以前は完全に無言だったので、
              // 手で追える形にする（自動リトライはしない。二重送信のほうが害が大きい）。
              captureApiError(new Error("gift email not delivered"), {
                api: "stripe-webhook", kind: "gift_x10", session: s.id, codes: codes.length,
              });
            }
          }
          await trackFunnel(
            "paid_gift_x10",
            // 購入者メールを平文で計測基盤に送らない（lib/funnel-server.js の no-PII 方針）
            s.metadata?.user_id || (buyerEmail ? hashFunnelId(buyerEmail) : "anon"),
            s.metadata?.src,
          );
        } catch (e) {
          console.error("gift_x10 handler error:", e?.message);
          captureApiError(e, { api: "stripe-webhook", kind: "gift_x10", session: s.id });
        }
        return res.status(200).json({ received: true, kind: "gift_x10" });
      }

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
      if (userId) {
        await trackFunnel(plan === "lifetime" ? "paid_lifetime" : "paid_pro", userId, s.metadata?.src);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      if (db && sub.customer) {
        const { data: u } = await db.from("users").select("id").eq("stripe_customer_id", sub.customer).single();
        if (u) {
          await db.from("users").update({ plan: "free", stripe_subscription_id: null }).eq("id", u.id);
          await db.from("trial_events").insert({ user_id: u.id, event_type: "cancelled_pro", metadata: {} });
          await trackFunnel("churn_pro", u.id);
        }
      }
    }
  } catch (e) {
    // acknowledge to avoid Stripe retries storm; error is logged server-side.
    // 2026-07-24: ここが console.error だけだったため、「決済は通ったのに users.plan が
    // 上がらない」という最も困る失敗が Stripe 側からも Sentry 側からも見えなかった。
    // 200 を返す方針（リトライ嵐の回避）は変えず、通知だけ足す。
    console.error("stripe-webhook handler error:", e?.message);
    captureApiError(e, { api: "stripe-webhook", eventType: event?.type, eventId: event?.id });
  }

  return res.status(200).json({ received: true });
}

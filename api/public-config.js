// api/public-config.js — expose browser-safe config (Supabase URL + anon key).
// The anon/publishable key is designed to be public (RLS protects data),
// so serving it here avoids hardcoding and keeps env as the single source.
import { methodGuard } from "../lib/http.js";

export default function handler(req, res) {
  // 呼び出し側は index.html / dashboard.html / lib/sync.js / lib/site-chrome.js。すべて GET。
  if (methodGuard(req, res, "GET")) return;
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
    authEnabled: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
    giftPaymentLink: process.env.STRIPE_GIFT_X10_LINK || null,
  });
}

// [server] 課金まわりの判定を、DB も Stripe も触らない純粋関数として切り出したもの。
//
// 2026-07-24 新設。もともと api ハンドラの中に埋まっていて、外部サービス無しでは
// 一行も検証できなかった。ロジックは一切変えていない（移しただけ）。
// テスト: scripts/test-api-endpoints.mjs

/**
 * checkout.session.completed が Pay-it-forward ギフト購入かどうか。
 *
 * 一次判定は metadata の product_type=gift_x10。
 * ただし Stripe の Payment Links の管理画面は metadata 欄を出さなくなったため、
 * 「$5.00 USD ちょうどの一回払いで、アプリ由来の user_id / plan / client_reference_id が無い」
 * ものもギフトとみなす（通常の Pro / Lifetime は api/upgrade-checkout.js を通り必ずそれらを付ける）。
 *
 * 成立の前提: 他に $5 の Stripe 商品が無いこと（Pro $9.99 / Lifetime $149、
 * ハンドブック PDF は Gumroad で Stripe ではない）。
 * $5 の商品を追加したら、この金額判定は Price ID 判定に変えること。
 * 同じ警告が PAY-IT-FORWARD-OWNER-STEPS.md:19-20 にもある。
 */
export function isGiftPurchase(session) {
  if (!session) return false;
  if (session.metadata?.product_type === "gift_x10") return true;
  return (
    session.amount_total === 500 &&
    (session.currency || "usd").toLowerCase() === "usd" &&
    session.mode === "payment" &&
    !session.client_reference_id &&
    !session.metadata?.user_id &&
    !session.metadata?.plan
  );
}

/**
 * users テーブルの行から、レート制限に使う権利を導く。
 *
 * paid (pro / lifetime) は真の無制限でリミッタを完全にバイパスする。
 * trialActive は無制限ではなく、ゲスト 30/日 が 50/日 に緩むだけ。
 * 行が無い / 未ログインは両方 false。
 */
export function entitlementFromProfile(profile, now = Date.now()) {
  const none = { paid: false, trialActive: false };
  if (!profile) return none;
  if (profile.plan === "pro" || profile.plan === "lifetime") {
    return { paid: true, trialActive: false };
  }
  const trialActive =
    profile.trial_status === "active" &&
    !!profile.trial_end_date &&
    new Date(profile.trial_end_date).getTime() > now;
  return { paid: false, trialActive };
}

/**
 * トライアルの残日数と、期限切れになったかどうか。
 * 残りが 1 ミリ秒でもあれば切り上げて 1 日として見せる（既存の Math.ceil の挙動）。
 */
export function trialRemaining(profile, now = Date.now()) {
  if (!profile || profile.trial_status !== "active" || !profile.trial_end_date) {
    return { expired: false, daysRemaining: 0 };
  }
  const ms = new Date(profile.trial_end_date).getTime() - now;
  if (ms <= 0) return { expired: true, daysRemaining: 0 };
  return { expired: false, daysRemaining: Math.ceil(ms / 86400000) };
}

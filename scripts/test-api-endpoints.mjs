/**
 * Runtime fail-safe test for the new Free Trial / Stripe endpoints.
 * Verifies (without any owner env) that each handler:
 *   - imports & runs without crashing
 *   - returns the correct guard status when unconfigured (503) or wrong method (405)
 * This is NOT a full E2E (that needs Stripe + Supabase Auth env on Vercel).
 * Run: node scripts/test-api-endpoints.mjs
 */

// Ensure a clean, unconfigured environment for the guard tests.
for (const k of ["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","SUPABASE_URL","SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY"]) {
  delete process.env[k];
}

function mockRes() {
  return {
    statusCode: 0, body: null,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
    send(o) { this.body = o; return this; },
    setHeader() {},
  };
}
function mockReq(method, { headers = {}, query = {}, body = {} } = {}) {
  return { method, headers, query, body, on() {} };
}

let pass = 0, fail = 0;
function check(name, cond, got) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} — got ${JSON.stringify(got)}`); }
}

const cases = [
  { f: "../api/trial-start.js",      method: "GET",  expect: 405, label: "trial-start rejects GET" },
  { f: "../api/trial-start.js",      method: "POST", expect: 503, label: "trial-start 503 when unconfigured" },
  { f: "../api/trial-status.js",     method: "GET",  expect: 200, label: "trial-status 200 default when unconfigured" },
  { f: "../api/upgrade-checkout.js", method: "GET",  expect: 405, label: "upgrade-checkout rejects GET" },
  { f: "../api/upgrade-checkout.js", method: "POST", expect: 503, label: "upgrade-checkout 503 when no Stripe" },
  { f: "../api/stripe-webhook.js",   method: "GET",  expect: 405, label: "stripe-webhook rejects GET" },
  { f: "../api/stripe-webhook.js",   method: "POST", expect: 503, label: "stripe-webhook 503 when no Stripe" },
  { f: "../api/stripe-portal.js",    method: "POST", expect: 503, label: "stripe-portal 503 when no Stripe" },
  { f: "../api/count.js",            method: "GET",  expect: 200, label: "count 200 (enabled:false when no Upstash)" },
];

console.log("Fail-safe endpoint checks (no env configured):");
for (const c of cases) {
  try {
    const mod = await import(c.f);
    const res = mockRes();
    await mod.default(mockReq(c.method), res);
    check(c.label, res.statusCode === c.expect, { status: res.statusCode, body: res.body });
  } catch (e) {
    fail++;
    console.log(`  ✗ ${c.label} — THREW: ${e.message}`);
  }
}

// count.js must explicitly report disabled (never a fabricated number)
try {
  const mod = await import("../api/count.js");
  const res = mockRes();
  await mod.default(mockReq("GET"), res);
  check("count reports enabled:false / count:0 when unset", res.body && res.body.enabled === false && res.body.count === 0, res.body);
} catch (e) { fail++; console.log(`  ✗ count enabled:false — THREW: ${e.message}`); }

// ── 課金まわりの判定（2026-07-24 追加）─────────────────────────────
// lib/billing-rules.js は api ハンドラから切り出した純粋関数。
// Stripe も Supabase も要らないので、ここで実際の分岐を検証できる。
console.log("\nBilling rules (pure functions, no external services):");
const { isGiftPurchase, entitlementFromProfile, trialRemaining } =
  await import("../lib/billing-rules.js");

const giftBase = { amount_total: 500, currency: "usd", mode: "payment", metadata: {} };

check("gift: metadata product_type=gift_x10 は金額に関係なくギフト",
  isGiftPurchase({ ...giftBase, amount_total: 9999, metadata: { product_type: "gift_x10" } }) === true);
check("gift: $5.00 USD の一回払いで app 由来の情報が無ければギフト",
  isGiftPurchase(giftBase) === true);
check("gift: user_id が付いていればギフトではない（通常購入）",
  isGiftPurchase({ ...giftBase, metadata: { user_id: "u1" } }) === false);
check("gift: plan が付いていればギフトではない",
  isGiftPurchase({ ...giftBase, metadata: { plan: "pro" } }) === false);
check("gift: client_reference_id が付いていればギフトではない",
  isGiftPurchase({ ...giftBase, client_reference_id: "u1" }) === false);
check("gift: $9.99 (Pro) はギフトではない",
  isGiftPurchase({ ...giftBase, amount_total: 999 }) === false);
check("gift: 通貨が USD でなければギフトではない",
  isGiftPurchase({ ...giftBase, currency: "jpy" }) === false);
check("gift: subscription モードはギフトではない",
  isGiftPurchase({ ...giftBase, mode: "subscription" }) === false);
check("gift: session が無ければ false", isGiftPurchase(null) === false);

const NOW = Date.parse("2026-07-24T00:00:00Z");
const future = new Date(NOW + 3 * 86400000).toISOString();
const past = new Date(NOW - 1000).toISOString();

check("entitlement: pro は paid",
  JSON.stringify(entitlementFromProfile({ plan: "pro" }, NOW)) === JSON.stringify({ paid: true, trialActive: false }));
check("entitlement: lifetime は paid",
  entitlementFromProfile({ plan: "lifetime" }, NOW).paid === true);
check("entitlement: 有効なトライアルは paid ではなく trialActive",
  JSON.stringify(entitlementFromProfile({ plan: "free", trial_status: "active", trial_end_date: future }, NOW))
    === JSON.stringify({ paid: false, trialActive: true }));
check("entitlement: 期限切れトライアルは両方 false",
  entitlementFromProfile({ plan: "free", trial_status: "active", trial_end_date: past }, NOW).trialActive === false);
check("entitlement: プロフィール無し（未ログイン）は両方 false",
  entitlementFromProfile(null, NOW).paid === false);
check("entitlement: trial_end_date 欠落は trialActive にしない",
  entitlementFromProfile({ plan: "free", trial_status: "active", trial_end_date: null }, NOW).trialActive === false);

check("trial: 残り 3 日",
  trialRemaining({ trial_status: "active", trial_end_date: future }, NOW).daysRemaining === 3);
check("trial: 期限切れは expired=true / 残り 0",
  JSON.stringify(trialRemaining({ trial_status: "active", trial_end_date: past }, NOW)) === JSON.stringify({ expired: true, daysRemaining: 0 }));
check("trial: 未開始は expired=false / 残り 0",
  trialRemaining({ trial_status: "never_started" }, NOW).expired === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

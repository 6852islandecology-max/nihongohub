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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

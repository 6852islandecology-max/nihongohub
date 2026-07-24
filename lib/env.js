// [server] 環境変数の読み取りを 1 箇所に集める。
//
// 2026-07-24 新設。それまで同じ環境変数が 4 ファイル 6 箇所でバラバラに読まれており、
// とくに Upstash の別名フォールバックが非対称だった:
//
//   api/count.js と lib/funnel-server.js  → UPSTASH_* || KV_REST_API_*（別名あり）
//   lib/ratelimit.js と api/daily-coach.js → UPSTASH_* のみ（別名なし）
//
// このため KV_REST_API_* だけを設定した運用に切り替えると、カウンタとファネル計測は
// 動くのにレート制限だけが黙って無効化される（fail-open 設計なのでエラーも出ない）。
// ここを通せば全経路で同じ解決順になる。
//
// 挙動は変えていない。UPSTASH_* を優先し、無ければ KV_REST_API_* を見る、という
// 既存の解決順をそのまま全経路に広げただけ。

// ── Upstash Redis ──────────────────────────────────────────────────
export function redisUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
}

export function redisToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
}

export function isRedisConfigured() {
  return !!(redisUrl() && redisToken());
}

// ── Supabase ───────────────────────────────────────────────────────
export function isSupabaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isAuthConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// ── Stripe ─────────────────────────────────────────────────────────
export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

// ── その他 ─────────────────────────────────────────────────────────
export function isAnthropicConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function isSentryConfigured() {
  return !!process.env.SENTRY_DSN;
}

// SITE_URL 未設定時は req.headers.host にフォールバックする。
// Host ヘッダ由来の値が Stripe の success_url / cancel_url に入るので、
// 本番では SITE_URL を明示設定すること（.env.example に追記済み）。
export function siteUrl(req) {
  return process.env.SITE_URL || `https://${req.headers.host}`;
}

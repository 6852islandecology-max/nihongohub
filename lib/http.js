// [server] api ハンドラで繰り返されている定型処理。
//
// 2026-07-24 新設。api/ 12 本に同じコードが散っていた:
//   HTTP メソッドガード  8 箇所
//   認証チェック 2 行    6 箇所（完全同文）
//   Stripe クライアント生成 4 箇所（完全同文）
//   body の手動 JSON パース 2 箇所（書き方が別々）
//
// 重要: レスポンスの形もステータスコードも変えていない。既存のブラウザ側コードが
// それに依存しているため、統一は別途プロダクト判断が要る（docs/api-contract.md 参照）。
// ここでやったのは「同じものを同じ 1 箇所から呼ぶ」ようにしただけ。
//
// lib/ は Vercel の関数としてカウントされないので、ここにファイルを足しても
// 12 関数上限には影響しない。

import { getAuthedUser } from "./auth.js";

/**
 * 許可メソッド以外を 405 で弾く。
 * 返り値が true ならハンドラ側は即 return すること。
 *
 * body を渡せるのは、daily-coach.js だけが { ok:false, error } 形を返しており、
 * その差を温存する必要があるため。
 */
export function methodGuard(req, res, allowed, body = { error: "Method not allowed" }) {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (list.includes(req.method)) return false;
  res.status(405).json(body);
  return true;
}

/**
 * Supabase Auth の Bearer トークンから user を解決する。
 * 未認証なら 401 を返して null を返す。返り値が null ならハンドラは即 return すること。
 */
export async function requireAuth(req, res) {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

/**
 * Stripe クライアント。動的 import なのは、Stripe 未設定の環境で
 * モジュール読み込み自体を走らせないため（api ハンドラの起動を軽くする狙いもある）。
 */
export async function getStripe() {
  const Stripe = (await import("stripe")).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    timeout: 20000,
  });
}

/**
 * 素の Vercel Functions では body が文字列で届くことがあるので、その場合だけパースする。
 * パースに失敗しても投げず、空オブジェクトを返す（既存 2 箇所の挙動に合わせた）。
 */
export function parseBody(req) {
  const b = req.body;
  if (b && typeof b === "object") return b;
  try {
    return JSON.parse(b || "{}");
  } catch {
    return {};
  }
}

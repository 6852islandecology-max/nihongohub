// lib/cors.js
// 自ドメイン限定 CORS + OPTIONS プリフライト処理
// 本番: ALLOWED_ORIGIN=https://nihongohub.com
// 開発: ALLOWED_ORIGIN=* (env 未設定時のデフォルト)

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, x-admin-key";

export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGIN === "*") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Vary", "Origin");
  }
  // マッチしない Origin には Allow-Origin ヘッダを返さない（CORS 拒否）
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // 呼出側は true なら即リターン
  }
  return false;
}

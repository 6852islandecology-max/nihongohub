// lib/cors.js
// 自ドメイン限定 CORS + OPTIONS プリフライト処理
// 本番: ALLOWED_ORIGIN=https://nihongo-hub.com,https://www.nihongo-hub.com (カンマ区切り複数可)
// 開発: ALLOWED_ORIGIN=* (env 未設定時のデフォルト、開発時のみ)
// セキュリティ: 本番デプロイ前に必ず ALLOWED_ORIGIN を明示設定すること

const RAW = process.env.ALLOWED_ORIGIN || "*";
const ALLOWED_ORIGINS = RAW.split(",").map(s => s.trim()).filter(Boolean);
const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, x-admin-key, Authorization";

export function applyCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  // 許可外 Origin には Allow-Origin ヘッダを返さない (ブラウザが CORS 拒否)
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

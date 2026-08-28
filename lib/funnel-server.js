// [server] lib/funnel-server.js — funnel counters in Upstash Redis (counters only, no PII).
// Daily hashes:  nh:f:<YYYY-MM-DD>     field <event>           → count
//                nh:fsrc:<YYYY-MM-DD>  field <event>|<source>  → count
//                nh:fnav:<YYYY-MM-DD>  field <from>><to>       → count (in-site page transitions)
// Daily uniques: nh:fu:<YYYY-MM-DD>:<event> — HyperLogLog of anon/user ids
// Writers: api/count.js (client beacon), api/trial-start.js, api/upgrade-checkout.js,
//          api/stripe-webhook.js. Reader: scripts/funnel-report.mjs.
// Best-effort by design — measurement must never break signup or checkout.
import { createHash } from "node:crypto";
import { redisUrl, redisToken } from "./env.js";

const REST_URL = redisUrl();
const REST_TOKEN = redisToken();
const TTL_SECONDS = 60 * 60 * 24 * 120; // keep 120 days of daily keys

export async function trackFunnel(event, id, source, from, ret) {
  if (!REST_URL || !REST_TOKEN) return;
  const day = new Date().toISOString().slice(0, 10); // UTC day
  const cmds = [
    ["HINCRBY", `nh:f:${day}`, event, 1],
    ["EXPIRE", `nh:f:${day}`, TTL_SECONDS],
  ];
  // 再訪 (2026-08-28): クライアントはセッション単位で「前回訪問日が今日より前」なら
  // ret=1 を全 pv ビーコンに付ける (sessionStorage 固定、blog-quiz.js / site-chrome.js)。
  // pv_ret = 再訪セッションの PV 数、nh:fu:<day>:ret = 再訪ユニーク、
  // nh:fu:<day>:visitors = 全 pv のユニーク (再訪率の分母)。localStorage 消去や別端末は
  // 新規側に倒れる = 再訪は過小計測気味に出る (設計上の受容、per Gemini 反証 2026-08-28)。
  // pv_blog__<slug> の呼び出しは id/ret なしで来るのでここでは二重加算にならない。
  if (event.startsWith("pv_")) {
    if (id) {
      cmds.push(["PFADD", `nh:fu:${day}:visitors`, String(id)]);
      cmds.push(["EXPIRE", `nh:fu:${day}:visitors`, TTL_SECONDS]);
    }
    if (ret) {
      cmds.push(["HINCRBY", `nh:f:${day}`, "pv_ret", 1]);
      if (id) {
        cmds.push(["PFADD", `nh:fu:${day}:ret`, String(id)]);
        cmds.push(["EXPIRE", `nh:fu:${day}:ret`, TTL_SECONDS]);
      }
    }
  }
  if (source) {
    cmds.push(["HINCRBY", `nh:fsrc:${day}`, `${event}|${source}`, 1]);
    cmds.push(["EXPIRE", `nh:fsrc:${day}`, TTL_SECONDS]);
  }
  // In-site journey: pv_* beacons may carry the previous page class of the same
  // tab (sessionStorage), so from>to transition counts become measurable.
  if (from && event.startsWith("pv_")) {
    cmds.push(["HINCRBY", `nh:fnav:${day}`, `${from}>${event.slice(3)}`, 1]);
    cmds.push(["EXPIRE", `nh:fnav:${day}`, TTL_SECONDS]);
  }
  if (id) {
    cmds.push(["PFADD", `nh:fu:${day}:${event}`, String(id)]);
    cmds.push(["EXPIRE", `nh:fu:${day}:${event}`, TTL_SECONDS]);
  }
  try {
    await fetch(`${REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmds),
    });
  } catch {
    // best-effort
  }
}

// 個人を特定しうる文字列（メールアドレス等）を id として渡すときは、必ずこれを通す。
// PFADD の保存自体は HyperLogLog だが、送信ペイロードには平文が載ってしまうため。
// 一意カウントの精度は変わらない（同じ入力は同じハッシュになる）。
export function hashFunnelId(value) {
  if (!value) return "";
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 24);
}

// Coarse traffic sources accepted from the client (anything else is bucketed "other").
export const FUNNEL_SOURCES = new Set([
  "producthunt", "reddit", "google", "bing", "pinterest", "instagram", "threads",
  "x", "youtube", "tiktok", "substack", "medium", "direct", "other",
]);

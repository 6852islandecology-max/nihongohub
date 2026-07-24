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

export async function trackFunnel(event, id, source, from) {
  if (!REST_URL || !REST_TOKEN) return;
  const day = new Date().toISOString().slice(0, 10); // UTC day
  const cmds = [
    ["HINCRBY", `nh:f:${day}`, event, 1],
    ["EXPIRE", `nh:f:${day}`, TTL_SECONDS],
  ];
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

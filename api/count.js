/**
 * Social-proof counter for the Explore RPG layer (prefectures.html).
 * GET  /api/count        → { enabled, count }
 * GET  /api/count?hit=1  → increments once, returns { enabled, count }
 *
 * Also doubles as the funnel-beacon receiver (12-function limit: no new api file):
 * GET  /api/count?ev=pv_lp&src=producthunt&aid=<hex>  → { ok } (counters only, no PII)
 * Events land in Upstash via lib/funnel-server.js; read with scripts/funnel-report.mjs.
 *
 * Uses the existing Upstash Redis REST credentials. If they are not
 * configured, returns { enabled:false, count:0 } so the UI hides the
 * counter entirely — we never fabricate a number.
 *
 * Ported from skill-tree-resume/api/count.js (2026-06-02, MK viral横展開).
 */
import { trackFunnel, FUNNEL_SOURCES } from "../lib/funnel-server.js";
import { redisUrl, redisToken } from "../lib/env.js";
import { methodGuard } from "../lib/http.js";

const URL = redisUrl();
const TOKEN = redisToken();
const KEY = "nh_explore_count";

// Client-beacon events. Server-only events (trial_start, checkout_*, paid_*, churn_*)
// are written by their own api handlers and intentionally rejected here.
const FUNNEL_EVENTS = new Set([
  "pv_lp", "pv_onboarding", "pv_quiz", "pv_dashboard", "pv_prefectures", "pv_rpg",
  "pv_kana", "pv_wildlife", "pv_rank", "pv_blog", "pv_examprep", "pv_wherenext",
  "pv_other", "upgrade_success", "qa_ping",
]);

// Previous-page classes accepted on pv_* beacons (in-site transition tracking).
// Same vocabulary as the pv_* suffixes above.
const NAV_FROM = new Set(
  [...FUNNEL_EVENTS].filter((e) => e.startsWith("pv_")).map((e) => e.slice(3)),
);

async function redis(path) {
  const r = await fetch(`${URL}/${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`upstash ${r.status}`);
  const j = await r.json();
  return j.result;
}

export default async function handler(req, res) {
  // 呼び出し側は prefectures.html:1360 と lib/site-chrome.js:425、blog/blog-quiz.js:606。すべて GET。
  if (methodGuard(req, res, "GET")) return;
  res.setHeader("Cache-Control", "no-store");
  const ev = req.query && req.query.ev;
  if (ev) {
    // Affiliate-click beacons (aff_<partner>) are accepted alongside the pageview
    // whitelist, so funnel A (travel → affiliate) becomes measurable. ev is
    // regex-bounded before it is ever used as a Redis hash field.
    const isAff = /^aff_[a-z0-9_]{1,24}$/.test(ev);
    if (!URL || !TOKEN || (!FUNNEL_EVENTS.has(ev) && !isAff)) {
      res.status(200).json({ ok: false });
      return;
    }
    const src = FUNNEL_SOURCES.has(req.query.src) ? req.query.src : "other";
    const aid = typeof req.query.aid === "string" && /^[a-f0-9]{8,32}$/.test(req.query.aid)
      ? req.query.aid : null;
    const from = typeof req.query.from === "string" && NAV_FROM.has(req.query.from)
      ? req.query.from : null;
    await trackFunnel(ev, aid, src, from);
    res.status(200).json({ ok: true });
    return;
  }
  if (!URL || !TOKEN) {
    res.status(200).json({ enabled: false, count: 0 });
    return;
  }
  try {
    const hit = req.query && (req.query.hit === "1" || req.query.hit === 1);
    const count = hit ? await redis(`incr/${KEY}`) : await redis(`get/${KEY}`);
    res.status(200).json({ enabled: true, count: Number(count) || 0 });
  } catch (e) {
    // fail-open: hide counter rather than show a wrong number
    res.status(200).json({ enabled: false, count: 0 });
  }
}

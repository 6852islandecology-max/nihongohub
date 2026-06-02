/**
 * Social-proof counter for the Explore RPG layer (prefectures.html).
 * GET  /api/count        → { enabled, count }
 * GET  /api/count?hit=1  → increments once, returns { enabled, count }
 *
 * Uses the existing Upstash Redis REST credentials. If they are not
 * configured, returns { enabled:false, count:0 } so the UI hides the
 * counter entirely — we never fabricate a number.
 *
 * Ported from skill-tree-resume/api/count.js (2026-06-02, MK viral横展開).
 */
const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
const KEY = "nh_explore_count";

async function redis(path) {
  const r = await fetch(`${URL}/${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`upstash ${r.status}`);
  const j = await r.json();
  return j.result;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
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

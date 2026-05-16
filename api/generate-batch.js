// api/generate-batch.js
// POST /api/generate-batch — Admin 専用プリ生成バッチ（5 lang × 5 level × perCombo 問）

import { VALID_LEVELS, VALID_LANGS, generateQuiz } from "../lib/anthropic.js";
import { insertPregenerated, isSupabaseConfigured } from "../lib/supabase.js";
import { initSentry, captureApiError } from "../lib/sentry.js";

const DEFAULT_PER_COMBO = 100;
const MAX_PER_COMBO = 200;
const INTER_CALL_DELAY_MS = 150; // Anthropic レート対策（~6–7 req/s）

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default async function handler(req, res) {
  initSentry();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Admin Key 保護
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return res.status(501).json({ error: "ADMIN_KEY is not configured" });
  }
  const provided = req.headers["x-admin-key"];
  if (provided !== adminKey) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase is not configured" });
  }

  const body = req.body || {};
  const perCombo = Math.min(
    Math.max(1, parseInt(body.perCombo ?? DEFAULT_PER_COMBO, 10) || DEFAULT_PER_COMBO),
    MAX_PER_COMBO,
  );
  const targetLevels = Array.isArray(body.levels) && body.levels.length > 0
    ? body.levels.filter((l) => VALID_LEVELS.includes(l))
    : VALID_LEVELS;
  const targetLangs = Array.isArray(body.langs) && body.langs.length > 0
    ? body.langs.filter((l) => VALID_LANGS.includes(l))
    : VALID_LANGS;

  const summary = {
    requested: targetLevels.length * targetLangs.length * perCombo,
    generated: 0,
    inserted: 0,
    failed: 0,
    byCombo: [],
  };

  // Vercel Serverless のタイムアウトは Pro 60s / Hobby 10s。
  // Hobby で完走しないため、本エンドポイントは段階呼び出し前提 (levels/langs で小さく刻む)。
  for (const level of targetLevels) {
    for (const lang of targetLangs) {
      const items = [];
      for (let i = 0; i < perCombo; i++) {
        try {
          const quiz = await generateQuiz({ level, lang });
          items.push(quiz);
          summary.generated += 1;
          await sleep(INTER_CALL_DELAY_MS);
        } catch (err) {
          summary.failed += 1;
          console.error(`generateQuiz failed (${level}/${lang} #${i}):`, err.message);
          captureApiError(err, { api: "generate-batch", phase: "generateQuiz", level, lang, index: i });
        }
      }
      if (items.length > 0) {
        try {
          const n = await insertPregenerated({ level, lang, items });
          summary.inserted += n;
          summary.byCombo.push({ level, lang, generated: items.length, inserted: n });
        } catch (err) {
          console.error(`insertPregenerated failed (${level}/${lang}):`, err.message);
          captureApiError(err, { api: "generate-batch", phase: "insertPregenerated", level, lang, items: items.length });
          summary.byCombo.push({ level, lang, generated: items.length, inserted: 0, error: err.message });
        }
      }
    }
  }

  return res.status(200).json(summary);
}

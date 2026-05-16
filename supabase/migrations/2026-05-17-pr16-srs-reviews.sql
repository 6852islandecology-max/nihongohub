-- PR-16 SRS (Spaced Repetition System) — Supabase migration
-- 適用日: 2026-05-17 (Phase C1 着手日)
-- 仕様書: specs/PR-16-srs-algorithm-survey.md §3.2.1
-- 前提: PR-15 Free Trial Opt-in の users テーブルが既存であること (5/17 朝に同時 migration)
-- ロールバック: 同ディレクトリの 2026-05-17-pr16-rollback.sql 参照

-- 1. srs_reviews テーブル新設 (user × quiz × review 履歴)
CREATE TABLE IF NOT EXISTS srs_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- foreign keys
  user_id UUID NOT NULL,                -- REFERENCES users(id) (PR-15 で作成、後で FK 追加)
  quiz_id UUID NOT NULL,                -- REFERENCES pregenerated_quiz(id), JLPT + life mode 兼用

  -- SM-2 state
  ease_factor FLOAT NOT NULL DEFAULT 2.5,      -- EF, SM-2 standard initial
  interval_days INTEGER NOT NULL DEFAULT 0,    -- next interval in days
  repetitions INTEGER NOT NULL DEFAULT 0,      -- consecutive success count

  -- review timestamps
  last_review_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ NOT NULL,
  last_rating SMALLINT,                         -- 1=again, 2=hard, 3=good, 4=easy

  -- metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- one record per (user, quiz)
  UNIQUE (user_id, quiz_id),

  -- sanity constraints
  CHECK (ease_factor >= 1.3),
  CHECK (interval_days >= 0),
  CHECK (repetitions >= 0),
  CHECK (last_rating IS NULL OR last_rating BETWEEN 1 AND 4)
);

-- 2. インデックス
-- /api/srs-due の主クエリ: 「ユーザー X の next_review_at <= now() の行を取得」
CREATE INDEX IF NOT EXISTS idx_srs_reviews_user_next
  ON srs_reviews (user_id, next_review_at);

-- /api/srs-rate の upsert クエリ補助
CREATE INDEX IF NOT EXISTS idx_srs_reviews_user_quiz
  ON srs_reviews (user_id, quiz_id);

-- 3. updated_at の自動更新トリガ (Postgres 標準パターン)
CREATE OR REPLACE FUNCTION update_srs_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_srs_reviews_updated_at ON srs_reviews;
CREATE TRIGGER trg_srs_reviews_updated_at
  BEFORE UPDATE ON srs_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_srs_reviews_updated_at();

-- 検証クエリ (実行後手動チェック)
-- SELECT COUNT(*) FROM srs_reviews;  -- 期待: 0
-- \d srs_reviews                       -- 期待: 11 columns + 2 indexes + 1 trigger

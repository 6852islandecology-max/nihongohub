-- PR-25 Japan Life Quiz Mode — Supabase migration
-- 適用日: 2026-05-17 (Phase C1 着手日)
-- 仕様書: specs/PR-25-japan-life-quiz-v1.md §1.1
-- 適用方法: Supabase Dashboard → SQL Editor で本ファイル全文を貼り付け実行
-- ロールバック: 同ディレクトリの 2026-05-17-pr25-rollback.sql 参照

-- 1. quiz_mode カラム追加（既存行は 'jlpt' でデフォルト埋め、既存 1,525 行を保護）
ALTER TABLE pregenerated_quiz
  ADD COLUMN IF NOT EXISTS quiz_mode TEXT NOT NULL DEFAULT 'jlpt'
    CHECK (quiz_mode IN ('jlpt', 'life'));

-- 2. life_category カラム追加（life mode 時のみ NOT NULL、jlpt mode は NULL）
ALTER TABLE pregenerated_quiz
  ADD COLUMN IF NOT EXISTS life_category TEXT
    CHECK (life_category IS NULL OR life_category IN
      ('food', 'etiquette', 'rules', 'history_geo', 'popculture'));

-- 3. 整合性制約: life mode なら life_category 必須、jlpt mode なら life_category NULL
ALTER TABLE pregenerated_quiz
  ADD CONSTRAINT IF NOT EXISTS chk_life_category_consistency
    CHECK (
      (quiz_mode = 'jlpt' AND life_category IS NULL)
      OR (quiz_mode = 'life' AND life_category IS NOT NULL)
    );

-- 4. 複合 index（fetchCachedQuiz の WHERE 句最適化）
CREATE INDEX IF NOT EXISTS idx_pregenerated_quiz_mode_lang_cat
  ON pregenerated_quiz (quiz_mode, lang, life_category);

-- 5. 既存 idx_pregenerated_quiz_level_lang は jlpt mode 専用に降格（drop しない、キャッシュヒット維持）
-- 何もしない（既存 index はそのまま、jlpt mode のクエリでヒット）

-- 検証クエリ（実行後手動チェック）
-- SELECT quiz_mode, life_category, COUNT(*) FROM pregenerated_quiz GROUP BY quiz_mode, life_category;
-- 期待結果: quiz_mode='jlpt', life_category=NULL, count=1525 のみ

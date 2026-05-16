-- PR-25 ロールバック — Supabase migration
-- 仕様書: specs/PR-25-japan-life-quiz-v1.md §1.2
-- 実行条件: migration 適用後に致命的問題が見つかった場合のみ
-- 注意: ロールバック後、新規 life mode 行は喪失する。既存 jlpt データは保護

ALTER TABLE pregenerated_quiz DROP CONSTRAINT IF EXISTS chk_life_category_consistency;
ALTER TABLE pregenerated_quiz DROP COLUMN IF EXISTS life_category;
ALTER TABLE pregenerated_quiz DROP COLUMN IF EXISTS quiz_mode;
DROP INDEX IF EXISTS idx_pregenerated_quiz_mode_lang_cat;

-- 検証クエリ
-- \d pregenerated_quiz
-- 期待結果: quiz_mode / life_category カラムが消えている、既存 1,525 行は保持

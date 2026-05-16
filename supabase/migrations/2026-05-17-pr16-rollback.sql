-- PR-16 SRS ロールバック — Supabase migration
-- 仕様書: specs/PR-16-srs-algorithm-survey.md
-- 実行条件: srs_reviews テーブル全削除が必要な場合のみ
-- 注意: ロールバック後、全ユーザーの review 履歴が失われる

DROP TRIGGER IF EXISTS trg_srs_reviews_updated_at ON srs_reviews;
DROP FUNCTION IF EXISTS update_srs_reviews_updated_at();
DROP INDEX IF EXISTS idx_srs_reviews_user_quiz;
DROP INDEX IF EXISTS idx_srs_reviews_user_next;
DROP TABLE IF EXISTS srs_reviews;

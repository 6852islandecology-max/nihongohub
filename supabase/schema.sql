-- NihongoHub Supabase schema v1 (Phase B)
-- 次セッションで Supabase Console → SQL Editor に貼り付けて実行

-- プリ生成クイズキャッシュ
CREATE TABLE IF NOT EXISTS pregenerated_quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('N1','N2','N3','N4','N5')),
  lang TEXT NOT NULL CHECK (lang IN ('en','zh','es','th','id')),
  question_ja TEXT NOT NULL,
  reading TEXT,
  correct TEXT NOT NULL,
  distractors JSONB NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pregenerated_quiz_level_lang
  ON pregenerated_quiz (level, lang);

-- RLS: Service Role Key でのみ書き込み、Anon Key からの直接アクセスは禁止
ALTER TABLE pregenerated_quiz ENABLE ROW LEVEL SECURITY;

-- 閲覧ポリシー: service_role のみ（アプリは SERVICE_ROLE_KEY で接続するので通る）
CREATE POLICY "service_role_all"
  ON pregenerated_quiz
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

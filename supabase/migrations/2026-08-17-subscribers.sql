-- 2026-08-17: first-party email list (owned asset; replaces the Substack hand-off in blog/blog-quiz.js).
-- Run ONCE in Supabase Console → SQL Editor. Idempotent.
--
-- Browser writes directly via PostgREST with the anon key (no api/ function: Hobby cap is 12/12).
-- anon can INSERT only; it can never read, update or delete rows. service_role reads for sending.

CREATE TABLE IF NOT EXISTS public.subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  source          TEXT,                       -- page path the form was on (e.g. /blog/tokushima-v2.html)
  lang            TEXT,                       -- <html lang> of that page (en / zh-Hant / es / th / id)
  ref             TEXT,                       -- traffic-source class from the funnel beacon, or utm_source
  consent         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ,                -- reserved for double opt-in
  unsubscribed_at TIMESTAMPTZ,
  CONSTRAINT subscribers_email_format CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT subscribers_email_len    CHECK (char_length(email) <= 254),
  CONSTRAINT subscribers_source_len   CHECK (source IS NULL OR char_length(source) <= 200),
  CONSTRAINT subscribers_lang_len     CHECK (lang   IS NULL OR char_length(lang)   <= 16),
  CONSTRAINT subscribers_ref_len      CHECK (ref    IS NULL OR char_length(ref)    <= 64)
);
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_lower_key ON public.subscribers (lower(email));
CREATE INDEX IF NOT EXISTS idx_subscribers_created ON public.subscribers (created_at);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscribers_anon_insert ON public.subscribers;
CREATE POLICY subscribers_anon_insert ON public.subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- No SELECT / UPDATE / DELETE policy for anon or authenticated: write-only from the browser.

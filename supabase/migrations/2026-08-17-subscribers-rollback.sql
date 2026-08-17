-- Rollback for 2026-08-17-subscribers.sql. Drops the list — export first if it has rows.
DROP POLICY IF EXISTS subscribers_anon_insert ON public.subscribers;
DROP TABLE IF EXISTS public.subscribers;

-- 2026-06-02: Free Trial (PR-15) + Stripe (#4) foundation.
-- Run ONCE in Supabase Console → SQL Editor.
-- Safe to re-run (IF NOT EXISTS / idempotent).

-- 1) public.users profile, keyed to auth.users(id) ----------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  trial_status  TEXT NOT NULL DEFAULT 'never_started'
                  CHECK (trial_status IN ('never_started','active','expired','converted')),
  trial_start_date TIMESTAMPTZ,
  trial_end_date   TIMESTAMPTZ,
  plan          TEXT NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free','pro','lifetime')),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_trial_status_end ON public.users (trial_status, trial_end_date);

-- 2) auto-create a profile row when a new auth user signs up -------------------
--    (so api/trial-start can always find a row; reduces owner wiring)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3) trial / billing audit log ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN
                ('trial_started','trial_day5_email_sent','trial_expired',
                 'upgraded_lifetime','upgraded_pro','cancelled_pro')),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trial_events_user_created ON public.trial_events (user_id, created_at);

-- 4) RLS: profiles readable/updatable only by their owner; service_role bypasses.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_self_select ON public.users;
CREATE POLICY users_self_select ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users FOR UPDATE USING (auth.uid() = id);
-- trial_events: server (service_role) writes only; no client policy needed.
ALTER TABLE public.trial_events ENABLE ROW LEVEL SECURITY;

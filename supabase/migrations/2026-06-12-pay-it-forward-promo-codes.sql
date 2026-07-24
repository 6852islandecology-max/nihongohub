-- 2026-06-12: Pay-it-forward $5 gift system (Phase 3).
-- $5 donation → 10 Pro codes (1-month each) → buyer shares them in their community.
-- Run ONCE in Supabase Console → SQL Editor. Safe to re-run (IF NOT EXISTS).

-- 1) promo_codes table --------------------------------------------------------
--    One row per code. A single $5 gift purchase inserts 10 rows
--    sharing the same sponsor_session.
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT UNIQUE NOT NULL,
  product        TEXT NOT NULL DEFAULT 'pro_1month'
                   CHECK (product IN ('pro_1month','pro_3month','lifetime_gift')),
  valid_from     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until    TIMESTAMPTZ NOT NULL,
  used_by        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  used_at        TIMESTAMPTZ,
  sponsor_session TEXT,                          -- Stripe checkout.session.id of the gift purchase
  sponsor_email  TEXT,                           -- email of the buyer (for "from X" attribution)
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code      ON public.promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_sponsor   ON public.promo_codes (sponsor_session);
CREATE INDEX IF NOT EXISTS idx_promo_codes_used_at   ON public.promo_codes (used_at);

-- 2) RLS: anon may read aggregate count via the view below, but NEVER raw codes.
--    Only service_role inserts and marks used.
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
-- No client SELECT/UPDATE policies → table is server-only by default.

-- 3) public counter view (sponsorship total, NO code leak) --------------------
--    "Total Students Sponsored by Donors" reads from this view.
--    Counts codes that have actually been redeemed (more honest than created).
DROP VIEW IF EXISTS public.pay_it_forward_counter;
CREATE VIEW public.pay_it_forward_counter
WITH (security_invoker = true) AS
SELECT
  COUNT(*) FILTER (WHERE used_at IS NOT NULL)                    AS sponsored_count,
  COUNT(DISTINCT sponsor_session)                                 AS sponsor_count,
  MAX(used_at)                                                    AS last_sponsored_at
FROM public.promo_codes;

-- Grant public read on the view (aggregates only, no raw codes leak).
GRANT SELECT ON public.pay_it_forward_counter TO anon, authenticated;

-- 4) redeem RPC: server-only function that marks a code used + extends user Pro.
--    Client calls this via supabase.rpc('redeem_promo_code', {p_code: '...'}).
--    SECURITY DEFINER so it can write to promo_codes (which RLS otherwise blocks).
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row  public.promo_codes%ROWTYPE;
  v_pro_until TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_signed_in');
  END IF;

  SELECT * INTO v_row FROM public.promo_codes
    WHERE code = UPPER(TRIM(p_code))
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_code');
  END IF;
  IF v_row.used_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_redeemed');
  END IF;
  IF NOW() > v_row.valid_until THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  -- Mark redeemed
  UPDATE public.promo_codes
    SET used_by = v_user, used_at = NOW()
    WHERE id = v_row.id;

  -- Extend the user's Pro window by 30 days from now (or from existing Pro end).
  -- Simple model: just flip plan to 'pro' and stamp an event.
  UPDATE public.users
    SET plan = 'pro', trial_status = 'converted'
    WHERE id = v_user;
  INSERT INTO public.trial_events (user_id, event_type, metadata)
    VALUES (v_user, 'upgraded_pro', jsonb_build_object('source', 'pay_it_forward_gift', 'code_id', v_row.id));

  RETURN jsonb_build_object('ok', true, 'product', v_row.product, 'sponsor_email', v_row.sponsor_email);
END; $$;

REVOKE ALL ON FUNCTION public.redeem_promo_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(TEXT) TO authenticated;

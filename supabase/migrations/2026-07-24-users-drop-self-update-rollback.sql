-- 2026-07-24-users-drop-self-update.sql の取り消し。
-- 元の状態（本人が自分の行を UPDATE できる）に戻す。
--
-- 注意: 戻すと、ログイン済みユーザーがブラウザから自分の plan を
-- 'lifetime' に書き換えられる状態に戻る可能性がある。
-- 何かが壊れたときの緊急退避としてのみ使うこと。

BEGIN;

GRANT UPDATE ON public.users TO anon, authenticated;

DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users FOR UPDATE USING (auth.uid() = id);

COMMIT;

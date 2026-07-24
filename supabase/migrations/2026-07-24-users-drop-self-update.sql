-- 2026-07-24: public.users への「本人による UPDATE」を塞ぐ。
--
-- 未適用。適用はオーナー作業（Supabase ダッシュボード → SQL Editor）。
--
-- ── 背景 ────────────────────────────────────────────────────────────────
-- migrations/2026-06-02-users-trial-stripe.sql:53-54 が次のポリシーを作っている。
--
--   CREATE POLICY users_self_update ON public.users FOR UPDATE USING (auth.uid() = id);
--
-- このポリシーには WITH CHECK も列の制限も無い。public.users に対する
-- 列レベルの GRANT / REVOKE も全 SQL を確認した範囲で存在しない。
-- Supabase は既定で authenticated ロールにテーブル権限を与えるため、RLS が唯一の門になる。
-- したがって、ログイン済みユーザーが anon key を使ってブラウザから
--
--   update users set plan = 'lifetime' where id = auth.uid()
--
-- を実行できる状態にある可能性が高い。つまり課金を経ずに Pro / Lifetime を名乗れる。
--
-- ── なぜ削除して安全か ──────────────────────────────────────────────────
-- アプリはこのポリシーを使っていない。public.users への書き込みはすべてサーバ側の
-- service role 経由で、service role は RLS をバイパスする。
--
--   api/stripe-webhook.js:137, :157   plan / trial_status / stripe_* の更新
--   api/trial-start.js:48             トライアル開始
--   api/trial-status.js:28            期限切れ反映
--   api/upgrade-checkout.js:48        stripe_customer_id の保存
--
-- ブラウザ側から users を UPDATE するコードは、NihongoHub にも Echo にも存在しない
-- （両リポジトリを grep して確認。読み取りは Echo の src/plan.js:25 のみ）。
--
-- SELECT 側のポリシー（users_self_select）は残す。Echo がプラン判定に使っている。
--
-- ── 未確認 ─────────────────────────────────────────────────────────────
-- 本番 DB で実際に上記の UPDATE が通るかは検証していない（本番への実行が必要なため）。
-- 適用前に、Supabase の SQL Editor で対象ユーザーになりすまして確認するのが望ましい。
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

-- 1) 本人による UPDATE ポリシーを削除
DROP POLICY IF EXISTS users_self_update ON public.users;

-- 2) 念のため、テーブル権限としても UPDATE を落とす
--    （将来ポリシーが復活しても、権限が無ければ更新できない）
REVOKE UPDATE ON public.users FROM anon, authenticated;

COMMIT;

-- 適用後の確認
--   select polname, cmd from pg_policies where tablename = 'users';
--     → users_self_select だけが残っていること
--   select grantee, privilege_type from information_schema.role_table_grants
--     where table_name = 'users' and grantee in ('anon','authenticated');
--     → UPDATE が無いこと

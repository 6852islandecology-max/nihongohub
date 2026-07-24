# NihongoHub Supabase スキーマ

最終確認 2026-07-24。

## 重要: schema.sql は最新ではない

`schema.sql` は 2026-04 時点のスナップショットで、`pregenerated_quiz` と `user_progress` の 2 テーブルしか含まない。
その後のテーブルはすべて `migrations/` 側にある。新しい環境を作るときは schema.sql だけでは再現できない。

## DDL の管理経路が 3 系統に分裂している

これが現状で一番の問題。同じテーブルの定義が複数箇所にある。

1. `schema.sql` — 初期 2 テーブル
2. `migrations/*.sql` — 6 本（rollback 2 本を除く）
3. `../GO-LIVE-OWNER-STEPS.md` の STEP A — migrations に無い DDL が直書きされている

とくに 3 に含まれる次の 2 点は、どの migration ファイルにも存在しない。

- `user_progress` と `leaderboard` の作成 SQL（1 と 2 に同等のものがあるが、文面が違う二重管理）
- `create policy "users_self_read_plan" on users for select to authenticated using (auth.uid() = id)`
  これは `migrations/2026-06-02-users-trial-stripe.sql:52` の `users_self_select` と実質同じ内容の重複ポリシー。
  Echo（shadowing-app）が `public.users` からプランを読むために追加された。

## 適用順

新規環境を作る場合。

```
1. schema.sql
2. migrations/2026-05-17-pr16-srs-reviews.sql
3. migrations/2026-05-17-pr25-life-quiz-mode.sql
4. migrations/2026-06-02-users-trial-stripe.sql
5. migrations/2026-06-05-leaderboard.sql
6. migrations/2026-06-12-pay-it-forward-promo-codes.sql
7. GO-LIVE-OWNER-STEPS.md STEP A の 3 番目（users_self_read_plan）
```

`*-rollback.sql` は適用しない（取り消し用）。

## テーブル一覧

| テーブル | 定義場所 | RLS | 備考 |
|---|---|---|---|
| `pregenerated_quiz` | schema.sql:5 + pr25 migration で列追加 | 有効。`service_role_all` のみ | クイズキャッシュ |
| `user_progress` | schema.sql:36 | 有効。self select/insert/update | 端末間同期 |
| `srs_reviews` | pr16 migration:8 | 記述なし（= 無効） | コードから一度も参照されていない。下記参照 |
| `public.users` | 2026-06-02 migration:6 | 有効。self select / self update | Echo との共有契約。下記参照 |
| `public.trial_events` | 2026-06-02 migration:38 | 有効・ポリシー無し（service_role 専用） | 課金監査ログ |
| `leaderboard` | 2026-06-05 migration:6 | 有効・ポリシー無し | `/api/rank*` が service role で読み書き |
| `public.promo_codes` | 2026-06-12 migration:8 | 有効・クライアントポリシー無し | Pay-it-forward。集計 view と RPC あり |

## public.users は 2 リポジトリ間の契約

Echo（`.secretary/projects/shadowing-app`）の `src/plan.js:25-27` が、この表から
`plan` / `trial_status` / `trial_end_date` を読んでお気に入り上限を決める。
Echo 側の `supabase/migrations/` にはこの表の定義が無い。定義は NihongoHub 側にしかない。

`src/plan.js` はフェイルオープン設計なので、列名を変えても例外は出ず、
お気に入り上限が黙って無制限になるだけで誰も気付かない。列や CHECK 制約を変えるときは必ず Echo も確認すること。

## srs_reviews は使われていない

`.from("srs_reviews")` の呼び出しはコード全体でゼロ。参照は `lib/srs-browser.js` のコメントのみ。
SRS の永続化はブラウザの localStorage で完結している。
このテーブルだけ RLS の記述が無いのも、実際には使われていないことの傍証。

Vercel の関数枠が 12 で埋まっているため、`api/srs-due.js` のような新規エンドポイントを足す形でのサーバ側 SRS 実装は現状できない。実装するなら既存エンドポイントへの相乗りになる。

## rollback SQL が揃っていない

| migration | rollback |
|---|---|
| pr16-srs-reviews | あり |
| pr25-life-quiz-mode | あり |
| 2026-06-02-users-trial-stripe | 無し |
| 2026-06-05-leaderboard | 無し |
| 2026-06-12-pay-it-forward-promo-codes | 無し |

## 未確認の事項

- `migrations/2026-05-17-pr25-life-quiz-mode.sql:20` の `ADD CONSTRAINT IF NOT EXISTS` は、
  PostgreSQL の `ALTER TABLE ... ADD CONSTRAINT` では一般にサポートされない構文。
  このファイルが本番で成功実行されたかは確認していない。
- 上記の適用順が実際の本番の状態と一致しているかは、本番 DB を見ないと確定できない。

## 適用のしかた

DDL の適用はオーナー作業。Supabase ダッシュボード → SQL Editor に貼って実行する。
API キーだけでは DDL を流せない。

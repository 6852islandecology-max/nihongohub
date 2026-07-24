# NihongoHub ライブ化 — オーナー操作手順（2026-06-05）

> 補足（2026-07-24 追記）: 「コードはすべて本番反映済み」は 2026-06-05 時点の記述で、現在は成立しない。
> 作業ツリーに未コミットの変更が 470 件以上あり、その分は本番に出ていない。
> なお、デプロイ方式について本文は git push と書いており、これは 2026-07-22 に再確認された現行方式と一致する
> （同時期の STRIPE-SETUP.md と specs/2026-06-15-geo-spearhead-plan.md は `vercel --prod` 直接デプロイと
> 書いているが、そちらが撤回された側）。

コードはすべて本番反映済み（git push → Vercel 自動デプロイ）。下記4点だけ、Supabase ダッシュボード /
Gumroad / Vercel の操作が必要です（API キーだけでは DDL も Auth 設定も外部口座も触れないため、ここは
オーナー操作になります）。所要 ~15分。

診断で判明（本番 Supabase 実測）:
- `users` 表: あり ✓
- `leaderboard` 表: なし → 作成が必要（マイランキング）
- `user_progress` 表: なし → 端末間同期(sync.js)が今まで動いていなかった。下の SQL で同時に作成
- Anonymous sign-ins: 無効 → マイランキングと端末間同期に必要。下で有効化

---

## STEP A — Supabase SQL エディタに以下を貼って実行（1回）
プロジェクト: `udwiqbetcewhvqtdwvov`（NihongoHub）。ダッシュボード → SQL Editor → 貼り付け → Run。

```sql
-- 1) 端末間同期ストレージ（今まで未作成だった。sync.js 用）
create table if not exists user_progress (
  user_id uuid primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table user_progress enable row level security;
create policy "users_select_own_progress" on user_progress for select to authenticated using (auth.uid() = user_id);
create policy "users_upsert_own_progress" on user_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "users_update_own_progress" on user_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_user_progress_updated_at on user_progress (updated_at desc);

-- 2) マイランキング（匿名・国別・月次）
create table if not exists leaderboard (
  user_id    uuid primary key,
  country    text not null default 'XX',
  score      numeric(5,3) not null default 0,
  level      text,
  period     text not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_leaderboard_country_period_score on leaderboard (country, period, score desc);
alter table leaderboard enable row level security;
-- 読み書きは /api/rank* がサービスロールで行うため、公開ポリシーは作らない（RLS 有効・ポリシー無し）。

-- 3) Echo がプランを読めるように users の self-read を許可（WS7・Echo統一時に必要）
create policy "users_self_read_plan" on users for select to authenticated using (auth.uid() = id);
```

## STEP B — Supabase で Anonymous sign-ins を有効化
ダッシュボード → Authentication → Sign In / Providers → 「Anonymous sign-ins」を ON。
（これで端末間同期＋マイランキングの匿名セッションが機能。未対応だと両方フェイルオープンで非表示のまま）

→ STEP A+B 完了で「マイランキング」と「端末間同期」がライブになります。

## STEP C — Gumroad（移住セット販売）
1. Gumroad で「Japan Relocation 3-Volume Set」($19.99) を作成し、商品URLを取得。
2. `lib/config.js` を編集:
   - `GUMROAD_LIVE: true`
   - `PRODUCT_URL: '<取得した Gumroad URL>'`
3. commit & push（自動デプロイ）。これで移住記事の「NOTIFY ME」ボタンが本物の購入リンクに切替。

## STEP D — Echo の Pro 連動（任意・Echo再デプロイ時）
`shadowing-app/WS7-UNIFY-RUNBOOK.md` の手順（Echo の 0001-0005 を上の Supabase で実行＋Echoの
Vercel env の SUPABASE_URL/ANON_KEY を NihongoHub のものへ＋`npm run deploy`）。
未対応の間は Echo は従来どおり（フェイルオープン）。

---

## すでにライブ（操作不要）
- 共通ナビ／プラン状態チップ／言語バー／フッター、レベル測定LP主役、苦手単語TOP10、学習カレンダー、
  称号（語＋助詞組み合わせ）＋ギルドカード画像シェア、装備修正、バトル主人公アバター、
  サイトアイコン（鳥居）、料金の誠実化＋Pro価値（SRS/PDF）。
- マイランキングカードは STEP A+B まで自動で非表示（フェイルオープン）。完了後に表示開始。

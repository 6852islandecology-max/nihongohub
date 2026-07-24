# Stripe 本番有効化 手順書

コードは実装済み。Vercel に環境変数を設定するだけで決済が稼働します。
所要時間: 約20〜30分

---

## STEP 1 — Stripe ダッシュボード セキュリティ設定（最初に必須）

1. https://dashboard.stripe.com/ にログイン
2. 右上アカウントアイコン → **Account settings** → **Two-step authentication** → 有効化
3. **Radar settings** → **3D Secure** → 「Dynamically require 3DS based on risk」を選択

---

## STEP 2 — 商品とPrice IDを作成

Stripe Dashboard → **Products** → **+ Add product**

### Pro プラン（月額）
- Name: `NihongoHub Pro`
- Description: Unlimited daily SRS review + PDF study sheets
- Price: `$9.99` / `month` / recurring
- → 作成後に表示される **Price ID** をコピー（`price_` で始まる文字列）

### Lifetime プラン（買い切り）
- Name: `NihongoHub Lifetime`
- Description: Everything in Pro, forever
- Price: `$149.00` / one time
- → 作成後に表示される **Price ID** をコピー

---

## STEP 3 — Webhook エンドポイントを作成

Stripe Dashboard → **Developers** → **Webhooks** → **+ Add endpoint**

- Endpoint URL: `https://www.nihongo-hub.com/api/stripe-webhook`
- Events to listen（2つ選択）:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
- → 作成後に表示される **Signing secret**（`whsec_` で始まる）をコピー

---

## STEP 4 — Vercel に環境変数を追加

https://vercel.com/dashboard → nihongohub プロジェクト → **Settings** → **Environment Variables**

追加する変数（4つ）:

| Key | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...`（Developers → API keys から取得）|
| `STRIPE_PRICE_PRO` | `price_...`（STEP 2 の Pro Price ID）|
| `STRIPE_PRICE_LIFETIME` | `price_...`（STEP 2 の Lifetime Price ID）|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`（STEP 3 の Signing secret）|

また、以下が未設定なら追加:
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |

---

## STEP 4.5 — Customer Portal を有効化（解約に必須）

Stripe Dashboard → **Settings** → **Billing** → **Customer portal** → **Activate**
- 「Cancel subscriptions」「Update payment methods」を許可に設定。
- これを有効化しないと `api/stripe-portal.js`（アカウントの「Manage / cancel subscription」）が
  `billingPortal.sessions.create` でエラーになり、特商法「いつでも解約」の導線が動かない。

---

## STEP 5 — 再デプロイ

Vercel Dashboard → nihongohub → **Deployments** → 最新のデプロイ → **...** → **Redeploy**

または作業ディレクトリ（`.secretary/projects/nihongohub`）から:
```
npx vercel --prod
```
（注意: 本プロジェクトは `git push` での再デプロイは使わない＝アフィリ配線が本番より遅れた
git 状態に巻き戻るため。デプロイは常に作業ディレクトリからの `npx vercel --prod`。）

> 訂正（2026-07-24 追記）: 上の記述は 2026-07-22 に撤回された。現行方式は git commit → push。
> `npx vercel --prod` によるローカル作業ディレクトリからの直接デプロイは禁止。
>
> 理由: 直接デプロイした内容は git に入らないため、その後 push 型の自動デプロイが走るたびに
> 上書きされて消えていた。2026-07-22 に、本番の index.html や共通ナビからリンクされているのに
> リンク先が 404（kana.html / exam-prep.html）という壊れリンクが多数見つかり、原因がこれと判明した。
> 英語原文が未コミットで翻訳版だけコミット済みのため hreflang が 404 を指す、という整合崩れも 11 記事で発生していた。
>
> 上の「git 状態に巻き戻る」という懸念自体は正しい。ただし正しい対処は直接デプロイではなく、
> デプロイ前に対象ファイルを確実に commit することだった。

---

## STEP 6 — 動作確認

1. https://www.nihongo-hub.com/ を開く
2. ログイン → 「Upgrade to Pro」ボタンが表示されることを確認
3. ボタンを押して Stripe Checkout 画面が開くことを確認（テストカード不要、本番）
4. Stripe Dashboard → Webhooks → エンドポイント → 「テストイベントを送信」で疎通確認

---

## 完了の状態

- `stripeEnabled = true`（`/api/public-config` が `stripeEnabled: true` を返す）
- Pro ボタン押下 → Stripe Checkout ページへリダイレクト
- 決済完了 → Webhook が発火 → Supabase `users.plan = 'pro'` に更新
- 月次キャンセル → Webhook が発火 → `users.plan = 'free'` に戻る

---

## 注意事項

- Stripe API key は `sk_live_` で始まる本番キーを使用（`sk_test_` は動くが実際に課金されない）
- Webhook のエンドポイントURLは必ず `https://www.nihongo-hub.com/` のドメインで（Vercel preview URLはNG）
- STRIPE_SECRET_KEY を公開リポジトリにコミットしない（`.gitignore` で `.env` を除外済み）

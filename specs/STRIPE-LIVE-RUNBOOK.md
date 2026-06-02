# Stripe 本番(ライブ)化ランブック — 審査通過後の手順

状態: 2026-06-02 にアカウント有効化を申請（審査中）。テストモードでは E2E 実証済み（signup→Checkout→Webhook→`users.plan='pro'`）。
本番(live)化はコード変更ゼロ。**env を live 値に差し替えるだけ**。

## 前提（テストモードと同じ仕組み）
- コードは `STRIPE_*` env を読むだけ。`Stripe.createFetchHttpClient()` 適用済（Vercel 接続エラー対策）。
- 商品・Webhook は **モードごとに別**。テストモードのものは live に引き継がれない → live で作り直す。

## 手順（Stripe 審査が「有効」になったら）

1. **(推奨) Vercel API トークンをローテ** — live シークレットを env に入れる前に。漏洩済みトークンを無効化＆再発行。

2. Stripe ダッシュボードを **本番モード**にして、live で再作成：
   - **商品2つ** → Pro `US$9.99/月(継続)` / Lifetime `US$149(一回)` → **live Price ID ×2**
   - **Webhook** → URL `https://www.nihongo-hub.com/api/stripe-webhook` / イベント `checkout.session.completed` + `customer.subscription.deleted` → **live `whsec_`**
   - **API キー** → `sk_live_`

3. **Vercel env を live 値へ差替**（Production/Preview/Development）:
   ```
   STRIPE_SECRET_KEY     = sk_live_...
   STRIPE_WEBHOOK_SECRET = whsec_...(live)
   STRIPE_PRICE_PRO      = price_...(live Pro)
   STRIPE_PRICE_LIFETIME = price_...(live Lifetime)
   ```

4. **再デプロイ**（空コミット or Vercel Redeploy）。

5. **本番スモーク検証**（秘書が実施）:
   - `/api/public-config` → `stripeEnabled:true`
   - サイト右下 FAB から実アカウント作成 → Upgrade → **実カードで少額決済 → Stripe で即返金**
   - `users.plan='pro'` 反映確認（trial-status）
   - ※ 本番は実カードのみ（テストカード不可）。少額実決済→即返金が安全。

## ライブ開始前のラスト確認（法務）
- 特商法ページ（tokushoho.html）= 記入済。**弁護士/行政書士の最終レビュー推奨**。
- 返金ポリシー（refund-policy-draft.md）も同時にレビュー。未実装の「N3保証」は記載しない方針。

## 後始末
- テストユーザー（smoketest+/paytest_*@nihongo-hub.com）を Supabase Auth Users で削除。
- Stripe テストモードのテストデータは残置で問題なし（live と分離）。

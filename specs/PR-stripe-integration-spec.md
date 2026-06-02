# Stripe 決済統合 仕様（#4 / 2026-06-02 起案）

**起案**: 秘書（概念図 6/2 版 Gap #4 対応）
**ステータス**: spec-v1（**コード実装前**。go-live は owner の Stripe 個人事業主登録後）
**前提**: PR-15 Free Trial（`PR-15-free-trial-optin-spec.md`）+ Supabase Auth + `users` テーブル拡張が先。
**所要見積**: 実装 6-10h（Auth 完了後）

> ⚠️ **なぜ今コードを書かないか（忖度なし）**: Stripe Webhook/Checkout は ①Stripe アカウント（owner 登録待ち）②Supabase Auth + `users` テーブル（未構築）③本番 Webhook 署名検証の実地テスト、が揃わないと**検証不能**。検証できない決済コードを先に置くのは月次バイブコーディング監査のリスク類型（過大設計・未検証）に該当するため、本ファイルで「実装レディな設計」を確定し、土台が揃い次第コードを起こす。

---

## 1. 商品設計（Phase C1 範囲）

| 商品 | 価格 | Stripe 種別 | 備考 |
|---|---|---|---|
| Pro 月額 | $9.99/月 | `subscription` (recurring) | 主柱 |
| Lifetime | $149 一括 | `payment` (one-time) | Launch 主訴求 |
| Academic | $19.99/月 | （Phase D2 後送り） | 本 spec 範囲外 |

PPP（購買力平価）調整は Stripe Adaptive Pricing で Phase D 検討（C1 はベース価格のみ）。

## 2. エンドポイント（`api/` 追加予定・サーバ側キー保持）

| ファイル | 役割 | 主処理 |
|---|---|---|
| `api/stripe-checkout.js` | Checkout Session 作成 | `mode='subscription'`(Pro) / `'payment'`(Lifetime)、`success_url`/`cancel_url`、`client_reference_id=user_id` |
| `api/stripe-webhook.js` | Webhook 受信 | 署名検証 → `checkout.session.completed` / `customer.subscription.deleted` で `users.plan` 更新 + `trial_events` 記録 |
| `api/stripe-portal.js` | Billing Portal | Pro 解約・支払い方法変更（特商法「いつでも解約」対応） |

## 3. 環境変数（owner が Vercel に設定）

```
STRIPE_SECRET_KEY=sk_live_...           # サーバ側のみ
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook 署名検証
STRIPE_PRICE_PRO=price_...              # Pro $9.99/月
STRIPE_PRICE_LIFETIME=price_...         # Lifetime $149
STRIPE_PUBLISHABLE_KEY=pk_live_...      # フロント（公開可）
```

## 4. plan 状態遷移（PR-15 と接続）

```
free → (Free Trial) → active(trial) → (Day7) → expired
expired/active → [Checkout] → converted: plan='pro' | 'lifetime'
pro → [Portal 解約] → free（期末まで pro 維持）
```

## 5. Webhook で扱うイベント（最小）

- `checkout.session.completed` → `mode` で pro/lifetime 判定 → `users.plan` 更新、`stripe_customer_id`/`stripe_subscription_id` 保存
- `customer.subscription.deleted` → `users.plan='free'`
- `invoice.payment_failed` → （C1 は記録のみ、リトライは Stripe 既定）

## 6. 法務（NHL 連動）

- 特商法表記ページ（事業者名・所在地・連絡先・返金条件）: **owner 個人事業主登録後に確定**。`refund-policy-draft.md` を基に Admin が確定。
- Lifetime の返金条件は明示（例: 14 日以内・未使用相当）。

## 7. go-live チェックリスト（実装後）

- [ ] owner: Stripe アカウント（個人事業主）+ 商品/Price 作成 + 環境変数設定
- [ ] Supabase Auth + `users` テーブル拡張（PR-15 §2）適用
- [ ] Webhook を Stripe Dashboard に登録（`/api/stripe-webhook`）+ 署名検証テスト
- [ ] テストモードで Checkout→Webhook→`users.plan` 更新を E2E 確認
- [ ] 特商法ページ公開（NHL）
- [ ] 月次バイブコーディング監査: API キー サーバ側保持を grep 確認

## 8. 実装順（土台が揃ったら）

1. Supabase Auth + users 拡張（PR-15 §2 migration）
2. `api/stripe-checkout.js`（Lifetime 一括が最小・テスト容易）
3. `api/stripe-webhook.js`（署名検証 + plan 更新）
4. フロント Upgrade ボタン → Checkout 遷移
5. `api/stripe-portal.js`（解約導線）

# Pay-it-forward 点火 — オーナー作業チェックリスト (約 30 分)

$5 → 10 人に 1 ヶ月 Pro コードのギフト機構。コードは全実装・デプロイ準備済み。
以下 4 ステップ完了後にチャットで「Pay-it-forward 作業完了」と伝えてください → Claude が Stripe テストモード E2E を実行します。

## 1. Supabase migration 実行 (2 分)

1. https://supabase.com/dashboard → NihongoHub プロジェクト → SQL Editor
2. `supabase/migrations/2026-06-12-pay-it-forward-promo-codes.sql` の中身を貼り付け → Run
3. 成功確認: Table Editor に `promo_codes` テーブルが出現

## 2. Stripe Payment Link 作成 (5 分)

1. https://dashboard.stripe.com → 商品カタログ → 商品を追加
   - 名前: `Gift Pro x10`、価格: **$5.00 / one-time**
2. Payment Links → 新規作成 → 上記商品を選択
   - 数量 1・「顧客が数量を調整できるように」は **チェックしない**
3. メタデータは不要 (現行の Stripe ダッシュボード UI は Payment Link にメタデータ欄が無いため)。
   webhook 側で **「$5.00 USD ちょうど + アプリ由来の user_id/plan 無し = ギフト」** と自動判定するよう修正済み (2026-06-12)。
   🚨 将来 $5 の Stripe 商品を別に追加する場合は webhook の判定を Price-ID 方式に変える必要あり。
4. 作成された URL (`https://buy.stripe.com/...`) を控える

## 3. Resend セットアップ (15 分 — DNS 伝播待ち含む)

1. https://resend.com でサインアップ (無料枠 100 通/日で十分)
2. Domains → Add Domain → `mail.nihongo-hub.com`
3. 表示される DNS レコード (SPF/DKIM の TXT + MX) を **nihongo-hub.com のレジストラ**(DNS 管理画面)に追加
4. Resend 側で Verify が通るのを待つ (数分〜1 時間)
5. API Keys → Create API Key → 控える

## 4. Vercel 環境変数追加 (3 分)

https://vercel.com → nihongohub プロジェクト → Settings → Environment Variables:

| Name | Value |
|---|---|
| `STRIPE_GIFT_X10_LINK` | ステップ 2 の Payment Link URL |
| `RESEND_API_KEY` | ステップ 3 の API キー |
| `RESEND_FROM` | `NihongoHub <gifts@mail.nihongo-hub.com>` (任意、デフォルト同値) |

追加後は再デプロイで反映 (Claude が次回デプロイ時に吸収)。

## 完了後に Claude がやること

1. Stripe テストモードで $5 決済 → webhook が `gift_x10` を識別
2. `promo_codes` に 10 行生成 → Resend からメール到着 (10 コード列挙)
3. `redeem.html` でコード入力 → Pro 付与
4. `index.html` の「Total students sponsored」カウンター加算確認
5. 本番モードで $5 実購入 1 回 → 完走確認

## 仕様メモ

- ギフトブロックは `STRIPE_GIFT_X10_LINK` 未設定の間、トップページで自動非表示 (2026-06-12 修正済み)
- コード有効期限: 発行から 1 年。1 コード = 1 ヶ月 Pro
- カウンターは「redeem 済みコード数」を表示 (発行数でなく実際に届いた数 = 誠実)

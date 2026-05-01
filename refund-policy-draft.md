---
created: "2026-04-22"
updated: "2026-04-22"
project: NihongoHub
document_type: legal-draft
status: draft (要法務レビュー)
reviewer_required: "日本の特定商取引法 + 消費者契約法に精通した弁護士または行政書士"
---

# NihongoHub 返金ポリシー v1 ドラフト

> ⚠️ これは**法務レビュー前の骨子ドラフト**。Stripe 決済開始前（Phase C1 完了前）に必ず日本の弁護士または行政書士のレビューを経ること。各国（特に EU GDPR、カリフォルニア州 CCPA）の消費者保護法にも整合性を取る必要がある。

## 背景

LP に「N3 in 6 months — or your money back」（6 ヶ月で N3 取得、または全額返金）と謳っているが、外部レビュー M-1 で「返金条件が未定義 → Stripe チャージバック警告リスク」と指摘。**明文化必須**。

## 返金ポリシー骨子

### 対象プラン
- Pro 月額 ($9.99–3.99、地域別 PPP)
- Academic 月額 ($19.99–7.99、地域別 PPP)
- Lifetime ($149–59、地域別 PPP)

### 基本的な返金条件

#### 一般的なキャンセル（日本国内購入者向け、クーリングオフ類似）
- 初回購入から **8 日以内** かつ、**ログイン後のクイズ解答 100 問未満** の場合、全額返金
- サブスク継続 2 ヶ月目以降のキャンセルは、翌月以降の課金停止のみ（既払い分は返金しない）

#### 「N3 未達成返金保証」（マーケティング訴求、条件厳格化）

以下**すべて**を満たすユーザーに対して、**6 ヶ月分の Pro 料金を全額返金**:

1. **6 ヶ月以上継続して Pro プランを有効**（途中解約・カード失効なし）
2. **累計クイズ解答数 1,000 問以上**（明確な学習コミット）
3. **NihongoHub 内 JLPT N3 模擬試験を 3 回受験**し、**全て 60% 未満**
4. 申請期限: 6 ヶ月継続達成から **14 日以内**（期限超過は申請不可）
5. 申請時に学習ログ（Supabase クイズ履歴）を提供し、**他人代行 / 自動化ボット使用でない** ことを確認

#### 除外事項
- Lifetime プラン購入者は「N3 未達成返金保証」対象外（本人の長期コミットを前提とする価格のため）
- Academic プランは機関単位契約のため、個別の「N3 未達成返金」は適用外（契約書で別途定義）

### 返金プロセス

1. ユーザーが `/refund-request` フォームから申請
2. 条件 1–5 の自動判定（Supabase クエリ）
3. 自動判定 OK → **7 営業日以内に Stripe Refund 実行**
4. 自動判定 NG → 却下理由（未達成の条件）をメールで通知
5. 返金実行後、**NihongoHub アカウントは自動削除**（学習履歴も消去）

### 地域別法律整合性（要弁護士確認）

| 地域 | 法律 | 追加対応 |
|---|---|---|
| 日本 | 特定商取引法 / 消費者契約法 | 特商法表記必須、クーリングオフ 8 日 |
| EU | GDPR / Consumer Rights Directive | 14 日クーリングオフ（CRD）、デジタルサービスは告知次第で適用外 |
| US (CA) | CCPA | 30 日返金要求可能州あり、州法整合性要確認 |
| その他 | — | Stripe 規約を参照、地域固有対応は Phase D 以降 |

### 不正防止

- **チャージバック検知**: Stripe Radar で高リスク取引をフラグ
- **同一 IP/カード複数申請**: 2 回目以降は手動レビュー
- **ログ改竄対策**: Supabase の学習履歴は `immutable = true` 列で追記のみ

## LP での表示（英語原文、訳は Phase C1 で生成）

```
💯 N3 Guarantee: Study with NihongoHub Pro for 6 months, answer 1,000+ quiz questions,
and take 3 official N3 mock tests. If you score below 60% on all three, we refund your
entire 6-month subscription. Terms apply — see Refund Policy.
```

## Stripe Dashboard での設定

- Products → Pro / Academic / Lifetime に **Refund Policy URL** を添付
- Checkout 画面で「By subscribing, you agree to our Refund Policy」リンク表示
- Webhook で返金イベント `charge.refunded` をハンドリング

## 次アクション

- [ ] 日本の弁護士・行政書士に本ドラフトをレビュー依頼（見積 3–5 万円、1–2 週間）
- [ ] 特定商取引法表記の作成（Admin 部署に起票）
- [ ] `/refund-request` フォーム実装（Phase C1）
- [ ] Stripe Refund Webhook 実装（Phase C1）
- [ ] 5 言語版（en/zh/es/th/id）の翻訳（Phase C2）

## 未確定事項（オーナー判断）

1. **返金条件の厳格さ**: 本案（1,000 問 + 3 回模試 + 全て 60% 未満）は厳しい方。マーケ訴求力と不正防止のバランス → オーナー判断
2. **Lifetime の扱い**: 完全対象外 or 条件緩和（5,000 問 + 5 回模試等）で対象 → オーナー判断
3. **模擬試験の実装**: Phase C1 時点で模試機能があるか? なければ本ポリシーは Phase C2 まで機能しない
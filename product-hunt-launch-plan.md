---
created: "2026-04-22"
updated: "2026-04-22"
project: NihongoHub
document_type: marketing-launch-plan
target_phase: "Phase B デプロイ完了後 2 週間（2026-05 下旬–2026-06 上旬）"
target_launch_date: "2026-06 第 1 火曜日（推定 2026-06-02）"
expected_traffic: "5K-20K 単発訪問 + バックリンク（DR 85+）"
---

# Product Hunt ローンチ計画

## 戦略的意義

外部レビュー M-7 指摘: **Product Hunt は事前準備の質で成否の 70% が決まる**。即席投下は 20 票で終わる。**Phase B デプロイ完了直後から 2 週間の準備期間を確保**し、ハンター選定 + Twitter 予告 + コンテンツ磨き込みで臨む。

### 期待効果
- **当日 5K–20K 訪問**（Top 5 入り時）
- **DR 85+ のバックリンク**（SEO 効果、永続）
- **早期アダプターコミュニティ形成**（Tier 1 ユーザー候補）

## ローンチ日の選択

### 曜日
- **火曜日・水曜日ローンチ**が最も競合少なく、Top 3 入り確率が高い（Product Hunt コミュニティ統計）
- 月曜は米国祝日のリスク、金–日は Weekend Only カテゴリで別ロジック

### タイミング
- **PST 00:01（午前 0 時 1 分）公開**（太平洋時間、これが Product Hunt の 1 日の始まり）
- = 日本時間 **PST 16:01 = JST 17:01**
- オーナーはローンチ日の JST 17:00 頃から **24 時間サポート態勢**

### 候補日
- 第 1 候補: **2026-06-02 (火)** — Phase B デプロイ (2026-05-15 目標) から 2 週間後
- 第 2 候補: **2026-06-09 (火)** — 余裕を持たせたい場合
- 第 3 候補: **2026-06-16 (火)** — Phase C1 準備と重なる場合

## 準備タイムライン（ローンチ 14 日前〜当日）

### D-14 〜 D-10: コンテンツ磨き込み
- [ ] LP の 5 言語コピーをネイティブにレビュー（Fiverr $50 × 5 言語）
- [ ] スクリーンショット 5 枚（Product Hunt 推奨サイズ 1270×760）
  - 1. LP ヒーロー + クイズ埋込
  - 2. クイズ解答画面（日本語 + 翻訳 + 選択肢）
  - 3. 5 言語切替デモ（言語別スクショ）
  - 4. 解説表示（学習 value）
  - 5. ダッシュボード（Phase C1 後撮影）
- [ ] プロダクトギャラリー用 GIF 1 本（クイズ 5 問解答の 15 秒ループ）
- [ ] Hero video 30 秒（オプション、オーナー時間次第）

### D-10 〜 D-7: ハンター選定
- [ ] Product Hunt 内で「Japanese learning」「language learning」「AI tools for education」カテゴリの **Top Hunter 10 人** リストアップ
  - 基準: 過去 1 年で 3+ launch、フォロワー 1K+、コメント率 10%+
- [ ] 上位 5 人に DM 送信（英語、Product Hunt メッセージ機能）:
  ```
  Hi [Name], I've been following your hunts — especially [specific product].

  I'm launching NihongoHub next [Tuesday] — an AI-powered JLPT quiz tool
  for non-English speakers (Spanish, Thai, Indonesian, Traditional Chinese).

  Different from Bunpro/WaniKani: we target the non-English market (huge but
  underserved). Early Haiku 4.5 integration, working LP already live.

  Would you be open to hunt this? Happy to send you early access.
  ```
- [ ] 返信があれば Zoom 15 分で見せる、承諾を得る

### D-7 〜 D-3: コピー最終化
- [ ] **Tagline 60 文字以内**（例案）:
  - "AI-powered JLPT quizzes in your native language — not just English"
  - "Unlimited Japanese practice for Spanish, Thai, Indonesian, Chinese learners"
- [ ] **Description 260 文字**（Product Hunt ページ用）:
  ```
  Tired of Japanese learning apps that only speak English? NihongoHub generates
  unlimited JLPT N5-N1 practice questions with explanations in Spanish, Thai,
  Indonesian, Traditional Chinese, and English. Powered by Claude Haiku 4.5.
  Free daily quizzes, Pro for $3.99-$9.99/month (PPP-adjusted).
  ```
- [ ] **First Comment（最重要！ローンチ直後に hunter がコメントで launcher として紹介）**:
  ```
  Hi Product Hunt! 👋 I'm Yuri, a PhD candidate at Toho University.

  I built NihongoHub because 5 of the top Japanese learning apps only support
  English UI — yet JLPT test-takers grew 4x in Indonesia, Thailand, Vietnam
  over 3 years. This felt wrong.

  🎯 What it does: Generates original JLPT N5-N1 quizzes in 5 languages
      (en/zh/es/th/id) using Claude Haiku 4.5.

  💰 Pricing: $3.99 (id) to $9.99 (en) Pro, PPP-adjusted.

  🛠️ Tech stack: Vercel Serverless + Supabase + Anthropic API + 47-prefecture
      content pipeline (coming soon).

  🙏 Ask: Try the free quiz, feedback on what's missing for your language.

  I'll be answering every comment today — AMA!
  ```

### D-3 〜 D-1: Twitter/X 予告 + 事前ネットワーキング
- [ ] 研究者個人 X アカウントで **Teaser ツイート** 3 本:
  - D-3: "Something I've been building for 6 months launches on @ProductHunt next Tuesday 👀"
  - D-1: "Tomorrow. @ProductHunt. 17:00 JST. NihongoHub. ⏰"
  - D-0: ローンチ当日の URL 投稿（毎時 Retweet）
- [ ] Reddit r/LearnJapanese での告知は規約違反（自薦禁止） → **しない**
- [ ] 日本語学習 Discord 5 グループでは「Product Hunt にローンチします、見てくれたら嬉しい」と投稿 OK（告知許可があるグループのみ）

### D-0 ローンチ当日（24 時間態勢）

#### JST 17:00–19:00（最重要 2 時間、Product Hunt トップに乗るかの勝負）
- [ ] 17:01 JST に Hunter がローンチ公開
- [ ] オーナーが **First Comment** を貼る（予め準備した文章）
- [ ] 全コメントに **10 分以内** に返信
- [ ] Slack / Discord で事前に依頼したフレンドに「upvote please」リクエスト
- [ ] 毎時 Twitter で状況更新 + Retweet 依頼

#### JST 19:00–01:00（Product Hunt 活発時間帯）
- [ ] コメント対応継続
- [ ] Q&A 性の高いコメントには丁寧回答（Product 改善の声を収集）
- [ ] ネガティブコメントにも丁寧に対応（ブロックしない）

#### JST 01:00–翌 17:00（米国日中、最も upvote 獲得期間）
- [ ] 仮眠 6 時間（オーナーの健康優先）
- [ ] 起きたら最新コメントに返信、数時間置きにチェック
- [ ] JST 17:00 でローンチ 24 時間完了、Top 入り判定

## 成功基準（定量）

| 指標 | 最低目標 | 通常 | 優秀 |
|---|---|---|---|
| Upvotes | 100 | 300 | 500+ |
| Comments | 20 | 50 | 100+ |
| LP 訪問（24h） | 1K | 5K | 20K+ |
| Email signup（24h） | 50 | 200 | 500+ |
| Pro 転換（7 日内） | 1 | 5 | 15+ |

**最低目標（100 upvotes）未達 = Product Hunt 戦略の見直し、Phase D で別チャネル再投入**

## Hunter 候補調査リスト（ローンチ 10 日前に埋める）

| # | Name / Handle | Followers | 過去ハント | DM 日 | 返信 | 承諾 |
|---|---|---|---|---|---|---|
| 1 | TBD | | | | | |
| 2 | TBD | | | | | |
| 3 | TBD | | | | | |
| 4 | TBD | | | | | |
| 5 | TBD | | | | | |

## リスクと対策

| リスク | 対策 |
|---|---|
| Hunter 全員に断られる | オーナー自身が launcher になる（3rd best option）|
| 当日 LP ダウン | Vercel の自動スケール任せ、Cloudflare キャッシュ事前ウォームアップ |
| 競合の妨害コメント | ブロックせず丁寧に応答、審判者は Product Hunt コミュニティ |
| オーナー睡眠不足でバーンアウト | ローンチ翌日は完全休養、週末開催で金曜有休推奨 |
| 予想外の大トラフィックで Anthropic 予算枯渇 | Spend Alert $40 ハードストップ、到達時は LP に「Pro waitlist」に切り替え |

## ローンチ後のフォロー

### 翌週
- 全コメント返信完了
- フィードバック集約 → 仕様書 v1.5 に反映
- 新規登録者への Welcome シーケンス（ConvertKit）

### 1 ヶ月後
- Product Hunt ランキング分析（Top カテゴリで何位だったか）
- 流入元分析（PH 直接 / Twitter / Tech ブログ転載）
- Blog 記事「What I learned launching NihongoHub on Product Hunt」執筆

## オーナーへの重要メモ

- **Product Hunt は一発勝負**。再ローンチは 6 ヶ月空ける必要あり
- **Phase B デプロイ完了 = LP が動いている状態**が絶対条件。未完成で投下は厳禁
- **PPP 価格 (§9-BIS) は事前に実装必須**（PH 上で「non-English 学習者フレンドリー」を訴求するため）
- **当日のオーナー負担は 24 時間コミット**。論文執筆を 2 日前から控え、当日完全フリー化

秘書は D-14 から「毎日 1 タスク」のリマインダーを秘書 TODO に投入する（Phase B 完了後にスケジュール化）。

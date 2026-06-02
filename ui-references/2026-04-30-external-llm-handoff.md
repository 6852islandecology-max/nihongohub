# ⚠️ 外部 LLM 出力 — 1st 部分採用 / フル SPA 化は不採用

> **このファイルは素材として保管されたものです。設計全体は採用していません。**
>
> - **出自**: 2026-04-30 オーナーが別の人（実体は AI / 外部 LLM の出力）と相談した結果として持ち帰った仕様書ドラフト
> - **採否**: [`notes/2026-04-30-decisions.md`](../../../notes/2026-04-30-decisions.md) 決定 2 で **1st 部分採用**を確定
>   - ✅ **採用**: `detectUserType()` 4 タイプ判定ロジック / 3-4 往復遅延サービスカード UX / UI デザイン素材（ダーク + #4ECDC4 ティール、Noto Sans JP）
>   - ❌ **不採用**: フル SPA SSR + Next.js 再導入 / Sonnet 4.0 廃止モデル ID / API キーフロント直叩き / エージェント②③④ / コミュニティ掲示板 / 申請書ガイド買い切り
> - **不採用理由詳細**: [`knowledge/external-intake/rejected/2026-04-30-nihongohub-llm-fullspa-proposal.md`](../../../knowledge/external-intake/rejected/2026-04-30-nihongohub-llm-fullspa-proposal.md)
> - **採用要素の実装先**: [`spec-v1-draft.md`](../spec-v1-draft.md) §6-BIS（3 層モダンキャッシュ ミニチャット入口）
>
> **ここから下は LLM 出力の原文です。設計を採用する判断には必ず上記決定ログと採用ガイドを参照してください。**

---

# NihongoHub — Claude Code 引き継ぎ仕様書

**作成日：** 2026年4月30日  
**ステータス：** 企画・プロトタイプ完了 → 実装フェーズへ

---

## 1. プロジェクト概要

### コンセプト
「日本語学習者のための総合プラットフォーム」。
2ちゃんねる・ニコニコ動画が「場を作って人を集め、その上で収益化した」モデルの現代版。
**入口は無料のAIチャット、会話の流れで自然に各有料サービスへ誘導する。**

### ターゲットユーザー
| タイプ | 人物像 | 規模感 |
|--------|--------|--------|
| 学習者 | JLPTを目指す外国人 | 国内29万人・世界172万人（JLPT受験者） |
| 旅行者 | 日本旅行を計画中の外国人 | インバウンド3,000万人超/年 |
| 在住者 | 日本在住の外国人（手続き困難層） | 在留外国人376万人（過去最多・増加中） |
| 探索者 | 日本語・文化に興味がある人 | 海外学習者379万人＋独学層 |

---

## 2. 収益モデル（4層構造）

```
[無料] AIチャット・コミュニティ  → 集客・滞在時間
[無料+成果報酬] 旅行・生活アフィリエイト → 月2〜20万円
[月額サブスク] JLPTクイズ・学習機能  → 月5〜50万円（積み上がる）
[買い切り] 市役所申請書ガイド     → 月1〜10万円
```

### 各収益源の詳細

**アフィリエイト**
- 提携先：じゃらん・楽天トラベル・Booking.com・SIMカード・クレカ（外国人向け）
- 多言語コンテンツをClaude APIで自動生成（英/中/韓/越/インドネシア）
- SEO戦略：「外国人 東京 おすすめ」「外国人 市役所 手続き」等

**JLPTサブスク**
- 無料：1日5問まで
- ベーシック（月490円）：無制限クイズ
- プレミアム（月980円）：AI弱点分析・個別学習プラン
- 問題はClaude APIで動的生成（コンテンツコストほぼゼロ）

**申請書ガイド（買い切り）**
- 住民票・マイナンバー申請ガイド：500〜980円
- 在留資格変更・更新書類パック：1,980〜3,980円
- 日本生活スタートパック（全書類まとめ）：4,980円
- 対応言語：英/中/韓/越/インドネシア語

---

## 3. サイト構造・画面設計

```
トップページ
└── AIチャット（Hana）← メインの入口
    ├── レベル判定 → 学習パス設定
    ├── JLPT練習問題（サブスク）
    ├── 旅行プランナー（アフィリエイト）
    ├── 申請書ガイド（買い切り）
    └── コミュニティ掲示板（無料・レベル別）
```

---

## 4. AIチャット「Hana（はな）」— コア機能

### キャラクター設定
- 名前：Hana（はな）
- 性格：温かく・励ます・自然に複数言語を切り替える
- 重要：**絶対に押しつけない。会話が自然に深まってからサービスを提案する**

### システムプロンプト（確定版）
```
You are Hana (はな), a warm and friendly AI assistant for a Japanese learning 
platform called "NihongoHub".

Your personality:
- Warm, encouraging, and naturally curious about the user
- You switch languages fluidly based on what the user writes
- You NEVER push services aggressively — guide naturally through conversation

Identify user type from conversation context:
1. LEARNER: mentions JLPT, kanji, grammar, 勉強, 試験
2. TRAVELER: mentions travel, Tokyo, Osaka, 旅行, 観光
3. RESIDENT: mentions visa, city hall, 市役所, 申請, 在留
4. EXPLORER: curious about Japan, anime, culture generally

Service suggestions (ONE per conversation, only when naturally appropriate):
- LEARNER → "We have a JLPT quiz feature — want me to show you your level?"
- TRAVELER → "I can help plan your trip with personalized recommendations!"
- RESIDENT → "We have step-by-step paperwork guides in your language!"
- EXPLORER → "Want to try a quick Japanese level check? It's fun!"

Rules:
- Start with greeting in Japanese AND English
- Keep responses concise (2-4 sentences)
- Suggest services only after 3-4 exchanges, never immediately
- Be genuinely helpful first, commercial second
```

### ユーザータイプ検出ロジック（フロントエンド）
```javascript
const detectUserType = (text) => {
  const lower = text.toLowerCase();
  if (/jlpt|n[1-5]|kanji|grammar|勉強|文法|漢字|試験/i.test(lower)) return "LEARNER";
  if (/travel|trip|tokyo|osaka|kyoto|旅行|観光|行きたい|여행/i.test(lower)) return "TRAVELER";
  if (/visa|residence|city hall|市役所|在留|申請|手続き|住民票/i.test(lower)) return "RESIDENT";
  return "EXPLORER"; // default
};
```

### サービスカード表示タイミング
- ユーザータイプ検出後、**3〜4往復待ってから**表示（即表示は離脱を招く）
- 「後で」ボタンで非表示にできる
- 1セッションにつき1回のみ表示

---

## 5. 技術スタック（推奨）

| レイヤー | 技術 | 理由 |
|----------|------|------|
| フロントエンド | Next.js (React) | SEO対応・多言語ルーティング |
| バックエンド/DB | Supabase | 無料枠充実・認証内蔵 |
| デプロイ | Vercel | 無料枠・Next.jsとの親和性 |
| AI | Claude API (claude-sonnet-4-20250514) | チャット・問題生成・解説 |
| 決済 | Stripe | サブスク・買い切り両対応 |
| 多言語 | next-i18next | 6言語対応（ja/en/zh/ko/vi/id） |

### 初期コスト
- Vercel + Supabase：**無料枠で開始可能**
- Claude API：月1〜3万円（ユーザー数に比例）
- Stripe：決済手数料3.6%のみ（月額固定費なし）
- **合計：月1〜3万円からスタート可能**

---

## 6. AIエージェント設計（4体構成）

### エージェント①：入口チャット（Hana）
- 役割：全ユーザーの最初の接点、タイプ判定、各サービスへの振り分け
- API呼び出し：会話ごとに全履歴を渡す（ステートレス）
- 実装済み：`nihongo-chat.jsx`（プロトタイプ）

### エージェント②：学習エージェント
- 役割：毎日の問題生成・弱点分析・学習プラン自動更新
- 処理フロー：
  1. Supabaseから前日の正答率データを取得
  2. Claude APIで弱点項目を分析
  3. 今日の問題セットを個別生成
  4. 試験日から逆算してスケジュール更新
  5. プッシュ通知 or メールで配信

### エージェント③：申請書サポートエージェント
- 役割：会話形式で申請書類を案内（区・書類種別・言語に応じて動的に回答）
- データ：全国主要区の申請手順をDBに格納
- 差別化：PDFを渡すだけの競合との違いは「対話型ステップ案内」

### エージェント④：旅行プランナーエージェント
- 役割：予算・日数・言語レベルに応じた旅程を自動生成、アフィリエイトリンクを自然に組み込む
- 連携API：じゃらんAPI・楽天トラベルAPI・Google Places API

---

## 7. データベース設計（Supabase）

```sql
-- ユーザー
users (id, email, language, jlpt_level, created_at)

-- 学習記録
quiz_results (id, user_id, question_id, is_correct, answered_at)

-- 問題バンク（AI生成＋キャッシュ）
questions (id, level, category, content_json, created_at)

-- チャット履歴
chat_sessions (id, user_id, messages_json, user_type, created_at)

-- 申請書ガイド購入
purchases (id, user_id, product_id, amount, purchased_at)

-- サブスク
subscriptions (id, user_id, plan, stripe_sub_id, status, expires_at)
```

---

## 8. 実装優先順位（フェーズ別）

### Phase 1（MVP・2〜4週間）
- [ ] Hanaチャット基本実装（`nihongo-chat.jsx`を本番化）
- [ ] ユーザー認証（Supabase Auth）
- [ ] 多言語対応トップページ
- [ ] Stripeサブスク決済（JLPTベーシックプラン）

### Phase 2（収益化・1〜2ヶ月）
- [ ] JLPTクイズ機能（N5〜N1、Claude APIで問題生成）
- [ ] 弱点分析ダッシュボード
- [ ] 申請書ガイド（買い切り商品、PDFダウンロード）
- [ ] アフィリエイト記事自動生成パイプライン

### Phase 3（スケール・2〜3ヶ月）
- [ ] コミュニティ掲示板（レベル別）
- [ ] 旅行プランナーエージェント
- [ ] プッシュ通知・メール学習リマインダー
- [ ] 全6言語対応

---

## 9. 既存成果物

| ファイル | 内容 | ステータス |
|----------|------|------------|
| `nihongo-chat.jsx` | Hanaチャット UIプロトタイプ（React） | 完成・動作確認済み |

### `nihongo-chat.jsx` の仕様
- Claude API（claude-sonnet-4-20250514）を直接呼び出し
- ランディング画面：6言語クイックスタートボタン
- チャット画面：リアルタイムタイピングインジケーター
- ユーザータイプ自動検出（キーワードベース）
- サービスカード：4〜5往復後に自動ポップアップ
- デザイン：ダークテーマ、#4ECDC4（ティール）アクセント

---

## 10. 競合・差別化

| 競合 | 弱点 | NihongoHubの優位性 |
|------|------|--------------------|
| Duolingo | 全員同じ問題、在住者向け機能なし | 個別最適化＋生活情報一体 |
| NHK語学 | 静的コンテンツ、双方向性なし | AIチャットで対話型 |
| 市区町村HP | 日本語のみ・わかりにくい | 多言語・対話型ステップ案内 |
| 旅行サイト | 日本語学習との連携なし | 学習レベルに合わせた旅行提案 |

**最大の差別化：「日本語を学ぶ」と「日本で生きる」を同じプラットフォームで解決する唯一のサービス**

---

## 11. Claude Codeへの具体的な指示

最初に着手してほしい作業：

```
1. nihongo-chat.jsx を Next.js プロジェクトに統合する
2. Supabase を接続してチャット履歴を保存できるようにする
3. ユーザー認証（メール＋Googleログイン）を実装する
4. JLPTクイズ画面の基本UIを作成する（N5から開始）
5. Stripe決済でサブスクプラン（月490円）を実装する
```

環境変数として必要なもの：
```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

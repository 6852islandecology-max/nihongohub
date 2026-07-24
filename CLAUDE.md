---
department: NihongoHub (Product 配下)
status: phase-b-pre-complete (依存サービス発行完了、本番デプロイ待機、Trust Karma Funnel + Mini-chat Entry 採択)
created: "2026-04-22"
updated: "2026-04-30 夜 (戦略反転採択 — Free Trial 型 / 3 言語ファースト / SRS Phase C1 / ミニチャット入口 Phase C1 後送り / 生活ハンドブック単発 PDF + 6/14 前倒し)"
goal: "月 100 万円 / 2027-04（標準）or 2026-10（ストレッチ）"
priority_rank: 4  # 年度優先度（論文>授業>科研費>アプリ）
---

# NihongoHub 部署: 海外向け日本語学習 SaaS

---

## 現況（2026-07-24 実測。以下の本文より優先する）

本ファイルの本文は 2026-04-30 で更新が止まっており、実態と大きく食い違う。
本文は当時の意思決定の記録として残すが、現在地は次のとおり。

稼働状況
- ステータスは `planning` でも `phase-b-pre-complete` でもない。本番稼働中で、運用約 15 ヶ月。
  本番 URL は `https://www.nihongo-hub.com`（正規ホストは www 付き）。Stripe は live。
- 実績（2026-07-18 計測）: 60 日で LP 298 → trial 1 → checkout 0 → 課金 0。
  外部有料顧客ゼロ、MRR ゼロ。登録 56 人。成立決済はオーナーのテスト 1 件のみ。

規模（本文の「フォルダ構成（v2.0）」は api 3 本 / lib 3 本と書いているが実際は違う）
- `api/` 13 ファイル。うち `generate-batch.js` は `.vercelignore` で除外され、デプロイされる関数は 12。
  Vercel Hobby の関数上限がちょうど 12 なので空き枠ゼロ。`api/*.js` を 1 本足すとデプロイ全体が凍結する。
  共通化コードは `lib/` に置くこと（`lib/` は関数としてカウントされない）。
- `lib/` 23 ファイル。サーバ用 ESM 9 本とブラウザ用 IIFE 14 本が同一階層に混在する。内訳は `lib/README.md`。
- HTML 345 本（ルート 25 + blog 320）。SVG 420 本。

本文の記述で現在は誤りのもの
- 「vercel.json ← 最小化（generate-batch の maxDuration のみ）」→ 現在の `vercel.json` は
  セキュリティヘッダと CSP のみで、functions 設定も maxDuration も無い。
- 「Phase B: デプロイ実行（本番日予約待ち）」→ 実行済み。
- デプロイ方式 → 2026-07-22 以降は git commit → push。`vercel --prod` の直接デプロイは禁止。

検証コマンド
- `npm test`（`scripts/test-srs.mjs` + `scripts/test-api-endpoints.mjs`）
- ローカル実機は `node dev-server.mjs`（port 3031）。本番はクロスオリジンで操作できない。
- 詳細は `docs/verification.md`。

DB スキーマ
- `supabase/schema.sql` は 2 テーブルのみの古いスナップショット。再現には migrations 6 本の適用が要る。
  適用順とその他の注意は `supabase/README.md`。

---

## プロジェクト概要
- **目標**: 海外（英・繁中・西・タイ・インドネシア）日本語学習者向けの、LP + AI 問題生成 SaaS
- **収益目標**: 月 100 万円 / 2026-10-22（開始 2026-04-22 から 6 ヶ月）
  - Pro $9.99 × 600 人 + Academic $19.99 × 50 人 + アフィリエイト
- **ステータス**: `planning`（デプロイ未実行、本日組織格納のみ）
- **上位原則**: 年度優先度 4 位（論文・授業・科研費が上）。繁忙期は待機モード、自動化で工数圧縮

## 技術スタック（2026-04-22 v2.0 リアーキ後）
- フロント: ルート直下 `index.html`（5 言語 LP、単一 HTML、ビルド不要）
- バック: **素の Vercel Serverless Functions**（Next.js 依存削除）
- AI: Anthropic API `claude-haiku-4-5-20251001`（`lib/anthropic.js` 共通化）
- キャッシュ: Supabase Postgres（`pregenerated_quiz` テーブル、`lib/supabase.js`）
- レート制限: Upstash Redis（sliding-window 10 req/日/IP、`lib/ratelimit.js`）
- フェイルオープン: Supabase/Upstash 未設定時はスキップして動作継続

## フォルダ構成（v2.0）
```
projects/nihongohub/
├── CLAUDE.md              ← このファイル
├── README.md              ← デプロイ手順
├── package.json           ← v2.0.0 (next/react 削除、@supabase + @upstash 追加)
├── vercel.json            ← 最小化（generate-batch の maxDuration のみ）
├── .env.example           ← ANTHROPIC + SUPABASE + UPSTASH + ADMIN_KEY
├── _original_handoff.zip  ← 受領元 ZIP（証跡）
├── index.html             ← 5 言語 LP（ルート直下に移動）
├── api/
│   ├── generate.js        ← キャッシュ優先 + レート制限
│   ├── generate-batch.js  ← Admin 専用プリ生成（5×5×100=2,500 問）
│   └── health.js          ← 拡張ヘルスチェック
├── lib/
│   ├── anthropic.js       ← Haiku 4.5 呼び出し + プロンプト
│   ├── supabase.js        ← クライアント + キャッシュ操作
│   └── ratelimit.js       ← Upstash rate limiter + IP 抽出
├── supabase/
│   └── schema.sql         ← 次セッションで Console に貼り付け実行
└── spec-v1-draft.md       ← 仕様書 v1
```

## 残タスク

### Phase B-pre: 依存サービス発行（2026-04-24 完了 ✅）
- [x] ADMIN_KEY 64 桁 hex 生成
- [x] Vercel Hobby 登録（GitHub OAuth、Web UI のみ。CLI は非 ASCII ホスト名で断念）
- [x] ANTHROPIC_API_KEY 発行、**月次予算 $20 上限**（当初 $40 → 1st 案 $10 → 中間値 $20）
- [x] Supabase プロジェクト作成（Tokyo）→ `supabase/schema.sql` 実行済 → URL + service_role 取得
- [x] Upstash Redis 作成（Tokyo / Regional）→ REST URL + Token 取得

### Phase B: デプロイ実行（本番日予約待ち、2026-04-27〜05-10 の集中枠）
本番日は **`PHASE_B_DEPLOYMENT_WEB_UI.md`** に従って実施（CLI 不要ルート、案 C）:
- [ ] GitHub Private repo `nihongohub` 作成 + main ブランチ push
- [ ] Vercel Dashboard → Add New → Import（GitHub 連携）
- [ ] 環境変数 6 個を Vercel Dashboard で設定
- [ ] 自動デプロイ（git push 連動）
- [ ] `/api/health` で 4 フラグ（apiKeySet / supabaseConfigured / redisConfigured / adminKeySet）全 true 確認
- [ ] `/api/generate-batch` を 5 言語に分割して 5 回実行（`curl.exe` のみ使用、CLI 不要）
- [ ] `/api/generate` を 5 言語 × 5 レベル（25 パターン）で動作確認
- [ ] Vercel Analytics 有効化 + CORS 本番限定化（`ALLOWED_ORIGIN`）

### Phase C: 収益化（Phase B 後）
- [ ] ドメイン取得（`nihongohub.com` 他候補、Cloudflare Registrar 推奨、年 ¥3,000 程度）
- [ ] Stripe 設定（Pro $9.99/月、Academic $19.99/月、Lifetime $149）
- [ ] ConvertKit 無料枠でニュースレター接続
- [ ] Reddit r/LearnJapanese で初回投稿（Marketing 部署ドラフト経由）

### Phase D: 成長ループ（継続）
- [ ] 週次メトリクス: 訪問数 / クイズ完走率 / Pro 転換率
- [ ] 月次振り返り: `成果物\Product\nihongohub\reports\YYYY-MM.md`
- [ ] LP ヒーロー文言 × 言語別 A/B テスト

## 担当スキル
- `claude-scholar:daily-coding`（実装）
- `claude-scholar:code-review-excellence`（コードレビュー）
- `claude-scholar:webapp-testing`（Vercel デプロイ検証）
- `claude-scholar:architecture-design`（API 追加時）
- `claude-scholar:git-workflow`（バージョン管理）
- `claude-api`（Anthropic SDK 設計、キャッシュ/コスト最適化）
- `markitdown`（README・ドキュメント整形）

## 連携部署
- **Marketing 部署**: **2026-04-29 から Trust Karma Funnel 戦略の主担当として前面化**。ブログ・SNS 運用先行 → NihongoHub LP 誘導動線、アフィリエイト管理。Reddit/ConvertKit/LP コピー → `.secretary\marketing\` 配下
- **PM 部署**: 6 ヶ月マイルストーン管理 → `.secretary\pm\nihongohub-roadmap.md`
- **Admin 部署**: Stripe 国内個人事業主登録、ドメイン購入の経費処理
- **秘書部署**: 週次レビュー時に進捗同期

## CEO からの方針（2026-04-29）— Trust Karma Funnel Pivot

**戦略採択**: NihongoHub を **「単発 AI クイズ × 5 言語 LP」専業** から **「コンテンツマーケティング先行 + LP 受け皿」のハイブリッド**にピボット。

### 戦略の本質
1. **v1 戦略は維持**（撤回しない、Phase B デプロイは予定通り完遂）
2. **Marketing 部署を前面化**: ブログ + SNS で日本語学習ガイドを発信、NihongoHub LP に誘導
3. **競合ツールを協業化**: 字幕tube / HayaiLearn / Trancy / Migaku / LingQ を有用なら紹介
4. **無報酬紹介を辞さない**: アフィリエイト不可ツールも紹介して**信頼カルマ**を高める
5. **5 言語ブルーオーシャン狙い**: 英語 SEO はレッドオーシャン、繁中・西・タイ・インドネシアは手薄市場

### Product 部署側の対応タスク

| ID | 内容 | 期限・トリガー |
|----|------|------------|
| **PR-1** | Phase B 本番デプロイ完遂（最優先、本案の前提条件） | 2026-04-27〜05-10 |
| **PR-2** | LP 末尾「もっと本格的に学ぶなら」セクションのデザイン案作成（5 言語版、3-4 ツール紹介） | Phase B 完了後 |
| **PR-3** | アフィリエイトリンク実装（環境変数経由、A/B テスト可能設計、Marketing 部署 MK-2 完了後） | 2026-05-31 想定 |
| **PR-4** | `/blog` パス追加（Vercel + Markdown ベース、SEO 用 self-host ブログ機能） | Phase 1 後半 (2026-06〜) |
| **PR-5** | Vercel Analytics で「ブログ → LP 流入」イベント計測設定 | PR-4 完了時に同時実施 |

### 重要: 競合紹介の設計原則

LP / ブログで競合ツールを紹介する際の設計ルール:
1. **誠実性最優先**: 短所も明記、「読者にとって最適なツール」を案内する姿勢
2. **NihongoHub の役割明示**: 「気軽な単発クイズ」ポジションを明確化、競合の代替ではなく**補完**として位置付け
3. **アフィリ / 無報酬の区別表示**: 「PR」「Sponsored」表記を関連法令準拠で行う（景品表示法・各国規制）
4. **収益最大化より信頼最大化**: 短期コンバージョン率より長期エンゲージメント

### 詳細ドキュメント
- 戦略採択経緯: [`notes/2026-04-29-decisions.md`](../../notes/2026-04-29-decisions.md) 決定 1
- 元アイデア + 市場調査: [`ideas/2026-04-29-nihongohub-jimakutube-reverse.md`](../../ideas/2026-04-29-nihongohub-jimakutube-reverse.md)
- Marketing 部署タスク群: [`marketing/CLAUDE.md`](../../marketing/CLAUDE.md) MK-1〜MK-9

## CEO からの方針（2026-04-30）— 外部 LLM 提案 1st 部分採用 + ミニチャット入口追加

**戦略**: オーナーが NihongoHub について別の人（**実体は AI / 外部 LLM の出力**）と相談し、Hana チャット中心 SPA 仕様 + JSX プロトタイプを持ち帰り。秘書多角評価の結果、**1st: 部分採用**を採択。**フル SPA 化は不採用**、**ミニチャット入口のみ採用**。

詳細: [`notes/2026-04-30-decisions.md`](../../notes/2026-04-30-decisions.md) 決定 2 を参照。

### 採用する要素（v1 仕様書 §2 に追記、§12 に受入基準追加）

1. **LP ヒーロー直下のミニチャット入口**（1〜数ターン、タイプ判定 → 既存サブサービス動線）
2. **3 層モダンキャッシュ構造**（オーナー指示「最新の方法を探せ」を反映）:
   - Layer 1: Exact Match Cache（Upstash Redis、サブ 1ms、既存 Phase B-pre スタック流用）
   - Layer 2: Semantic Cache（Supabase pgvector、類似度 ≥ 0.90、サブ 100ms、自己学習型）
   - Layer 3: Anthropic API + Prompt Caching（Haiku 4.5 = `claude-haiku-4-5-20251001`、`cache_control: {"type": "ephemeral"}` 付き）
3. **`detectUserType()` 4 タイプ判定ロジック**（LEARNER/TRAVELER/RESIDENT/EXPLORER、新案 JSX L62-68 流用）
4. **3-4 往復遅延サービスカード表示 UX**（新案 JSX L122-131 流用）
5. **UI デザイン素材**（ダーク + #4ECDC4 ティール、Noto Sans JP）

### 採用しない要素（再提案防止）

- フル SPA SSR / Next.js 再導入（Phase B-pre の v2.0 リアーキを巻き戻すため）
- **Sonnet 4.0 (`claude-sonnet-4-20250514`)** ID（古い世代、Haiku 4.5 比 4-5 倍コスト）→ **Haiku 4.5 を維持**
- API キーフロント直叩き（🚨 セキュリティ重大、月予算 $20 上限の DoS リスク）→ 必ずサーバ側 `api/chat-intro.js` 経由
- エージェント②学習 / ③申請書 / ④旅行（過大設計、年度優先度 4 位で維持不可）
- コミュニティ掲示板（モデレーション工数、Discord 既存コミュニティへ流す）
- 申請書ガイド買い切り（**行政書士法第 21 条** 抵触可能性、別事業切り出し検討で保留）
- ToyTalk JP の直接利用（ベータ・API 不明・法人条件未確定の 3 重リスク、商用 SaaS 依存先として不適切）
- ToyTalk Inc. のライター手作業応答プール（2015-2019 世代、現代の Semantic Cache で自動代替可能）

### コスト試算（3 層モダンキャッシュ採用後）

- Layer 1+2 で **60-70% カバー**（LLM 呼出ゼロ、サブ 100ms 応答）
- Layer 3 で **30-40% を Prompt Cache 経由**（cache hit cost = 標準入力 10%、90% 削減）
- 総合: ミニチャット部分 **月 $5-10**（既存 v1 試算 $117 + ミニチャット追加で済む）
- 月予算 $20 上限内に収まる

### Product 部署側の追加対応タスク

| ID | 内容 | 期限・トリガー |
|----|------|------------|
| **PR-6** | LP ヒーロー直下のミニチャット入口 UI 実装（新案 JSX デザイン素材を `ui-references/` から流用） | Phase B 完遂後、Phase C1 着手前 |
| **PR-7** | `api/chat-intro.js` 新設（Haiku 4.5 + Prompt Caching `cache_control` 付き、サーバ側 API キー保持） | Phase B 完遂後 |
| **PR-8** | Supabase pgvector extension 有効化 + Layer 2 Semantic Cache テーブル schema 追加（`semantic_cache` テーブル、embedding カラム、類似度検索 RPC） | Phase B 完遂後 |
| **PR-9** | Layer 1 Exact Match Cache の Upstash Redis キー設計（クイックスタートボタン応答 + 「こんにちは」等決まり文句） | Phase B 完遂後 |
| **PR-10** | Phase B 受け入れ基準への追加項目検証（Prompt Caching 有効化 / Semantic Cache hit rate 計測 / API キーサーバ側保持） | Phase B 完了直前 |

### バイブコーディング・リスクヘッジ運用との接続

外部 LLM 提案受け入れ時の秘書側スクリーニングは [`.secretary\CLAUDE.md`](../../CLAUDE.md) 機能 4（バイブコーディング監査）を参照。本案はその **発動初例** として記録。

### 重要な参照
- 多角評価詳細: [`notes/2026-04-30-decisions.md`](../../notes/2026-04-30-decisions.md) 決定 2
- 不採用箇所と理由（再提案防止用）: [`knowledge/external-intake/rejected/2026-04-30-nihongohub-llm-fullspa-proposal.md`](../../knowledge/external-intake/rejected/2026-04-30-nihongohub-llm-fullspa-proposal.md)
- 元 LLM 出力（デザイン素材として保管）: [`projects/nihongohub/ui-references/2026-04-30-external-llm-handoff.md`](./ui-references/2026-04-30-external-llm-handoff.md) + [`2026-04-30-external-llm-chat.jsx`](./ui-references/2026-04-30-external-llm-chat.jsx)
- プラン全文: [`C:\Users\Yurik\.claude\plans\c-users-yurik-downloads-files-secretary-encapsulated-oasis.md`](C:\Users\Yurik\.claude\plans\c-users-yurik-downloads-files-secretary-encapsulated-oasis.md)

## CEO からの方針（2026-04-30 PM）— Google Maps/Instagram + 生活ハンドブック ハイブリッド + Academic Phase D2

オーナーから 3 件の追加施策を採択（詳細 [`notes/2026-04-30-decisions.md`](../../notes/2026-04-30-decisions.md) 決定 3）:

### 1. Google Maps + Instagram 取り込み（採用）

**対応**: §11 SEO 47 都道府県 × 5 言語 = 235 記事の自動生成パイプラインに以下を追加:
- Google Maps Embed iframe（無料・商用可）
- Instagram 検索ハッシュタグ提示（外部リンク誘導）
- Instagram oEmbed 公式埋込（厳選 1-3 投稿/記事）
- 自前 TikTok / Reels 制作は **不採用**（4-22 集客戦略 v2 と整合）

**Z 世代旅行検索の根拠**: Instagram 67% > TikTok 62% > Google 61%、旅行先決定で Instagram 投稿/ストーリーが **47.9%（1 位）**

### 2. 多言語日本生活ハンドブック ハイブリッド（4-30 朝判断の修正・再採択）

**新事実**: 2026 年 1 月 1 日施行の行政書士法改正で「個別助言型」は厳しいリスクだが、**「一般教材型」は明確に合法**（行政書士事務所自身が記載例を Web 公開、書店で在留資格マニュアルが市販されている事実より）。

**ハイブリッド採用方針**:

🥇 **有料商品**: 「多言語日本生活ハンドブック（5 言語版）」**¥1,480-1,980**（PPP 調整あり、$5.99-14.99）
- 内容: 一般的な手続きフロー + 架空名による一般記入例 + 多言語語彙集 + 文化解説 + 自治体公式リンク集
- **境界線厳守**: 個別助言 / AI チャット連動 / 書類代筆は **絶対不可**
- **Phase C1 前に弁護士チェック必須**（Admin 部署起票、予算数万円）
- 詳細仕様: [`spec-v1-draft.md`](./spec-v1-draft.md) §10-BIS

🥈 **無料ブログ**: Marketing 部署 **MK-10「在住外国人向け生活ガイド（5 言語）」**
- 有料商品のプレビュー + SEO 集客
- Trust Karma Funnel と整合

### 3. Academic プラン優先度低下（採用）

- Phase C1 → **Phase D2 へ移動**（2026-04-30 PM 確定）
- Phase C1 では **Pro $9.99 + Lifetime $149 のみ** 実装
- 主柱 Pro ¥898,500/月（90%）に影響なし、副柱 Academic ¥149,925/月（10%）が遅延

### 秘書評価の自己訂正記録

4-30 朝に「申請書ガイド買い切り = 行政書士法第 21 条違反リスク」と評価したのは、外部 LLM 出力の文言が「個別助言型」を含んでいたためで、**「一般教材型」と区別すべきだった**。オーナーの直感「有用 + 競合不在 + 宣伝効果」は **3 つとも正しかった**。確証バイアス潰しを発動しても秘書評価は完璧でない、という実例（バイブコーディング監査運用にもフィードバック）。

### Product 部署側の追加対応タスク

| ID | 内容 | 期限・トリガー |
|----|------|------------|
| **PR-11** | §11 47 都道府県記事プロンプト仕様に Google Maps Embed + Instagram ハッシュタグ + oEmbed 統合 | Phase C2 着手時 |
| **PR-12** | 生活ハンドブック PDF + Web ビューワ実装（5 言語、PPP 価格、Stripe Adaptive Pricing） | Phase C1 着手時 |
| **PR-13** | 表紙免責 + AI チャット連動なしの 2 点を grep / コードレビューで Phase C1 受入時に確認 | Phase C1 受入 |
| **PR-14** | Academic プラン実装は **Phase D2 へ移動**（Phase C1 から削除） | Phase D2 (2026-09 以降) |

## 重要な設計上の判断（引き継ぎ時点）

1. **著作権回避**: `generate.js` の `buildPrompt` に「JLPT 過去問・教科書・アニメ/マンガ/楽曲・ブランド・実在人物を参照しない」制約を明示。出力のスポットチェックは週次で実施
2. **モデル選定**: Haiku 4.5 採用（コスト: input $1/MTok, output $5/MTok）。1 クイズ ≒ 512 tok 出力 ≒ $0.0026。1 万問生成 ≒ $26
3. **5 言語**: en / zh / es / th / id（日本語学習市場の主要言語ブロック）
4. **コスト管理必須**: 無料ユーザー過多だと API コストが売上を食う。**Phase B 完了後、即座にプリ生成キャッシュか日次リミット実装が必要**

## マイルストーン（PM と連動、詳細は pm/nihongohub-roadmap.md）

| フェーズ | 内容 | 期限 | 状態 |
|---------|------|------|------|
| Phase A | 組織格納・CLAUDE.md・ロードマップ | 2026-04-22 | ✅ |
| Phase B-pre | 依存 4 サービス発行（Vercel/Anthropic/Supabase/Upstash） | 2026-04-24 | ✅ |
| Phase B | デプロイ稼働（Web UI 版手順書、案 C） | 2026-04-27〜05-10 | 集中枠予約待ち |
| Phase C1 | ドメイン + Stripe + ニュースレター | 2026-06-15 | 未着手 |
| Phase C2 | Reddit 初回投稿 + 最初の有料ユーザー獲得 | 2026-07-15 | 未着手 |
| Phase D | 月 100 万円達成（標準 2027-04、ストレッチ 2026-10） | 2027-04 | 未着手 |

## 運用メモ
- 年度優先度 4 位のため、論文・授業・科研費が忙しい期間は自動化タスクのみ稼働
- 週次更新は `claude-scholar:webapp-testing` + `scheduled-task` で自動化を目標
- Anthropic API 利用量・Vercel 帯域は月次で要監視（`reports/YYYY-MM.md` に記録）

## CEO からの方針（2026-04-30 夜）— 戦略反転採択 (Mind Council 多面検証 + リサーチ 18 件 経由)

オーナー指示「NihongoHub について多面的・分野横断的に検証 → 計画変更がなさそうなら採用」に応答した結果、**5 改訂を全採用**。詳細: [`notes/2026-04-30-decisions.md`](../../notes/2026-04-30-decisions.md) 決定 6 + [`strategic-review-2026-04-30.md`](./strategic-review-2026-04-30.md) (1,500 行)。

### 採択された戦略改訂 5 件

| # | 改訂 | 影響 |
|---|---|---|
| 1 | **Free Trial 型移行** (Freemium → 3-7 日 trial) | Pro 転換率 2% → 17-49% (EdTech 業界 Opt-in 17.8% / Opt-out 49.9%) |
| 2 | **3 言語ファースト** (繁中 + インドネシア + 英語) | JLPT Top 10 順位ベース。スペイン・タイは AI 翻訳のみで Phase D 後送り |
| 3 | **Discord β tester 募集** (Migaku 12K + Indo-Japan 8K) | 5/11-5/17 で 30-100 人フィードバック |
| 4 | **生活ハンドブック単発 PDF 固定** | 行政書士法業務性回避 (反復継続性回避) |
| 5 | **生活ハンドブック販売開始 6/14 前倒し** | 新 Specified Residence Card 発行ピーク捕捉 + r/japanlife 40K 市場 |

### Phase B 集中枠 (4-27〜5-10) 優先順位調整

- ミニチャット入口関連 11 項目は **§12 Phase B 受入基準から外し、Phase C1 後送り** (Migaku Patreon 離脱の前例警告と整合)
- Phase B 必須項目 11 + Day 1 計測 7 項目に集中
- 5/11-5/17: Discord β tester 募集 + Free Trial 型実装着手

### Product 部署側の追加対応タスク (2026-04-30 夜 戦略反転採択)

| ID | 内容 | 期限 |
|---|---|---|
| **PR-15** | Free Trial 型実装 (Stripe Trial 設定 + LP CTA 改修) | Phase C1 着手時 (5/17 以降)、4-8h |
| **PR-16** | SRS 機能実装 (間違えた問題の再出題、Anki 風カード) | Phase C1 着手時、8-12h |
| **PR-17** | LP Hero 改修 (Lifetime $149 主訴求 + 研究者ブランド + Free Trial 訴求) | Phase B 完遂後 5/11-5/17、2h |
| **PR-18** | Discord β tester 募集投稿 (Migaku Discord + Japanese-Indonesian Discord + r/LearnJapanese) | 5/11-5/17、投稿執筆 2-3h |
| **PR-19** | 3 言語ファースト判断 (繁中 + インドネシア + 英語、スペイン・タイは AI 翻訳のみ) | v1.5 仕様書改訂時 |
| **PR-20** | 生活ハンドブック販売開始 6/14 前倒し (Phase C1 着手前倒し、PR-12 → 6/14 期限) | 6/14 |

### 採用しない要素 (再追記)

- ❌ **5 言語等価でのコンテンツ深さ追求** (3 言語 + AI 翻訳 2 言語のハイブリッドで対応)
- ❌ **Freemium モデル** (Free Trial 型に移行)
- ❌ **生活ハンドブックの SaaS 形式** (単発 PDF 固定で行政書士法回避)
- ❌ **ミニチャット入口の Phase B 同時投入** (Phase C1 後送り)

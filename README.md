# NihongoHub — デプロイ手順

## 概要
海外向け日本語学習SaaS。5言語対応LP + AI問題生成クイズ。

## ファイル構成
```
nihongohub/
├── public/
│   └── index.html        ← LP本体（v3ベース、5言語対応）
├── pages/
│   └── api/
│       ├── generate.js   ← AI問題生成エンドポイント
│       └── health.js     ← ヘルスチェック
├── package.json
├── vercel.json
└── .env.example
```

## デプロイ手順（Vercel）

### 1. 依存関係インストール
```bash
npm install
```

### 2. Vercelにデプロイ
```bash
npx vercel --prod
```

### 3. 環境変数を設定
Vercel Dashboard → Settings → Environment Variables に追加：
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxx
```
※ https://console.anthropic.com/ で取得

### 4. 動作確認
```
GET  https://your-domain.vercel.app/            → LP表示
POST https://your-domain.vercel.app/api/generate → AI問題生成
GET  https://your-domain.vercel.app/api/health   → APIキー設定確認
```

## AI問題生成のテスト
```bash
curl -X POST https://your-domain.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"level":"N5","lang":"en"}'
```

## 残タスク（優先順位順）
1. [ ] Vercelデプロイ + ANTHROPIC_API_KEY設定
2. [ ] ドメイン取得（nihongohub.com 等）とVercelに紐付け
3. [ ] Stripe設定（Pro $9.99/月、Academic $19.99/月、Lifetime $149）
4. [ ] ニュースレター登録フォームをMailchimp/ConvertKitに接続
5. [ ] Reddit r/LearnJapanese で初回投稿（無料ユーザー獲得）

## 収益目標
- Pro $9.99 × 600人 + Academic $19.99 × 50人 + アフィリエイト = 月100万円
- 達成期限：2026年10月（開始から6ヶ月）

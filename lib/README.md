# lib/ の中身

このディレクトリにはサーバ用モジュールとブラウザ用モジュールが同居している。
実行環境が違うだけで、依存が混ざっているわけではない（同じファイルが両方で使われている箇所はゼロ）。

ディレクトリを `lib/server/` と `lib/browser/` に分けるのが本来だが、ブラウザ用ファイルは
HTML 320 本以上から `<script src>` で直接参照されており、移動すると全部書き換えになる。
しかもその HTML の大半が未コミット状態なので、今は分けない。
代わりに各ファイルの先頭に `[server]` / `[browser]` のタグを入れてある。

`lib/` は Vercel の関数としてカウントされない（`api/` 直下だけが関数）。
関数上限 12 が埋まっているので、共通化コードは必ずここに置くこと。

## サーバ用（ESM export、api/ から import される）

| ファイル | 責務 |
|---|---|
| `anthropic.js` | Haiku 4.5 でのクイズ生成。プロンプト構築、JSON 抽出、正規表現による品質ゲート、LLM バリデータ、指数バックオフ再試行 |
| `supabase.js` | service role クライアント（モジュールスコープでキャッシュ）と `pregenerated_quiz` の読み書き |
| `auth.js` | Supabase Auth の Bearer トークンから user を解決。Stripe 署名検証用の `readRawBody` |
| `cors.js` | `ALLOWED_ORIGIN` に基づく CORS と OPTIONS プリフライト |
| `ratelimit.js` | Upstash によるゲスト日次リミット（30/日、トライアル 50/日、N5/N4 は無制限）。未設定・障害時は fail-open |
| `sentry.js` | Sentry 初期化とエラー送信。DSN 未設定時は console.error にフォールバック |
| `funnel-server.js` | Upstash へのファネル計数。best-effort（計測が決済を壊してはならない） |
| `env.js` | 環境変数の読み取りを集約。とくに Upstash の `KV_REST_API_*` フォールバックを全経路で統一 |
| `http.js` | api ハンドラの定型処理（メソッドガード、認証、Stripe クライアント、body パース） |
| `period.js` | リーダーボードの集計期間 `YYYY-MM` |
| `quiz-constants.js` | レベル / 言語 / トピックの語彙。`LANG_NAMES` の唯一の定義 |
| `billing-rules.js` | 課金判定の純粋関数（ギフト判定、権利判定、トライアル残日数）。外部サービス無しでテストできる |

## ブラウザ用（IIFE、HTML から `<script src>` で読む）

| ファイル | 読み込む HTML 数 | 責務 |
|---|---|---|
| `config.js` | 318 | 名前に反してサーバ設定ではない。`window.NH_CONFIG` に Gumroad 商品 URL とアフィリエイトリンク表を持ち、`data-nh-buy` / `data-aff` のアンカーを書き換える。改名すると 318 本が壊れる |
| `site-chrome.js` | 16 | 共通ナビ、プラン chip、`window.NH_AUTH`、言語バー、フッタ、ファネルビーコン。blog は読まない（blog のナビは `scripts/build-guides.mjs` がビルド時に焼き込む） |
| `i18n-core.js` | 15 | ナビ / フッタのみの 6 言語辞書。ページごとの本文辞書（T / QT / PX）は各 HTML にインラインのまま置く方針（同ファイル冒頭に明記） |
| `hamburger.js` | 15 | ハンバーガーメニューの注入 |
| `sync.js` | 4 | Supabase 匿名 Auth と `user_progress` への同期。`Storage.prototype.setItem` をフックして自動 push する |
| `constellation.js` | 4 | 学習の可視化 |
| `equipment.js` | 4 | 47 県の装備表示 |
| `readiness.js` | 2 | JLPT 準備度の算出 |
| `level-sharecard.js` | 2 | レベル共有カードの canvas 描画 |
| `srs-browser.js` | 1 | SM-2 ベースの SRS。唯一の SRS 実装（旧 `lib/srs.js` は 2026-07-24 に削除） |
| `daily-mission.js` | 1 | 今日のミッション |
| `level-estimator.js` | 1 | レベル推定 |
| `sharecard.js` | 1 | 共有カード描画 |
| `titles.js` | 1 | 称号 |

## 注意点

`lib/config.js` はサーバ設定ではない。`lib/env.js` がサーバ側の設定を扱う。
名前が紛らわしいが、参照数（318 本）を考えると改名のコストが利益を上回る。

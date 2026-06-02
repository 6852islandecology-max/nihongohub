# Tier 2 / Tier 3 実装レディ集約（2026-06-02）

概念図 6/2 版の Gap うち、**土台・owner トリガー・コスト承認が前提で 1 セッションでは検証完了できない**タスクの「実装レディ」化。
秘書が今セッションで安全に進めた範囲＋次に火を点けるトリガーを 1 枚に集約（統合型・思想 #3）。

> 方針（忖度なし）: 未検証の決済/認証/課金バッチコードを先に置くのは月次バイブコーディング監査の「過大設計・未検証」リスク類型。よって**検証できない部分はコードを起こさず、設計と発火条件を確定**する。

---

## #7 Free Trial（PR-15）— 土台待ち

- **spec**: `PR-15-free-trial-optin-spec.md`（完成済）
- **ブロッカー**: Supabase **Auth 未構築** + `users` テーブル未作成。Trial は Auth が無いと記録先が無い。
- **実装順（Auth 完了後）**: ①`users` 拡張 migration（PR-15 §2）→ ②`api/trial-start.js`（opt-in 開始・クレカ不要・`trial_end=Day7`）→ ③Day5/Day7 メール（ConvertKit）→ ④Free 降格制限（1日3問）。
- **トリガー**: 「Supabase Auth を立てる」決定（owner）。これが Tier 2 全体の起点。

## #4 Stripe — owner アカウント待ち

- **spec**: `PR-stripe-integration-spec.md`（本セッション新規＝ギャップ解消）
- **ブロッカー**: owner の Stripe 個人事業主登録 + #7 の users 土台。
- **トリガー**: owner Stripe 登録 → 環境変数設定 → テストモード E2E。

## #8 市区町村ドリルダウン地図（N03 TopoJSON）— 大型・第一フェーズ設計

現状 prefectures.html の `areas` は**テキストカード**（既存・稼働中）。次フェーズで県内クリック地図へ。

- **データ源**: 国土数値情報 **N03 行政区域**（市区町村ポリゴン、CC-BY 相当・出典明記要）。
- **重量対策**: 全 47 県を一括ロードしない。**県選択時に当該県の TopoJSON を lazy-load**（`data/n03/<code>.topojson`）。raw N03 GeoJSON → `mapshaper` で簡略化（`-simplify 5% keep-shapes`）→ TopoJSON 変換でファイルを 1 県あたり数十 KB に圧縮。
- **第一フェーズ（実装時）**: ①`scripts/build-n03.mjs`（mapshaper CLI ラッパ、1-2 県＝東京・京都で試作）→ ②`area-detail` 内に県内 SVG を描画し市区町村クリック → ③既存 `areas[]` テキストと接続。
- **ブロッカー**: N03 配布データ取得（サイズ大）+ mapshaper 依存。prefectures.html の検証済み挙動を壊さないため**別ファイル/遅延ロードで隔離**。
- **コスト**: $0（公的データ）。工数大（県内ジオメトリ整備）。
- **トリガー**: 「市区町村地図に着手」決定 + N03 データ取得。

## #5 47県 SEO 記事（PR-11）— **コスト発火待ち（owner Go）**

- **spec**: `PR-11-prefecture-seo-prompt-template.md`（600 行・完成済、`buildPrefecturePrompt` + Supabase migration + LLM-judge 込み）
- **first batch 計画**: 10-15 記事（英語ファースト）。Haiku 4.5、1 記事 ~1,500 出力 tok。
  - コスト試算: 15 記事 × ~2,000 tok in/out ≒ **$1-3**（月予算 $20 上限内）。
- **なぜ本セッションで未実行か**: ①API 課金が発生する外部バッチ＝**owner のコスト承認を要する**（product 規則「リクエスト発生前にコスト試算必須」）②ANTHROPIC_API_KEY は `.env`（秘書が無差別に鍵を探索するのは不可）③PR-11 は元来 **Phase C2（6/15-）**。
- **発火手順（owner Go 後）**: ①`prefecture_articles` migration を Supabase に適用 → ②`scripts/seed-prefecture-articles.sh`（PR-11 から起こす）で 10-15 県を生成 → ③出典・アフィリ表記・編集独立性を 1-2 本目視 → ④`/blog` 系で配信。
- **戦略的意義**: アフィリ却下（Airalo/JR Pass）の真因＝**コンテンツ実績不足**を埋める本命。記事 10-15 本公開後にアフィリ再申請が現実的。
- **トリガー**: owner「47県記事バッチを回して」＋コスト $1-3 承認。

---

## まとめ（このセッションの Tier 2/3 到達点）

| # | 本セッション成果 | 次の発火トリガー（owner/土台） |
|---|---|---|
| #7 | spec 既存・実装順確定 | Supabase Auth 構築 |
| #4 | **Stripe spec 新規作成（ギャップ解消）** | owner Stripe 登録 |
| #8 | 第一フェーズ設計・隔離方針確定 | N03 取得 + 着手 Go |
| #5 | first batch コスト試算 $1-3・発火手順確定 | owner コスト承認 + バッチ Go |

# 5-4 / 5-5 自動化：オーナー有効化用 準備物（2026-06-15）

オーナー外出中・副作用最小化方針のため、settings.json編集と永続cron作成は行っていない。
以下はオーナーが戻ってから有効化するための手順と雛形。いずれも有効化前は本番・他セッションに無影響。

## 5-4 SNS品質ゲート Hook（投稿前のボット臭/収益臭/議論性チェック）

目的：[[feedback_viral_controversy_ok_bot_commercial_ng]] の2軸NG（ボット臭＝5分おき独立連投/テンプレ反復、収益臭＝リード投稿に自社リンク・収益語）を投稿前に機械判定し、警告する。健全な議論・逆張りは通す。

設計（Threads自動化を壊さない）：
- ハードブロックせず「警告のみ」。投稿経路（Buffer / browser MCP 物理クリック）自体は遮断しない。
- 判定は Haiku（`claude-haiku-4-5-20251001`）。API関数は増やさない（Hookはローカル実行 or プロンプト評価）。

有効化手順（オーナー作業）：
1. 判定スクリプト雛形を作る（ローカル、`scripts/sns-quality-check.mjs`）：
   入力＝投稿テキスト（複数なら間隔も）。出力＝OK/WARN＋理由。
   ルール：(a) 同一チャネルへ5分以内の独立連投→WARN(ボット臭)。(b) リード投稿に `http`/アフィリ/「稼ぐ」「PR」等＋逆張りの同居→WARN(収益臭)。(c) 議論/固有データ/一人称体験あり→OK。
2. `~/.claude/settings.json` の hooks に PostToolUse を追加（SNS投稿ツール＝browser MCP form_input / buffer_schedule の matcher）。例：
   ```json
   { "hooks": { "PostToolUse": [ { "matcher": "form_input|buffer", "hooks": [ { "type": "command", "command": "node C:/Users/Yurik/.secretary/projects/nihongohub/scripts/sns-quality-check.mjs" } ] } ] } }
   ```
   ※ matcher・引数は実際のSNS投稿ツール名に合わせて調整。まずは1チャネルで試運転推奨。
3. 既存の routine（nihongohub-daily-sns 等）に影響しないことを1回目の投稿で目視確認。

## 5-5 scheduled-tasks（GEO鮮度・計測の接続）

現状：LLM share-of-model 週次監視（`weekly-llm-share-of-model` 水10:00）と各 content routine は既に稼働。5-5の追加分は「新規/更新コンテンツに GEO 注入を自動適用」する接続。

有効化手順（オーナー作業、永続cron作成は戻ってから）：
1. コンテンツ生成・再生成の routine（blog/min-wage/prefecture dataset 等）の末尾に GEO 注入を追加：
   ```
   node scripts/build-prefectures-dataset.mjs   # 既存（あれば）
   node scripts/apply-geo-summaries.mjs          # null要約の耐久充当
   node scripts/inject-evidence.mjs              # TL;DR + BlogPosting/sameAs（en+locale）
   node scripts/inject-glance-capsule.mjs        # 既存
   node scripts/inject-hreflang.mjs              # 既存
   ```
   → これで新規県・新規記事にも自動でGEOブロック/スキーマが乗る。順序が重要（dataset→summaries→evidence）。
2. 月次 GEO 鮮度タスク（任意）：上記を月初に再実行し、`data/prefectures.json` の `lastUpdated` を更新（鮮度は被引用に効く＝[[reference_geo_aeo_playbook]]）。scheduled-tasks MCP か `/schedule` で作成。

## 5-6 Structured Outputs（済・任意の正式化）

本セッションのWorkflow（要約生成/翻訳）で structured output を実用済み。
任意：`scripts/llm_share_of_model.py` の出力もJSONスキーマ固定にして Supabase 機械挿入→ダッシュボード化（intent_share を3エンジン別に）。

## 注意（共通）

- Vercel関数は空き枠ゼロ（[[reference_nihongohub_vercel_function_limit]]）。5-4/5-5とも新規 `api/*.js` を作らない設計。
- デプロイは `npx vercel --prod --yes`（オーナー、作業ツリーに並行セッションの作業中変更も含むため要確認）。

---
title: NihongoHub UI References
type: ui-references
created: "2026-04-30"
purpose: 外部 LLM 出力等の UI デザイン素材を保管。設計全体ではなく素材としてのみ流用するファイルを格納。
---

# NihongoHub UI References

このフォルダには、NihongoHub の **UI デザイン素材として流用するファイル** を保管します。**設計全体を採用したファイルではありません**。

## ⚠️ 重要: 流用範囲の明確化

各ファイルの先頭に「採用 / 不採用」の明示ヘッダーが付いています。**新規実装の参照元としては必ず本体仕様書 [`spec-v1-draft.md`](../spec-v1-draft.md) を優先してください**。

## 格納ファイル一覧

| ファイル | 出自 | 採用範囲 | 不採用理由 |
|---|---|---|---|
| [`2026-04-30-external-llm-handoff.md`](2026-04-30-external-llm-handoff.md) | 2026-04-30 外部 LLM 出力（オーナーが別の人と相談、実体は AI 出力） | `detectUserType()` ロジック / 3-4 往復遅延サービスカード UX / 部分的な UI コンセプト | フル SPA 化、エージェント②③④、コミュニティ、申請書買い切り |
| [`2026-04-30-external-llm-chat.jsx`](2026-04-30-external-llm-chat.jsx) | 同上の React プロトタイプ | UI デザイン素材（ダーク + #4ECDC4 ティール、Noto Sans JP）、`detectUserType()` 関数（L62-68）、サービスカード遅延表示（L122-131） | API キーフロント直叩き（L70-86 重大セキュリティリスク）、Sonnet 4.0 廃止モデル ID（L75）、フル SPA 構造 |

## 採用要素の正式実装先

**[`spec-v1-draft.md`](../spec-v1-draft.md) §6-BIS** で 3 層モダンキャッシュ構造のミニチャット入口として実装:

- Layer 1: Exact Match Cache（Upstash Redis）
- Layer 2: Semantic Cache（Supabase pgvector、類似度 0.90）
- Layer 3: Anthropic API + Prompt Caching（**Haiku 4.5 = `claude-haiku-4-5-20251001`**、サーバ側 `api/chat-intro.js` で API キー保持）

## 関連ドキュメント

- 採否決定の経緯: [`notes/2026-04-30-decisions.md`](../../../notes/2026-04-30-decisions.md) 決定 2
- 不採用箇所と理由（再提案防止）: [`knowledge/external-intake/rejected/2026-04-30-nihongohub-llm-fullspa-proposal.md`](../../../knowledge/external-intake/rejected/2026-04-30-nihongohub-llm-fullspa-proposal.md)
- 多角評価プラン全文: [`C:\Users\Yurik\.claude\plans\c-users-yurik-downloads-files-secretary-encapsulated-oasis.md`](C:\Users\Yurik\.claude\plans\c-users-yurik-downloads-files-secretary-encapsulated-oasis.md)

## バイブコーディング・リスクヘッジ運用との接続

本フォルダは [`.secretary\CLAUDE.md`](../../../CLAUDE.md) 機能 4「バイブコーディング・リスクヘッジ定期運用」の **発動初例**。外部 LLM 提案を受け入れる際の「素材として流用」プロセスを実装した参考事例として機能する。

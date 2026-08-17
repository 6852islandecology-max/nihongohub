# newsletter/ — 「47 Notes from Japan」自社名簿の配信

名簿の口（`blog/blog-quiz.js` のリードマグネット・記事内 `#nl-box`・LP `#newsletter`）は
`public.subscribers` に直接書く（PostgREST + anon key、INSERT-only RLS、`supabase/migrations/2026-08-17-subscribers.sql`）。
ここはその名簿に「1県ずつ」のメールを送る側。ローカル専用（`scripts/` はデプロイ除外）。

## 必要な .env

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`（既存）
- `RESEND_API_KEY` — Vercel 本番に既にある値（`api/stripe-webhook.js` が使用）をローカル `.env` にも貼る
- 任意: `NEWSLETTER_FROM`（既定 `NihongoHub <letters@mail.nihongo-hub.com>`、送信ドメイン `mail.nihongo-hub.com` は Resend 検証済）、`NEWSLETTER_REPLY_TO`（既定 support@nihongo-hub.com）、`NEWSLETTER_TEST_TO`

## 3 本のスクリプト

| 役割 | コマンド |
|---|---|
| 名簿 ↔ Resend audience 同期（登録は Supabase が正、解除は Resend が正） | `node scripts/newsletter/sync-audience.mjs [--dry]` |
| 週の原稿を生成（サイト既存データのみ、新規記述なし） | `node scripts/newsletter/draft-issue.mjs <slug> \| --next` |
| 送信（テスト 1 通 / audience へ Broadcast） | `node scripts/newsletter/send-issue.mjs <file.html> --subject "…" [--test you@…]` |

出力: `成果物/Marketing/NihongoHub/newsletter/issues/<date>-<slug>.{html,txt,review.md}`、送信ログ `…/newsletter/log.md`。
状態: `state.json`（audienceId、issued 済み県、lastDraft/lastSent、`autoSend`）。`autoSend: true` で週次 routine が本配信まで行う。

## 設計上の決め

- 解除リンクは Resend Broadcast の `{{{RESEND_UNSUBSCRIBE_URL}}}` に任せる（自前の解除エンドポイントを作ると api/ が 13 本目になり Hobby 12 上限で凍結する）。解除は sync で Supabase に `unsubscribed_at` として書き戻す。
- 原稿の各項目は v2 ガイドと同じデータ（`explore-data.js` / `guides-data.js` / `guides-extra.js` / `guides-enriched.json` / `img-credits-multi.json` / `build-spots-v2.mjs`）から出す。写真は CC ライセンスをクレジット付きで使う。
- ローテーションは v2 公開済み県 → JIS 順。`state.json.issued` に送信済みを記録し重複しない。
- フッターに事業者情報ページ（tokushoho）へのリンク。CAN-SPAM の物理住所本文記載は未対応（オーナー判断: 記載するなら `NEWSLETTER_POSTAL` を足して draft に流し込む）。
- Resend 無料枠: 月 3,000 通・日 100 通・audience 1 件 1,000 連絡先（超えたら有料か送信分割。判断はオーナー）。

## 週次 routine

`.claude/prompts/nihongohub-weekly-newsletter.md`（scheduled-task `nihongohub-weekly-newsletter`）。鍵が無い週は todos に起票して終了する。

# NihongoHub Phase B デプロイ手順書

**目的**: 仕様書 v1 §12 の受け入れ基準を満たすデプロイ完了まで。
**所要時間目安**: 60–90 分（アカウント発行込み）
**前提**: Node.js / npm 済、Windows 11、PowerShell 利用

---

## 🔑 ステップ 0: `ADMIN_KEY` を自分で生成する

> ⚠️ 旧 KEY（`e33711...`）は 2026-04-22 深夜セッションで公開扱いのため **無効化**。以下コマンドで毎回新規生成すること。

PowerShell / Bash で下記を実行:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

64 桁の hex 文字列が表示される。これを:
- Vercel Environment Variables の `ADMIN_KEY` に設定
- ローカル `.env.local` にもコピー（`.gitignore` 対象なので Git に入らない）
- **秘書（Claude Code）へは共有不要**。オーナー側でのみ保管

生成例（形式のみ参考、実値は毎回異なる）:
```
a090b6a8592602ab558a5ce3ec36bf6c96c07a044d766fe94ceb7737fa7e9b03
```

本手順書内のコマンド例で `$ADMIN_KEY` と出てくる箇所は、生成した値を貼り付ける。

---

## ステップ 1: Vercel アカウント（5 分）

1. [https://vercel.com/signup](https://vercel.com/signup) を開く
2. **Continue with GitHub** を選択（推奨、後で Private repo 連携が楽）
3. 個人アカウントで Free プラン開始
4. Vercel CLI をローカルにインストール:

```powershell
npm i -g vercel
vercel login
```

---

## ステップ 2: Anthropic API Key（5 分）

1. [https://console.anthropic.com/](https://console.anthropic.com/) にログイン
2. **Settings → Billing** で**月額予算 $20** の上限を設定（コスト爆発防止、2026-04-24 決定の最新値）
3. **Settings → API Keys → Create Key** で新規発行
4. 名前は `nihongohub-prod`、値を安全な場所にメモ（`sk-ant-api03-...`）

---

## ステップ 3: Supabase プロジェクト（10 分）

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) で **New Project**
2. 設定:
   - Organization: 個人
   - Name: `nihongohub`
   - Database Password: ランダム生成、保管
   - Region: `Northeast Asia (Tokyo)`（低レイテンシ）
   - Pricing Plan: Free
3. プロジェクト作成（2–3 分待機）
4. **SQL Editor → New Query** で `supabase/schema.sql` の中身を貼り付けて **Run**
   - 期待結果: `Success. No rows returned`
5. **Settings → API** から以下をメモ:
   - `Project URL`（`https://xxxxx.supabase.co`）
   - `service_role` secret（`eyJ...`、⚠️ anon ではない）

---

## ステップ 4: Upstash Redis（5 分）

1. [https://console.upstash.com/](https://console.upstash.com/) で Sign up（Google OAuth 推奨）
2. **Create Database**:
   - Name: `nihongohub-ratelimit`
   - Primary Region: `ap-northeast-1` (Tokyo)
   - Type: **Regional** (Free tier)
3. 作成後、**REST API** タブから以下をメモ:
   - `UPSTASH_REDIS_REST_URL`（`https://xxxxx.upstash.io`）
   - `UPSTASH_REDIS_REST_TOKEN`（`AX...`）

---

## ステップ 5: Vercel に環境変数設定（5 分）

ローカルプロジェクト直下で:

```powershell
cd C:\Users\Yurik\.secretary\projects\nihongohub
vercel link
```

- Set up and deploy? → **Y**
- Which scope? → 個人アカウント
- Link to existing project? → **N**
- What's your project's name? → `nihongohub`
- In which directory is your code located? → `./`

続いて 6 変数を設定:

```powershell
vercel env add ANTHROPIC_API_KEY production
# 貼り付け: sk-ant-api03-...

vercel env add SUPABASE_URL production
# 貼り付け: https://xxxxx.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# 貼り付け: eyJ...

vercel env add UPSTASH_REDIS_REST_URL production
# 貼り付け: https://xxxxx.upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN production
# 貼り付け: AX...

vercel env add ADMIN_KEY production
# 貼り付け: e33711650754e7d478dbe40aab1b0c429787146bcd3a974aadb8ece4d993e90d
```

---

## ステップ 6: 本番デプロイ（3 分）

```powershell
vercel --prod
```

- 初回は数分かかる
- 完了後 `https://nihongohub-xxxx.vercel.app` が表示される
- 以下、このドメインを `<DEPLOY_URL>` と表記

---

## ステップ 7: ヘルスチェック（1 分）

PowerShell で:

```powershell
curl.exe https://<DEPLOY_URL>/api/health
```

期待するレスポンス:

```json
{
  "status": "ok",
  "model": "claude-haiku-4-5-20251001",
  "apiKeySet": true,
  "supabaseConfigured": true,
  "redisConfigured": true,
  "adminKeySet": true,
  "timestamp": "2026-..."
}
```

3 フラグすべて `true` でないと、ステップ 5 の環境変数に漏れがある。

---

## ステップ 8: プリ生成バッチ（Phase B の山場、15–30 分）

⚠️ **Vercel Hobby プランは maxDuration 60 秒** なので、5×5×100=2,500 問を一発生成はタイムアウト。
**言語ごとに分割**して 5 回実行する:

```powershell
# 英語のみ 5 レベル × 100 問 = 500 問
curl.exe -X POST https://<DEPLOY_URL>/api/generate-batch `
  -H "x-admin-key: e33711650754e7d478dbe40aab1b0c429787146bcd3a974aadb8ece4d993e90d" `
  -H "Content-Type: application/json" `
  -d '{\"langs\":[\"en\"],\"perCombo\":100}'

# 同様に zh / es / th / id で繰り返す
# 各コール ≒ 500 問 × 150ms = 75 秒... 60 秒で 400 問生成で止まる可能性あり
# その場合は perCombo を 70 に下げる:
# -d '{\"langs\":[\"en\"],\"perCombo\":70}'
```

各呼び出し後、JSON で `{generated, inserted, failed}` が返る。`inserted` 合計が **2,000+** になるまで繰り返す。

### Supabase 側で確認

Supabase Dashboard → **Table Editor → pregenerated_quiz** で行数を確認。2,000 行以上あれば OK。

---

## ステップ 9: 動作確認（10 分）

### 9-1. /api/generate のキャッシュヒット検証

同じ level/lang で 15 回叩き、`source: "cached"` が 12 回以上出れば 80% ヒット:

```powershell
for ($i=0; $i -lt 15; $i++) {
  curl.exe -X POST https://<DEPLOY_URL>/api/generate `
    -H "Content-Type: application/json" `
    -d '{\"level\":\"N5\",\"lang\":\"en\"}' | Select-String "source"
}
```

### 9-2. レート制限（16 回目で 429）

**10 回は成功、11 回目で 429 が返ればレート制限 OK**（ゲスト = 認証なし）。

### 9-3. LP 動作確認

ブラウザで `https://<DEPLOY_URL>/` を開く:
- [ ] 5 言語ボタン切替で文言が変わる
- [ ] N5–N1 レベル切替
- [ ] 「Try a free quiz」等のボタンで `/api/generate` が呼ばれる
- [ ] 日本語の問題 + 翻訳 + 選択肢が表示される

---

## ステップ 10: Vercel Analytics 有効化（2 分）

Vercel Dashboard → `nihongohub` プロジェクト → **Analytics** タブ → Enable（Free プラン）

---

## ステップ 10.5: 監視・アラート設定（必須、5 分）

### A. Anthropic Spend Alert（予算爆発防止）

1. [console.anthropic.com](https://console.anthropic.com/) → **Settings → Billing → Spend Limit**
2. 月次上限: **$20**（2026-04-24 決定の最新値、当初 $40 → 1st 案 $10 → 中間値 $20）
3. アラート通知: **$10 / $15 / $20** の 3 段でメール受信
4. 上限到達時の挙動: ハードストップ（API が 429 を返す）

### B. Vercel のデプロイ失敗通知

1. Vercel Dashboard → `nihongohub` → **Settings → Notifications**
2. 「Deployment Failed」「Domain Expired」を ON
3. 通知先メールをオーナー個人アドレスに

### C. Sentry 無料枠（推奨、Phase B 完了から 1 週間以内）

1. [sentry.io](https://sentry.io) で Sign up（GitHub OAuth）
2. New Project → Platform: **Node.js**
3. DSN 取得
4. ローカルで `npm install @sentry/node`（package.json に追加）
5. `lib/sentry.js` 新設（Phase B 完了後、秘書に依頼）
6. Vercel env に `SENTRY_DSN` 追加、再デプロイ

### D. CORS 本番限定化（Phase B デプロイ直後に必須）

```powershell
# ALLOWED_ORIGIN を本番ドメインに限定
vercel env add ALLOWED_ORIGIN production
# 貼り付け: https://nihongohub.vercel.app  (独自ドメイン取得前)
# または:   https://nihongohub.com          (Phase C1 独自ドメイン後)

vercel --prod  # 再デプロイ
```

確認:
```bash
# 異なる Origin からのアクセスは CORS エラーになるはず
curl -X POST https://[deploy]/api/generate \
  -H "Origin: https://evil.example.com" \
  -H "Content-Type: application/json" \
  -d '{"level":"N5","lang":"en"}'
# → ブラウザでは CORS ポリシー違反でブロック
```

---

## ✅ Phase B 完了チェックリスト（仕様書 §12）

- [ ] `/api/health` が 3 フラグ `true`
- [ ] `/api/generate` が 5 言語 × 5 レベル（25 パターン）で 200 応答
- [ ] プリ生成 2,000+ 問が `pregenerated_quiz` に格納、キャッシュヒット 80%+
- [ ] ゲスト日次リミット 10 req/日 が 11 回目で 429
- [ ] LP が 5 言語すべて表示、クイズ動線動作
- [ ] Vercel Analytics 有効化

すべてチェック付けば Phase C1（独自ドメイン + Stripe）へ。

---

## 🩹 トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `/api/health` で `apiKeySet:false` | env 設定漏れ | `vercel env ls` で確認、`vercel env add` で再設定 → 再デプロイ |
| `/api/generate` で 500 "Server configuration error" | Anthropic Key 不正 | Key 再発行、予算上限未設定確認 |
| `/api/generate-batch` でタイムアウト | Hobby 60 秒制約 | `perCombo` を 50–70 に下げて再実行 |
| `supabaseConfigured:false` | URL か key 未設定 | service_role を使っているか確認（anon ではダメ） |
| 429 が 1 回目から出る | Upstash に古いデータ残存 | Upstash Console で DB Flush、または別 IP からテスト |
| LP のクイズが動かない | CORS / fetch パス | ブラウザ DevTools Console でエラー確認、`/api/generate` が同一ドメインで呼ばれているか |

---

## 📝 デプロイ後に更新するドキュメント

1. `CLAUDE.md` の残タスクチェックを付ける
2. `spec-v1-draft.md` §12 チェックリストを埋める
3. `../../pm/nihongohub-roadmap.md` の Phase B を ✅ に
4. `成果物\Product\nihongohub\reports\2026-04.md` に API コスト実測（Anthropic Console）を記録
5. 秘書 `notes/2026-04-xx-decisions.md` に「Phase B 完了」を記録

**Phase B 完了後、オーナー合意のうえで Phase C1 着手チケットを PM で起票**。

# NihongoHub Phase B デプロイ手順書（Web UI 版）

**CLI 不要版** — `vercel login` 問題（Windows 非ASCII ホスト名）回避ルート
**目的**: 仕様書 v1 §12 の受け入れ基準を満たすデプロイ完了まで
**所要時間目安**: 40–70 分（GitHub push 10 分 + 残り Web UI 操作）
**前提**: GitHub アカウント、ブラウザのみ（Node.js / CLI 不要）

> 本手順書は `PHASE_B_DEPLOYMENT.md`（CLI 版）の置き換え。ステップ 0-4（アカウント発行）は 2026-04-24 に完了済み。以下はステップ 5 以降の Web UI 版。

---

## 前提確認（ステップ 0-4 完了済みチェック）

以下 6 つの機密情報がオーナー手元に揃っていること:

| # | キー | 形式 |
|---|-----|-----|
| 1 | `ADMIN_KEY` | 64桁 hex |
| 2 | `ANTHROPIC_API_KEY` | `sk-ant-api03-...` |
| 3 | `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| 4 | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...`（JWT） |
| 5 | `UPSTASH_REDIS_REST_URL` | `https://xxxxx.upstash.io` |
| 6 | `UPSTASH_REDIS_REST_TOKEN` | `AX...` |

揃っていなければ `PHASE_B_DEPLOYMENT.md` のステップ 0-4 を先に完了。

---

## ステップ 5: GitHub リポジトリ作成 + コード push（10–15 分）

### 5-1. GitHub リポジトリ作成（Web UI）

1. ブラウザで https://github.com/new を開く
2. 以下の設定で作成:

| 項目 | 値 |
|---|---|
| Repository name | `nihongohub` |
| Description | `Japanese language learning SaaS — 5-language LP + AI quiz (Vercel + Anthropic Haiku 4.5)` |
| Visibility | **Private**（推奨、秘匿 API キーとの距離を取る） |
| Initialize | 何もチェックしない（README / .gitignore / License は既存のものを push する） |

3. **Create repository** クリック
4. 次画面に表示される URL（例: `https://github.com/<YourUser>/nihongohub.git`）をメモ

### 5-2. ローカルから GitHub へ push

ローカルプロジェクト直下（`C:\Users\Yurik\.secretary\projects\nihongohub\`）で以下を実行:

```powershell
cd C:\Users\Yurik\.secretary\projects\nihongohub

# 秘密情報が入らないか最終確認
git status

# 初期化（まだ git init していない場合のみ）
git init
git branch -M main

# .env / node_modules / _original_handoff.zip が除外されていることを確認
# .gitignore は既存（Env / node_modules / .vercel / _original_handoff.zip をブロック）

git add .
git commit -m "feat: Phase B deploy-ready (v2.0 architecture, schema + rate-limit + admin)"
git remote add origin https://github.com/<YourUser>/nihongohub.git
git push -u origin main
```

⚠️ push 前に **必ず `git status` + `.gitignore` 確認**:
- `.env.local` が含まれていないこと
- `node_modules/` が含まれていないこと
- `_original_handoff.zip` が含まれていないこと

### 5-3. GitHub で反映確認

ブラウザで `https://github.com/<YourUser>/nihongohub` を開き、ファイル一覧に以下が並んでいれば OK:
- `api/` `lib/` `supabase/` `content-pipeline/`
- `index.html` / `package.json` / `vercel.json` / `.gitignore`
- `CLAUDE.md` / `README.md` / `PHASE_B_DEPLOYMENT.md` / `PHASE_B_DEPLOYMENT_WEB_UI.md` 等

---

## ステップ 6: Vercel Dashboard から GitHub repo を Import（5 分）

1. Vercel Dashboard（https://vercel.com/dashboard）を開く
2. **Add New → Project** をクリック
3. **Import Git Repository** セクションで GitHub 連携:
   - 初回は **Install Vercel for GitHub** で権限付与（Private repo アクセス許可）
   - `nihongohub` リポジトリを探して **Import** クリック
4. 設定画面で以下を確認:

| 項目 | 値 |
|---|---|
| Framework Preset | **Other**（自動検出されなければ） |
| Root Directory | `./` |
| Build Command | 空欄のまま |
| Output Directory | 空欄のまま（静的 `index.html` + serverless `api/`） |
| Install Command | `npm install`（自動検出） |

5. **Environment Variables** セクションで 6 変数を追加（下記ステップ 7 で詳述、ここでまとめて入れてもよい）
6. **Deploy** はまだ押さない（環境変数を先に設定）

---

## ステップ 7: 環境変数 6 つを Vercel Dashboard に設定（10 分）

Vercel Project → **Settings → Environment Variables** で以下 6 個を追加:

| # | NAME | VALUE（オーナー側メモから貼付） | Environments |
|---|------|----|----|
| 1 | `ADMIN_KEY` | （ステップ 0 で生成した 64桁 hex） | Production ✅ Preview ✅ |
| 2 | `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Production ✅ Preview ❌ |
| 3 | `SUPABASE_URL` | `https://xxxxx.supabase.co` | Production ✅ Preview ✅ |
| 4 | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Production ✅ Preview ❌ |
| 5 | `UPSTASH_REDIS_REST_URL` | `https://xxxxx.upstash.io` | Production ✅ Preview ✅ |
| 6 | `UPSTASH_REDIS_REST_TOKEN` | `AX...` | Production ✅ Preview ❌ |

各変数ごとに:
1. **Add New** クリック
2. **Name** と **Value** を入力
3. **Environments** を選択（機密性の高いものは Production のみ）
4. **Save**

> ⚠️ `ANTHROPIC_API_KEY` と `SUPABASE_SERVICE_ROLE_KEY` と `UPSTASH_REDIS_REST_TOKEN` は Preview 環境に流さない（PR preview URL が漏れたら即 $$$）。

### 後からの追加も可能

すべての変数はあとから **Settings → Environment Variables → Add New** で追加・編集できる。ただし既存デプロイに適用するには **Redeploy** が必要（後述）。

---

## ステップ 8: 初回デプロイ実行（3–5 分）

### 8-1. Vercel Dashboard からデプロイ

1. Vercel Project → **Deployments** タブ
2. 右上 **Deployments → Redeploy**（または新規 Import 時は Deploy ボタン）
3. 初回は 3-5 分で完了
4. 完了後、URL（例: `https://nihongohub-xxxx.vercel.app`）が表示される
5. 以下、このドメインを `<DEPLOY_URL>` と表記

### 8-2. ヘルスチェック

ブラウザで以下にアクセス:
```
https://<DEPLOY_URL>/api/health
```

期待するレスポンス（JSON）:
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

**4 フラグ全て `true`** でなければ、ステップ 7 の環境変数に漏れあり。Settings → Environment Variables で確認 → 修正 → **Deployments → Redeploy**。

### 8-3. Git push による自動デプロイ（運用）

以後、コード修正は:
```powershell
git add .
git commit -m "..."
git push
```
→ Vercel が自動検出して自動デプロイ（CLI 完全不要）

---

## ステップ 9: プリ生成バッチ実行（15–30 分）

⚠️ Vercel Hobby プランは maxDuration 60 秒のため、2,500 問一発生成はタイムアウト。
**言語ごとに分割して 5 回実行**。

### 9-1. PowerShell で実行（CLI 不要で `curl.exe` だけ使用）

以下 5 回、連続して実行（`<ADMIN_KEY>` と `<DEPLOY_URL>` を置換）:

```powershell
# 英語: 5 レベル × 100 問 = 500 問
curl.exe -X POST https://<DEPLOY_URL>/api/generate-batch `
  -H "x-admin-key: <ADMIN_KEY>" `
  -H "Content-Type: application/json" `
  -d '{\"langs\":[\"en\"],\"perCombo\":100}'

# 中国語
curl.exe -X POST https://<DEPLOY_URL>/api/generate-batch `
  -H "x-admin-key: <ADMIN_KEY>" `
  -H "Content-Type: application/json" `
  -d '{\"langs\":[\"zh\"],\"perCombo\":100}'

# スペイン語
curl.exe -X POST https://<DEPLOY_URL>/api/generate-batch `
  -H "x-admin-key: <ADMIN_KEY>" `
  -H "Content-Type: application/json" `
  -d '{\"langs\":[\"es\"],\"perCombo\":100}'

# タイ語
curl.exe -X POST https://<DEPLOY_URL>/api/generate-batch `
  -H "x-admin-key: <ADMIN_KEY>" `
  -H "Content-Type: application/json" `
  -d '{\"langs\":[\"th\"],\"perCombo\":100}'

# インドネシア語
curl.exe -X POST https://<DEPLOY_URL>/api/generate-batch `
  -H "x-admin-key: <ADMIN_KEY>" `
  -H "Content-Type: application/json" `
  -d '{\"langs\":[\"id\"],\"perCombo\":100}'
```

各コールの返り値 `{generated, inserted, failed}` の `inserted` 合計が **2,000+** なら OK。

### 9-2. タイムアウト時の縮退

60 秒でタイムアウトする場合は `perCombo` を `70` → `50` に下げて再実行:
```powershell
-d '{\"langs\":[\"en\"],\"perCombo\":70}'
```

### 9-3. Supabase 側で行数確認

Supabase Dashboard → **Table Editor → pregenerated_quiz** で 2,000+ 行が入っていれば成功。

---

## ステップ 10: 動作確認（10 分）

### 10-1. キャッシュヒット検証

PowerShell で同じ level/lang で 15 回叩く:

```powershell
for ($i=0; $i -lt 15; $i++) {
  curl.exe -X POST https://<DEPLOY_URL>/api/generate `
    -H "Content-Type: application/json" `
    -d '{\"level\":\"N5\",\"lang\":\"en\"}' | Select-String "source"
}
```

`"source":"cached"` が **12 回以上** なら 80% ヒット達成。

### 10-2. レート制限検証

11 回目で 429 が返ればゲスト日次 10req/日リミット正常動作。

### 10-3. LP 目視確認

ブラウザで `https://<DEPLOY_URL>/` を開く:
- [ ] 5 言語ボタン切替で文言が変わる
- [ ] N5–N1 レベル切替
- [ ] 「Try a free quiz」で `/api/generate` が呼ばれる
- [ ] 日本語問題 + 翻訳 + 選択肢が表示される

---

## ステップ 11: 監視・CORS 本番限定化（必須、10 分）

### 11-1. Vercel Analytics 有効化

Vercel Dashboard → `nihongohub` → **Analytics** タブ → **Enable**（Free プラン）

### 11-2. Anthropic Spend Alert（既存 $20 上限）

`console.anthropic.com` → Billing → Spend Limit で:
- 月次上限: **$20**（2026-04-24 決定）
- アラート: **$5 / $10 / $20** の 3 段階メール通知
- 上限到達時: Hard Stop

### 11-3. Vercel デプロイ失敗通知

Vercel Dashboard → `nihongohub` → **Settings → Notifications**:
- Deployment Failed / Domain Expired を ON
- 通知先メールを個人アドレスに

### 11-4. CORS 本番限定化

Vercel Dashboard → **Settings → Environment Variables → Add New**:
- Name: `ALLOWED_ORIGIN`
- Value: `https://<DEPLOY_URL>`（独自ドメイン取得前）
  - Phase C1 で独自ドメイン化後は `https://nihongohub.com` に更新
- Environments: Production ✅

追加後、**Deployments → Redeploy** で反映。

### 11-5. Sentry（推奨、Phase B 完了 1 週間以内）

秘書に `lib/sentry.js` 実装を依頼 → SENTRY_DSN 追加 → 再デプロイ。

---

## ✅ Phase B 完了チェックリスト（仕様書 §12）

- [ ] GitHub Private repo `nihongohub` 作成、main ブランチ push 済
- [ ] Vercel Project `nihongohub` 作成、GitHub 連携済
- [ ] 環境変数 6 個（+ 後から `ALLOWED_ORIGIN`）設定済
- [ ] `/api/health` 4 フラグ全 `true`
- [ ] `/api/generate` 5 言語 × 5 レベル（25 パターン）200 応答
- [ ] プリ生成 2,000+ 問が `pregenerated_quiz` 格納、キャッシュヒット 80%+
- [ ] ゲスト日次リミット 10 req/日、11 回目で 429
- [ ] LP 5 言語表示、クイズ動線動作
- [ ] Vercel Analytics 有効
- [ ] CORS 本番限定化（`ALLOWED_ORIGIN` 設定済）

全チェック付けば Phase C1（独自ドメイン + Stripe）へ。

---

## 🩹 Web UI 版トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| GitHub push で `Permission denied` | SSH 鍵未設定 or HTTPS 認証失敗 | Personal Access Token を発行して HTTPS push、または SSH 鍵を GitHub に登録 |
| Vercel Import で repo が見えない | Vercel for GitHub の権限不足 | GitHub → Settings → Applications → Vercel → Configure で repo アクセス許可 |
| Deploy が `Build failed` | `package.json` の依存解決失敗 | Deployments → Logs で詳細確認、`@supabase/supabase-js` 等のバージョンを確認 |
| `/api/health` で `apiKeySet:false` | 環境変数未設定 or typo | Settings → Environment Variables で確認 → 修正 → Redeploy |
| 環境変数を変更したのに効かない | 既存デプロイに反映されていない | Deployments → 最新デプロイの ... メニュー → **Redeploy** |
| GitHub push 時に `.env.local` を誤コミット | `.gitignore` 不備 | 即 `git rm --cached .env.local` + commit + push、Anthropic / Supabase / Upstash のキーを全て **再発行** |

---

## 📝 デプロイ後に更新するドキュメント

1. `CLAUDE.md` の残タスクをチェック
2. `spec-v1-draft.md` §12 チェックリストを埋める
3. `../../pm/nihongohub-roadmap.md` Phase B を ✅ に
4. `成果物\Product\nihongohub\reports\2026-04.md` or 2026-05.md に API コスト実測記録
5. `../../notes/YYYY-MM-DD-decisions.md` に「Phase B 完了」記録
6. Phase C1 着手チケットを PM で起票（独自ドメイン + Stripe + ConvertKit）

---

## 作成経緯

- 2026-04-24 秘書作成。`vercel login` が Windows 非ASCII ホスト名で失敗した問題への対応として、CLI を迂回する Web UI ルート（案 C）を採用
- 根拠: `notes/2026-04-24-decisions.md` 決定 3

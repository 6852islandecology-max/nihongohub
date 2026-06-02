# Phase B+ 監視（Sentry + Anthropic Spend Alert + Vercel Web Analytics）仕様

**起案日**: 2026-05-04
**起案者**: 秘書
**ステータス**: spec-v1（オーナー Sentry プロジェクト作成のみ要、それ以外は秘書実装可）
**期限**: 2026-05-13（v3 ロードマップ）
**所要**: 30 分（仕様）+ 1.5h（実装）+ 5 分（オーナー Sentry 作成）

---

## 0. 目的

v3 4 倍稼働化により API 呼出数増（月予算 $20 → $40 上限）+ 本番事故防止のため、Phase B+ で 3 種監視を導入:

1. **Sentry**: フロントエンド + サーバー側エラー追跡（無料枠）
2. **Anthropic Spend Alert**: 月予算 $40 超過 alarm（既存 $20 上限を $40 に変更）
3. **Vercel Web Analytics**: 訪問数・地域分布・ページビュー（Hobby プラン無料枠）

---

## 1. オーナー対応必須項目（5-10 分）

### 1.1 Sentry プロジェクト作成

1. https://sentry.io/signup/ にサインアップ（GitHub OAuth 推奨）
2. 新 Organization 作成: 名前は任意（例: `nihongohub`）
3. 新 Project 作成 → Platform = **Next.js** を選択（素 Vercel Serverless でも Next.js テンプレが互換）
4. プロジェクト作成後、**DSN URL** が表示される（形式: `https://xxxxx@oXXXXX.ingest.sentry.io/XXXX`）→ コピー
5. Vercel Dashboard で `SENTRY_DSN` 環境変数を追加（Production / Preview / Development 全て）
6. オーナーは秘書に「DSN 設定完了」と一言ください → 秘書がコード追加 + デプロイ確認

無料枠: 月 5,000 events / 1 user / 1 project（NihongoHub Phase B-C2 で十分）

### 1.2 Anthropic Spend Alert — $20 維持 + Email alert + reactive top-up（2026-05-16 仕様改訂）

> **改訂理由**: オーナー判断 (2026-05-16) で当初案「$40 化」を不採択、$20 上限維持 + alert 受信時に都度手動増額する reactive 方針を採択。詳細は `notes/2026-05-16-decisions.md` 決定 3 参照。

1. https://console.anthropic.com/settings/limits を開く
2. **Monthly spend limit**: `$20` のまま（変更なし）
3. **Email alerts** で `80%` (=$16) と `95%` (=$19) で通知設定 ← 必須
4. オーナーは秘書に「$20 維持 / 80%/95% alert ON 完了」と一言

#### Reactive top-up 運用

- 80% alert (=$16 到達) email 受信時にオーナーが Anthropic Console で必要分のみ手動増額 ($25/$30 等、その月のみ)
- 翌月 1 日リセット時に必要なら $20 に戻す（または据置）
- 秘書側で各 batch 着手前 (5/30 stress test / 6/14 SEO 235 記事) にコスト試算を再提示 + オーナー判断を促す

#### コスト試算（v3 4 倍稼働化、Phase C1-C2 期間）

| 月 | 内訳 | 推定総額 | $20 alert 発火確率 |
|---|---|---|---|
| 5月 | 既存運用 + PR-25 シード 1,250 問 ($2.50) + stress test 2,500 問 ($10-15) | $15-18 | 中 (80% = $16) |
| 6月 | β tester 5 名利用 + Phase C2 SEO 235 記事 ($5-10) | $15-25 | 高 (80% = $16) |
| 7月以降 | MAU 増加に応じ漸増 | 変動 | 観測対象 |

### 1.3 Vercel Web Analytics 有効化

1. https://vercel.com/6852islandecology-max/nihongohub → **Analytics** タブ
2. 「**Enable Web Analytics**」ボタンクリック（Hobby プラン無料枠、月 25,000 events）
3. オーナーは秘書に「Analytics 有効化完了」と一言

無料枠: 月 25,000 events（Phase C2 中間 KPI #1 = MAU 1,000 までは余裕）。Phase D で MAU 5,000+ に達したら Pro プラン $20/月に upgrade 検討。

---

## 2. 秘書実装項目（1.5h、Sentry DSN 受領後即着手可）

### 2.1 `package.json` に Sentry SDK 追加

```json
"dependencies": {
  ...
  "@sentry/node": "^8.42.0"
}
```

実行:
```bash
cd /c/Users/Yurik/.secretary/projects/nihongohub
npm install @sentry/node
```

### 2.2 `lib/sentry.js` 新設

```js
// lib/sentry.js
// Sentry initialization for NihongoHub serverless functions
import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry() {
  if (initialized || !process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || "development",
    tracesSampleRate: 0.1, // 10% トレース、月 5,000 event 内に収める
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    beforeSend(event, hint) {
      // 個人情報スクラブ: email/password/auth 関連を伏せる
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers["x-admin-key"];
      }
      return event;
    },
  });
  initialized = true;
}

export function captureApiError(err, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.error("Sentry not configured, error logged locally:", err, context);
    return;
  }
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setContext(k, v));
    Sentry.captureException(err);
  });
}

export function captureMessage(msg, level = "info", context = {}) {
  if (!process.env.SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setContext(k, v));
    Sentry.captureMessage(msg, level);
  });
}
```

### 2.3 既存 API への組込（最小差分）

各 `api/*.js` の冒頭で initSentry + try/catch:

#### `api/generate.js` 改修例

```js
import { initSentry, captureApiError } from '../lib/sentry.js';

export default async function handler(req, res) {
  initSentry();
  try {
    // ... 既存処理
    const cached = await fetchCachedQuiz({ level, lang });
    if (cached) return res.json({ ...cached, source: "cached", remaining });
    const generated = await generateQuiz({ level, lang });
    return res.json({ ...generated, source: "generated", remaining });
  } catch (err) {
    captureApiError(err, {
      api: "generate",
      level: req.body?.level,
      lang: req.body?.lang,
      mode: req.body?.mode,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
}
```

同様に `api/generate-batch.js` `api/health.js` `api/trial-start.js` (PR-15) `api/upgrade-checkout.js` (PR-15) `api/stripe-webhook.js` (PR-15) `api/srs-due.js` (PR-16) `api/srs-rate.js` (PR-16) で initSentry + captureApiError パターン適用。

### 2.4 フロント側 Sentry（任意、Phase B+ では server-only でも可）

Phase B+ 時点では server-only で十分。Phase C2 でフロント側エラー（5 言語スイッチ動作不良等）追跡時に追加:

```html
<!-- index.html の <head> 末尾 -->
<script src="https://browser.sentry-cdn.com/8.42.0/bundle.min.js"></script>
<script>
  if (window.Sentry) {
    Sentry.init({
      dsn: "[client-side DSN, separate from server]",
      environment: "production",
      tracesSampleRate: 0.05,
    });
  }
</script>
```

NihongoHub では server エラーが 90%+ で、フロントは静的に近いため Phase C2 まで保留推奨。

### 2.5 Anthropic コスト追跡（自前メトリクス）

Anthropic の Spend Alert に加えて、自前で日次コスト追跡:

```sql
-- Supabase に追加
CREATE TABLE IF NOT EXISTS api_cost_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  endpoint TEXT NOT NULL,  -- 'generate' / 'generate-batch'
  request_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
  cache_hit_rate NUMERIC(5, 2),  -- %
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, endpoint)
);

CREATE INDEX idx_api_cost_log_date ON api_cost_log (date DESC);
```

`lib/anthropic.js` で API 呼出後にコスト記録（Haiku 4.5 = input $1/MTok + output $5/MTok = ~$0.002/quiz）:

```js
async function logApiCost({ endpoint, count = 1, estimatedCostUsd }) {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.rpc('upsert_api_cost', {
    p_date: today,
    p_endpoint: endpoint,
    p_count: count,
    p_cost: estimatedCostUsd,
  });
}
```

Supabase RPC:
```sql
CREATE OR REPLACE FUNCTION upsert_api_cost(
  p_date DATE, p_endpoint TEXT, p_count INTEGER, p_cost NUMERIC
) RETURNS VOID AS $$
BEGIN
  INSERT INTO api_cost_log (date, endpoint, request_count, estimated_cost_usd)
  VALUES (p_date, p_endpoint, p_count, p_cost)
  ON CONFLICT (date, endpoint) DO UPDATE SET
    request_count = api_cost_log.request_count + EXCLUDED.request_count,
    estimated_cost_usd = api_cost_log.estimated_cost_usd + EXCLUDED.estimated_cost_usd;
END;
$$ LANGUAGE plpgsql;
```

### 2.6 月次コスト確認スクリプト（既存 scheduled-task に追加）

`scripts/inspect-api-cost.mjs`（新規、`.env` 補充済前提）:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const days = parseInt(process.argv[2] || "30", 10);
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const { data, error } = await sb
  .from("api_cost_log")
  .select("*")
  .gte("date", since)
  .order("date", { ascending: false });

if (error) { console.error(error); process.exit(1); }

let totalCost = 0;
let totalRequests = 0;
console.log(`=== Anthropic API Cost (last ${days} days, since ${since}) ===\n`);
console.log("Date         Endpoint         Requests  Cost($)");
console.log("--------------------------------------------------");
for (const row of data) {
  console.log(`${row.date}  ${row.endpoint.padEnd(15)} ${String(row.request_count).padStart(8)}  ${row.estimated_cost_usd.toFixed(4)}`);
  totalCost += row.estimated_cost_usd;
  totalRequests += row.request_count;
}
console.log("--------------------------------------------------");
console.log(`Total:                          ${String(totalRequests).padStart(8)}  ${totalCost.toFixed(2)}`);
console.log(`\nMonthly budget: $40.00`);
console.log(`Used: ${(totalCost / 40 * 100).toFixed(1)}%`);
if (totalCost > 32) console.log("⚠️  Budget 80% exceeded — review usage");
if (totalCost > 38) console.log("🔴 Budget 95% exceeded — alert");
```

実行:
```bash
node scripts/inspect-api-cost.mjs 30  # 直近 30 日
node scripts/inspect-api-cost.mjs 7   # 直近 7 日
```

---

## 3. monthly-vibe-coding-audit との連動

既存 `monthly-vibe-coding-audit` scheduled-task（毎月 1 日 10:00）にコスト類型チェックを追加:

- リスク類型 #5「コスト試算欠如」: 月次で `api_cost_log` を集計し、$40 上限内か確認
- 出力: `reviews/monthly/{YYYY-MM}-vibe-coding-audit.md` にコストサマリ追記

これは既存プロンプトの軽微改修で実現可能（5/13 まで秘書側で対応）。

---

## 4. 受入基準（5/13 完了判定）

### 4.1 オーナー対応（3 項目）

- [ ] Sentry プロジェクト作成 + DSN 取得
- [ ] Anthropic Spend Alert を $40 / 80% / 95% に設定
- [ ] Vercel Web Analytics 有効化

### 4.2 秘書実装（5 項目）

- [ ] `package.json` に @sentry/node 追加 + npm install
- [ ] `lib/sentry.js` 新設
- [ ] `api/*.js` 全エンドポイントに initSentry + captureApiError パターン適用
- [ ] Supabase に `api_cost_log` テーブル + `upsert_api_cost` RPC 追加
- [ ] `scripts/inspect-api-cost.mjs` 新設

### 4.3 動作確認（オーナー DSN 受領後）

- [ ] `/api/health` 呼出 → Sentry にトランザクション 1 件記録
- [ ] 意図的な 500 error 発生 → Sentry にエラー 1 件記録
- [ ] `node scripts/inspect-api-cost.mjs 7` で 5/3 250 問 + 5/4 25 + 478 = 753 件 / $1.50 表示
- [ ] Vercel Analytics ダッシュボードで `/` PV カウント上昇確認

---

## 5. 環境変数追加サマリ

```
# .env (ローカル) + Vercel Dashboard 両方に追加
SENTRY_DSN=https://xxxxx@oXXXXX.ingest.sentry.io/XXXX  # オーナー対応 1.1 後

# 既存 (変更なし)
ANTHROPIC_API_KEY=...  # Spend limit のみ Console で変更
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
ADMIN_KEY=...
```

---

## 6. リスク

| リスク | 影響度 | 対応 |
|---|---|---|
| Sentry 無料枠超過（月 5,000 events） | 中 | tracesSampleRate=0.1 で抑制、Phase D で Pro $26/月 検討 |
| Anthropic $40 上限到達で API 停止 | 高 | 80%/95% alert で事前検知、Phase C2 直前に $50 上限へ更新検討 |
| Sentry SDK 追加で Vercel cold start 遅延 | 低 | @sentry/node は 50KB 程度、cold start +50-100ms 想定（許容） |
| 個人情報誤送信（email 等） | 高 | beforeSend で auth/cookie/x-admin-key スクラブ |

---

## 7. 関連ドキュメント

- v3 ロードマップ: [`pm/nihongohub-roadmap.md`](../../../pm/nihongohub-roadmap.md)
- 戦略反転（4 倍稼働 → 月予算 $40 化）: [`notes/2026-05-04-decisions.md`](../../../notes/2026-05-04-decisions.md) 決定 6
- monthly-vibe-coding-audit: [`.claude/prompts/monthly-vibe-coding-audit.md`](../../../../.claude/prompts/monthly-vibe-coding-audit.md)
- バイブコーディング監査運用: [`CLAUDE.md`](../../../CLAUDE.md) §機能 4

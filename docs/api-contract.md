# API 契約表

2026-07-24 時点。デプロイされる Vercel 関数は 12（`api/` に 13 ファイル、`generate-batch.js` は `.vercelignore` で除外）。
Hobby プランの上限がちょうど 12 なので空き枠はゼロ。

この表の目的は、レスポンスの形とステータスコードが「今どうなっているか」を固定して可視化すること。
ばらつきは意図的に温存している。統一するとブラウザ側の分岐が壊れるため、
統一はプロダクト判断として別途扱う（`docs/refactor-proposals.md`）。

## 一覧

| エンドポイント | メソッド | 認証 | レート制限 | CORS | Sentry | 未設定時 | エラー時 |
|---|---|---|---|---|---|---|---|
| `/api/generate` | POST | 任意（Bearer があれば権利判定） | ゲスト 30/日、トライアル 50/日、有料は無制限、N5/N4 は無制限 | あり | あり | 500 `{error}` | 400 / 429 / 500 / 502 `{error}` |
| `/api/daily-coach` | POST | なし | IP 20/日（fail-open） | あり | あり | 200 `{ok:false, reason:"unconfigured"}` | 200 `{ok:false, reason}` |
| `/api/health` | GET | なし | なし | あり | あり（init のみ） | 200（フラグで状態を返す） | — |
| `/api/public-config` | GET | なし | なし | なし | なし | 200（null 混じり） | — |
| `/api/count` | GET | なし | なし | なし | なし | 200 `{enabled:false, count:0}` | 200（fail-open） |
| `/api/trial-status` | GET | 必須 | なし | なし | なし | 200（既定値） | 401 `{error}` |
| `/api/trial-start` | POST | 必須 | なし | なし | あり | 503 `{error}` | 400 / 401 / 500 `{error}` |
| `/api/upgrade-checkout` | POST | 必須 | なし | なし | あり | 503 `{error}` | 400 / 401 / 502 `{error}` |
| `/api/stripe-portal` | POST | 必須 | なし | なし | あり | 503 `{error}` | 400 / 401 / 502 `{error}` |
| `/api/stripe-webhook` | POST | Stripe 署名検証 | なし | なし | あり | 503 `{error}` | 400（署名不正）。それ以外は常に 200 |
| `/api/rank` | GET | 必須 | なし | なし | なし | 200 `{available:false}` | 401 / 200 `{available:false}` |
| `/api/rank-submit` | POST | 必須 | なし | なし | なし | 200 `{ok:false, skipped:true}` | 401 / 500 `{error}` |
| `/api/generate-batch` | POST | ADMIN_KEY ヘッダ | なし | なし | あり | 501 / 500 | 403 / 200（集計を返す） |

## レスポンスの形が 4 種類ある

- `{ error: "..." }` — 大半のエンドポイント
- `{ ok: false, reason: "..." }` — `daily-coach.js` のみ。クライアントが `ok` を見て定型文にフォールバックする
- `{ enabled: false, count: 0 }` — `count.js`。数字を捏造しないための設計（表示自体を隠す）
- `{ available: false }` — `rank.js`。`dashboard.html:721` がカードを隠す

## 「未設定」時のステータスコードが 5 種類ある

501 / 500 / 503 / 200 が混在する。方針としては次の 2 つが混ざっている。

- 機能が無いだけならユーザーには見せない → 200 を返して UI 側で隠す（count, rank, trial-status, daily-coach）
- 設定漏れとして扱う → 503（Stripe 系, trial-start）

どちらも意図はあるが、同じ「未設定」という状況に対して扱いが違う。

## CORS

`lib/cors.js` の `applyCors` を使っているのは 3 本のみ（`generate`, `daily-coach`, `health`）。
他は CORS 処理をしていない。Bearer トークン認証なので古典的な CSRF リスクは低い。

`lib/cors.js:7` のデフォルトは `"*"`。ローカルの `.env` では `ALLOWED_ORIGIN` がコメントアウトされている
（本番の Vercel 環境変数側で設定されているかは未確認）。

## 副作用のある GET

`/api/trial-status` は GET だが、トライアル期限切れを検出すると `users.trial_status` を更新し
`trial_events` に記録する。2026-07-24 に `.eq("trial_status","active")` の条件を足して、
同時実行で監査ログが二重に入らないようにした。

`/api/count?hit=1` も GET でカウンタを INCR する。

## 認証なしで外部 API コストを消費できるもの

| エンドポイント | 消費するもの | 歯止め |
|---|---|---|
| `/api/daily-coach` | Anthropic（Haiku 4.5、max_tokens 120） | IP 20/日。ただし Upstash 障害時は fail-open で無制限になる |
| `/api/generate` | Anthropic（キャッシュ miss 時のみ） | ゲスト 30/日。N5/N4 は上限が無いがキャッシュ限定に強制される |
| `/api/count` | Upstash の書き込みのみ | なし |

## 12 関数上限による設計上の妥協

`api/count.js` はカウンタとファネルビーコン受信の 2 役を持つ。責務としては分けるべきだが、
新しい `api/*.js` を足すとデプロイ全体が凍結するため意図的に相乗りさせている
（同ファイル冒頭 6-8 行に理由が書かれている）。分離してはいけない。

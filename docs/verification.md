# NihongoHub 検証手順

このプロジェクトには CI もリンタも型検査も無い。検証はすべて手元で実行する。
最終確認日 2026-07-24。

## 1. 自動テスト（外部依存なし、常に実行できる）

```bash
npm test
```

内訳
- `node scripts/test-srs.mjs` — SM-2 アルゴリズムの単体テスト。`lib/srs-browser.js`（本番で実際に動いている実装）を対象とする。
- `node scripts/test-api-endpoints.mjs` — 環境変数を意図的に消した状態で各ハンドラを呼び、ガード（405 / 503 / 200）が正しく返るかを確認する。E2E ではない。

期待値は「両方とも 0 件失敗」。終了コードで機械判定できる。

## 2. ローカル実機確認

本番 URL はクロスオリジンのため操作できない。UI に関わる変更は必ずローカルで確認する。

```bash
node dev-server.mjs
```

port 3031 で起動する。静的ファイルを配信し、`/api/*` を実際の serverless ハンドラにルーティングし、`.env` を自動で読む。
静的配信だけでよい場合は `npx serve -l 3030 .`（`.claude/launch.json` に両方登録済み）。

確認の観点
- 変更したページを開いて表示崩れがないか
- ブラウザのコンソールにエラーが出ていないか
- api を変更した場合は、変更前後のレスポンス JSON のキー構成が一致するか

## 3. 外部依存があり、通常は実行しないもの

| コマンド | 必要なもの | 注意 |
|---|---|---|
| `node scripts/smoke-test-25-coverage.mjs` | `.env` の実キー、本番 Supabase への接続 | 25 セル（5 言語 × 5 レベル）のキャッシュ充足を確認する。終了コードを返さないので合否の機械判定はできない。 |
| `node scripts/inject-index-cards.mjs` | Anthropic API キー | 差分が無くても毎回課金呼び出しが発生する。安易に回さない。 |
| `npm run blog:photos:fetch` | Wikimedia へのネットワークアクセス | 画像を取得して webp 化する。 |

## 4. 構造の不変条件

変更のたびに確認する。

```bash
node -e "const f=require('fs');console.log('api files:',f.readdirSync('api').filter(x=>x.endsWith('.js')).length)"
```

13 であること。うち `api/generate-batch.js` は `.vercelignore` で除外されるので、デプロイされる関数は 12。
Vercel Hobby プランの関数上限がちょうど 12 なので、`api/*.js` を 1 本でも増やすとデプロイ全体が凍結する。
共通化コードは必ず `lib/` に置く（`lib/` は関数としてカウントされない）。

```bash
git status --short | wc -l
```

作業ツリーには常時 500 件規模の未コミット差分がある。自分の変更でこの件数がどれだけ増えたかを把握しておく。

## 5. ブログのビルド／注入パイプライン

`scripts/build-guides.mjs` は `blog/<slug>.html` をテンプレートから全文上書きするため、`scripts/inject-*.mjs` が積んだブロックを消す。必ず次の順で回す。

```bash
node scripts/build-blog.mjs --dry
```

`scripts/build-blog.mjs` が正しい順序を 1 箇所に定義している。まず `--dry` で差分を確認し、内容を確認してから `--dry` なしで実行する。

実行後は次で健全性を測る。

```bash
node scripts/check-blog-integrity.mjs
```

canonical の欠落数と各マーカーの残存数を出力する。

## 6. デプロイ

デプロイはオーナーの作業。実装担当は実行しない。

2026-07-22 以降の方針は git commit → push 経由（Vercel の GitHub 連携で自動デプロイ）。
`vercel --prod` によるローカル作業ディレクトリからの直接デプロイは禁止。理由は、直接デプロイした未コミット分が、後続の push 型デプロイに上書きされて消えるため。実際に 2026-07-22 に本番 404 の事故が発生している。

デプロイ後にしか確認できないこと
- `.vercelignore` に追加したパスが本番で 404 になるか
- `/api/health` の 4 フラグがすべて true か

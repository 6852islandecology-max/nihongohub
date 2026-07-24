# 死コード棚卸し（NihongoHub）

調査日 2026-07-24。参照数はすべて `grep -r`（node_modules と .git を除く）の実測。

判断の方針: 「古いから」では消さない。消したのは、参照ゼロかつ本番でも配信されていないことを
実測で確認できたものだけ。判断がつかないものは残して理由を書いた。

---

## 削除したもの

### lib/srs.js（117 行）

- 参照元: `scripts/test-srs.mjs` のみ。import しているコードは他にゼロ。
- ファイル冒頭コメントが「api/srs-due.js / api/srs-rate.js から呼ばれる」と書いていたが、
  その 2 ファイルは存在しない。
- 実際に動いている SRS は `lib/srs-browser.js`（quiz.html が読む）。両者は既に挙動が乖離しており、
  `srs-browser.js:12` の `SUBDAY_MS`（サブデイ・ステップ）が `srs.js` に無かった。
- つまり「20 件が緑のテスト」が本番未使用のコードを守っている状態だった。
- 対応: `scripts/test-srs.mjs` の対象を `lib/srs-browser.js` に付け替え、テストを 34 件に拡充してから削除。
  テストは減らしていない。むしろ本番で動く実装を初めてカバーした。

### lib/life-quiz-categories.js

- 参照元ゼロ。`LANG_NAMES` の 3 重定義のうち 1 つでもあった（`lib/anthropic.js:5-11` と
  `api/daily-coach.js:13` に残る 2 つは現役）。

### zen.html（3,058 行 / 286KB）

- ZenMarket のアフィリエイトページを丸ごと保存したもの。`<link rel="canonical">` が
  `https://zenmarket.jp/...` を指し、GTM タグと jQuery/Bootstrap の CDN 参照が残っていた。
- サイト内からの参照ゼロ。`sitemap.xml` に不在。本番で 404（未デプロイ）。
- 第三者サイトの複製をそのまま置いておく状態は、重複コンテンツと権利の両面で持っておく利点が無い。

### _pfx_block.html（7 行）

- 47 県リンクの HTML 断片。`<html>` タグも無い。参照ゼロ、本番で 404。

---

## 残したもの（消さない理由つき）

### scripts/generate-sprites-v2.mjs（639 行）

一見すると `build-hero-sprites.mjs` + `build-avatar-sprites.mjs` に置き換えられた旧世代に見えるが、
出力を突き合わせると置き換えられていない部分がある。

| 出力 | generate-sprites-v2 | 後継 |
|---|---|---|
| `rpg-n5..n1.svg`（主人公 5 段階） | ○ | `build-hero-sprites.mjs` |
| `assets/avatars/*.svg`（15 体） | ○ | `build-avatar-sprites.mjs` |
| `assets/characters/akari.svg` | ○ | 後継なし |
| `assets/characters/yukika.svg` | ○ | 後継なし |
| `og-default.svg` | ○ | 後継なし |

NPC 2 体と OG 画像はこのスクリプトが唯一の生成元。消すと再生成できなくなる。

### scripts/generate-pixel-art.mjs（265 行）

装備 188 点は `regen-equipment-art.mjs` が、アバター 15 体は `build-avatar-sprites.mjs` が引き継いでおり、
機能としては完全に置き換えられている（`regen-equipment-art.mjs:5-7` に「LLM に SVG を書かせず
16x16 ピクセルマップを返させて自前レンダする。Haiku v1 の品質が問題だった」と経緯が書かれている）。

ただし `data/equipment-metadata.js:4` がこのスクリプトを生成元として明記しており、
消すとその記述が宙に浮く。保持コストがほぼゼロなので残した。

### content-pipeline/（2 ファイル）

`prefecture-list.json` を読むコードは存在せず、仕様書が挙げる成果物 6 点のうち実在するのは 1 点だけ。
実際の 47 県コンテンツは別系統（`scripts/build-guides.mjs` + `blog/guides-data.js` + `data/prefectures.json`）で作られている。

死んだ枝ではあるが、47 県記事の設計判断とコスト試算（282 記事 × 2,500tok = $3.53）の記録として価値がある。
本番配信は `.vercelignore` で止めたので、置いておくコストはディスクだけ。

### srs_reviews テーブル（supabase/migrations/2026-05-17-pr16-srs-reviews.sql）

`.from("srs_reviews")` の呼び出しはコード全体でゼロ。このテーブルだけ RLS の記述が無いのも、
使われていないことの傍証。

ただしテーブルの DROP は本番データに触る操作で、しかも取り消しに migration がもう 1 本要る。
コードと違って「消して困ったら戻す」が簡単ではないため、判断を保留した。詳細は `supabase/README.md`。

なお Vercel の関数枠が 12 で埋まっているので、`api/srs-due.js` のような新規エンドポイントを
足す形でのサーバ側 SRS 実装は現状できない。実装するなら既存エンドポイントへの相乗りになる。

### one-off / one-shot と自己申告しているスクリプト 8 本

`purge-quiz-cache.mjs` / `fix-numeric-bank.mjs` / `regen-bank.mjs` / `export-drill-pack.mjs` /
`inject-seo-meta.mjs` / `regen-translations.mjs` / `inspect-latest.mjs` / `seed-life-quiz.sh`。

いずれも冒頭コメントに実行日や「一度きり」と書いてある。ただし同種の作業がまた発生したときの
手順書として機能するので残した。`inject-seo-meta.mjs` は one-shot と書いてあるが実際にはビルドパイプラインの
一部として繰り返し必要（`scripts/build-blog.mjs` に組み込んだ）。

### src/audio-aligner.js（Echo、257 行）

`src/main.js:1163-1166` に「機能を一旦封印」と明記されており、
`localStorage("echo-vad-enable")==="1"` でないと UI に出ない。意図的な封印なので触らない。

---

## 参照が腐っているだけのもの（実体が無い）

ドキュメントが実行を指示しているが、スクリプト自体が存在しない。

| 参照元 | 指示されているファイル |
|---|---|
| `specs/PhaseB-plus-monitoring-spec.md:282-283, 319` | `scripts/inspect-api-cost.mjs` |
| `drafts/PR-12-translation-prompt-template.md:173, 188` | `scripts/translate-handbook-chapter.mjs` |
| `specs/2026-06-15-automation-owner-ready.md:17, 24` | `scripts/sns-quality-check.mjs` |
| `specs/2026-06-15-automation-owner-ready.md:43` | `scripts/llm_share_of_model.py` |

いずれも「作る予定として書かれたが作られなかった」もの。仕様書側の記述なので消していない。

---

## 本番の壊れリンク（死コードではないが同時に見つかった）

`downloads/JLPT-N4-Free-Grammar-Slice.pdf` が本番で 404 を返す。
一方でこの PDF は `exam-prep.html` と blog 4 記事（`jft-basic-tokutei-ginou-guide` /
`jlpt-n5-study-roadmap` / `jlpt-textbooks-best-books` / `n4-grammar-hardest-points`）からリンクされている。

原因は `downloads/` が git 未追跡で、一度もコミットされていないため。
2026-07-22 に修正した `kana.html` / `exam-prep.html` の 404 と同じパターン。

リードマグネット（メール登録の誘因）が落ちているので、実害としては小さくない。
ファイル自体はローカルに存在するので、オーナーが `git add downloads/` してコミットすれば直る。

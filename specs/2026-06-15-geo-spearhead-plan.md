# NihongoHub GEO + Spearhead 実装計画（2026-06-15 着手）

オーナー承認バッチ（2026-06-15）の実装計画兼進捗トラッカー。
手戻り防止のため「設計をコードの実態に固定」してから着手する。本ファイルが作業のSoT。

## ゴール（一文）

英語圏のレッドオーシャン（Duolingo/Wagotabi 等）での正面戦を避け、需要が制度保証された
「インドネシア語 × 特定技能(SSW)就労準備 × 47県の生活情報」へスピアヘッドを尖らせ、
全コンテンツをAIに引用されやすい形（一次データ＋TL;DR＋honest比較＋エンティティ確立）へ
ビルド時に焼き込み、実利アフィリ＋無料リードマグネットで信頼と被引用を積む。

## 絶対制約（違反＝手戻り/事故。着手前に毎回確認）

1. Vercel関数は現在ちょうど12個（api/に13ファイル、`generate-batch.js`は`.vercelignore`で除外）。
   空き枠ゼロ。新規 `api/*.js` を追加すると全デプロイ凍結。
   → 5-4/5-6はAPI関数を増やさない。ビルド時スクリプト or 既存`api/count.js`へ相乗り。
2. デプロイは git push でなく作業ディレクトリから `npx vercel --prod --yes`（オーナー実行・オーナー承認ゲート）。
   私はgit commit/pushしない。編集はそのまま次回デプロイに反映される。
   → 訂正（2026-07-24 追記）: この項は 2026-07-22 に撤回。現行方式は git commit → push（Vercel の
     GitHub 連携で自動デプロイ）。`vercel --prod` による直接デプロイは禁止。直接デプロイ分が git に
     入らないまま後続の push 型デプロイに上書きされて消え、本番 404 の事故になった。
     「編集はそのまま次回デプロイに反映される」という前提も成立しない。commit しない限り反映されない。
3. GEO向けコンテンツ（3-3/3-4/3-6/3-8）はビルド時にHTMLへ焼き込む（`scripts/inject-*.mjs`方式）。
   ランタイムJS（blog-quiz.js）注入はAIクローラに見えないので不可。idempotentマーカーで囲む。
4. faceless厳守：人物/顔/声/実写自撮りなし。風景・データ・キャラのみ。
5. 捏造禁止：数値・統計はスクリプト/実データソースから。出せない数字は出さない。出典必須。
6. honest-AEO：自社最優先の目的は持つが手段は検証可能な事実のみ。宣伝口調・自賛は逆効果(AI引用-26%)。
7. モデルID（現行）：Haiku 4.5 `claude-haiku-4-5-20251001` / Sonnet 4.6 `claude-sonnet-4-6` /
   Opus 4.8 `claude-opus-4-8`（高度推論）。廃止ID禁止（月次grep監査）。
8. 月予算 $20 上限。3層キャッシュ前提。Workflow/一括生成のトークンも予算内に収める。
9. 太字(**)は成果物・応答とも不使用（強調は構造で）。説明・提示は日本語。
10. ローカル実機検証＝`node .secretary/projects/nihongohub/dev-server.mjs`（port 3031）。本番はクロスオリジンで操作不可。

## アーキテクチャ（確定）

- ビルド時注入（HTMLに焼く）＝`scripts/inject-*.mjs`。データ駆動・per-language・idempotentマーカー。
  既存例：`inject-glance-capsule.mjs`（`.lede`直後にカプセル）/`inject-hreflang.mjs`/`inject-section-chips.mjs`。
- per-pageの事実コンテンツ（県ごとに異なる一次データ・TL;DR・比較行）はJSONに持つ。
  生成はWorkflow（5-3、承認済）＋structured output（5-6）。ソースは実データ
  （`data/prefectures.json` / `data/pokefuta.js` / `explore-data.js` / `wildlife.html`＝GBIF）に限定（捏造防止）。
- アフィリURLは `blog/blog-quiz.js` の `AFF` 一括管理（既存）。承認後1行で点火。私はURLを勝手に入れない。
- 比較表(3-8)はキラーページ限定（全県には入れない）。honestな複数ツール比較＋NihongoHubの位置付け。

## 承認項目と実装設計

### 優先度1（キーストン）
- [~] 3-1 スピアヘッド：インドネシア語×SSW就労準備の専用導線。
  並行セッションと整合（重複回避）：競合分析`competitive-analysis-2026-06-15.md`、id最低賃金記事
  `blog/id/minimum-wage-japan-2025.html`(+en)、idドリル等は既存→ハブはそれらを束ねる統合ファネルに徹する。
  済(a)：`tokutei-ginou-id.html`をハブ化。追加＝「特定技能とは」TL;DR＋出典付き一次データ(MOFA/ISA/JFT公式リンク、
  可変数値は断定せず)＋統合ファネル4導線(最低賃金記事→id県別生活→練習→送金Wise)＋FAQPage(4Q,id)＋Organization(sameAs8)。
  クイズは維持、開始時はイントロを隠すJS追加。dev-server検証OK(JSON-LD妥当/ファネル実在/イントロ切替/バンク58問)。捏造ゼロ。
  残(b)index.htmlにidユーザー入口を1つ／(c)honest比較(3-8)。
- [ ] 3-2 実利ファネル：クイズ/RPG→県ページ→就労/移住/旅行アフィリのCVR計測を回す。
  `lib/funnel-server.js`＋`scripts/funnel-report.mjs`＋`blog-quiz.js`の`aff_*`beacon（既存）。新API追加なし。
- [ ] 3-3 一次データブロック：各記事冒頭付近に「数値＋出典」を1ブロック。
  新規`scripts/inject-evidence.mjs`。データ＝`data/geo-evidence.<lang>.json`（Workflow生成、実データ由来）。
- [ ] 3-4 TL;DR（40-60語の直接回答）：記事冒頭（H1直下）に質問→簡潔結論。
  3-3と同じ`inject-evidence.mjs`で同時注入（1スクリプトに集約＝関数増やさず・手戻り減）。

### 採用（優先度2-3）
- [~] 3-6 エンティティ確立：済＝index.html Organization+sameAs(8,TikTok追加)＋誤帰属否認文(既存)。
  inject-evidenceを汎用化し en ブログ全64ページ(47県＋17キラー/トピック)に BlogPosting+Organization(sameAs8)を付与、
  素Article(sameAs無)を置換、FAQPageと重ね掛け。検証OK・冪等。残＝Wikidataアイテム作成(オーナー実行)／locale(id等)。
- [x] 3-7 RPGナラティブ：`rpg.html`の県クエスト見出し直下に「47の実在県を巡る旅＋クエスト=実フレーズ(旅行/学習/就労)でクリア=学びと進行が一致」の1行。
  `prefectures.html`導入文(px_intro英語フォールバック)も「学んでクリア＝実フレーズ」に。既存の「One quest」h1/装備「grows as you learn」と整合。新機能なし(過大設計回避)。
- [x] 3-8 honest比較表：`study-japanese-in-japan.html`は既に「Which path fits you?」honest比較表(.ktable、語学学校/ワーク/短期/オンラインをGoGoNihon/italkiへ)＋FAQPage完備＝実装済(読んで確認、重複構築回避)。
  SSWハブ(tokutei-ginou-id.html)にも統合ファネル比較導線を追加済。残＝SNS用の表要約配信(任意)。
- [x] 3-10 無料リードマグネット：新規`sources/japan-starter-7-days.html`(無料7日スターター＝各日が既存無料資源
  クイズ/県別/キット/最低賃金/SSWハブ/RPGへ誘導＝統合ファネル、Day5でSSW、末尾にidスピアヘッド導線、印刷可)。
  `blog-quiz.js`のリードマグネットを更新＝ゲートなし直接リンク(オーナー方針=全無料)＋任意の週次購読(Substack、list-building)。
  配信はサイト側で確実(Substack依存解消)。dev-server検証OK(7日描画/全導線実在/aichiでLM新コピー)。構文OK。

### Claude Code 自動化（5-x）
- [ ] 5-1 モデル段階使い分け：ルーティン/Hook＝Haiku、生成＝Sonnet、多段/QA＝Opus。
  `.claude/rules/product.md`のモデル表にOpus 4.8追記＋使い分け方針を明記。
- [ ] 5-2 サブエージェント並列：コンテンツ生成/検証を並列化（本実装でも使用）。
- [ ] 5-3 Workflow（dynamic workflows、起動承認済）：県×言語のGEOデータ生成をパイプライン化。
  まず1県(aichi)で手動検証→スキーマ確定→fan-out（scout-then-pipeline）。
- [ ] 5-4 Hooks品質ゲート：SNS投稿前にボット臭/収益臭/議論性をHaikuで判定→NGで中断。
  API関数を増やさない（Hookはローカル/プロンプト評価）。Threads自動化は壊さない（下記落とし穴）。
- [ ] 5-5 scheduled-tasks：既存ルーティン群にGEO鮮度更新・計測を接続。新API不要。
- [ ] 5-6 Structured Outputs：LLM share-of-model監視とGEOデータ生成をJSONスキーマ固定で機械可読化。
- [x] 5-7 メモリ衛生：MEMORY.md索引を圧縮(27.2KB→22.5KB、上限24.4KB内)。全100ポインタ保持・リンク先不変・太字除去・冗長部をリンク先へ委譲。本研究の要点(spearhead/GEO playbook)も反映済。grep検証=bullet100一致。

### 落とし穴対応（オーナー指摘：Threads自動化を止めない）
- [ ] Threads運用はheadless/cronでブラウザMCP不可の制約があるが、現行の
  Buffer/`buffer_schedule.py`＋ブラウザMCP物理クリック経路を維持する。
  5-4のHookは「投稿内容の品質判定」だけを行い、投稿経路自体はブロックしない設計にする。

## 私が勝手にやらないこと（オーナーゲート）
- 本番デプロイ（`npx vercel --prod --yes`）：編集は出すが、デプロイ実行はオーナー承認。
- アフィリURLの投入（`blog-quiz.js` AFF）：承認連絡が来た分だけ。
- Wikidataアイテムの新規作成・外部アカウント作成：手順書を出し、実行はオーナー。
- Gumroad公開・課金トグル・法務サインオフ要の有料化。

## 実行フェーズ（手戻り防止の順序）
- [x] Phase 0：ground truth確定（コードベース所在・制約・既存注入パターン・blog-quiz.js）。
- [x] Phase 1：土台完了。本計画/決定記録(`notes/2026-06-15-decisions.md`)/メモリ反映2件+索引/
  5-1モデル表更新(`.claude/rules/product.md`にOpus4.8+段階方針)/5-7 MEMORY.md圧縮(22.5KB、100ポインタ保持)。
- [x] Phase 2：GEO注入インフラ実証＋en展開。`scripts/inject-evidence.mjs`新規（TL;DR＋出典付きpick＝3-3/3-4、
  BlogPosting＋Organization sameAs＝3-6）。aichiでdev-server視覚＋DOM＋JSON-LD検証OK、冪等性OK。
  en 42県へ展開（FAQ型）。index.html sameAsにTikTok追加（計8）。
  残＝summary=nullの5県(hokkaido/tokyo/kyoto/osaka/okinawa、既存Article持ち)はTL;DR・sameAs付きschema未付与→Phase 3で最優先。
- [~] Phase 3：5-3 Workflow着手。済＝null 5大県(hokkaido/tokyo/kyoto/osaka/okinawa)の要約をWorkflow(Haiku 5agent,
  structured output, 各ページ実コンテンツ由来)で生成→`data/geo-summaries-overlay.json`＋`scripts/apply-geo-summaries.mjs`
  に耐久保存→prefectures.jsonへ適用→inject-evidence再実行。inject-evidenceを「素Article→BlogPosting+sameAs昇格」に強化。
  結果：en全47県がTL;DR＋BlogPosting＋sameAs(8,TikTok含む)を保持、冪等性OK。
  済(id locale)：47県のid要約をWorkflow(Haiku2並列)生成→`data/geo-tldr.id.json`(aichi/mieは私が直訳補完)→
  inject-evidenceをlocale対応に拡張(evidenceBlockラベル可変/entityLd lang/Pass3)→id 42県(存在分)にid TL;DR(SINGKATNYA)＋
  BlogPosting(inLanguage:id)+sameAs。検証OK・冪等。5大県はid頁未作成でスキップ(overlayにid訳は用意済)。残＝es/th/zh(後回し)。
- [ ] Phase 4：3-6 orgスキーマ／3-8 honest比較／3-1 SSWハブ／3-4 TL;DR本適用。
- [ ] Phase 5：3-10無料リードマグネット再編／3-7 RPGコピー／3-2計測。
- [ ] Phase 6：5-4 Hook（Threads非破壊）／5-5/5-6接続。
- [ ] Phase 7：dev-server総検証→オーナーへデプロイ依頼。

## Decisions Made
- スピアヘッドをidxSSWへ（内部28agent＝需要適合律速＋外部市場＝英語圏飽和/Wagotabi先行 が収束）。
- GEOはビルド時HTML注入に固定（AIクローラ非JS前提）。
- 関数増やさない制約をHook/計測の設計前提に。
- 2026-06-15(別セッション・PDF/記事/競合トラック): 競合外部調査=`competitive-analysis-2026-06-15.md`。前提訂正=id最低賃金/UMR県別は競合薄でない(Kompas系Ohayo Jepang/cakap/izumi/Pocket Nihongoが先行)→id側は質的差別化勝負、英語の全47ランキングの方が隙間。JFT-BasicはJFT Guru/Gogakuが機能先行→機能量勝負せず統合ファネルで差別化。moat=「id×SSW×47県×統合ファネル×一次データ×GEO」の交点。追加成果(API関数増やさず・捏造ゼロ): 移住PDF Vol1-3安全修正+再ビルド+目視(QA=`_qa/pdf-qa-2026-06-15.md`)・県別最低賃金記事en+id(3-3/3-4実例, `data/min-wage-2025.json`+`scripts/build-minwage.mjs`+sitemap)・id JLPTドリルPDF N5/N4(`build_drill_pdf.py`をid UI対応, gumroad `-ID`)。最低賃金記事は薄い言語es/thにも展開(zhは飽和で除外、JLPTドリルはバンク不在で非展開)。2026-06-15 オーナー許可で本番デプロイ実行済(dpl_AXiXaQrTBYNyuDQX35qQnoq6Cb6g、www.nihongo-hub.com、673ファイル)=私の記事en/id/es/th＋並行セッションのGEO/ファネル作業を一括反映、主要ページ200確認。よって「全て未デプロイ」は解消。Gumroad差し替え/出品(ファイル+出品コピー準備済、実アップロードはAPI不可でオーナー操作)/アフィリURL(Wise等)は引き続きオーナー操作。

## Errors Encountered
- `data/prefectures.json` はトップレベルが`{prefectures:[...]}`（配列でない）→`.prefectures`参照に修正。
- 最重要5県(hokkaido/tokyo/kyoto/osaka/okinawa)のsummaryがnull→TL;DR/schemaをPhase 3に先送り（priority）。
- `inject-article-jsonld.mjs`(既存)はld+json有のページをスキップ。FAQ型県は素通り→inject-evidenceがBlogPosting付与。
  Article既存の数ページは重複回避でスキップ（sameAs無Articleのまま残存）。Phase 4でschema統一を検討。

## Status
済：en全47県 TL;DR/pick(3-3/3-4)。3-6＝en全64ページ(47県＋17キラー)にBlogPosting+sameAs＋index Org。3-1 SSWハブ化検証OK。3-8＝study-japanese-in-japanに既存(確認済)。
デプロイ＝2026-06-15オーナー許可で本番反映済(別セッション経由、www.nihongo-hub.com、dpl_AXiXaQrTBYNyuDQX35qQnoq6Cb6g)。以降のキラーページschema等は次回`npx vercel --prod --yes`分(オーナーゲート)。
済追加：3-10リードマグネット／5-7 MEMORY圧縮／3-7 RPGコピー／locale TL;DR 全4言語(id/es/th/zh、各約42県、計168ページ)。
全ブログコーパス約232ページがGEOスキーマ、県ページは5言語TL;DR。承認バッチの作業ツリー系は完了。
5-4/5-5は副作用回避のため「オーナー有効化用 準備物」を作成(`specs/2026-06-15-automation-owner-ready.md`)＝settings.json/cronは未変更。
本番デプロイ済(2026-06-15 オーナー指示、`dpl_7CcqM2YHdBYCWLhBysjZDjgDRJ35`、www.nihongo-hub.com、682ファイル、関数12でOK)。
主要ページ実取得で配信確認(aichi IN SHORT/BlogPosting、SSWハブ Jalur lengkap、7日スターター、id/es/zh TL;DR=全[200])。
残(オーナー作業)＝3-1(b)index id入口(152KB、未着手=未検証リスク回避)／3-2計測(運用)／5-4/5-5有効化／es-th-zh訳の軽微な粗の校正(任意)。
引き継ぎ＝`.secretary/knowledge/session-handoff-2026-06-15-geo-spearhead-execution.md`。
新規ファイル＝inject-evidence.mjs(汎用化)/apply-geo-summaries.mjs/geo-summaries-overlay.json。プレビュー＝`preview_start nihongohub-full`(3031)、スクショ不安定→DOM eval代替。

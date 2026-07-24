# NihongoHub ページ掣除（格下げ）設計書

作成 2026-06-26 / オーナー=福田真平 / SoT=このファイル

## 目的とスコープ

問題: ホーム(index)とSNS入口(prefectures)が、サイト全機能を同格に並べてフォークしており、冷たい来訪者が「最初の一歩」を選べず離脱している。根本原因は機能の数ではなく、入口ページの視覚的階層が無いこと。

今回やること: 各ページの「現状の主アクション」は変えず、競合する入口を (a) 折りたたみナビへ格下げ、(b) 進行後アンロックへ後段送り、する。集中導線の手本は既にサイト内にある onboarding.html（ヘッダ剥ぎ＋前進1本道）。これを prefectures と index に移植する。

今回やらないこと（保留）:
- 玄関の初手を「レベル診断」か「地図バトル」のどちらに統一するかの戦略判断。index→診断 / prefectures→バトル の現状のまま掃除する。矛盾は残すが、掃除後の初期離脱を計測してから決める。
- 機能そのものの削除。消すのではなく出す位置をずらすだけ。
- シャドーイング相手診断の新規実装（別途。置き場は「県制覇後アンロック」で確定、ナビには足さない）。

原則: 1ページ＝主アクション1つ＋副アクション最大1つ。残りは折りたたみナビか fold 下か進行後。

## 計測（実装の合否判定）

主指標は回遊と初期離脱。最低限ログを取る: prefectures 初回セッションの「県タップ到達率」「初回バトル到達率」、index の「主CTAクリック率」。掃除前の現値を1回スナップして before/after で見る。地図入口に劣る掃除はロールバック。

## ページ別プラン

### 1. prefectures.html（最優先 / SNS入口）
現状: 地図＋HUD6リンク(Where Next/Battle/Journey/Dashboard/Town/START FREE)＋県パネル内のアフィリ・wildlife・招待・クエスト が同レベルで同時発火。冷たい来訪者が6方向分岐。

- 残す: 地図（ヒーロー）＋一言ガイド「県をタップ → バトルで装備」＋県パネルの battle CTA。
- 折りたたみナビへ格下げ: HUDの Where Next / Journey / Dashboard / Town / START FREE（共通 site-chrome のメニューに寄せ、ヘッダに並べない）。HUDのカウンター(0/47, 0/188)は残してよい。
- 後段送り（1回バトル後にアンロック）: 県パネルのアフィリカード群、wildlife ランキング行、招待/VIPブロック、クエスト称号。冷たい来訪者に招待ボタンは無意味。
- 受け入れ条件: 初回ロード直後に見える「機能への入口」が、地図と battle CTA の実質2系統に収まる。

### 2. index.html（次点 / ホーム）
現状: ヒーロー「Find your level」直下に6枚「Start Here」グリッド（=全機能を同格カードで再掲）＋3枚価格＋ギフト＋ニュースレターで約22入口。

- 残す: ヒーロー主CTA「Find your level」＋副CTA「Discover the map」の2つだけを fold 上に。
- 後段送り（fold 下へ移動）: 6枚「Start Here」グリッドは「中で何ができるか」セクションとして下げる、または撤去。価格3枚・ギフト・ニュースレターも fold 下。
- 触らない: ヒーロー内のクイズデモ widget（主CTAを邪魔しない範囲なら可）。
- 受け入れ条件: fold 上の「別機能への誘導」が主1・副1のみ。

### 3. quiz.html
- 残す: 「New Question」＋課金モーダル(#limit-modal、30問/日→trial/lifetime)。課金ゲートは良いので維持。
- 格下げ: JS前の素ヘッダ11リンク直書きを掃除（site-chrome.js が後で差し替えるので、素の段階で11個並べない）。
- 触らない: レベル/トピックのピル（機能自身の操作であって競合機能ではない）。

### 4. dashboard.html
- 整理: quiz.html へ向かう4つの重複ボタンを「Train now」1つ＋「Review mistakes」1つに集約。
- 触らない: ランキング opt-in、sync/QR。

### 5. onboarding.html / rpg.html / exam-prep.html
- onboarding: 手本。触らない。
- rpg: 主「START BATTLE」＋副「EXPLORE MAP」で許容範囲。今回対象外。
- exam-prep: 今回対象外。ただし将来課題として記録: 課金導線が quiz=Stripe と exam-prep=Substack待機で割れている。CTA語彙の統一は別チケット。

## 横断の軽微項目
- JS前の素ヘッダが7ページでバラバラ（nav.nav と header.hud の2系統、リンク数も不一致）。素の段階を統一（空にして site-chrome.js に任せる、が単純）。FOUC対策。
- 共通ナビは3グループで常時約13行先を露出。今回は触らないが、グループの既定折りたたみを検討する将来課題。

## 実装順
1. prefectures 初回掣除（最大レバレッジ） → プレビューで確認 → before/after 計測準備。
2. index ヒーロー掣除（Start Here グリッド後段送り）。
3. 横断: 素ヘッダ統一 / dashboard 重複ボタン集約 / quiz 素ヘッダ掃除。
4. 本番デプロイは npx vercel --prod --yes（git push 禁止＝アフィリ巻き戻り）。オーナー承認後。

## 進捗

- 2026-06-26: 実装順1（prefectures 初回掣除）完了・ローカル検証済（本番未デプロイ）。
  - HUD: 静的6リンク→Battle 1本に削減（残り5本は実行時に site-chrome.js がドロップダウンへ畳むため FOUC 解消のみ）。
  - Traveler's Quest ブロックに `id=quest-block`＋`display:none`、`renderTitles()` で nh_titles≥1 のとき表示。初回来訪=地図＋ヒーローCTAのみ、初制覇後に Quest HQ アンロック。
  - 判断変更: 県パネル内のアフィリ/wildlife は「県タップ後」にしか出ず文脈的なので今回は触らず（収益導線を埋めすぎない原則）。
  - 検証: 称号0=非表示 / 称号1=表示・1/47、共通ナビ注入OK、本変更由来のコンソールエラーなし。

- 2026-06-26: 実装順2（index 掣除）完了・ローカル検証済（本番未デプロイ）。
  - hero 直下にあった「Start Here」6枚グリッド（`section.guide#guide`）を roadmap の後へ移動。元位置はコメントのプレースホルダ。
  - 結果のセクション順: hero → roadmap → guide → features → jlpt → culture → travel → pricing → newsletter。hero 直下は roadmap になり fold 上の同格フォークを解消。価格/ニュースレターは元から終盤=fold下のため追加移動不要。
  - hero の主CTA「Find your level」＋副CTA「Discover each region」は据え置き（既に主1＋副1）。
  - 検証: guide は1つ・6枚維持・roadmap の後、本変更由来のコンソールエラーなし。
  - 別件観測（スコープ外）: quiz/index でアフィリ widget（travelpayouts系）が "config is not valid"/"[tp] entrypoint init" をループ出力し、プレビューのスクショがハングするほどレンダラが回り続ける。実害（重さ）の可能性あり、別途調査候補。

- クイズ別件（2026-06-26、掣除とは別workstream）:
  - Undertale モード→「RETRO BATTLE」改名＋トグルの金パルス追加。
  - 実戦闘はコード正常（実API 3031 でキャッシュ/ライブ生成/採点すべて完動）、5599で動かないのは静的サーバにAPIが無いため。
  - 答え露出バグ修正: AI生成の問題文が下線対象に振り仮名を振る場合（`<u>前<rt>まえ</rt></u>` 等）、読み＝答えが露出していた。`hideTargetFurigana()` を追加し `<u>` 対象の内外の `<rt>/<rp>` を除去、描画2箇所（通常711/復習905）に適用。非対象の振り仮名は保持。検証=3パターン除去＋実UI8回で対象内rt常時0。本番にも効く実バグ修正。

- 2026-06-26: 実装順3（横断の軽微）一部実施・検証済（本番未デプロイ）。
  - quiz.html 素ヘッダ: 直書き11リンク→「← Home」1本のフォールバックに削減（site-chrome.js が実行時に共通ナビへ差し替え。検証=実行時に Learn/Explore/My Journey/Pricing 注入、静的は Home のみ）。
  - dashboard 重複ボタン集約: 見送り（対等な提案）。quiz.html へのボタンは別文脈のショートカット（ヒーロー主ペア／苦手語カードの「Drill these」／「What to do next」リスト）で真の重複でなく、進行後ページでは複数CTAが有益。集約は有用CTAを削るため現状維持。
  - 素ヘッダ統一（rpg/exam-prep/onboarding 等の他ページ）: FOUCのみの低価値のため未実施。必要なら別途。
- 2026-06-26: 過去問の答え露出は描画時 `hideTargetFurigana` で全パス無毒化済みを確認（quiz.html 711/905 のみが furigana＋下線対象を描画。onboarding バンク/index ヒーロー/prefectures バトルは露出形式なし、`data.reading` は指示文）。本番Supabaseの保存データ書き換えは正しさには不要（表示時に無毒化）。

- 2026-06-26: 本番デプロイ完了・検証済。`npx vercel --prod --yes`（リンク済み・CLI認証 6852islandecology-max・トークン不要）。dpl_74RiUr7bYX5BCVZkVH3e98XCreQ4 / Aliased www.nihongo-hub.com。本番HTMLで RETRO BATTLE・hideTargetFurigana 反映、UNDERTALE 表記消失、quizヘッダ削減、index グリッド後段送り を確認。掣除1-3＋クイズ修正が本番反映済み。

- 2026-06-26: アフィリ widget ループ調査 完了。発生源=Travelpayouts Drive（`tp-em.com/NTM3NDk5.js` marker537499、index/prefectures/blog）。本番コンソール実機確認（Chrome）で `entrypoint→emerald→link_switcher→bb→convert→monetization enabled` と1回ずつ正常初期化・エラーゼロ・ループなし。「config is not valid」はlocalhost限定（登録ドメイン不一致でtpの認証が失敗→リトライ）。本番実害なし＝修正不要。任意で localhost ゲートを足せば開発時ハングも消せる（低優先）。
- 2026-06-26 決定: 玄関の初手は「統一しない＝来訪意図に合わせる」。index（学習意図）=Find your level、prefectures（SNS/遊び意図）=地図バトル。各ドアが主アクション1つを持てば良く、掣除で既に実現済みのため追加変更なし。

## 保留・未決（次に決める）
- 玄関の初手統一: 解決済み（2026-06-26、上記「決定」参照＝統一せず意図に合わせる）。残る計測課題は各ドアの初期離脱を本番データで継続観察すること。
- シャドーイング相手診断の実装（県制覇後アンロックとして別途、軸=音域・速度・話題・語法）。

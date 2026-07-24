# シャドーイング相手診断 最小仕様

作成 2026-06-26 / オーナー=福田真平 / SoT=このファイル
発端=本セッション冒頭の「同性別・同年代のYouTuberを当てるアキネーター」案を、検証を経て再定義したもの。

## 目的と位置づけ

学習者に「自分が真似しやすい日本語YouTuber」を提示し、その人で Echo（シャドーイング）を即開始させる。
- ナビに足す新機能ではなく、県を初めて制覇した後にアンロックされる報酬導線（掣除の決定と整合）。
- 結果がシェア可能＝地図に次ぐSNS入口の候補にもなる。
- 「楽しい発見 → その場でシャドーイング開始」で Echo への送客を一直線にする。

## スコープ

やる（最小版）:
- 手選び 15〜30 チャンネルを手動タグ付けした静的データ（AI推定なし）。
- 4〜5 問の診断クイズ（中身は単純フィルタ＋スコア、ベイズ推論なし）。
- 結果 3〜5 件のカード＋「この人でシャドーイング開始」（Echo起動）＋シェア。
- 県制覇後アンロックのゲート。

やらない（再提案防止）:
- 年齢の推定・表示（検証不能＋不快リスク）。マッチは年齢でなく語法/フォーマル度で代替。
- 本物のアキネーター式ベイズ推論エンジン。
- 大規模チャンネルDBの自動収集（最小版が KPI を満たすまで作らない）。

## 名称

「Akinator」は商標のため固有名詞として使わない（RETRO BATTLE 改名と同じ方針）。
表示名の候補=「Shadowing Match（シャドーイング相手診断）」「Find your shadowing senpai」。内部キーは `shadow_match`。

## マッチ軸（合意済み4軸）

模倣しやすさの優先順:
1. 音域（実質=性別）: 自分のF0に近い声は真似やすい。M / F / either。
2. 速度: レベル適合の主軸。slow / medium / fast。
3. 話題: 継続動機。travel / food / gaming / daily-life / news / study など。
4. 語法・フォーマル度: casual（タメ口）/ neutral / polite（丁寧）。

補助（任意）: 標準語/方言フラグ（学習者は標準語優先）。

## データモデル（channel schema, 静的JSON）

```
{
  id, name, handle,                 // YouTube ハンドル
  thumb,                            // サムネ画像URL（CC/公式の範囲）
  voice: "M"|"F",                   // 音域
  speed: "slow"|"medium"|"fast",    // 速度
  topics: ["travel","food",...],    // 話題（複数可）
  register: "casual"|"neutral"|"polite",
  standard: true|false,             // 標準語か
  level: "beginner"|"intermediate"|"advanced", // 速度+語彙から付与
  sampleVideo,                      // 代表動画URL（Echo起動に渡す）
  why                               // シャドーイング向きの一言（自分の言葉）
}
```
seed=オーナー/秘書で手選び 15〜30 件を手動タグ。出典・チャンネルは公開リンクのみ参照（転載しない）。

## 診断クイズ（4〜5問・各回答が軸に写像）

- Q1 音域: 「自分の声に近いのは？」 高め(F) / 低め(M) / どちらでも
- Q2 速度: 「どれくらいの速さなら追える？」 ゆっくり / ふつう / 速くてOK（≒N5-4 / N3 / N2-1）
- Q3 話題: 「何の話を聞きたい？」 travel/food/gaming/daily/news/study（単一 or 複数）
- Q4 語法: 「どんな話し方を真似したい？」 タメ口 / ふつう / 丁寧
- Q5(任意): 「標準語だけがいい？」 はい / 方言もOK

## マッチング（スコア式・サーバ不要）

各チャンネルにユーザー回答との一致でスコア加点（重みは軸の優先順）:
`score = 3*voice一致 + 2*speed一致 + 1.5*topic重なり + 1*register一致 + 0.5*standard一致`
降順で上位3〜5件を返す。全部クライアントJS、API呼び出しゼロ。

## 結果カード

各チャンネル: サムネ＋名前＋「なぜ合うか」（一致軸を明示）＋
- 「この人でシャドーイング開始 →」= Echo を代表動画つきで起動。
- シェアボタン（結果カード画像）。
依存: Echo の deep-link 仕様（`?v=`/動画指定）を要確認。未対応なら Echo トップ遷移＋代表動画提示、もしくは Echo 側に動画指定パラメータを追加（別チケット）。

## 配置（アンロック）

- 県を初めて制覇（`nh_titles>=1`）でアンロック。prefectures の Quest HQ かダッシュボードに「🎙 シャドーイング相手を見つける」カードを出す（prefectures の quest-block と同じゲート流用）。
- 冷たい初回来訪の入口には出さない。

## 計測・kill 基準

- KPI: 診断完了率 / 結果→Echo起動率 / シェア率。
- before値が無い新機能なので、地図入口・通常Echo導線と比較。
- kill: 地図入口や既存Echo導線に明確に劣るなら畳む（最小版のまま判定）。

## 法務・コスト

- 公開YouTubeチャンネルへのリンクのみ（ホストしない）＝著作権問題なし。Echo の既存シャドーイング機構の範囲内。
- 年齢推定/表示なし＝プライバシー・不快リスク回避。
- コスト≒0（静的JSON＋クライアントフィルタ、API不要、月$20予算に影響なし）。

## 最小実装ステップ

1. seed チャンネル 15〜30 件を手選び＋手動タグ（オーナー/秘書）。← 着手の第一歩
2. `data/shadow-match.js`（チャンネル配列）＋診断UI（4-5問）＋スコア関数＋結果カード。
3. Echo deep-link 確認 →「シャドーイング開始」配線。
4. `nh_titles>=1` ゲートで Quest HQ にカード露出。
5. KPI 計測を仕込み、地図入口と比較。

## 進捗（2026-06-26 実装・ローカル検証済 / 本番未デプロイ）

- データ層 `data/shadow-match.js`: web調査で検証した14チャンネル（音域6M/8F・速度slow7/medium4/fast2・register/level混在・全標準語）。確信度 conf=high/medium、sample動画は確証4件のみ、曖昧handleはYouTube検索リンクにフォールバック。年齢は不使用。
- 診断ページ `shadow-match.html`: 5問→スコア式フィルタ（音域3>速度2>話題1.5>語法1>標準0.5、速度は隣接で部分点）→上位5件カード。各カードに「🎙 Shadow in Echo」（`shadowing-app-theta.vercel.app/?source=nihongohub&yt=<URL>`）＋「▶ Watch on YouTube」＋シェア。既存パレット/フォント/chrome準拠。
- エントリー: prefectures の Quest HQ（`nh_titles>=1` でアンロックされる quest-block）に「🎙 FIND MY PARTNER →」カードを追加。
- 検証: 5問描画→回答で有効化→ランク表示、(F/slow/easy/neutral/標準)で最上位=Comprehensible Japanese(4軸一致)・一致チップ強調、Echo/YT href 正、エントリーカードは title>=1 で表示。実装中の括弧不足(forEach簡潔アロー)バグを修正済み。
- 既知の限界(v0): (1)Echo の `yt=` deep-link を Echo が読むかは未確認＝最小版は「YouTube直リンク」を確実な動線として併設、Echo側対応は別チケット。(2)ページは英語のみ(6言語i18n未対応)。(3)チャンネルの速度/語法タグは medium 確信度を含む＝運用で微修正前提。

## 拡張（2026-06-26 PM、14→28チャンネル）

オーナー指摘「全パターンで別の適切なYouTuberが出た方が浅くない」を受け、324組vs14chでは一意化不可と確認のうえ、浅さの正体=「集中」と特定。薄い領域を埋める形で母数を拡張（飽和帯の追加はしない方針）。

- 2回のweb調査（裏取り）で14件追加→28（Yasu=速度不明とFNN=ニュース冗長を除外）。埋めた領域: 男性声、中速/速い native、food/travel/news/gaming/podcast、街頭/親子=複数話者。
- データ/UI更新: クイズ話題に News・Gaming 追加（6→8）。複数話者チャンネルは `voice:'mixed'`＝音域は部分点(1.5、専用単一声3より下)＋チップ "multi-voice"。
- 総当たり再測定（432組）の改善:
  - 1位になる別チャンネル数 9→22（活用率 64%→79%）
  - 上位5集中 77%→45%（最多 70/432=16%、旧 Teppei 21% より分散）
  - 無理筋マッチ 3%→1%、話題が1位を動かす 96%→100%
- 設計判断: スコアの人工的分散（未使用chの下駄履き）はしない＝品質低下で逆に浅くなる。母数拡張で正攻法に解いた。音域一致を最優先する重み付けは維持（専用単一声 > mixed）。

## UI改修v2（2026-06-26 PM、アキネーター型＋埋め込み）

オーナー要望で4点改修。`shadow-match.html` を全面書き換え（検証済・本番未デプロイ）:
- 1問ずつポップアップ表示（progress dots＋pop アニメ、自動前進、← back）→ 最後に結果。アキネーター体験。
- 結果は上位3枚に変更（旧5枚）。「合わなければ再診断」で複数回回ってもらう設計。
- 各おすすめを YouTube 埋め込み表示。段階フォールバック: videoId(sample)→特定動画 / UC channel ID→最新アップロード(`videoseries?list=UU…`) / どちらも無→リンク。ボタン文言も video=「Shadow with this video」/ channel=「Shadow this creator」と適応。
- 埋め込み下に「🎙 シャドーイング（Echoへ動画/チャンネルを渡す）」＋「📲 Share」、結果末尾に「↻ Answer again（再診断）」。
- 検証: 5問が1問ずつ進行→結果3枚、Miku=特定動画埋め込み/Toranomaki・Yuta=最新アップロード埋め込み/UC無=リンク、再診断で初期化。括弧/構文クリーン。
- データ拡張(進行中): バックグラウンド調査で新規〜12ch＋既存の UC channel ID/videoId を収集中（completon通知待ち）。マージで @handle 系チャンネルの埋め込みが点灯し、母数も増える予定。

## 拡張v2（2026-06-26 夜、UX刷新＋28→35＋埋め込み）

オーナー指示4点を実装:
1. 上位表示を3枚に（複数回回答を促す）。
2. おすすめは YouTube 埋め込み＋下に「Shadow with this video / this creator」＋シェア、最後に「↻ Answer again」。
3. アキネーター型: 1問ずつポップアップ表示（step-card がフェードで切替・進捗ドット）→最後に結果。
4. チャンネル増（バックグラウンド調査2回）。

データ整合（重要）: 埋め込みは「実物が映る」ので、YouTube oEmbed で全 videoId の author を照合。誤りを4件検出して排除した（comprehensible/easy-japanese=別チャンネルのID、Miku/Naoko の旧sample=別チャンネル動画）。daily-japanese-naoko は旧IDが別chに解決＝チャンネル特定不能のため削除。確認できた videoId のみ動画埋め込み、自前の信頼UC IDは最新アップロード埋め込み、どちらも無ければリンク表示。
結果: 35チャンネル（埋め込み内訳=特定動画28／チャンネル最新5／リンクのみ2）。新規=QuizKnock/中田大学/Mochi/Japan with Nao/sayuri's vlog/関西弁(方言,standard:false)/子ども向け教育/Ryuji料理。

分散の再測定（432組）: 1位になる別チャンネル 22→26、上位5集中 45%→40%、無理筋 1%→0%。14ch時(9/77%/3%)からの累計改善。
検証: 1問ずつ表示→3枚→動画/プレイリスト/リンクの3経路すべて正常描画、Shadow/Share/Answer-again 動作、もう一度で1問目に戻る。
2026-06-26 本番デプロイ済（dpl_A11SuagurtHdi1tsFh5uiEQFZxcx / www.nihongo-hub.com）。本番で shadow-match ページ・data(35ch)・prefectures の「FIND MY PARTNER」カードを確認。
2026-06-26 Echo deep-link 実装（「Shadow with this video」が動かない件の修正）: Echo(shadowing-app)は手入力からしか動画を読まず、URLパラメータ非対応だった。`src/main.js` の `bootstrap()` に「起動時 `?yt=<url>` / `?v=<id>` を読んで `loadYouTube()` 自動実行」を追加。さらに Service Worker(`sw.js`)が `/src/main.js` を固定VERSIONキャッシュで配信していたため、`VERSION` を v52→v53 に更新して新main.jsを配信。Echo を2回デプロイ（dpl_8MA7eP3Ve… → dpl_Es6PgPSjci…、shadowing-app-theta.vercel.app）。検証=Chromeで deep-link URL を開くと yt-url に対象ID注入→app-mode-player遷移→YouTubeプレイヤーiframe読込→エラーなし、を確認。ユーザーの初回は旧SW→新SW activate の client.navigate でクエリ保持のまま自動リロードされ自己修復。これで Echo `yt=` deep-link は「別チケット」から解決済みに。
2026-06-26 埋め込み不具合修正: 動画が表示されない＝サイトCSPの `frame-src` に YouTube が無く iframe が遮断されていた（全埋め込みに効く systemic 原因、per-video でない）。`vercel.json` の CSP frame-src に `https://www.youtube.com https://www.youtube-nocookie.com` を追加し再デプロイ（dpl_4LRManY61KQqz3nmEGvwL96TkpfE）。検証=CSPヘッダにyoutube反映＋Chromeで youtube iframe 挿入時にCSP違反が出ないことを確認。教訓: 埋め込みは iframe の src だけでなく「実描画（CSP/embed可否）」まで検証する。Echo の `yt=` deep-link 対応は引き続き別チケット（現状は確実な YouTube 埋め込み＋リンクで成立）。

## 動線＋シェア成長ループ（2026-06-26 夜・本番Live）
- 動線CTA: 結果の後に「⚡ Find your level（onboarding）」＋「🗾 Explore the map（prefectures）」を追加。SNS流入を Echo/YouTube へ逃さずNihongoHub本体へ引き込む。
- シェア成長ループ: シェアボタンが `shadow-match.html?m=<channelId>` を共有。受け手が開くと「サイト上に埋め込み動画つきの相手＋『自分も診断する』CTA」を表示（`renderSharedResult`）。YouTube直リンクでなく自サイト着地＝結果自慢がそのままサイト宣伝になる。検証=`?m=kimagure-cook`で埋め込み表示→start-quizで診断遷移、シェアURLにID付与、本番マーカー全True。
- SNS宣伝（水曜2026-07-01）: Threads勝ち型(リンクなし)2本をbank追加（自動キュー）＋宣伝キット `成果物/Marketing/NihongoHub/shadow-match-promo-2026-07-01.md`（Threads当日リンク投稿/Reddit価値先出し、手動・オーナー）。

## リスク（正直な自己開示）

- 本当のコストは機能でなく「タグ付きチャンネルDBの構築・維持」。ここを甘く見ると死ぬ。最小版で価値検証してから拡張する。
- 根本問題は母数不足であり、機能追加では客は増えない。これは「入口価値（シェア性）＋Echo送客」で測る前提。効かなければ畳む。

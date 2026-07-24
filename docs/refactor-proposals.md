# 提案（実装していないもの）

2026-07-24 のリファクタリングで、意図的に実装せず提案に留めた項目。
いずれも「承認なしに着手しない」と決めたもの。着手する場合は 1 項目ずつ、検証手段を用意してから。

---

## P-1  srs_reviews テーブルの廃止

現状: `.from("srs_reviews")` の呼び出しはコード全体でゼロ。このテーブルだけ RLS の記述が無い。
SRS の永続化はブラウザの localStorage（`nh_mistakes`）で完結している。

見送った理由: テーブルの DROP は本番データに触る操作で、コードと違って「消して困ったら戻す」が簡単ではない。

前提の制約: Vercel の関数枠が 12 で埋まっているため、`api/srs-due.js` のような新規エンドポイントを
足す形でのサーバ側 SRS 実装は現状できない。実装するなら既存エンドポイントへの相乗りになる。
つまり「将来サーバ側 SRS をやる」なら、テーブルを残すだけでは足りず設計から要る。

作業量: DROP と rollback の migration 2 本で 30 分。適用はオーナー作業。

---

## P-2  api レスポンス形状とステータスコードの統一

現状: レスポンスの形が 4 種類、「未設定」時のステータスコードが 5 種類（`docs/api-contract.md`）。

見送った理由: 既存のブラウザ側コードが個別の形に依存している。
たとえば `dashboard.html:721` は `{available:false}` を、`daily-coach` の呼び出し側は `{ok:false}` を見て分岐する。
統一するとフロント側 25 本の HTML を同時に直すことになり、しかもその大半が未コミット状態にある。

作業量: 中〜大。api 12 本 + 呼び出し側の洗い出し。段階的にやるなら
「新しい形を追加で返しつつ古いキーも残す」→ フロントを移行 → 古いキーを消す、の 3 段。

---

## P-3  Stripe のギフト判定を Price-ID 方式へ

現状: 「$5.00 USD ちょうどの一回払いで、アプリ由来の user_id / plan / client_reference_id が無い」
ものをギフトとみなす（`lib/billing-rules.js` の `isGiftPurchase`）。

これは仕様であって不具合ではない。Stripe の Payment Links 管理画面が metadata 欄を出さなくなった
ことへの回避策で、`PAY-IT-FORWARD-OWNER-STEPS.md:19-20` と webhook のコメント両方に自己警告がある。

いつ壊れるか: $5 の Stripe 商品を新しく作った瞬間、その購入がギフトと誤判定される。

作業量: 小。`STRIPE_PRICE_GIFT_X10` を環境変数に足し、`line_items[0].price` で判定する。
ただし Stripe の checkout.session.completed イベントには line_items が既定で含まれないので、
`stripe.checkout.sessions.listLineItems()` の追加呼び出しが要る。

---

## P-4  lib/ のディレクトリ分割

現状: サーバ用 12 本とブラウザ用 14 本が同一階層にある。
2026-07-24 に各ファイル先頭へ `[server]` / `[browser]` のタグを入れ、`lib/README.md` に一覧を作った。

見送った理由: ブラウザ用ファイルは HTML 320 本以上から `<script src>` で参照されている
（`lib/config.js` だけで 318 本）。移動すると全部書き換えになり、しかも対象 HTML の大半が未コミット。

やるなら: `lib/browser/` を作って旧パスからリダイレクトする手は使えない（静的配信なので）。
HTML 側の一括置換が必須。`scripts/build-guides.mjs` のテンプレートも同時に直す。

作業量: 大。かつ失敗すると全ページの JS が落ちる。

---

## P-5  ブログのビルド／注入パイプラインの完全実行

現状: `scripts/build-blog.mjs` に正しい順序を定義した（実行はしていない）。
`scripts/check-blog-integrity.mjs` で健全性を測れるようにした。
2026-07-24 に canonical の欠落 215 本だけは補完済み（`inject-seo-meta.mjs --dir=blog`）。

残っている欠落（`node scripts/check-blog-integrity.mjs` の実測）:
- `<!--blognav-->` が 320 本中 5 本にしか無い。42 県記事から TOC / 前後リンク / 関連リンクが消えている
- `<!--evidence-->`（TL;DR）が 47 本
- `pxrel` ブロックが 3 本で重複している（inject-blog-nav の旧バグの痕跡。スクリプト側は修正済み）

見送った理由: `build-guides.mjs` は `blog/<slug>.html` を全文上書きするため、
未コミットの手直しが入っている記事があれば消える。作業ツリーに 470 件以上の未コミット差分が
ある状態で全文再生成をかけるのは危険。

やるなら: 先にオーナーが blog/ をコミットして退避点を作る。そのうえで
`node scripts/build-blog.mjs --dry` → 差分確認 → 実行 → `check-blog-integrity.mjs` で計測。

---

## P-6  翻訳ページの canonical が英語版を指している 44 本

現状: `blog/{es,id,th,zh}/` 220 本のうち、176 本は自言語版を canonical にしている（正しい hreflang 構成）。
残り 44 本は英語原文を canonical にしている。これは 2026-07-24 より前からの状態で、git HEAD にも入っている。

何が起きるか: canonical が英語版を指すと、検索エンジンに「この翻訳ページは英語版の複製なので
英語版を索引せよ」と伝えることになる。翻訳ページ自体は検索結果に出なくなる。
5 言語展開が集客の柱であることを考えると、意図と食い違っている可能性が高い。

ただし断定はしない: 薄い翻訳を意図的に索引から外す判断もありうる。

確認方法: Google Search Console で該当 44 URL の「ユーザーが指定した正規 URL」と
インデックス状況を見る。索引されていなければ、この canonical が原因。

対象の抽出: `node scripts/check-blog-integrity.mjs --verbose` では出ない。
`blog/{es,id,th,zh}/` の canonical が `/blog/<slug>.html`（言語ディレクトリなし）を指すものが該当。

---

## P-7  Echo の課金 API へのレート制限

現状: レート制限があるのは `api/reconstruct-subtitles.js` だけで、しかも
`const rateMap = new Map()` というサーバレスインスタンスローカルの実装（同ファイル :62 が
「MVP 用。スケール時は Upstash Redis 等へ移行」と自認）なので実質機能しない。

無防備なもの:
- `api/asr-youtube.js` — Gemini 2.5 Flash を消費
- `api/transcribe.js` — OpenAI Whisper（従量課金）
- `api/yt-search.js` — YouTube Data API v3（1 日 100 件の無料枠）

さらに全 7 本が `Access-Control-Allow-Origin: *` を返す。これは Capacitor の WebView が
別オリジン（`appassets.androidplatform.net`）から叩く必要があるためで、`api/config.js:7-9` に理由がある。
安易に絞ると Android アプリが壊れる。

見送った理由: Echo は 2026-06-26 以降凍結で計測ゼロ・収益ゼロ。今のところ実害が出ていない。
NihongoHub と同じ Upstash を使えば実装自体は難しくない。

作業量: 小〜中。NihongoHub の `lib/ratelimit.js` と同じ形を移植する。

---

## P-8  Echo の src/main.js（2,055 行）の分割

現状: state（30 フィールドの単一ミュータブルオブジェクト）、YouTube 読み込み、ループ tick、
録音 UI、ブックマーク UI、ページ遷移、bootstrap が同居する。
`state.lastShowCc` と `state.lastReconstructInput` は宣言時の state リテラルに無く後から生える。

見送った理由: Echo には UI の自動テストが無い。分割の正しさを確認する手段が
「手で触る」しかない状態で 2,000 行を動かすのは割に合わない。

先にやるべきこと: `state` の形を JSDoc の `@typedef` で書き起こす。
型注釈だけなら挙動を変えずに、後から生えるフィールドを可視化できる。

---

## P-9  Android オーバーレイと src/ の統合

現状: `android/app/src/main/assets/echo-overlay/sidepanel/` に `auth.js` / `bookmarks.js` /
`recorder.js` / `supabase-client.js` / `video-bookmarks.js` / `sentence-reconstructor.js` の
移植版がある。`recorder.js` の先頭コメントが「PWA src/recorder.js から移植」と明記しており、
単なるコピーではなく別 UI 向けの移植で、既に細部が乖離している。

見送った理由: 統合先の UI（sidepanel）が PWA とは別物なので、共通化できるのは
ロジック部分だけ。しかも Android 側は実機でしか検証できない。

作業量: 大。実機（Android タブレット）と `adb logcat` が要る。

---

## P-10  インライン CSS / JS の外部化

現状の実測:
- ルート HTML 25 本: インライン JS 303KB、インライン CSS 138KB
- blog 320 本: インライン CSS 111KB
- 外部化されている CSS は `styles/*.css` 合計 21KB のみ

具体的な重複:
- `:root` の CSS 変数が 22 ファイルに複製。うち 6 本は完全同一文字列
- `--gold` の値が `#c8911f` 系と `#e0a634` 系に分岐したまま
- `.ktable` の 818 バイトブロックが blog 69 ファイルに完全同一で複製

見送った理由: CSP が `style-src 'self' 'unsafe-inline'` で、ページごとの読み込み順にも依存する。
対象 HTML の大半が未コミット。`--gold` の統一は見た目が変わるのでプロダクト判断が要る。

なお `escapeHtml` / `toast` / i18n の 3 点セットの統合は、`lib/i18n-core.js:1-7` が
「ページごとの辞書はインラインのまま置く、i18n-core には移さない」と設計として明記しているので、
重複だからという理由だけで統合してはならない。

---

## P-11  Echo の Cloze の日本語対応

現状: `src/cloze.js:43` のトークナイザが `/([A-Za-z]+(?:'[A-Za-z]+)?)|([^A-Za-z]+)/g` で英字専用。
`isBlankable` も `/^[A-Za-z]{3,}/` を要求し、採点用の `norm` も `[^a-z]` を除去する。
日本語字幕では空欄が 1 つも作れず、`startSession()` が
「この字幕からは空欄問題を作れませんでした」に落ちる。

判断できないこと: これが英語字幕動画向けの機能という設計意図なのか、
日本語対応が未実装なのか、コードとドキュメントのどちらからも読み取れなかった。

日本語対応が必要な場合: 形態素解析が要る。バンドラなしの方針と衝突する（辞書サイズ）。
軽い代替として「N-gram で助詞を避けて切る」「字幕に含まれる漢字語だけを空欄にする」などがあるが、
いずれも品質は落ちる。プロダクト判断が先。

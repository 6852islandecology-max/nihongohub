# PR-25 Japan Life Quiz Mode — Skeleton Spec

**起案日**: 2026-05-03
**起案者**: 秘書 (オーナー指示「日本クイズ拡張」を受けて)
**ステータス**: **architecture-decided (案 A 採択 2026-05-04)** — Phase C1 (5/17-) で実装着手
**優先度**: Phase C1 (PR-12 生活ハンドブック販売 6/14 と同時稼働を狙う)
**工数試算**: **6-8h (案 A)** + 2-4h (シードコンテンツ生成)
**アーキ確定**: **案 A** = 既存 `pregenerated_quiz` に `quiz_mode` カラム追加、最少変更、既存キャッシュ機構流用 (2026-05-04 オーナー判断)

---

## 1. Why Now (戦略整合性)

### オーナー指摘 (2026-05-03 21:30)
> 旅行者は数年後には在住外国人を目指し、JLPT を受けるかもしれません。対立構造ではなく、グラデーション。

### 市場根拠 (秘書側 2 件 WebSearch、2026-05-03)
- **JLPT 観光客受験**: 2025 年から運営が「観光ビザでの受験を禁止」← 観光客 → 受験者の流入が多すぎて運営が問題視 = **グラデーション実証**
- **日本リピート率**: 2025 年 Japan Brand Survey で 52.7% が再訪希望 (2024: 34.6% → 急上昇)、世界 1 位
- **JLPT 応募者規模**: 2024 年 1.72M 人 (世界、過去最多)

### 既存 NihongoHub 戦略との接続
- **PR-12 生活ハンドブック PDF** (6/14 販売開始): 在住者向け、¥1,480-1,980、旅行者は買わないと評価していたが、**「数年後在住予定の旅行者」も顧客層**
- **MK-1/2 アフィリ (Migaku/LingQ)**: 学習サービス向けだが、生活クイズなら **楽天トラベル / Klook / Booking** もアフィリ候補に
- **Marketing Trust Karma Funnel**: ブログ → クイズ → アフィリ + ハンドブック販売の自然導線

---

## 2. Scope (MVP 範囲)

### 採用する要素
- **新クイズモード `life`**: 既存 JLPT モードと UI 共有、レベル選択を「カテゴリ選択」に置換
- **5 カテゴリ × 5 言語**:
  1. **食 (food)**: 寿司ネタ名、ラーメン地域差、コンビニ商品、居酒屋オーダー
  2. **マナー (etiquette)**: 神社参拝、温泉、電車内、訪問先での靴
  3. **生活ルール (rules)**: ゴミ分別、自治会、賃貸契約、引っ越し届
  4. **歴史・地理 (history_geo)**: 47 都道府県、戦国時代、年号、伝統工芸
  5. **アニメ・ポップ文化 (popculture)**: ジャンル分類、声優概念、ジブリ、アイドル文化 — **著作権配慮: 固有名詞は概念説明として最小限、引用なし**
- **既存 LP 統合**: ヒーロー直下のレベル選択タブに「+ Japan Life Quiz」をもう 1 タブ追加 (or `/quiz/life` ルート別ページ案も検討)

### 採用しない要素 (再提案防止)
- **フル雑学クイズ統合**: コンテンツ法務リスク + プロダクト稀釈で却下、**カテゴリ 5 種固定** で運用
- **ライブ生成 only**: コスト管理の観点でプリ生成キャッシュ必須 (JLPT 同等 3 層モダンキャッシュ流用)
- **ユーザー投稿型**: モデレーション工数膨張、Phase D 以降に再判断

---

## 3. Architecture (3 案)

| 案 | データモデル | API | フロント | 工数 | 備考 |
|---|---|---|---|---|---|
| **🥇 案 A (推奨)** | 既存 `pregenerated_quiz` に `quiz_mode` カラム追加 ('jlpt' / 'life') | 既存 `/api/generate` に `mode` パラメータ追加 | 既存 UI に「カテゴリ」セレクタ追加 | 6-8h | 最少変更、既存キャッシュ機構そのまま流用 |
| 案 B | 新テーブル `pregenerated_life_quiz` | 新 `/api/generate-life` | 別タブ UI | 10-14h | 関心分離、ただし重複コード増 |
| 案 C | 別ページ `/quiz/life` で SPA 風に | API は B と同じ | 完全別 LP | 16-24h | SEO 上は最強、ただし PR-25 単体で過剰 |

**推奨: 案 A**。最小変更で grad 仮説を検証、ABテスト容易。Phase D で C 案に昇格判断する余地あり。

---

## 4. Data Model (案 A 採用時)

### Supabase migration (Phase C1 着手時実行)

```sql
ALTER TABLE pregenerated_quiz
  ADD COLUMN IF NOT EXISTS quiz_mode TEXT NOT NULL DEFAULT 'jlpt'
    CHECK (quiz_mode IN ('jlpt', 'life'));
ALTER TABLE pregenerated_quiz
  ADD COLUMN IF NOT EXISTS life_category TEXT
    CHECK (life_category IS NULL OR life_category IN
      ('food', 'etiquette', 'rules', 'history_geo', 'popculture'));

CREATE INDEX IF NOT EXISTS idx_pregenerated_quiz_mode_lang_cat
  ON pregenerated_quiz (quiz_mode, lang, life_category);
```

### `fetchCachedQuiz` 改修

```js
export async function fetchCachedQuiz({ mode = 'jlpt', level, lang, lifeCategory }) {
  const q = client.from("pregenerated_quiz").select("...").eq("lang", lang).eq("quiz_mode", mode);
  if (mode === 'jlpt') q.eq("level", level);
  if (mode === 'life' && lifeCategory) q.eq("life_category", lifeCategory);
  // ... rest unchanged
}
```

---

## 5. Prompt Design (案 A、`lib/anthropic.js` 拡張)

新関数 `buildLifeQuizPrompt(category, lang)`:
- 4 択 vocab_context 形式は流用 (UI/UX 互換)
- `STRICT RULE 7 NATURAL JAPANESE` も流用
- `STRICT RULE 11 explanation in ${langName}` 流用
- 追加: カテゴリ別の文化的真正性 + ファクト精度要件
- ハルシネーション対策: `culture_jlpt` で既に N3+ で運用、知見流用

カテゴリ別シード例:
- **food**: "<ruby>寿司<rt>すし</rt></ruby>で「<u>ガリ</u>」とは何のことですか？" → A: ショウガの甘酢漬け
- **etiquette**: "神社の手水舎で正しい作法は？" → A: 左手を清めてから右手、口をすすぐ
- **rules**: "東京 23 区で<u>燃えるゴミ</u>と一緒に出してよいものは？" → A: 紙くず
- **history_geo**: "「明治維新」は何年に始まりましたか？" → A: 1868 年
- **popculture**: "「OP」は何の略ですか？" → A: オープニングテーマ曲

---

## 6. Aff / Funnel 接続点

| カテゴリ | 説明セクション末尾の「もっと知る」誘導先 | アフィリ候補 |
|---|---|---|
| food | tabelog / ぐるなび 多言語版 / ローカルラーメンガイド | 楽天トラベル (グルメパッケージ) |
| etiquette | NihongoHub 内ブログ / japan-guide.com | (アフィリなし、信頼カルマ) |
| rules | **PR-12 ハンドブック PDF への直接 CTA** | NihongoHub 自社販売 |
| history_geo | §11 47 都道府県記事 (PR-11) / Wikipedia | Klook (歴史ツアー) |
| popculture | Crunchyroll / Anime News Network | Crunchyroll Affiliate |

---

## 7. Cost Estimate (Phase C1 着手前必須項目)

### 初期シード生成 (Phase C1 着手時 1 回)
- 5 カテゴリ × 5 言語 × 50 問 = 1,250 問
- Haiku 4.5 単価 約 $0.002/問 → **$2.50** (月予算 $20 内)
- 3 層モダンキャッシュ採用後: Layer 1+2 で 60-70% カバー

### 月次運用 (Phase D 以降)
- ライブ生成: 1 問 0.5-1¢ × 想定 1000 req/月 = $5-10
- 既存 JLPT 月次 $5-10 と合算で **$20 上限内**

### Stripe Adaptive Pricing 連動 (PR-12 ハンドブック販売)
- life カテゴリ rules で「もっと詳しい手続きガイド → ハンドブック」CTA を設置
- 想定 conversion: クイズ 100 完走 → ハンドブック CTA クリック 5% → 購入 10% = 0.5 件/100
- 月 1000 ユーザーで 5 件/月 = ¥7,400-9,900/月 (PR-12 主訴求)

---

## 8. 法務チェックリスト (バイブコーディング監査 #6 法務リスク)

- [ ] 著作権法: アニメ・マンガ固有名詞の引用は概念説明レベルに留める (例: 「OP = Opening」OK、特定作品セリフ NG)
- [ ] 行政書士法第 21 条: rules カテゴリで「個別助言」風表現を回避、「一般的な手続きフロー」のみ (PR-12 と同方針)
- [ ] 景品表示法: アフィリリンクには「PR」「Sponsored」表記
- [ ] PDPA / GDPR: 学習履歴 (PR-24 MVP の localStorage) は変更なし、追加収集なし
- [ ] 個人情報保護法: 同上
- [ ] 弁護士チェック必要可否: PR-12 弁護士相談 (NHL-1) スコープに本 PR-25 も含めて 1 回で済ませる

---

## 9. Phase Gate (Phase C1 着手判定)

- [ ] PR-12 弁護士チェック完了 (NHL-1)
- [ ] PR-21/PR-17/PR-23/PR-24 の Phase B 受入完了 (本日 2026-05-03 完了済)
- [ ] 250 問新プロンプト生成完了 + smoke test 25 パターン (本日 2026-05-03 進行中 / 明日 5/4)
- [ ] §11 47 都道府県記事 (PR-11) のシード 5 件以上 (誘導先準備、Marketing 部署と協調)
- [ ] Marketing 部署 MK-1 (アフィリ確認) 完了

---

## 10. Open Questions (オーナー判断状況)

1. **案 A vs 案 B vs 案 C** ✅ **2026-05-04 確定 = 案 A** (既存 `pregenerated_quiz` に `quiz_mode` カラム追加、6-8h)。Phase D で C 昇格判断は別途
2. **popculture カテゴリの著作権境界**: 「アニメジャンル名」は OK だが「特定作品」はどこまで? 弁護士相談時に同時確認推奨（NHL-1 知人弁護士ヒアリング項目に追加）
3. **生活ハンドブック CTA の出し方**: rules カテゴリ末尾だけ vs 全カテゴリ末尾 vs LP 別 CTA → ⏳ オーナー判断保留
4. **AB テスト設計**: 「JLPT のみ」群 vs 「JLPT + life」群で滞在時間 / Pro 転換率を比較する設計が必要 → ⏳ Phase Interview 5/24 完了後に確定
5. **Phase C1 起点**: 5/17 着手 (Phase C1 開始日) vs 6/1 (PR-12 ハンドブック完成後同時投入) → ⏳ v3 では 5/17 着手で Phase C1 期間に同時実装推奨

---

## 11. Next Step (本仕様書承認後)

1. オーナー本仕様書レビュー (案 A/B/C 選択 + Open Questions 5 件)
2. Phase C1 着手 (5/17 以降) で Architecture 決定 + 実装着手
3. PR-12 弁護士相談 (NHL-1) スコープに含める
4. Marketing 部署 MK-1/2/5/10 と協調 (誘導先 + アフィリ + ブログ)

# PR-12 ハンドブック AI 翻訳プロンプトテンプレ

**起案日**: 2026-05-16
**起案者**: 秘書
**ステータス**: ready-for-c1-execution（Phase C1 5/17-6/1 期間中に章別実行）
**仕様書**: `specs/PR-12-handbook-pdf-spec.md` §F1（5 言語 PDF 生成）
**目的**: Haiku 4.5 を使った en/ja → zh/es/th/id 翻訳を一貫品質で実行するためのプロンプト規格
**前提モデル**: `claude-haiku-4-5-20251001`

---

## 0. 言語別運用方針（決定 12 + 戦略反転 5 改訂 PR-19）

| 言語 | コード | 翻訳方針 | ネイティブチェック |
|---|---|---|---|
| 英語 | `en` | **執筆ベース言語の 1 つ**（PR-12 Ch1-3 は EN ベース） | 不要 |
| 日本語 | `ja` | **執筆ベース言語の 2 つ目**（PR-12 Ch4-7 は JA ベース、行政用語精度のため） | 不要（オーナー native） |
| 繁中 | `zh` | **3 言語ファースト**（Haiku 4.5 翻訳 + Phase D2 で人手 review） | Phase D2 後送り |
| インドネシア語 | `id` | **3 言語ファースト**（Haiku 4.5 翻訳 + Conyac review、PR-18 同便） | 5/13 → Phase D2 後送り（決定 12） |
| スペイン語 | `es` | **AI 翻訳のみ**（PR-19 で Phase D2 まで人手後送り） | Phase D2 後送り |
| タイ語 | `th` | **AI 翻訳のみ**（PR-19 で Phase D2 まで人手後送り） | Phase D2 後送り |

---

## 1. 章別 翻訳優先順位マトリックス

ベース言語と翻訳先の関係（5/17-6/1 Phase C1 期間で順次実行）:

| 章 | ベース言語 | 既存ドラフト | 翻訳先 4 言語 | 優先度 | 期限 |
|---|---|---|---|---|---|
| **Ch 1**: Before You Arrive | EN | `drafts/PR-12-handbook-ch1-2-en-v1.md` | ja / zh / es / th / id | P0 | 5/20 |
| **Ch 2**: First Week in Japan | EN | 同上 | ja / zh / es / th / id | P0 | 5/20 |
| **Ch 3**: Municipal Office | EN | `drafts/PR-12-handbook-ch3-municipal-office-en-v1.md` | ja / zh / es / th / id | P0 | 5/22 |
| **Ch 4**: 日常ルール (Daily Rules) | JA | `drafts/PR-12-handbook-ch4-7-ja-v1.md` Ch4 | en / zh / es / th / id | P0 | 5/24 |
| **Ch 5**: 在留更新 (Visa Renewal) | JA | 同 Ch5 | en / zh / es / th / id | **P0 (rules カテゴリ法務リスク高)** | 5/26 |
| **Ch 6**: 緊急時 (Emergency) | JA | 同 Ch6 | en / zh / es / th / id | P0 | 5/28 |
| **Ch 7**: 文化敬語 (Culture & Keigo) | JA | 同 Ch7 | en / zh / es / th / id | P1 | 5/30 |
| **Appendix A**: 自治体公式リンク集 | JA + EN | 未作成 | （ID のみ機械翻訳） | P2 | 6/1 |
| **Appendix B**: 多言語語彙集 200 語 | 表 | 未作成（用語抽出から） | 5 言語並記 | P1 | 6/1 |
| **Appendix C**: 行政書士・弁護士紹介先 | JA + EN | 未作成 | 5 言語 | P2 | 6/1 |

合計 7 章 + 3 Appendix を **2 週間で 5 言語化** = 35 翻訳タスク + 3 Appendix。Haiku 4.5 で 1 タスク 5-10K 出力 tok ≒ $0.025-0.05、合計 $1-2。

---

## 2. 翻訳プロンプト テンプレート（共通骨格）

以下のプロンプトを Haiku 4.5 に投げる。`{SOURCE_LANG}` `{TARGET_LANG}` `{CHAPTER_TITLE}` `{SOURCE_TEXT}` `{CATEGORY}` を実値置換。

```
You are a professional translator specializing in Japanese-related practical documentation
(visa procedures, municipal office paperwork, daily life rules) for foreign residents and
visitors of Japan. Translate the following Chapter from {SOURCE_LANG} to {TARGET_LANG}.

CONTEXT
- Document type: General educational handbook (NOT individual legal/visa advice)
- Audience: Foreign residents and visitors of Japan, JLPT N3-N5 level Japanese readers
- Publisher: NihongoHub (Japanese language learning SaaS)
- Format: PDF for sale at ¥1,480-1,980 (PPP-adjusted $5.99-14.99)
- Chapter title: {CHAPTER_TITLE}
- Category: {CATEGORY}  // one of: before-arrival / first-week / municipal-office / daily-rules / visa-renewal / emergency / culture-keigo

STRICT RULES (legal compliance, do not break)
RULE 1 GENERAL EDUCATIONAL TONE: Translate as general explanatory educational content.
   NEVER add individual advice like "in your case" or "for you specifically".
   Preserve existing general phrasing; do not specify individuals.
RULE 2 NO LEGAL ADVICE: Avoid prescriptive statements like "you must" or "you have to"
   for legal/visa/tax procedures. Use general descriptive language like "the typical flow is"
   or "in most cases, residents file...".
RULE 3 NO PROFESSIONAL ADVICE: Never imply this document substitutes for professional
   行政書士 (gyōseishoshi), 弁護士 (bengoshi), 税理士 (zeirishi) consultation.
   If the source mentions professional consultation, preserve that recommendation explicitly.
RULE 4 PRESERVE EXAMPLES AS FICTIONAL: Names like "山田太郎" must remain clearly fictional
   in the target language (e.g., "Yamada Tarō (fictional example)" in EN, "ฮามาดะ ทาโร่ (ตัวอย่างสมมุติ)" in TH).
RULE 5 TERMINOLOGY ACCURACY: For Japanese-specific terms (在留資格 / 住民票 / マイナンバー /
   印鑑登録 / 国民健康保険 / 国民年金 / 確定申告), include the original Japanese in parentheses
   at first occurrence, e.g., "Residence Status (在留資格)" or "Tarjeta de Mi Número (マイナンバーカード)".
RULE 6 PRESERVE STRUCTURE: Maintain headings, bullet lists, tables, callout boxes, and
   numbered steps exactly as in the source. Do NOT collapse or expand sections.
RULE 7 FORMAT MARKERS: Preserve Markdown formatting (#, ##, **, ```, |, etc.) exactly.
RULE 8 LINKS: Preserve all URLs verbatim. For Japan government sites (.go.jp), append
   the target-language note "[公式 Japanese only / official Japanese only]" if no
   target-language version exists.

LENGTH GUIDANCE
- Output should be 85-115% the length of the source (in characters/words)
- Languages with longer expressions (es, th) may run 110-115%
- Languages with denser scripts (zh, ja) may run 85-95%

OUTPUT FORMAT
Return ONLY the translated Markdown, no preamble, no commentary, no "Here is the translation:".

---

SOURCE TEXT ({SOURCE_LANG}):

{SOURCE_TEXT}
```

### 2.1 言語別の追加注意

#### 繁中 (`zh`)
- 用語は **台湾繁中** をデフォルト（香港繁中の差異が出る用語は両方併記、例: `居留資格 (台) / 居留身份 (港)`）
- 行政書士 = 「行政書士」のまま、補足で「日本特有的法律專業」を付与

#### インドネシア語 (`id`)
- 「日本」= "Jepang" 統一（"Negeri Matahari Terbit" 等の詩的表現は避ける）
- フォーマル度: **半フォーマル**（"Anda" 一貫、"kamu" 不使用）
- 外来語: 日本語固有用語はラテン字 ローマ字 + 括弧内インドネシア説明、例: "Zairyū Kādo (Kartu Izin Tinggal)"

#### スペイン語 (`es`)
- バリアント: **中南米スペイン語**（"ustedes" 複数 2 人称、"vosotros" 不使用）
- フォーマル度: **ustedeo**（「あなた」= "usted"、Brazilian-Portuguese 流ではない）
- カタカナ語: 「カード」= "tarjeta" 統一、英語 "card" 直訳禁止

#### タイ語 (`th`)
- フォーマル度: **書き言葉の中フォーマル**（"ท่าน" は王族/僧侶のみ、"คุณ" デフォルト）
- 外来語: 日本固有用語は **音写 + 括弧説明**、例: "ไซริว การ์ด (บัตรอนุญาตพำนัก)"
- 数字: アラビア数字 (0-9) 使用、タイ数字 (๐-๙) は使わない

---

## 3. 章固有プロンプト追記（章別に上記テンプレに追加する制約）

### Ch 5: 在留更新 (Visa Renewal) — 法務リスク最高

上記 STRICT RULES に加えて:

```
CHAPTER-SPECIFIC RULE: This chapter covers visa renewal procedures and is the highest legal
risk section. You MUST:
- Translate any phrase that sounds like prescription (例: "あなたは X 月前に申請する必要がある")
  into descriptive general statement (例: "一般的に、X 月前から申請が受け付けられる" /
  "In general, applications are accepted from X months in advance")
- For specific paperwork forms or fees, append "(actual requirements may vary by case;
  consult a gyōseishoshi or your nearest immigration office)" in the target language at
  first occurrence
- Preserve all 行政書士法第 21 条 配慮 phrasing from the source
```

### Ch 3: Municipal Office — 自治体差分大

```
CHAPTER-SPECIFIC RULE: Procedures vary by municipality. You MUST:
- Translate prescriptive statements ("Bring document X") into permissive general statements
  ("In most municipalities, document X is requested")
- When source mentions specific municipality (e.g., 新宿区), preserve the original name and
  add a clarifier "(Shinjuku Ward; other municipalities may differ)"
```

### Appendix A: 自治体公式リンク集

```
CHAPTER-SPECIFIC RULE: This is a link directory only.
- DO NOT translate URLs
- Add per-link annotation "[Japanese only]" if no foreign-language version of the linked
  page exists (verify via the URL pattern: .go.jp/en/ for English, .go.jp/zh-cn/ for
  simplified Chinese, etc.)
- Translate municipality names to Hepburn romaji for non-CJK languages
```

---

## 4. 実行コマンド（5/17-6/1 期間中、章別に実行）

### 4.1 単章翻訳（手動 1 章 × 1 言語）

```bash
# 環境変数
export ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" .env | cut -d'=' -f2- | tr -d '"')

# 翻訳実行例: Ch1 (EN base) → zh (繁中)
node scripts/translate-handbook-chapter.mjs \
  --source-file drafts/PR-12-handbook-ch1-2-en-v1.md \
  --source-lang en \
  --target-lang zh \
  --chapter-title "Before You Arrive" \
  --category before-arrival \
  > drafts/PR-12-handbook-ch1-zh-v1.md
```

### 4.2 章 × 4 言語 batch（推奨、5/20 Ch1-2 完了等）

```bash
# 5/17 朝に scripts/translate-handbook-chapter.mjs を実装後に動く
# Ch1-2 EN → zh/es/th/id 4 言語並列
for target in zh es th id; do
  node scripts/translate-handbook-chapter.mjs \
    --source-file drafts/PR-12-handbook-ch1-2-en-v1.md \
    --source-lang en \
    --target-lang $target \
    --chapter-title "Before You Arrive + First Week" \
    --category before-arrival \
    > drafts/PR-12-handbook-ch1-2-${target}-v1.md
  echo "Done: ${target}"
done
```

### 4.3 全章 × 全言語 (35 タスク)

```bash
# 5/30 Ch7 完了時の最終一括（既存日本語版 → 英語反転含む）
bash scripts/translate-handbook-all.sh
# 想定所要: 35 タスク × 30 sec = 17 分、$1-2
```

> **注**: `scripts/translate-handbook-chapter.mjs` 本体は Phase C1 着手日 5/17 朝に実装予定（仕様: §2 プロンプトテンプレを Haiku 4.5 に投げる単純ラッパ、~50 行）。

---

## 5. grep 受入基準（翻訳出力に対する自動検査）

各翻訳 .md 出力に対して以下を自動 grep。1 件でもヒットしたら NHL-2 弁護士審査前に手修正必須。

### 5.1 法務リスク NG ワード（最優先）

```bash
# 個別助言型の禁止フレーズ（en/es/zh/th/id 並列、章別実行時に grep）
NG_EN="(in your case|you must|you have to|you are required to)"
NG_ES="(en tu caso|debes|tienes que|es obligatorio para ti)"
NG_ZH="(您必須|你必须|您的情況|你的情況)"
NG_TH="(คุณต้อง|ในกรณีของคุณ)"
NG_ID="(Anda harus|dalam kasus Anda|Anda wajib)"
```

検出時の対応: 「在留資格更新の場合、一般的に X 月前から〜」型の **般化表現に書き換え**。手動 grep & 修正、各章 5-10 分。

### 5.2 著作権 NG ワード

```bash
# 商標・固有名詞の混入チェック
NG_TRADEMARK="(Nintendo|Sony|Toyota|Honda|McDonald|7-Eleven|FamilyMart|Lawson)"
# Conbini は「conbini stores in general」レベル表現は OK、固有チェーン名は NG
```

### 5.3 構造保全チェック

```bash
# 翻訳前後で Markdown 見出し数が一致するか
SOURCE_H2=$(grep -c "^## " source.md)
TARGET_H2=$(grep -c "^## " target.md)
test "$SOURCE_H2" = "$TARGET_H2" || echo "WARN: heading count mismatch"
```

### 5.4 翻訳品質スポットチェック（5/30 まで実施）

各章の最初 200 字 + 最後 200 字を秘書で目視チェック:
- 日本語固有用語の括弧内原語併記が機能しているか
- 数字・URL・架空名（山田太郎）が改変されていないか
- 段落構造が崩れていないか

---

## 6. 期限超過時の縮退方針

| 縮退レベル | 対応 |
|---|---|
| **A**: 5/30 までに 7 章 × 5 言語完成 | 計画通り |
| **B**: 5/30 までに Ch1-5 × 5 言語のみ完成 | Ch6-7 を Phase D1 (8/15) 後送り、6/14 販売は Ch1-5 のみで開始 |
| **C**: 5/30 までに Ch1-3 × 3 言語ファースト (en/zh/id) のみ | スペイン・タイは Phase D2 (10/22) 後送り、6/14 販売は 3 言語 ×Ch1-5 |
| **D**: 6/1 までに Ch1 × 3 言語のみ | 6/14 販売を 6/30 延期、Phase C1 終了判定要再協議 |

---

## 7. 関連ドキュメント

- PR-12 仕様書: [`specs/PR-12-handbook-pdf-spec.md`](../specs/PR-12-handbook-pdf-spec.md)
- 既存 EN ドラフト Ch1-2: [`drafts/PR-12-handbook-ch1-2-en-v1.md`](./PR-12-handbook-ch1-2-en-v1.md)
- 既存 EN ドラフト Ch3: [`drafts/PR-12-handbook-ch3-municipal-office-en-v1.md`](./PR-12-handbook-ch3-municipal-office-en-v1.md)
- 既存 JA ドラフト Ch4-7: [`drafts/PR-12-handbook-ch4-7-ja-v1.md`](./PR-12-handbook-ch4-7-ja-v1.md)
- インドネシア語ネイティブチェック手配: [`admin/correspondence/2026-05-04-indonesian-native-check-research.md`](../../../admin/correspondence/2026-05-04-indonesian-native-check-research.md)
- 戦略反転 PR-19 (3 言語ファースト): `strategic-review-2026-04-30.md` §3.4
- 行政書士法 NHL-1 ヒアリング項目: [`admin/forms/business-legal/NHL-1-lawyer-candidates.md`](../../../admin/forms/business-legal/NHL-1-lawyer-candidates.md)

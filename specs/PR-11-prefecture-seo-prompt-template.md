# PR-11 47 都道府県 SEO 記事自動生成 プロンプトテンプレート

**起案日**: 2026-05-04
**起案者**: 秘書
**ステータス**: spec-v1（Phase C2 着手 6/15 予定、batch 生成 235 記事 = 47 都道府県 × 5 言語）
**期限**: 2026-05-27（v3 ロードマップ）
**所要**: 4-6h（仕様）+ 4-8h（実装 + シード生成）+ 12-20h（人手レビュー全体、Phase C2 期間分散）
**関連 PR**: PR-25 (life mode の history_geo / food カテゴリと相互リンク) + PR-12 (ハンドブック Appendix A 自治体リンク連動) + MK-16 (アフィリ動線一元化)

---

## 0. 目的

NihongoHub 集客の主要 SEO 資産として **47 都道府県 × 5 言語 = 235 記事**を Haiku 4.5 で自動生成。

- **検索キーワード狙い**: 「Hokkaido travel guide」「青森 観光」「Bali ke Tokyo」等のロングテール
- **集客ファネル**: SEO 流入 → 47 都道府県記事 → アフィリ動線一元化（MK-16）でクロスセル
- **ペルソナ整合**: 「47 都道府県を回った Ikimono Hakase Family（生き物博士の家族、3 人家族）」(C 採択家族版、2026-05-05 リブランド) の **子連れ旅 × 地域 × 文化** の三題噺を各記事に反映、生き物要素は子の発見トリガとして組み込み
- **Trust Karma Funnel** 整合: 旅行アフィリ直貼り禁止、必ず NihongoHub 内記事で完結

---

## 1. アーキテクチャ概要

### 1.1 データフロー

```
[manual seed file: prefectures.yaml (47 県メタ)]
   ↓ batch script `scripts/generate-prefecture-articles.mjs`
[for each prefecture × lang × version]
   ↓ buildPrefecturePrompt()
[Anthropic Haiku 4.5 + Prompt Caching]
   ↓ JSON response
[validateArticleSchema() + LLM-judge quality check]
   ↓ 通過
[Supabase: prefecture_articles テーブル INSERT]
   ↓
[Vercel ISR: /[lang]/prefectures/[slug] パス]
   ↓
[公開ページ + Google Maps Embed + Instagram oEmbed + 内部リンク]
```

### 1.2 コスト試算

- 1 記事 = 入力 ~3,000 tok + 出力 ~2,000 tok ≈ $0.013/article (Haiku 4.5)
- 235 記事 × $0.013 = **$3.06**
- Prompt Caching 有効化で 60-70% カバー → 実コスト **$1.0-1.5**
- 月予算 $40 上限内 (Phase B+ 監視 §1.2)

---

## 2. データモデル

### 2.1 `prefectures.yaml`（47 県メタ、手動メンテ）

```yaml
# scripts/data/prefectures.yaml
prefectures:
  - id: 01
    slug: hokkaido
    name_ja: 北海道
    name_en: Hokkaido
    name_zh_tw: 北海道
    name_es: Hokkaidō
    name_th: ฮอกไกโด
    name_id: Hokkaido
    region: hokkaido
    capital: sapporo
    capital_lat: 43.0642
    capital_lng: 141.3469
    population: 5_182_000
    area_km2: 83_450
    visited_by_creator: true       # 「47 都道府県を回った Ikimono Hakase Family」訪問記録
    visit_year_first: 2018
    visit_year_recent: 2024
    creator_field_notes: |
      Family trip to Daisetsuzan in 2018 (our child found a beetle in the forest),
      swan-watching at Lake Akan in 2024 with our kid asking endless questions.
      Family-friendly spots: kid-safe trails, family onsen, gentle hikes.
      Specialty foods to mention: jingisukan, ikura don, soup curry, miso ramen.
      Cultural distinctness: Ainu traditions still live in eastern Hokkaido,
      especially around Akan, Shiraoi (Upopoy), and Asahikawa.
    flagship_spots:
      - id: akan-ko
        name_en: Lake Akan
        name_ja: 阿寒湖
        category: nature
        lat: 43.4527
        lng: 144.0926
      - id: sapporo-station
        name_en: Sapporo Station
        category: city
      - id: shiraoi-upopoy
        name_en: Upopoy National Ainu Museum
        category: culture
    affiliate_priority:
      - jr_pass        # JR Hokkaido は Pass 範囲外もあるが集約
      - klook_tours
      - rakuten_travel
  - id: 02
    slug: aomori
    # ... (47 件、合計 ~600 行 YAML)
```

`scripts/data/prefectures.yaml` を手動でメンテし、生成毎にインプット。`creator_field_notes` フィールドは「47 都道府県を回った Ikimono Hakase Family」訪問記録（既訪県、家族エピソード + 子の発見）or 文献ベース（未訪県）を区別する。

### 2.2 Supabase テーブル

```sql
CREATE TABLE IF NOT EXISTS prefecture_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefecture_id TEXT NOT NULL,         -- '01' = 北海道, '47' = 沖縄
  prefecture_slug TEXT NOT NULL,       -- 'hokkaido', 'aomori', ...
  lang TEXT NOT NULL CHECK (lang IN ('en','zh','es','th','id')),
  version INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  body_md TEXT NOT NULL,
  flagship_spots JSONB NOT NULL,       -- [{name, lat, lng, gmap_embed_url}, ...]
  cover_image_url TEXT,
  affiliate_routing JSONB NOT NULL,    -- アフィリ転送マップ (lang 別)
  related_articles JSONB,              -- 内部リンクの自動生成
  llm_quality_score NUMERIC(3,2),      -- LLM-judge 0.00-1.00
  human_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  human_reviewer TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prefecture_id, lang, version)
);

CREATE INDEX idx_pref_articles_lang_pub ON prefecture_articles (lang, published_at DESC);
CREATE INDEX idx_pref_articles_slug_lang ON prefecture_articles (prefecture_slug, lang);
```

---

## 3. プロンプトテンプレート（核心）

### 3.1 `buildPrefecturePrompt(prefMeta, lang)` 関数仕様

`lib/anthropic.js` に新関数追加:

```js
const LANG_NAMES = {
  en: 'English',
  zh: '繁體中文 (Traditional Chinese)',
  es: 'Español',
  th: 'ภาษาไทย (Thai)',
  id: 'Bahasa Indonesia',
};

const LANG_AUDIENCE_NOTES = {
  en: 'English-speaking travelers from US, UK, Australia, Canada, and global English readers. Mid-range budget travelers. Often first or second visit to Japan.',
  zh: '台灣、香港、新加坡、馬來西亞華人讀者。重複訪日比例高（年 2-3 回）、地方深掘興趣強い。',
  es: 'Lectores hispanohablantes de Latinoamérica y España. Primera o segunda visita a Japón. Presupuesto medio.',
  th: 'นักเดินทางชาวไทย ส่วนมากเดินทางครั้งแรกหรือครั้งที่สอง มาญี่ปุ่น',
  id: 'Pembaca Indonesia, kelas menengah, sering Working Holiday atau studi, repeat visitors.',
};

export function buildPrefecturePrompt(prefMeta, lang) {
  const langName = LANG_NAMES[lang];
  const audienceNote = LANG_AUDIENCE_NOTES[lang];
  const visitedBy = prefMeta.visited_by_creator
    ? `The creators ("Ikimono Hakase Family" — a Japanese family of three who has visited all 47 prefectures together with our child) have personally been to ${prefMeta.name_en}. Family field notes: ${prefMeta.creator_field_notes}`
    : `The Ikimono Hakase Family has not yet personally visited ${prefMeta.name_en} as a family. Write from well-researched sources, attribute claims, and AVOID inventing personal family anecdotes.`;

  return `You are writing a single ${langName} article about Japan's ${prefMeta.name_en} prefecture for NihongoHub, a Japanese-language and travel content site.

# AUDIENCE
${audienceNote}

# AUTHENTICITY CONSTRAINT (CRITICAL)
${visitedBy}

# PERSONA (use first-person plural "we / our family" — ANONYMOUS family handle)
- The authors are **"Ikimono Hakase Family"** — a Japanese family of three (father, mother, one child) who has visited all 47 prefectures together with our child.
- Father is an animal-behaviour enthusiast (handle: "Ikimono Hakase"). Mother and child contribute their own observations and discoveries.
- DO NOT use any specific real name (no first/last name of any family member). Refer as "we" / "our family" / "the author" without specifying further.
- DO NOT mention any specific Japanese university affiliation, ORCID, or academic IDs.
- DO NOT include any specifying information about the child (no name, no exact age, no gender, no school name, no home address). Only "our child" / "our kid" is allowed; age band ("preschooler" / "young elementary kid") may be used sparingly only when contextually necessary.
- DO NOT include any photos of family faces (only landscape, back-silhouette, or environment shots).
- The voice combines: "local family with kid-friendly travel mileage" + "father's nature-observation knack" + "child's unfiltered discoveries". Three-themed framing: **kid-friendly travel × local geography × culture**, with nature/biology elements appearing as "what our kid spotted" triggers (NOT as a single-author specimen log).

# ARTICLE SCHEMA (output JSON exactly)
{
  "title": "string, 50-70 chars in ${langName}, includes prefecture name, no clickbait",
  "meta_description": "string, 140-160 chars in ${langName}, summary for Google search snippet",
  "body_md": "string, 1200-1800 words in ${langName}, Markdown formatted",
  "flagship_spots": [
    {
      "spot_id": "matches one of: ${prefMeta.flagship_spots.map(s => s.id).join(', ')}",
      "headline": "string, ${langName}, 60-100 chars",
      "summary": "string, ${langName}, 150-250 chars",
      "why_visit": "string, ${langName}, 200-300 chars"
    }
  ],
  "internal_links": [
    {
      "anchor_text": "${langName} text, link to NihongoHub-internal article",
      "target_slug": "another-prefecture-slug or 'jlpt-quiz' or 'living-handbook'"
    }
  ],
  "language_phrase": {
    "phrase_ja": "Japanese phrase relevant to this prefecture (regional dialect or food/culture term)",
    "reading": "<ruby>...<rt>...</rt></ruby> if N3+ kanji",
    "explanation": "${langName} explanation, 80-120 words, why this phrase matters in this prefecture"
  }
}

# CONTENT REQUIREMENTS
1. Title and meta_description: write in ${langName}, optimized for SEO (include "${prefMeta.name_en}", "Japan", "travel" or "guide").
2. body_md structure (mandatory):
   ## Section 1 — Why ${prefMeta.name_en} matters (200-250 words)
     - One specific reason this prefecture is worth visiting that's NOT in every guidebook
     - Include one concrete sensory detail (sound, smell, texture, color)
   ## Section 2 — Three flagship spots (400-600 words)
     - Cover EXACTLY the 3 spots from prefMeta.flagship_spots
     - Each spot: 1-2 paragraphs, with a specific moment to look for
     - For each spot, embed the Google Maps URL placeholder: [GMAP_EMBED:spot_id]
   ## Section 3 — A local language note (200-300 words)
     - One word or phrase from the prefecture's dialect or food culture
     - Why this particular phrase reveals something about the place
     - Output the phrase in the language_phrase JSON field above (don't duplicate in body)
   ## Section 4 — Practical info (200-250 words)
     - Best season to visit
     - Approximate cost range for 2-3 days (in ${langName} currency where reasonable)
     - One transportation tip that saves time
     - Link to the official prefecture tourism site (placeholder: [OFFICIAL_TOURISM])
   ## Section 5 — Where to next (100-150 words)
     - 2-3 internal NihongoHub links (other prefectures, JLPT quiz, living handbook)
     - One sentence inviting the reader to subscribe to "47 Notes from Japan" Substack

3. Tone:
   - Avoid em-dash reveals ("the truth is — X"). Use simple sentences.
   - Avoid words like "stunning", "breathtaking", "must-see". Show, don't sell.
   - Avoid clickbait formulations ("You won't believe what's in Aomori").
   - Use specific verbs and nouns: "Lake Akan steams in winter" beats "Lake Akan is beautiful".

4. NO HALLUCINATIONS:
   - If you don't know whether a fact is true, omit it.
   - Specific train fares, hotel prices, restaurant names: ONLY use widely-known landmarks.
   - Population and area facts: use the prefMeta data exactly.

# AFFILIATE ROUTING (NEVER DIRECT-LINK)
- Travel affiliate links (JR Pass / Klook / Viator / Rakuten Travel) MUST go through NihongoHub's internal redirect, not directly.
- The affiliate routing map is generated separately; for body_md, use placeholder format: [AFF:rakuten_travel:hokkaido] etc.
- DO NOT inline affiliate URLs in this output.

# OUTPUT
Output VALID JSON ONLY, no surrounding prose. Match the schema exactly.`;
}
```

### 3.2 出力例（英語、Hokkaido、800 words 冒頭部分）

```json
{
  "title": "Hokkaido travel guide: a Japanese family's notes from Japan's wildest prefecture",
  "meta_description": "From swans on Lake Akan to soup curry in Sapporo, a Japanese family of three's guide to Hokkaido—what the seasons feel like, what to eat with your kid, and where to slow down.",
  "body_md": "## Why Hokkaido matters\n\nMost guides to Hokkaido start with the snow festival. We'd start with the air. Step off the plane in Chitose in late October and the first thing you notice is that the sky has a different *thickness*—drier, with a faint smell of old leaves. Hokkaido sits far enough north that its weather has more in common with Vladivostok than Tokyo, and our kid felt that the moment we arrived...\n\n## Three flagship spots\n\n### Lake Akan ([GMAP_EMBED:akan-ko])\n\nWe first went to Akan in February 2024 with our child to see red-crowned cranes, and ended up staying three extra days because of a snowstorm. Our kid was fascinated by the marimo algae balls in the museum...\n\n### Sapporo ([GMAP_EMBED:sapporo-station])\n\nSapporo is the easiest entry point to Hokkaido as a family. Our kid loved the Sapporo TV Tower, but the real Hokkaido is everywhere else—Sapporo is to Hokkaido what Brisbane is to Queensland...\n\n### Upopoy ([GMAP_EMBED:shiraoi-upopoy])\n\nOpened in 2020 in Shiraoi, Upopoy is Japan's first national museum dedicated to the Ainu, the indigenous people of Hokkaido and Sakhalin. The kid-friendly exhibits made our child ask questions for hours afterward...\n\n## A local language note\n\nIn Hokkaido, you'll see signs and menus using the word *まりも* (marimo), referring to a green algal ball found in only a handful of cold lakes globally—Akan being the most famous. Our kid called them \"green tennis balls\"...\n\n## Practical info\n\n- **Best season**: Late September to early October for autumn foliage; mid-February for winter snow festivals; late June for purple-and-green Furano lavender contrasts.\n- **Approximate cost (2-3 days for a family of three)**: ¥80,000–¥130,000 ($530–$870), mid-range with kid-friendly accommodation...\n- **Transit tip with kid**: For Eastern Hokkaido (Akan, Shiretoko), rent a car at New Chitose Airport with a child seat reservation. Bus routes between national parks are limited and stroller-unfriendly...\n- **Official site**: [OFFICIAL_TOURISM]\n\n## Where to next\n\nIf this guide caught your interest, next try [Aomori](/en/prefectures/aomori) for the Tōhoku version of cold-country culture with kids, or [Okinawa](/en/prefectures/okinawa) for Japan's other geographic extreme. For the JLPT learning side, our [N3 quiz set](/en/quiz?level=N3) has a Hokkaido-flavored vocabulary cluster. And if weekly cultural notes from a Japanese family's lens sound useful, the [47 Notes from Japan](https://47notesfromjapan.substack.com) Substack mails one every Saturday.",
  "flagship_spots": [
    {
      "spot_id": "akan-ko",
      "headline": "Lake Akan: where Hokkaido's older soul still hums",
      "summary": "An ancient caldera lake in eastern Hokkaido known for marimo algae, red-crowned cranes, and Ainu villages.",
      "why_visit": "Akan is the easiest place to encounter authentically-presented Ainu culture without the polish of Sapporo's tourist industry, and the lake itself has a winter mood unlike any other in Japan."
    },
    {
      "spot_id": "sapporo-station",
      "headline": "Sapporo: the entry point that's also a trap",
      "summary": "Hokkaido's capital, a planned grid city with great food but treacherously concentrated tourist stops.",
      "why_visit": "Use Sapporo as logistics hub—great soup curry, jingisukan, and ramen yokocho—but don't mistake it for Hokkaido. The interesting prefecture starts past the city limits."
    },
    {
      "spot_id": "shiraoi-upopoy",
      "headline": "Upopoy: Japan's national Ainu museum",
      "summary": "Opened 2020 in Shiraoi, the first national museum dedicated to Japan's indigenous Ainu people.",
      "why_visit": "If you read about Hokkaido at all, you'll keep encountering Ainu names and traditions; Upopoy is where that backstory becomes legible. Half-day commitment from Sapporo."
    }
  ],
  "internal_links": [
    {"anchor_text": "Aomori", "target_slug": "aomori"},
    {"anchor_text": "Okinawa", "target_slug": "okinawa"},
    {"anchor_text": "N3 quiz set", "target_slug": "jlpt-quiz-n3"},
    {"anchor_text": "47 Notes from Japan", "target_slug": "external-substack"}
  ],
  "language_phrase": {
    "phrase_ja": "<ruby>毬藻<rt>まりも</rt></ruby>",
    "reading": "marimo",
    "explanation": "Marimo are velvet-green algal balls found in only a handful of cold lakes worldwide; Lake Akan is the most famous. Hokkaido locals treat marimo as a kind of regional mascot, and you'll see the word printed on souvenirs, train station vending machine drinks, and the wrappers of an iconic Hokkaido confection. The phrase isn't commonly used outside the prefecture—if you say *marimo* unprompted in Tokyo, expect a small flicker of recognition that you've been north."
  }
}
```

---

## 4. 品質保証 (LLM-as-judge)

### 4.1 第二プロンプト: `judgePrefectureArticle(article, prefMeta, lang)`

```js
export function buildJudgePrompt(article, prefMeta, lang) {
  return `You are a strict editor reviewing a single article about ${prefMeta.name_en} prefecture written in ${LANG_NAMES[lang]}.

Article:
${JSON.stringify(article, null, 2)}

Score 0.00–1.00 on each dimension. Output JSON: {scores: {accuracy, voice, persona_anonymity, seo_quality, no_hallucination, affiliate_compliance}, overall: number, top_issues: [string]}.

CRITERIA:
- accuracy: facts about the prefecture are verifiable
- voice: matches "local researcher with fieldwork" tone, not "stunning sights" boilerplate
- persona_anonymity: NO mention of real names, universities, ORCIDs (grep keywords: Yuya, Fukuda, Toho, ORCID, 0000-0001)
- seo_quality: title 50-70 chars, meta_description 140-160 chars, includes prefecture name
- no_hallucination: specific prices/restaurants/trains are widely-known landmarks only
- affiliate_compliance: NO direct affiliate URLs inline (only [AFF:...] placeholders)

THRESHOLDS:
- overall ≥ 0.85: pass
- 0.75 ≤ overall < 0.85: human review required
- overall < 0.75: regenerate with feedback

Output VALID JSON only.`;
}
```

### 4.2 自動 grep 検証 (LLM-judge と並列)

```js
function checkPersonaAnonymity(text) {
  const forbidden = [/Yuya/i, /Fukuda/i, /福田/, /裕哉/, /Toho/i, /東邦/, /0000-0001-7009-176X/, /ORCID/];
  for (const pat of forbidden) {
    if (pat.test(text)) return { ok: false, matched: pat.source };
  }
  return { ok: true };
}

function checkAffiliateCompliance(text) {
  const directLinks = /https?:\/\/(jrpass\.com|klook\.com|viator\.com|rakuten-travel\.|booking\.com)/i;
  const m = text.match(directLinks);
  if (m) return { ok: false, matched: m[0] };
  return { ok: true };
}
```

両方通過 + LLM-judge overall ≥ 0.85 で自動公開、0.75-0.85 は human_reviewed=false で保存しレビュー待ち。

---

## 5. アフィリ動線一元化マップ（MK-16 連動）

### 5.1 `affiliate-routing.yaml`

```yaml
# scripts/data/affiliate-routing.yaml
# MK-16「アフィリ動線一元化ルール」連動

routes:
  rakuten_travel:
    base_url: 'https://nihongo-hub.com/r/rt/'
    targets:
      hokkaido: 'https://travel.rakuten.com/hotel/japan/hokkaido?aff=NIHONGOHUB'
      aomori: 'https://travel.rakuten.com/hotel/japan/aomori?aff=NIHONGOHUB'
      # ... 47 都道府県分
    lang_specific:
      en: 'use rakuten_travel_global'
      zh: 'use rakuten_travel_tw'
      es: 'use rakuten_travel_es'
  klook_tours:
    base_url: 'https://nihongo-hub.com/r/kl/'
    # ...
  jr_pass:
    base_url: 'https://nihongo-hub.com/r/jr/'
    # ...
```

`/r/rt/hokkaido` 等の内部リダイレクトを Vercel rewrites で実装、`affiliate_clicks` テーブルでクリック計測。直接アフィリ URL を記事に書かない（grep で検出）。

### 5.2 Vercel `vercel.json` rewrites 追加

```json
{
  "rewrites": [
    { "source": "/r/rt/:slug", "destination": "/api/aff?p=rt&slug=:slug" },
    { "source": "/r/kl/:slug", "destination": "/api/aff?p=kl&slug=:slug" },
    { "source": "/r/jr/:slug", "destination": "/api/aff?p=jr&slug=:slug" }
  ]
}
```

`api/aff.js` で `affiliate-routing.yaml` をパース → 該当 URL に 302 redirect + `affiliate_clicks` に INSERT。

---

## 6. Google Maps Embed + Instagram oEmbed (4-30 PM 採択)

### 6.1 Google Maps Embed iframe

`[GMAP_EMBED:spot_id]` プレースホルダを記事レンダリング時に展開:

```js
function renderGmapEmbed(spotId, prefMeta) {
  const spot = prefMeta.flagship_spots.find(s => s.id === spotId);
  if (!spot) return '';
  return `<iframe loading="lazy" src="https://www.google.com/maps/embed/v1/place?key=${env.GMAPS_EMBED_KEY}&q=${spot.lat},${spot.lng}" width="100%" height="280" style="border:0"></iframe>`;
}
```

`GMAPS_EMBED_KEY` は **API キー制限を Domain-restricted モード**で発行（無料、Vercel 環境変数追加）。

### 6.2 Instagram oEmbed (厳選 1-3 投稿/記事)

各都道府県につき 1-3 件の **公式 oEmbed タグ**を `prefectures.yaml` に追加:

```yaml
- id: 01
  slug: hokkaido
  instagram_embeds:
    - 'https://www.instagram.com/p/CXxxxxxxxx/'  # 観光協会公式 or 信頼アカウント
```

レンダリング時に Instagram oEmbed API で展開（Meta App ID 必要、Phase C2 着手時に取得）。

商標・著作権配慮:
- 公的観光協会または有名 verified アカウント以外は埋込しない
- alt-text を必ず添付
- Phase C2 デプロイ前に法務（NHL-1 知人弁護士）で 1 サンプル監修

---

## 7. 実装段階（Phase C2 着手 6/15-）

### 7.1 Phase C2 Sprint 計画

| Day | 作業 | 所要 |
|---|---|---|
| 6/15 (月) | Supabase migration + `prefectures.yaml` 47 県メタ整備 (visited 県は creator_field_notes 充実) | 4-5h |
| 6/16-17 | `lib/anthropic.js` に `buildPrefecturePrompt` + `buildJudgePrompt` 実装 | 3-4h |
| 6/18 | `scripts/generate-prefecture-articles.mjs` 実装 (batch with concurrency=3) | 2-3h |
| 6/19 | アフィリ動線一元化 (`api/aff.js` + `vercel.json` rewrites) 実装 | 2-3h |
| 6/20-21 | Vercel ISR ページ実装 (`/[lang]/prefectures/[slug]`) + Gmaps Embed + 内部リンク | 4-5h |
| 6/22 | 北海道 5 言語 batch 生成（5 記事）→ LLM-judge + grep + 人手スポットチェック | 2-3h |
| 6/23-29 | 残 46 都道府県 × 5 言語 = 230 記事 batch 生成（concurrency=3 で 4-6h、人手レビューは順次） | 4-6h batch + 12-20h レビュー |
| 6/30 | 公開 + Vercel Web Analytics で初期 PV 計測 | 1-2h |

合計 Phase C2: **batch 生成 = 4-6h、人手レビュー含む完全公開 = 35-50h** （オーナー稼働 4 倍化下で 6/15-6/30 の 16 日間に分散可能）

### 7.2 段階的公開

- **6/22**: 北海道 5 言語のみ公開（Vercel Analytics で初期 SEO 反応観測、LLM-judge 0.85 閾値の妥当性検証）
- **6/26**: 北海道 + 47 都道府県の英語版 (47 記事) 全公開
- **6/30**: 5 言語 × 47 = 235 記事 全公開、Phase C2 完了

---

## 8. 受入基準

### 8.1 機能テスト (6/22 北海道公開時)

- [ ] `prefectures.yaml` 47 県メタ揃う (visited_by_creator 既知県は creator_field_notes 100 字以上)
- [ ] `/en/prefectures/hokkaido` が表示される (Vercel ISR 60 秒 revalidate)
- [ ] Google Maps Embed が 3 spot 全部表示
- [ ] アフィリ動線が全て `/r/rt/...` 経由 (grep `https://travel.rakuten.com` がページ HTML に直接出ない)
- [ ] 内部リンク 4 件が他 NihongoHub ページへ正しく遷移
- [ ] LLM-judge で overall ≥ 0.85
- [ ] grep ペルソナ匿名性 ゼロ件 (Yuya|Fukuda|Toho|0000-0001|ORCID)
- [ ] 5 言語 (en/zh/es/th/id) 同等品質 (各々 LLM-judge ≥ 0.85)

### 8.2 SEO チェック (6/30 全公開時)

- [ ] Google Search Console に 235 記事登録
- [ ] sitemap.xml 自動生成
- [ ] meta_description 全 235 件が 140-160 chars
- [ ] hreflang タグで 5 言語間相互リンク
- [ ] structured data (Schema.org TouristAttraction) 各 flagship_spot に埋込

### 8.3 法務 (NHL-2-5 連携)

- [ ] アフィリリンクに「PR」「Sponsored」表記（記事フッター）
- [ ] 商標・著作権侵害の自動検証（grep + LLM-judge）
- [ ] Instagram oEmbed は公式観光協会 or 有名 verified のみ
- [ ] 個別の「あなた向けの旅程」型助言ゼロ件（旅行業法配慮）

---

## 9. 関連ドキュメント

- v3 ロードマップ: [`pm/nihongohub-roadmap.md`](../../../pm/nihongohub-roadmap.md)
- アフィリ動線一元化 (MK-16): [`marketing/content-plan/affiliate-routing-rules.md`](../../../marketing/content-plan/affiliate-routing-rules.md)
- Substack 連携 (47 Notes from Japan): [`marketing/substack-drafts/MK-12-substack-launch-package-v1.md`](../../../marketing/substack-drafts/MK-12-substack-launch-package-v1.md)
- ペルソナ C 採択: [`marketing/persona/ikimono-hakase-persona.md`](../../../marketing/persona/ikimono-hakase-persona.md)
- Phase B+ 監視 (生成 batch コスト追跡): [`specs/PhaseB-plus-monitoring-spec.md`](./PhaseB-plus-monitoring-spec.md)
- PR-25 Japan Life Quiz (history_geo / food カテゴリ相互リンク): [`specs/PR-25-japan-life-quiz-v1.md`](./PR-25-japan-life-quiz-v1.md)
- PR-12 ハンドブック (Appendix A 自治体リンク連動): [`specs/PR-12-handbook-pdf-spec.md`](./PR-12-handbook-pdf-spec.md)
- 47 都道府県訪問記録 (visited フィルタ): [`marketing/persona/prefecture-visit-log.md`](../../../marketing/persona/prefecture-visit-log.md)

---

## 10. Open Questions

1. **`prefectures.yaml` の `visited_by_creator` の真偽値**: 47 県すべて訪問済前提だが、未訪県があれば文献ベースに切り替え。オーナー追加判断要（`marketing/persona/prefecture-visit-log.md` で 47 件埋まっているか確認）
2. **Instagram oEmbed の Meta App ID 取得**: Phase C2 着手 6/15 までに Meta for Developers でアプリ登録要（オーナー対応 30 分）
3. **Google Maps Embed API キー**: Phase C2 着手前に Google Cloud Console でキー発行 + Domain-restricted 設定（オーナー対応 15 分）
4. **アフィリ収益試算**: 4-30 夜試算で月 ¥6,750-200,000、Phase D 中間 KPI #2 (8/15 MAU 5K) 時点で実測検証
5. **記事更新サイクル**: 1 年に 1 度メタ情報更新 (LP 連動)、半年に 1 度内容軽微レビュー (公式リンク切れ確認等)

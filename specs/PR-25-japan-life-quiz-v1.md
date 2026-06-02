# PR-25 Japan Life Quiz Mode — Spec v1（案 A 採択版）

**起案日**: 2026-05-03（skeleton）→ **v1: 2026-05-04**
**ステータス**: **architecture-decided (案 A 採択)** — Phase C1 (5/17-) で実装着手
**優先度**: Phase C1（PR-12 生活ハンドブック販売 6/14 と同時稼働を狙う）
**工数試算**: **6-8h（実装）+ 2-4h（シードコンテンツ生成）**
**前提**: skeleton spec [`PR-25-japan-life-quiz-skeleton.md`](./PR-25-japan-life-quiz-skeleton.md) §1-§11 既読

---

## 0. v1 改訂サマリ（skeleton → v1）

- ✅ アーキテクチャ確定: **案 A** = 既存 `pregenerated_quiz` に `quiz_mode` カラム追加
- ✅ Open Question #1（A/B/C 選択）クローズ
- 🆕 Supabase migration SQL 完全版
- 🆕 `lib/anthropic.js` 拡張仕様（`buildLifeQuizPrompt(category, lang)`）
- 🆕 `api/generate.js` + `api/generate-batch.js` 改修ポイント
- 🆕 フロント側カテゴリセレクタ UI 仕様
- 🆕 シードコンテンツ生成 batch 仕様（5 カテゴリ × 5 言語 × 50 問 = 1,250 問、$2.50）
- 🆕 受入基準 + 法務チェックリスト（NHL-1 知人ヒアリング後 7 項目）

---

## 1. データモデル（案 A）

### 1.1 Supabase migration（Phase C1 着手時実行）

```sql
-- 1. quiz_mode カラム追加（既存行は 'jlpt' でデフォルト埋め）
ALTER TABLE pregenerated_quiz
  ADD COLUMN IF NOT EXISTS quiz_mode TEXT NOT NULL DEFAULT 'jlpt'
    CHECK (quiz_mode IN ('jlpt', 'life'));

-- 2. life_category カラム追加（life mode 時のみ NOT NULL、jlpt mode は NULL）
ALTER TABLE pregenerated_quiz
  ADD COLUMN IF NOT EXISTS life_category TEXT
    CHECK (life_category IS NULL OR life_category IN
      ('food', 'etiquette', 'rules', 'history_geo', 'popculture'));

-- 3. 制約: life mode なら life_category 必須、jlpt mode なら life_category NULL
ALTER TABLE pregenerated_quiz
  ADD CONSTRAINT IF NOT EXISTS chk_life_category_consistency
    CHECK (
      (quiz_mode = 'jlpt' AND life_category IS NULL)
      OR (quiz_mode = 'life' AND life_category IS NOT NULL)
    );

-- 4. 複合 index（fetchCachedQuiz の WHERE 句最適化）
CREATE INDEX IF NOT EXISTS idx_pregenerated_quiz_mode_lang_cat
  ON pregenerated_quiz (quiz_mode, lang, life_category);

-- 5. 既存 idx_pregenerated_quiz_level_lang は jlpt mode 専用に降格（drop しない、キャッシュヒット維持）
```

### 1.2 ロールバック手順（万一）

```sql
-- カラムだけ drop（既存 jlpt データは保護）
ALTER TABLE pregenerated_quiz DROP CONSTRAINT IF EXISTS chk_life_category_consistency;
ALTER TABLE pregenerated_quiz DROP COLUMN IF EXISTS life_category;
ALTER TABLE pregenerated_quiz DROP COLUMN IF EXISTS quiz_mode;
DROP INDEX IF EXISTS idx_pregenerated_quiz_mode_lang_cat;
```

### 1.3 既存データ互換性

migration 後、既存 1,525 行（cum_ins）は全て `quiz_mode='jlpt'` + `life_category=NULL` で残る。`/api/generate` はデフォルト `mode='jlpt'` を取り、JLPT 既存挙動は完全互換。

---

## 2. API 改修（案 A）

### 2.1 `api/generate.js` 改修

**Before**:
```js
const { level, lang } = req.body;
const cached = await fetchCachedQuiz({ level, lang });
```

**After**:
```js
const { level, lang, mode = 'jlpt', lifeCategory } = req.body;

// life mode は lifeCategory 必須
if (mode === 'life' && !lifeCategory) {
  return res.status(400).json({ error: 'lifeCategory is required when mode=life' });
}
if (mode === 'life' && !LIFE_CATEGORIES.includes(lifeCategory)) {
  return res.status(400).json({ error: `lifeCategory must be one of: ${LIFE_CATEGORIES.join(', ')}` });
}
// jlpt mode は level 必須（既存挙動）
if (mode === 'jlpt' && !level) {
  return res.status(400).json({ error: 'level is required when mode=jlpt' });
}

const cached = await fetchCachedQuiz({ mode, level, lang, lifeCategory });
if (cached) {
  return res.json({ ...cached, source: 'cached', remaining: ... });
}

// 生成パス
const generated = mode === 'life'
  ? await generateLifeQuiz({ category: lifeCategory, lang })
  : await generateJlptQuiz({ level, lang });
```

定数:
```js
const LIFE_CATEGORIES = ['food', 'etiquette', 'rules', 'history_geo', 'popculture'];
```

### 2.2 `lib/supabase.js` 改修

**Before**:
```js
export async function fetchCachedQuiz({ level, lang }) {
  return await client.from('pregenerated_quiz').select('...')
    .eq('lang', lang).eq('level', level).limit(1).single();
}
```

**After**:
```js
export async function fetchCachedQuiz({ mode = 'jlpt', level, lang, lifeCategory }) {
  let q = client.from('pregenerated_quiz')
    .select('question, reading, correct, distractors, explanation, created_at')
    .eq('lang', lang)
    .eq('quiz_mode', mode);
  if (mode === 'jlpt') q = q.eq('level', level);
  if (mode === 'life') q = q.eq('life_category', lifeCategory);
  // ランダム抽出（既存と同じ挙動）
  const { data, error } = await q.order('random()').limit(1).single();
  if (error || !data) return null;
  return data;
}
```

### 2.3 `lib/anthropic.js` 拡張

新関数 `buildLifeQuizPrompt(category, lang)` を追加。既存 `buildJlptPrompt(level, lang)` と並列構造。

```js
export function buildLifeQuizPrompt(category, lang) {
  const langName = LANG_NAMES[lang]; // "English", "中文", "Español", "ไทย", "Bahasa Indonesia"
  const categoryGuide = CATEGORY_GUIDES[category];
  return `You are a Japanese culture quiz creator. Generate ONE 4-choice quiz about ${categoryGuide.label}.

STRICT RULE 1 NATURAL JAPANESE: question_ja must read naturally to native speakers.
STRICT RULE 2 RUBY: All N3+ kanji must use <ruby>漢字<rt>ふりがな</rt></ruby>.
STRICT RULE 3 UNDERLINE: Underline the asked-about word with <u>...</u>.
STRICT RULE 4 NO COPYRIGHTED CONTENT: No specific anime/manga titles, no song lyrics, no brand names.
STRICT RULE 5 4 OPTIONS: 1 correct + 3 plausible distractors.
STRICT RULE 6 EXPLANATION: write in ${langName}, 80-150 words.
STRICT RULE 7 CULTURAL ACCURACY: facts must be verifiable.

Category: ${categoryGuide.label}
Scope: ${categoryGuide.scope}
Examples to avoid (overused):
${categoryGuide.avoid.join('\n- ')}

Output JSON ONLY: {question, reading, correct, distractors, explanation, life_category, quiz_mode: "life"}`;
}

const CATEGORY_GUIDES = {
  food: {
    label: 'Japanese food culture',
    scope: 'Sushi terminology, ramen regional variants, izakaya ordering, conbini specialties, seasonal foods',
    avoid: ['Studio Ghibli food scenes', 'specific restaurant chain menus'],
  },
  etiquette: {
    label: 'Japanese etiquette and manners',
    scope: 'Shrine/temple visit protocols, onsen rules, train manners, home visit customs (shoes/slippers)',
    avoid: ['outdated stereotypes', 'individual person-specific advice'],
  },
  rules: {
    label: 'Japanese daily life rules and procedures',
    scope: 'Garbage sorting, neighborhood association basics, rental contract general flow, address change concept',
    avoid: ['specific municipality forms', 'individual case advice (gyōseishoshi-hō配慮)'],
  },
  history_geo: {
    label: 'Japanese history and geography',
    scope: '47 prefectures, Sengoku/Edo era basics, traditional crafts, eras (Heisei/Reiwa)',
    avoid: ['controversial political history', 'unverified dates'],
  },
  popculture: {
    label: 'Japanese pop culture concepts',
    scope: 'Anime genre names (shonen/seinen/josei/yuri/yaoi), voice actor concept (seiyū), idol culture concept',
    avoid: ['specific anime titles', 'specific song titles', 'specific celebrity names', 'verbatim quotes'],
  },
};
```

法務境界線（NHL-1 知人ヒアリング 5/15 で要確認）:
- popculture は「概念・ジャンル名のみ」「特定作品 NG」を厳守
- rules は「一般教材型」「個別助言禁止」（PR-12 ハンドブックと同方針）

### 2.4 `api/generate-batch.js` 改修

Admin プリ生成 batch に life mode 対応:

```js
const { levels, langs, perCombo, mode = 'jlpt', lifeCategories } = req.body;

if (mode === 'life') {
  // life mode はカテゴリ × 言語の matrix
  const cats = lifeCategories || LIFE_CATEGORIES;
  for (const cat of cats) {
    for (const lang of langs) {
      for (let i = 0; i < perCombo; i++) {
        const quiz = await generateLifeQuiz({ category: cat, lang });
        await insertQuiz({ ...quiz, quiz_mode: 'life', life_category: cat, lang });
      }
    }
  }
} else {
  // jlpt mode 既存挙動
  ...
}
```

シード生成コマンド例（Phase C1 着手時）:
```bash
# 5 カテゴリ × 5 言語 × 50 問 = 1,250 問
curl -X POST .../api/generate-batch \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"mode":"life","langs":["en","zh","es","th","id"],"perCombo":50}'
# 想定コスト: $2.50（Haiku 4.5 単価 $0.002/問）
```

---

## 3. フロント改修（案 A）

### 3.1 既存 LP の改修箇所

ヒーロー直下の practice セクション（`#practice`）に「カテゴリセレクタ」追加:

```html
<section id="practice">
  <!-- 既存タブ -->
  <div class="quiz-mode-tabs">
    <button class="tab-btn active" data-mode="jlpt">JLPT N1–N5</button>
    <button class="tab-btn" data-mode="life">Japan Life Quiz</button>
  </div>

  <!-- JLPT mode: 既存 5 レベルセレクタ -->
  <div class="level-selector" data-mode="jlpt" style="display:flex">
    <button data-level="N1">N1</button>
    <button data-level="N2">N2</button>
    <!-- ... -->
  </div>

  <!-- 🆕 Life mode: 5 カテゴリセレクタ -->
  <div class="category-selector" data-mode="life" style="display:none">
    <button data-cat="food">🍣 Food</button>
    <button data-cat="etiquette">🙏 Etiquette</button>
    <button data-cat="rules">📋 Daily Rules</button>
    <button data-cat="history_geo">🗾 History/Geo</button>
    <button data-cat="popculture">🎌 Pop Culture</button>
  </div>

  <!-- クイズカード（既存 UI 流用、既存 JLPT と life で同一 component） -->
  <div id="quiz-card">...</div>
</section>
```

### 3.2 JS 改修（既存 `index.html` 内 inline JS）

```js
let currentMode = 'jlpt';
let currentLevel = 'N5';
let currentCategory = null;

// タブ切替
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    currentMode = btn.dataset.mode;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('[data-mode]').forEach(el => {
      el.style.display = el.dataset.mode === currentMode ? 'flex' : 'none';
    });
  };
});

// クイズ取得
async function fetchQuiz() {
  const body = currentMode === 'jlpt'
    ? { mode: 'jlpt', level: currentLevel, lang: currentLang }
    : { mode: 'life', lifeCategory: currentCategory, lang: currentLang };
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
}
```

### 3.3 5 言語タブテキスト

| カテゴリ | en | zh | id | es | th |
|---|---|---|---|---|---|
| food | Food | 飲食 | Makanan | Comida | อาหาร |
| etiquette | Etiquette | 禮儀 | Etiket | Etiqueta | มารยาท |
| rules | Daily Rules | 生活規則 | Aturan Hidup | Reglas | กฎ |
| history_geo | History/Geo | 歷史地理 | Sejarah/Geografi | Historia | ประวัติศาสตร์ |
| popculture | Pop Culture | 流行文化 | Pop Culture | Cultura Pop | วัฒนธรรม |

---

## 4. シードコンテンツ生成（Phase C1 着手時）

### 4.1 Phase C1 着手日（5/17）の手順

```bash
# 1. Supabase migration 実行（Console SQL editor）
# §1.1 の SQL をコピペ実行

# 2. life シード batch 生成（1,250 問、約 30 分、$2.50）
cd /c/Users/Yurik/.secretary/projects/nihongohub
ADMIN_KEY=$(grep "^ADMIN_KEY=" .env | cut -d'=' -f2 | tr -d '"')
curl -sS -m 1800 -X POST "https://nihongohub-nu.vercel.app/api/generate-batch" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"mode":"life","langs":["en","zh","es","th","id"],"perCombo":50}'

# 3. 生成確認
node scripts/smoke-test-25-coverage.mjs  # life mode 対応版に拡張要
```

### 4.2 拡張後 smoke-test カバレッジ

5 カテゴリ × 5 言語 = 25 セル（life mode）+ 5 レベル × 5 言語 = 25 セル（jlpt mode）= **計 50 セル網羅**を smoke test 拡張版で確認。

---

## 5. アフィリ動線（PR-25 から NihongoHub 内記事 + アフィリ）

| カテゴリ | 説明セクション末尾の「もっと知る」誘導先 | アフィリ候補 |
|---|---|---|
| food | tabelog 多言語版 / NihongoHub 47 都道府県記事「ご当地グルメ」 | 楽天トラベル（グルメパッケージ） |
| etiquette | NihongoHub 内記事 / japan-guide.com | （アフィリなし、信頼カルマ） |
| rules | **PR-12 ハンドブック PDF への直接 CTA**（rules → ハンドブック直リンク） | NihongoHub 自社販売 ¥1,480-1,980 |
| history_geo | NihongoHub 47 都道府県記事 (PR-11) / Wikipedia | Klook（歴史ツアー） |
| popculture | Crunchyroll / Anime News Network | Crunchyroll Affiliate |

すべてアフィリは MK-16 動線一元化ルール準拠で **NihongoHub 47 都道府県 SEO 記事 (PR-11) 経由**で転送。

---

## 6. 受入基準（PR-25 完了判定）

### 6.1 機能テスト

- [ ] Supabase migration 実行成功（既存 1,525 行が `quiz_mode='jlpt'` で保護）
- [ ] `/api/generate` で `mode='jlpt'` 時、既存挙動と完全互換（cum_ins 1,525 のキャッシュヒット率変化なし）
- [ ] `/api/generate` で `mode='life'` + `lifeCategory='food'` 時、life mode quiz 取得成功
- [ ] life mode で `lifeCategory` 未指定時、400 error
- [ ] life mode 5 カテゴリ × 5 言語 = 25 セル全網羅（シード 1,250 問完了後）
- [ ] フロント: タブ切替で jlpt ↔ life UI 切り替わり、quiz card は同一 component で表示
- [ ] 5 言語タブテキスト全対応

### 6.2 法務チェックリスト（NHL-1 知人ヒアリング 5/15 後実施）

- [ ] **著作権**: アニメ・マンガ固有名詞ゼロ（grep でランダム抽出 100 問チェック）
- [ ] **行政書士法第 21 条**: rules カテゴリで「個別助言」表現ゼロ（一般教材型維持）
- [ ] **景品表示法**: アフィリリンクに「PR」「Sponsored」表記あり
- [ ] **PDPA / GDPR**: 学習履歴は localStorage 維持、追加収集なし
- [ ] **個人情報保護法**: 同上
- [ ] **NHL-1 知人ヒアリング 7 項目**完了確認（特に項目 6: popculture 著作権境界）

### 6.3 コスト試算（5/30 Phase C1 直前 stress test 含）

- 初期シード: $2.50（5/17）
- 月次運用: ライブ生成 1 件 0.5-1¢ × 想定 1,000 req/月 = $5-10
- 既存 JLPT $5-10 と合算で **月 $20 上限内**

---

## 7. AB テスト設計（5/24 Phase Interview 完了後に確定）

| 群 | 対象 | 比較指標 |
|---|---|---|
| A | JLPT のみ | 滞在時間 / クイズ完走率 / Pro 転換率 |
| B | JLPT + life | 同上 + life mode 利用率 / カテゴリ別人気 |

仮説:
- B 群は滞在時間 +30% 想定（多様性）
- B 群は Pro 転換率 +10% 想定（rules → ハンドブック直 CTA 経由）
- B 群の life カテゴリ人気順予測: rules > food > history_geo > etiquette > popculture（PR-12 ハンドブック需要と整合）

---

## 8. Phase Gate（Phase C1 着手判定 5/17）

- [x] PR-21/PR-17 a-e/PR-23/PR-24 受入完了（5/3）
- [x] 250 問新プロンプト生成 + smoke test 25 パターン（5/4）
- [x] cum_ins 1,500 達成（5/4 cum_ins 1,525 達成）
- [ ] **NHL-1 知人弁護士ヒアリング完了**（5/15、popculture 境界確認）
- [ ] **PR-12 ハンドブック弁護士チェック完了**（5/31 NHL-2）
- [ ] §11 47 都道府県記事 (PR-11) のシード 5 件以上（Phase C2 5/17 着手時）
- [ ] Marketing 部署 MK-1（アフィリ確認）完了（5/15）

---

## 9. Open Questions（v1 残り）

1. ✅ **アーキ A/B/C**: 案 A 採択（2026-05-04 オーナー判断）
2. ⏳ **popculture 著作権境界**: NHL-1 5/15 ヒアリング項目 6 で確定
3. ⏳ **生活ハンドブック CTA 配置**: rules カテゴリ末尾 vs 全カテゴリ末尾 vs LP 別 CTA → Phase Interview 5/24 完了後に確定
4. ⏳ **AB テスト設計**: Phase Interview 5/24 完了後に確定（§7 試案ベース）
5. ✅ **Phase C1 起点**: 5/17 着手で同時実装推奨（v3 ロードマップ）

---

## 10. 関連ドキュメント

- skeleton: [PR-25-japan-life-quiz-skeleton.md](./PR-25-japan-life-quiz-skeleton.md)
- v3 ロードマップ: [`pm/nihongohub-roadmap.md`](../../../pm/nihongohub-roadmap.md)
- 5/4 決定 7（案 A 採択）: [`notes/2026-05-04-decisions.md`](../../../notes/2026-05-04-decisions.md)
- NHL-1 ヒアリング項目: [`admin/NHL-1-lawyer-candidates.md`](../../../admin/NHL-1-lawyer-candidates.md)
- アフィリ動線一元化: [`marketing/content-plan/affiliate-routing-rules.md`](../../../marketing/content-plan/affiliate-routing-rules.md)

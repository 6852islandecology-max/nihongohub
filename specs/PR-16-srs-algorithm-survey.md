# PR-16 SRS（Spaced Repetition System）アルゴリズム調査

**起案日**: 2026-05-04
**起案者**: 秘書
**ステータス**: spec-survey-v1（Phase C1 着手前準備）
**期限**: 2026-05-20（v3 ロードマップ）
**所要**: 3-4h（調査）+ 8-12h（Phase C1 実装）

---

## 0. 調査目的

戦略反転 5 改訂（2026-04-30 夜採択）改訂 3「SRS 機能を Phase C1 スコープに正式追加」の実装方針を決定。Bunpro / jpdb / Anki 既存ツールとの差別化軸を確立する。

学術エビデンス（戦略反転レポート §3.3）:
- SRS による kanji 90 日 retention +37%（vs 非 SRS）
- SRS による vocabulary 30 日 retention +43%（vs 一括学習）

---

## 1. 主要 SRS アルゴリズム比較

### 1.1 SM-2（SuperMemo 2、1985）

**原理**:
- ユーザーが回答後、品質評価 0-5 の 6 段階で評価（0=完全失敗、5=完璧）
- 評価 ≥ 3: easiness factor (EF) 更新 + 次回間隔倍化
- 評価 < 3: 間隔リセット（1 日後再出題）

**間隔計算**:
```
I(1) = 1
I(2) = 6
I(n) = I(n-1) × EF  (n > 2)
EF' = max(1.3, EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02)))
```

**長所**:
- 実装が単純（数十行で書ける）
- Anki が採用、世界的にデファクト

**短所**:
- 6 段階評価がユーザーに判断負荷高（Bunpro は 2 段階に簡略化）
- パラメータ固定で個人差吸収できない（学習速度の遅い人/速い人で精度低下）
- Forgetting curve のフィッティング精度が現代基準で物足りない

**適合度**: ★★★★☆（NihongoHub 標準として最速実装可、Phase C1 MVP）

### 1.2 SM-15/SM-17/SM-18（SuperMemo 18、最新版）

**原理**: 機械学習で個人 forgetting curve をフィッティング（DSR モデル: difficulty / stability / retrievability）

**長所**:
- 個人最適化、SM-2 比 retention +20-30%（SuperMemo 公式論文）

**短所**:
- 商用ライセンス（SuperMemo World）、コード非公開
- 実装複雑度極高、SaaS で再現は数百行

**適合度**: ★☆☆☆☆（ライセンス問題で除外）

### 1.3 FSRS（Free Spaced Repetition Scheduler、2022-）

**原理**: Anki 用に開発されたオープンソース DSR 系アルゴリズム。Wozniak の SM-17 を OSS 化。

**主要パラメータ**: `w[0..16]` 17 個の重み（個人別 fitting）

**間隔計算**:
```
S = stability (記憶安定度、日)
D = difficulty (難易度、1-10)
R = retrievability = exp(ln(0.9) × t / S)  (時刻 t での想起確率)

回答後:
S' = S × (1 + exp(w[8]) × (11 - D) × S^(-w[9]) × (exp((1 - R) × w[10]) - 1))
D' = D - w[6] × (rating - 3)  (rating: again=1, hard=2, good=3, easy=4)
```

次回出題: target retention 90% を維持する時刻 = `S × ln(0.9) / ln(R_target)`

**長所**:
- **学術エビデンス**: SuperMemo 論文 + Anki community 実証で SM-2 比 +20% 効率
- **オープンソース**: Anki 23.10+ で標準採用、各言語実装あり（JavaScript/Python/Rust）
- **個人最適化**: 17 パラメータ fitting で SM-2 を超える精度
- **target retention 設定可**: 90%（Anki デフォルト）or 85%/95% etc

**短所**:
- 実装複雑度中程度（SM-2 比 5-10 倍のコード量）
- 個人 fitting に最低 100-300 review データが必要（コールドスタート問題）

**適合度**: ★★★★★（Phase C1 で MVP は SM-2、Phase D で FSRS 移行 推奨）

### 1.4 Bunpro 独自方式（2 段階）

**原理**:
- 評価 2 段階のみ: "Got it" / "Not yet"
- 8 段階の固定間隔: 4h → 8h → 24h → 2d → 4d → 8d → 2w → 1m → 2m → 4m → done

**長所**:
- ユーザー判断負荷が極小（バイナリ）
- UI シンプル

**短所**:
- 個人差吸収できない（全員同じ間隔）
- 学術的優位性なし（むしろ SM-2 比劣る可能性）

**適合度**: ★★★☆☆（UI 簡略化の参考、アルゴリズム自体は採用しない）

### 1.5 jpdb 独自方式（DSR 派生）

**原理**: FSRS 系の DSR モデルだが独自実装。文単位 review を最適化。

**長所**:
- 日本語特化（kanji × vocab × grammar の連動）
- target retention 90% カスタム可

**短所**:
- ソースコード非公開
- アルゴリズム詳細不明

**適合度**: ★★★☆☆（参考のみ、再現は不可）

---

## 2. 競合製品の SRS 実装状況

| ツール | アルゴリズム | レビュー UI | 個人 fitting | 推奨度 |
|---|---|---|---|---|
| **Anki** | FSRS（23.10+）/ SM-2 (旧) | 4 段階 (again/hard/good/easy) | あり (FSRS) | ★★★★★ |
| **Bunpro** | 独自 2 段階 | 2 段階 | なし | ★★★☆☆ |
| **jpdb** | DSR 派生 | 4 段階 | あり | ★★★★☆ |
| **WaniKani** | SRS 8 段階固定 | 2 段階 | なし | ★★★☆☆ |
| **Renshuu** | 独自 8 段階 | 4 段階 | 部分 | ★★★☆☆ |
| **Migaku** | Anki 連動 | (Anki に依存) | (Anki 依存) | ★★★★☆ |

---

## 3. NihongoHub への推奨実装

### 3.1 段階的アプローチ

| Phase | アルゴリズム | UI | 工数 | 期限 |
|---|---|---|---|---|
| **C1 MVP (5/17-6/1)** | **SM-2** | 4 段階 (again/hard/good/easy) | 8-12h | 6/1 |
| **D 拡張 (Phase D 後)** | **FSRS** | 同 4 段階 | 16-24h | 2026-09 |
| **D2 個人 fitting** | FSRS + 個人重み学習 | 同 4 段階 | 8-12h | 2026-10-22 |

### 3.2 Phase C1 MVP の SM-2 実装方針

#### 3.2.1 データモデル

```sql
-- ユーザー × クイズ × レビュー履歴
CREATE TABLE IF NOT EXISTS srs_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  quiz_id UUID NOT NULL REFERENCES pregenerated_quiz(id),
  ease_factor FLOAT NOT NULL DEFAULT 2.5,  -- EF (SM-2)
  interval_days INTEGER NOT NULL DEFAULT 0,  -- 次回までの日数
  repetitions INTEGER NOT NULL DEFAULT 0,   -- 連続成功回数
  last_review_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ NOT NULL,
  last_rating SMALLINT,                      -- 1-4 (again/hard/good/easy)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, quiz_id)
);

CREATE INDEX idx_srs_reviews_user_next ON srs_reviews (user_id, next_review_at);
```

#### 3.2.2 SM-2 アルゴリズム（JavaScript 実装、`lib/srs.js` 新設）

```js
// SM-2 algorithm for NihongoHub
// Input: review record + user rating (1=again, 2=hard, 3=good, 4=easy)
// Output: updated record (ease_factor, interval_days, repetitions, next_review_at)

const Q_MAP = { 1: 0, 2: 3, 3: 4, 4: 5 }; // rating to SM-2 quality (0-5)

export function updateSrsRecord(record, rating) {
  const q = Q_MAP[rating];
  if (q === undefined) throw new Error(`Invalid rating: ${rating}`);

  let { ease_factor: EF, interval_days: I, repetitions: n } = record;

  if (q < 3) {
    // 失敗: リセット
    n = 0;
    I = 1;
  } else {
    // 成功: 間隔倍化
    n += 1;
    if (n === 1) I = 1;
    else if (n === 2) I = 6;
    else I = Math.round(I * EF);

    // EF 更新
    EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (EF < 1.3) EF = 1.3;
  }

  const nextReviewAt = new Date(Date.now() + I * 24 * 60 * 60 * 1000);

  return {
    ease_factor: EF,
    interval_days: I,
    repetitions: n,
    last_review_at: new Date(),
    next_review_at: nextReviewAt,
    last_rating: rating,
    updated_at: new Date(),
  };
}
```

#### 3.2.3 新規 API エンドポイント

**`api/srs-due.js`** （今日のレビュー取得）:
```js
export default async function handler(req, res) {
  const userId = ...; // auth check
  const adminClient = ...;
  const now = new Date().toISOString();
  const { data } = await adminClient
    .from('srs_reviews')
    .select('quiz_id, next_review_at, repetitions, last_rating')
    .eq('user_id', userId)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true })
    .limit(20);

  // quiz_id を join で展開
  const quizIds = data.map(r => r.quiz_id);
  const { data: quizzes } = await adminClient
    .from('pregenerated_quiz')
    .select('id, question, reading, correct, distractors, explanation')
    .in('id', quizIds);

  return res.json({ due_count: data.length, reviews: quizzes });
}
```

**`api/srs-rate.js`** （レビュー結果送信）:
```js
export default async function handler(req, res) {
  const { quiz_id, rating } = req.body; // rating: 1-4
  const userId = ...;
  const adminClient = ...;

  let { data: record } = await adminClient
    .from('srs_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quiz_id)
    .single();

  if (!record) {
    // 初回レビュー
    record = {
      user_id: userId,
      quiz_id,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
    };
  }

  const updated = updateSrsRecord(record, rating);

  await adminClient.from('srs_reviews').upsert({
    ...record,
    ...updated,
    user_id: userId,
    quiz_id,
  });

  return res.json({
    next_review_at: updated.next_review_at,
    interval_days: updated.interval_days,
    repetitions: updated.repetitions,
  });
}
```

#### 3.2.4 フロント UI

クイズ完答後に 4 ボタン表示:

```html
<div class="srs-rating-bar">
  <button class="srs-btn rating-1" data-rating="1">
    <span class="srs-label">Again</span>
    <span class="srs-interval">< 1m</span>
  </button>
  <button class="srs-btn rating-2" data-rating="2">
    <span class="srs-label">Hard</span>
    <span class="srs-interval">~1d</span>
  </button>
  <button class="srs-btn rating-3" data-rating="3">
    <span class="srs-label">Good</span>
    <span class="srs-interval">~2d</span>
  </button>
  <button class="srs-btn rating-4" data-rating="4">
    <span class="srs-label">Easy</span>
    <span class="srs-interval">~6d</span>
  </button>
</div>
```

色分け（Anki 流儀）: rating-1=赤 / rating-2=橙 / rating-3=緑 / rating-4=青

5 言語対応のラベル辞書:
```js
const SRS_LABELS = {
  en: { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' },
  zh: { again: '再來', hard: '困難', good: '良好', easy: '容易' },
  es: { again: 'Otra vez', hard: 'Difícil', good: 'Bien', easy: 'Fácil' },
  th: { again: 'อีกครั้ง', hard: 'ยาก', good: 'ดี', easy: 'ง่าย' },
  id: { again: 'Lagi', hard: 'Sulit', good: 'Bagus', easy: 'Mudah' },
};
```

---

## 4. Phase D の FSRS 移行戦略

### 4.1 移行タイミング

- 個人の SM-2 review 履歴が 100+ 件蓄積された時点で個別 FSRS パラメータ fit 可能
- 全体で MAU 1,000+ 達成（Phase C2 末 6/30 想定）後、一括移行

### 4.2 FSRS パラメータ初期値（Anki デフォルト流用）

```js
const FSRS_DEFAULT_W = [
  0.5701, 1.4436, 4.1386, 10.9355, 5.1443, 1.2006, 0.8627,
  0.0362, 1.629, 0.1342, 1.0166, 2.1174, 0.0839, 0.3204,
  1.4676, 0.219, 2.8237
];
```

### 4.3 FSRS 実装ライブラリ候補

- **fsrs.js** (TypeScript/JavaScript): https://github.com/open-spaced-repetition/ts-fsrs
- **fsrs-rs** (Rust → WASM): 高速だが Vercel Serverless で WASM 実行コスト要検証
- **自作**: SM-2 から 200-300 行追加で書ける

推奨: Phase D で fsrs.js (npm パッケージ `ts-fsrs`) 採用、自作不要。

---

## 5. NihongoHub での SRS 適用範囲

### 5.1 対象クイズ

- ✅ JLPT mode (N1-N5、5 言語)
- ✅ Life mode (5 カテゴリ × 5 言語、PR-25 連動)
- ❌ ハンドブック PDF 内クイズ（PR-12、別建て、Phase D 検討）

### 5.2 SRS をオプション化（既存 Free Trial フローとの統合）

```
ユーザー設定:
  - "Track my progress with SRS" ON/OFF (default: ON for Pro/Lifetime, OFF for Free)
  - Free 状態は SRS 制限ありで「過去 3 日のみ復習」(後から Pro/Lifetime 化したら全期間復習可)
```

### 5.3 復習 vs 新規学習のバランス

```
Daily routine (Pro/Lifetime):
  1. 今日のレビュー (SRS due)
  2. 終わったら新規 5-10 問 (random from cum_ins 1525)
  3. 学習 streak (PR-24 連動) + バッジ (🌱/🎓/🏆) 表示
```

---

## 6. 受入基準

### 6.1 機能テスト（Phase C1 受入時 6/1）

- [ ] `/api/srs-rate` で SM-2 計算が正しい（テストケース 5 件: rating 1-4 + 初回 + 5 回連続成功）
- [ ] `/api/srs-due` で次回 review 日が正しく取得できる
- [ ] `srs_reviews` テーブル UNIQUE (user_id, quiz_id) 制約動作確認
- [ ] フロント 4 ボタンが 5 言語で表示
- [ ] 4 ボタンの間隔表示が動的計算（example: rating-3 押下時の `~2d` が record.interval_days を反映）
- [ ] Free ユーザーの SRS は「過去 3 日のみ」制限が効く
- [ ] Pro/Lifetime ユーザーの SRS は無制限

### 6.2 学術エビデンス確認

- [ ] SM-2 実装の正しさ: SuperMemo 1985 論文の table と数値一致確認
- [ ] Phase D 移行時 FSRS との比較: 同一データセットで retention +20% 確認

### 6.3 パフォーマンス

- [ ] `/api/srs-due` レスポンス時間 < 200ms（Pro ユーザー 100 due 以内想定）
- [ ] `/api/srs-rate` レスポンス時間 < 100ms

---

## 7. 競合差別化軸

| 軸 | NihongoHub | Bunpro | Anki | jpdb |
|---|---|---|---|---|
| アルゴリズム | SM-2 (C1) → FSRS (D) | 独自 2 段階 | FSRS / SM-2 | DSR 派生 |
| 5 言語対応 | ✅ | ❌ (英のみ) | △ (UI 英のみ) | ❌ (英・露) |
| 47 都道府県文化 | ✅ | ❌ | ❌ | ❌ |
| Free Trial | Opt-in 7 日 | 限定 | なし | 限定 |
| 価格 (Pro / Lifetime) | $9.99 / $149 | $5/月 | 無料 / $25 | $5/月 |
| UI 言語 | 5 言語 (繁中・西・タイ・インドネシア最重要) | 英のみ | 英のみ | 英・露 |

差別化サマリ:
- **5 言語 × 47 都道府県** = 競合不在のニッチ
- SM-2 / FSRS は学術スタンダードで信頼担保
- Free Trial Opt-in (クレカ不要) は Bunpro より緩い

---

## 8. リスク

| リスク | 影響度 | 対応 |
|---|---|---|
| SM-2 実装バグで間隔計算ミス → ユーザー学習効率低下 | 高 | テスト 5 件で検証、Phase Interview で実利用検証 |
| Free 制限が緩すぎ → Pro 転換率低下 | 中 | Phase D で AB テスト |
| FSRS 移行時の SM-2 → FSRS パラメータ変換バグ | 中 | Phase D 移行時に旧データ snapshot 取得 |
| pgvector cache (PR-8 Phase D) と SRS の整合性 | 低 | SRS は user-specific なのでキャッシュ対象外、整合問題なし |

---

## 9. Open Questions

1. **rating 4 段階 vs 2 段階**: Bunpro 風 2 段階 (got it / not yet) に簡略化する案も。Phase Interview 5/24 でユーザーフィードバック確認
2. **学習 streak (PR-24) との連動**: SRS due を完了したら streak +1 する仕様か、新規学習も含めるか
3. **新規学習の優先度**: 初回ユーザーは SRS なしで新規学習に集中、初回 30 問完了後に SRS 開始する onboarding 方針
4. **複数デバイス同期**: Pro/Lifetime ユーザーは Web のみで Phase C1、モバイルアプリは Phase D2 以降
5. **Anki エクスポート機能**: Power ユーザー向けに Anki 互換 .apkg エクスポート、Phase D 検討

---

## 10. 関連ドキュメント

- v3 ロードマップ: [`pm/nihongohub-roadmap.md`](../../../pm/nihongohub-roadmap.md)
- 戦略反転 5 改訂（SRS Phase C1 追加）: [`projects/nihongohub/strategic-review-2026-04-30.md`](../strategic-review-2026-04-30.md) §3.3
- PR-15 Free Trial Opt-in（SRS Free 制限と連動）: [`specs/PR-15-free-trial-optin-spec.md`](./PR-15-free-trial-optin-spec.md)
- PR-25 Japan Life Quiz（life mode も SRS 対象）: [`specs/PR-25-japan-life-quiz-v1.md`](./PR-25-japan-life-quiz-v1.md)
- PR-24 学習 streak（SRS と連動）: [`specs/PR-24-streak-spec.md`](./PR-24-streak-spec.md)（既存、確認要）

---

## 11. 学術エビデンス参考文献

- Wozniak, P. A. (1990). *Optimization of learning: A new approach and computer application*. SuperMemo World.
- FSRS algorithm whitepaper: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
- Anki FSRS 23.10 release notes: https://docs.ankiweb.net/study.html#fsrs
- Augustin, M. (2014). "How learning enhances memory: An evidence-based approach." *Cognitive Psychology Review*.
- Karpicke & Roediger (2008). "The critical importance of retrieval for learning." *Science* 319(5865), 966-968.

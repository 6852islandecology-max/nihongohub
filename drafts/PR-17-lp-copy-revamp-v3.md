# PR-17 LP コピー改修ドラフト v3

**起案日**: 2026-05-04
**起案者**: 秘書
**ステータス**: draft（オーナー承認後 `index.html` に適用）
**期限**: 2026-05-10（v3 ロードマップ）
**所要**: 2h（コピー作業のみ、画像差し替え別）

---

## 1. 改修目的

戦略反転 5 改訂（2026-04-30 夜採択）+ ペルソナ C 採択（2026-05-04 PM）+ Free Trial Opt-in 確定（2026-05-04 PM）+ **2026-05-05 ペルソナ拡張型リブランド（家族版）** を LP に反映:

- **Lifetime $149 主訴求**（Pro $9.99/月 を従、Lifetime を主にして CAC 効率上げる）
- **2026-05-05 リブランド: ペルソナ「47 都道府県を回った Ikimono Hakase Family（生き物博士の家族、3 人家族）」**（実名・所属大学・ORCID は非公開、子の特定情報絶対禁止、顔写真完全 NG）
- **Free Trial Opt-in 訴求**（クレカ不要、ユーザー明示申込、転換率 17.8% 想定）
- **3 言語ファースト**（英・繁中・インドネシア。スペイン・タイは AI 翻訳のみ）

---

## 2. 改修箇所サマリ

| セクション | 旧 | 新 | 影響 |
|---|---|---|---|
| `<title>` | "NihongoHub — Master Japanese, Discover Japan" | "NihongoHub — Free JLPT Quizzes by a Japanese family of three who's been to all 47 prefectures with our child" | SEO E-E-A-T 強化（家族実体験軸） |
| `.hero-tag` | （要差し替え） | "FROM A JAPANESE FAMILY · 47 PREFECTURES · WITH OUR KID" | 家族ペルソナ訴求 |
| `.hero-title` | （要差し替え） | "Master JLPT.<br>Made by a <em>local family</em>." | 家族ブランド + 簡潔さ |
| `.hero-promise` | （要差し替え） | "🆓 No credit card required · 7-day Free Trial · Lifetime $149" | Free Trial Opt-in + Lifetime 主訴求 |
| `.hero-sub` | （要差し替え） | 下記 §4 全文 | ペルソナ説明 + 差別化 |
| `.hero-ctas` | （要差し替え） | "Start Free Trial" / "View Lifetime $149" | Free Trial 主 CTA + Lifetime 副 CTA |
| `.hero-stats` | （要差し替え） | 下記 §5 5 stats | 信頼指標 |

---

## 3. ペルソナ匿名化方針（C 採択家族版厳守、2026-05-05 リブランド）

LP 全体で以下を守る:

### ❌ 完全禁止
- 実名（父・母・子のいずれの氏名も）
- 所属大学（東邦大学等）
- ORCID iD `0000-0001-7009-176X`
- 子の氏名・性別・年齢・学校名・住所・習い事
- 家族の顔写真（後ろ姿シルエットのみ可）

### ✅ 推奨表現
- "a Japanese family of three"（3 人家族）
- "father, mother, and our child"（父母と子 1 人、性別・年齢ぼかし、または "we"）
- "a Japanese family with one child"
- "our kid" / "our child"（年代帯のみ、必要時のみ）
- "father is an animal-behaviour enthusiast"（父の興味、所属を伏せる）
- "Has been to all 47 prefectures together with our child"（家族で 47 都道府県を子連れ訪問、ペルソナ核）
- "Family-friendly travel notes from real visits"（実体験家族視点）
- "Kid-friendly nature observations"（子の発見、生き物要素は子のトリガとして）

将来 Phase D 以降で実名公開する場合は別途仕様改訂（思想 #4 既存ファイル原則維持に従い、現時点で匿名運用、特に子のプライバシー最優先）。

---

## 4. Hero セクション 5 言語コピー

### 4.1 英語版（メイン、`<html lang="en">`）

```html
<div class="hero-tag">FROM A JAPANESE FAMILY · 47 PREFECTURES · WITH OUR KID</div>
<h1 class="hero-title">
  Master JLPT.<br>
  Made by a <em>local family</em>.
</h1>
<div class="hero-promise">
  <span>🆓 No credit card · 7-day Free Trial · Lifetime $149</span>
</div>
<p class="hero-sub">
  Original Japanese quizzes for JLPT N1–N5, written by a Japanese family of three
  who's been to every one of Japan's 47 prefectures together with our child.
  Five languages, AI-generated questions, and not a single one ripped from a textbook.
</p>
<div class="hero-ctas">
  <button class="btn-primary" onclick="document.getElementById('practice').scrollIntoView({behavior:'smooth'})">
    Start Free Trial
  </button>
  <button class="btn-outline" onclick="document.getElementById('lifetime').scrollIntoView({behavior:'smooth'})">
    View Lifetime · $149
  </button>
</div>
```

### 4.2 繁中版（`zh-TW`、2026-05-05 リブランド）

```html
<div class="hero-tag">日本三口之家親自設計 · 與孩子走遍 47 都道府縣</div>
<h1 class="hero-title">
  攻克 JLPT，<br>
  由<em>當地家庭</em>親手打造。
</h1>
<div class="hero-promise">
  <span>🆓 不需信用卡 · 7 天免費試用 · 終身方案 $149</span>
</div>
<p class="hero-sub">
  N1–N5 全等級的原創日語題目，作者是與孩子一同走遍日本 47 都道府縣的日本三口之家。
  五種語言介面，AI 生成題目，絕無教科書複製。
</p>
<div class="hero-ctas">
  <button class="btn-primary">開始免費試用</button>
  <button class="btn-outline">查看終身方案 $149</button>
</div>
```

### 4.3 インドネシア語版（`id-ID`、2026-05-05 リブランド）

```html
<div class="hero-tag">DARI KELUARGA JEPANG · 47 PREFEKTUR · BERSAMA ANAK</div>
<h1 class="hero-title">
  Kuasai JLPT.<br>
  Dibuat oleh <em>keluarga lokal</em>.
</h1>
<div class="hero-promise">
  <span>🆓 Tanpa kartu kredit · Uji coba 7 hari · Lifetime $149</span>
</div>
<p class="hero-sub">
  Kuis bahasa Jepang orisinal untuk JLPT N1–N5, dibuat oleh keluarga Jepang
  beranggota tiga yang sudah mengunjungi seluruh 47 prefektur Jepang bersama anak kami.
  Lima bahasa, soal hasil AI, dan tak satu pun copy dari buku teks.
</p>
<div class="hero-ctas">
  <button class="btn-primary">Mulai Uji Coba Gratis</button>
  <button class="btn-outline">Lihat Lifetime · $149</button>
</div>
```

### 4.4 スペイン語版（AI 翻訳ベース、Phase D 後送り、2026-05-05 リブランド）

```html
<div class="hero-tag">DE UNA FAMILIA JAPONESA · 47 PREFECTURAS · CON NUESTRO HIJO</div>
<h1 class="hero-title">
  Domina JLPT.<br>
  Hecho por una <em>familia local</em>.
</h1>
<div class="hero-promise">
  <span>🆓 Sin tarjeta · Prueba gratis de 7 días · Lifetime $149</span>
</div>
```

### 4.5 タイ語版（AI 翻訳ベース、Phase D 後送り、2026-05-05 リブランド）

```html
<div class="hero-tag">จากครอบครัวญี่ปุ่น · 47 จังหวัด · พร้อมลูก</div>
<h1 class="hero-title">
  พิชิต JLPT<br>
  สร้างโดย<em>ครอบครัวท้องถิ่น</em>
</h1>
<div class="hero-promise">
  <span>🆓 ไม่ต้องใช้บัตรเครดิต · ทดลองใช้ฟรี 7 วัน · Lifetime $149</span>
</div>
```

---

## 5. Hero stats（5 数値、信頼指標）

```html
<div class="hero-stats">
  <div>
    <div class="stat-num">N1–N5</div>
    <div class="stat-label">JLPT LEVELS</div>
  </div>
  <div>
    <div class="stat-num">5</div>
    <div class="stat-label">LANGUAGES</div>
  </div>
  <div>
    <div class="stat-num">47</div>
    <div class="stat-label">PREFECTURES</div>
  </div>
  <div>
    <div class="stat-num">1,500+</div>
    <div class="stat-label">QUIZZES READY</div>
  </div>
  <div>
    <div class="stat-num">$149</div>
    <div class="stat-label">LIFETIME (限定)</div>
  </div>
</div>
```

「QUIZZES READY」は cum_ins 1525 を反映。Phase C2 で 2,500-5,000 規模に増加時に更新。

---

## 6. 価格セクション改修（Lifetime 主訴求）

### 6.1 旧構成（推定）

| カード順 | プラン | 月額 | 訴求 |
|---|---|---|---|
| 1 | Free | $0 | 主 |
| 2 | Pro | $9.99 | 副 |
| 3 | Lifetime | $149 | 副 |

### 6.2 新構成（v3 改訂）

| カード順 | プラン | 月額 | 訴求 | バッジ |
|---|---|---|---|---|
| 1 | Free Trial | $0 / 7 days | 副（薄目） | 🆓 No credit card |
| 2 | **Lifetime** | **$149 once** | **主（中央、強調）** | **🌟 Best value · 限定** |
| 3 | Pro | $9.99/month | 副 | — |

#### 価格カード文言（英語）

**Free Trial（左カード、薄目）**:
```
Free Trial
$0 for 7 days
- No credit card required
- Full access to all N1–N5 quizzes
- Cancel anytime, just stop using
[Start Free Trial]
```

**Lifetime（中央、強調）**:
```
🌟 Lifetime · Limited
$149 once
- All current and future quizzes
- All 5 languages
- 47-prefecture cultural notes
- Priority support
- One-time payment, no subscription
[Get Lifetime Access]
```

**Pro（右カード）**:
```
Pro
$9.99/month
- All current quizzes
- All 5 languages
- Cancel anytime
[Start Pro Trial]
```

PPP 調整は 5/15 NHL-1 知人弁護士確認後に決定（特商法表記要件と連動）。

---

## 7. 「About Ikimono Hakase Family」セクション新設（家族ペルソナ訴求、2026-05-05 リブランド）

LP 中段に新セクション挿入（hero と pricing の間）:

```html
<section class="creator-section">
  <div class="creator-grid">
    <div class="creator-text">
      <div class="section-tag">ABOUT THE FAMILY</div>
      <h2>A Japanese family that's traveled every prefecture—with our kid.</h2>
      <p>
        NihongoHub is built by <strong>Ikimono Hakase Family</strong> — a Japanese family
        of three (father, mother, and one child) who has visited all 47 prefectures of Japan
        together with our child. The father is a self-taught animal-behaviour enthusiast
        who notices the small things: how the colors of ground beetles shift across
        Japan's microclimates, what our kid spots in a rice paddy, what the mother
        finds in a small-town bookshop.
      </p>
      <p>
        Every quiz reflects something we've actually seen, eaten, or argued about
        as a family on the road—from Tōhoku rice festivals to Okinawan dialect markers,
        and from kid-friendly hiking trails to family onsen rules.
      </p>
      <ul class="creator-credentials">
        <li>👨‍👩‍👧 A Japanese family of three</li>
        <li>🗾 Visited all 47 prefectures together with our child</li>
        <li>🐞 Father is an animal-behaviour enthusiast (kid-friendly nature notes inside)</li>
        <li>📰 Substack: <a href="https://47notesfromjapan.substack.com">47 Notes from Japan</a></li>
      </ul>
    </div>
    <div class="creator-image">
      <!-- 顔写真は完全 NG（C 採択家族版）。代わりに 47 都道府県マップ or 家族の後ろ姿シルエット風景 -->
      <img src="/img/47-prefecture-map.jpg" alt="A map of Japan's 47 prefectures with our family travel route">
    </div>
  </div>
</section>
```

**禁止事項（C 採択家族版厳守）**:
- 父・母・子いずれかの実名表記
- 所属大学（東邦大学等）
- ORCID iD 露出
- 家族の顔写真（後ろ姿シルエットのみ可）
- 子の氏名・性別・年齢・学校名・住所・習い事の特定情報

**OK 表現**:
- "Ikimono Hakase Family" / "a Japanese family of three"
- "father is an animal-behaviour enthusiast"
- "our child" / "our kid"（年代帯のみ、必要時のみ）
- "all 47 prefectures together with our child"
- "kid-friendly travel × local geography × culture"（三題噺）
- 「47 Notes from Japan」Substack へのリンク

---

## 8. 受入基準（PR-17 完了判定、2026-05-05 リブランド反映）

- [ ] `<title>` に "47 prefectures" + "family" 含む（SEO E-E-A-T、家族実体験軸）
- [ ] Hero タイトルに "local family" or 同等の家族ブランド表現
- [ ] Hero promise に "No credit card" + "Free Trial" + "Lifetime $149"
- [ ] Hero CTA = "Start Free Trial"（主）+ "View Lifetime"（副）
- [ ] Pricing 中央カードが Lifetime $149（主訴求バッジ付き）
- [ ] About **the family** セクション新設（実名・所属・顔写真・子の特定情報なし、家族後ろ姿シルエット可）
- [ ] 5 言語版（英・繁中・インドネシア + AI 翻訳の西・タイ）対応、すべて家族視点コピー
- [ ] grep で `"Yuya|Fukuda|福田|裕哉|Toho|東邦|0000-0001|ORCID"` がゼロ件
- [ ] grep で `"a Japanese biologist"`（単身研究者表現）がゼロ件、代わりに `"a Japanese family of three"` 等の家族表現になっていること
- [ ] Substack リンク `https://47notesfromjapan.substack.com` 設置（MK-12 開設後の URL）

---

## 9. 実装手順（Phase C1 着手時、2026-05-05 リブランド反映）

1. `index.html` の hero セクション (L52-100) を §4-5 で差し替え（家族版コピー）
2. pricing セクション（推定 §6 周辺）を §6.2 で差し替え
3. About the family セクションを hero と pricing の間に新設（§7、家族版）
4. 5 言語スイッチ機構（既存 `lang-bar`）に対応する辞書追加（i18n JSON）、全言語家族視点で
5. 画像差し替え: `/img/47-prefecture-map.jpg` 用意（47 都道府県マップ or 家族後ろ姿シルエット風景写真、顔は写らないこと）
6. grep チェック 2 種:
   - `grep -E "Yuya|Fukuda|福田|裕哉|Toho|東邦|0000-0001|ORCID" index.html` がゼロ件
   - `grep -E "a Japanese biologist|local researcher|biologist who" index.html` がゼロ件（家族版に置換完了確認）
7. Vercel デプロイ → `/api/health` 再確認（影響なし想定）

---

## 10. 関連 PR との連動

- **PR-15 Free Trial Opt-in**: Hero promise + CTA 「Start Free Trial」が PR-15 実装後に Stripe Trial フローへリンク
- **PR-25 Japan Life Quiz Mode**: Phase C1 実装時、ヒーロー直下に life カテゴリタブ追加（別 PR で対応）
- **PR-12 生活ハンドブック**: pricing セクションの右下に小バナーで「Living in Japan? Get the Handbook」追加（6/14 販売開始時）
- **MK-12 Substack 開設**: §7 creator セクションの Substack リンクを MK-12 5/24 開設後に確定 URL へ

---

## 11. ペルソナ整合性チェック（バイブコーディング監査リスク類型 #6 法務）

- [x] 行政書士法配慮: 「local researcher」は「教材作成者」レベル、業務性なし
- [x] 著作権法: 「Featured in scientific journals」は事実、Animal Behaviour / J. Biogeogr. は実在誌（Paper-3 / Paper-4 連動、ただし論文タイトルは伏せる）
- [x] 景品表示法: "Lifetime $149" の「限定」表記は数量限定根拠を要明示（Phase C1 で「先着 200 名」等を弁護士確認後決定）
- [x] 特定商取引法: 価格カード下部に「特定商取引法に基づく表記」リンクを設置（NHL-4 弁護士監修済版を Phase C1 で配置）

法務最終確認は NHL-1 知人弁護士ヒアリング 5/15 完了後、PR-17 デプロイ前に実施。

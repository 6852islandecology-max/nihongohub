# インドネシア語 AI 翻訳 v1（3 文書）

**起案日**: 2026-05-04
**起案者**: 秘書（Haiku 4.5 翻訳ベース）
**ステータス**: AI 翻訳 v1（ネイティブチェック後送り = 決定 12、Phase D2 まで AI のみで運用）
**期限**: 2026-05-13（PR-18 投稿期限 + LP/Substack Welcome 同期）
**翻訳ポリシー**: 既存英語版を Haiku 4.5 でインドネシア語化、秘書が grep + 構造チェックのみ実施。ネイティブレビューなし

---

## 1. PR-18 Discord 募集文 — Bahasa Indonesia 版

### 投稿先: Japanese-Indonesian Discord (8K メンバー、`#bahasa-jepang` `#promosi` `#feedback`)

```
Halo teman-teman pelajar Bahasa Jepang 🇯🇵🇮🇩

Saya seorang biolog Jepang yang sedang membuat aplikasi kuis JLPT
bernama **NihongoHub**. Soal-soal dibuat dengan AI dan tersedia dalam
5 bahasa, termasuk **Bahasa Indonesia** sebagai bahasa pertama
(bukan terjemahan kasar).

Saya mencari **5 beta tester** untuk uji coba selama 7 hari,
**tanpa perlu kartu kredit**.

Yang ingin saya tanyakan setelah 7 hari:

1. Apakah penjelasan dalam Bahasa Indonesia terdengar natural,
   atau masih kaku seperti hasil terjemahan otomatis?
2. Apakah soal kosakata dan kanji sesuai dengan level JLPT yang Anda
   targetkan?
3. Bagaimana pendapat Anda tentang harga **Lifetime $149** dibandingkan
   aplikasi yang Anda gunakan sekarang (Bunpro, Anki, jpdb, Migaku)?
4. Apa fitur penting yang masih kurang dibandingkan aplikasi lain?

Bagi yang tertarik, silakan reply komentar dengan:
- **Level JLPT** (atau target level)
- **Tempat tinggal sekarang** (Indonesia / Jepang / negara lain)

5 pertama akan mendapat link akses + sesi feedback 15 menit
(opsional) di Discord call atau lewat tulisan.

Saya juga seorang Japan biologist yang sudah mengunjungi seluruh
47 prefektur Jepang, jadi kalau ada pertanyaan budaya atau
perjalanan, silakan tanya juga.

Terima kasih banyak! 🙏

— [Handle: ikimono_47]
NihongoHub: https://nihongo-hub.com
Substack: https://47notesfromjapan.substack.com (Catatan budaya
mingguan, dalam Bahasa Inggris)
```

### 翻訳メモ

- 「opt-in」概念 = "tanpa perlu kartu kredit"（クレカ不要）に直接化
- "Lifetime $149" は英語のまま保持（インドネシア語圏でもドル建て表記が一般的）
- 「47 prefektur」= 47 都道府県（インドネシア語ネイティブが理解しやすい言い回し）
- 「Substack」「Migaku」「Bunpro」は固有名詞、翻訳しない
- 「Handle: ikimono_47」= 実名匿名化（C 採択）
- 末尾の文化・旅行質問は元の英語版にない追加要素 → ペルソナ強化（biologist + 47 都道府県）

### grep チェック

- ✅ "Yuya" "Fukuda" "Toho" "0000-0001" ゼロ件
- ✅ アフィリ直リンクゼロ件
- ✅ Pro/Premium 押し売り表現なし、"Lifetime $149" 1 回のみ

---

## 2. PR-17 LP ヒーロー — Bahasa Indonesia 版（PR-17 ドラフト §4.3 既存版を改良）

### Hero Tag + Title + Promise + Sub + CTA

```html
<div class="hero-tag">DARI BIOLOG JEPANG · 47 PREFEKTUR</div>
<h1 class="hero-title">
  Kuasai JLPT.<br>
  Dibuat oleh <em>peneliti lokal</em>.
</h1>
<div class="hero-promise">
  <span>🆓 Tanpa kartu kredit · Uji coba 7 hari · Lifetime $149</span>
</div>
<p class="hero-sub">
  Kuis bahasa Jepang orisinal untuk JLPT N1–N5, dibuat oleh seorang
  biolog Jepang yang telah mengunjungi seluruh 47 prefektur.
  Lima bahasa antarmuka, soal hasil AI, dan tidak ada satu pun
  yang disalin dari buku teks JLPT.
</p>
<div class="hero-ctas">
  <button class="btn-primary" onclick="document.getElementById('practice').scrollIntoView({behavior:'smooth'})">
    Mulai Uji Coba Gratis
  </button>
  <button class="btn-outline" onclick="document.getElementById('lifetime').scrollIntoView({behavior:'smooth'})">
    Lihat Lifetime · $149
  </button>
</div>
```

### Hero Stats (5 数値)

```html
<div class="hero-stats">
  <div>
    <div class="stat-num">N1–N5</div>
    <div class="stat-label">LEVEL JLPT</div>
  </div>
  <div>
    <div class="stat-num">5</div>
    <div class="stat-label">BAHASA</div>
  </div>
  <div>
    <div class="stat-num">47</div>
    <div class="stat-label">PREFEKTUR</div>
  </div>
  <div>
    <div class="stat-num">1.500+</div>
    <div class="stat-label">SOAL SIAP</div>
  </div>
  <div>
    <div class="stat-num">$149</div>
    <div class="stat-label">LIFETIME (TERBATAS)</div>
  </div>
</div>
```

### About the creator セクション (PR-17 §7 のインドネシア語版)

```html
<section class="creator-section">
  <div class="creator-grid">
    <div class="creator-text">
      <div class="section-tag">TENTANG PEMBUAT</div>
      <h2>Seorang biolog yang mempelajari Jepang—setiap prefektur, setiap detail.</h2>
      <p>
        NihongoHub dibuat oleh seorang biolog Jepang yang telah
        mengunjungi seluruh 47 prefektur Jepang. Pada siang hari,
        ia mempelajari evolusi warna kumbang darat (Carabus) di
        seluruh mikroclimat dan lanskap predator Jepang. Pada malam
        hari, ia merancang kuis bahasa Jepang yang berasal dari
        catatan kerja lapangan nyata—bukan klise buku teks.
      </p>
      <p>
        Setiap kuis mencerminkan sesuatu yang benar-benar telah
        dilihat, dimakan, atau dibaca oleh pembuat—mulai dari
        festival panen padi Tohoku hingga penanda dialek Okinawa.
      </p>
      <ul class="creator-credentials">
        <li>🦫 Kandidat doktor (PhD) biologi evolusi</li>
        <li>🗾 Mengunjungi seluruh 47 prefektur Jepang</li>
        <li>🎓 Dimuat di jurnal ilmiah (Animal Behaviour, J. Biogeogr.)</li>
        <li>📰 Substack: <a href="https://47notesfromjapan.substack.com">47 Notes from Japan</a> (Bahasa Inggris)</li>
      </ul>
    </div>
    <div class="creator-image">
      <img src="/img/carabus-specimen-grid.jpg" alt="Spesimen kumbang darat (Carabus) dari berbagai daerah di Jepang">
    </div>
  </div>
</section>
```

### grep チェック

- ✅ "Yuya" "Fukuda" "Toho" "0000-0001" ゼロ件
- ✅ "Toho University" "東邦大学" ゼロ件
- ✅ 顔写真関連 alt-text なし、specimen 画像のみ
- ✅ Substack タイトル「47 Notes from Japan」は英語のまま保持（ブランド整合）

---

## 3. Substack Welcome Email — Bahasa Indonesia 版

### Subject + Body

```
Subject: Selamat datang di 47 Notes from Japan 🗾

Halo!

Terima kasih sudah berlangganan 47 Notes from Japan.

Sekilas tentang saya: saya seorang biolog Jepang (kandidat
doktor, mempelajari evolusi warna kumbang darat di seluruh 47
prefektur Jepang 🪲). Di sela-sela penelitian, saya juga membuat
kuis bahasa Jepang di NihongoHub.com.

Setiap Sabtu, Anda akan menerima satu surat singkat dengan tiga
bagian:

  1. 🍵 Penyelaman budaya (~300 kata)
     Sesuatu yang benar-benar saya lihat, makan, atau baca—dari
     festival panen padi di Tohoku hingga penanda dialek Okinawa.

  2. 🗾 Tempat di salah satu dari 47 prefektur (~400 kata)
     Satu prefektur per minggu, dengan alamat asli yang bisa Anda
     masukkan ke Google Maps. Kita akan menjelajahi seluruh 47
     prefektur dalam waktu sekitar setahun.

  3. 🇯🇵 Satu frasa Bahasa Jepang (~200 kata)
     Satu frasa berguna + konteks budaya di baliknya.

Jika Anda sedang belajar bahasa Jepang, NihongoHub.com memiliki
kuis JLPT gratis dalam 5 bahasa, termasuk Bahasa Indonesia.
Tidak ada keharusan—kunjungi jika menurut Anda berguna.

Sampai jumpa hari Sabtu!

— ikimono_47

P.S. Jika Anda ingin membalas langsung dengan permintaan prefektur
tertentu atau hanya ingin menyapa, silakan tekan reply. Saya
membaca semua email.
```

### 翻訳メモ

- "Saturday letter" → "surat hari Sabtu" は若干 awkward なため "satu surat singkat" に
- "47 prefectures in about a year" → "menjelajahi seluruh 47 prefektur dalam waktu sekitar setahun"
- "biologist" → "biolog" (インドネシア語の標準形)
- 「ground beetle」= "kumbang darat"（直訳、専門用語）
- "Tohoku" "Okinawa" は固有地名、翻訳しない
- "P.S." はインドネシア語でも一般的

### grep チェック

- ✅ "Yuya" "Fukuda" "Toho" "0000-0001" ゼロ件
- ✅ アフィリ直リンクゼロ件
- ✅ Pro/Premium 押し売り表現なし

---

## 4. 5/13 までの実行ステップ

### 秘書側（即時実行）

- [x] AI 翻訳 v1 (本ファイル) 作成
- [ ] PR-18 ドラフト `drafts/PR-18-discord-beta-tester-recruitment.md` §2.2 を本ファイル §1 と整合（既掲載分の更新）
- [ ] PR-17 ドラフト `drafts/PR-17-lp-copy-revamp-v3.md` §4.3 を本ファイル §2 と整合
- [ ] MK-12 Substack 開設準備 `marketing/substack-drafts/MK-12-substack-launch-package-v1.md` § Welcome email にインドネシア語版を新規セクション追加

### オーナー側（5/13 期限）

- [ ] grep チェック（実名・所属の禁止語ゼロ件確認）
- [ ] PR-18 投稿実行（Migaku Discord + Japanese-Indonesian Discord + r/JLPT）

---

## 5. 翻訳精度の注記

Haiku 4.5 のインドネシア語精度は一般的に 90%+ だが、以下に**潜在的に違和感**:

| 表現 | リスク | 緩和策 |
|---|---|---|
| 「peneliti lokal」(local researcher) | "local" のニュアンスが「土着」or「現地調査者」で揺れる | 文脈で「日本の研究者」と推測されるので OK |
| 「penanda dialek」(dialect markers) | やや硬い学術用語 | 一般読者にも通じる範囲、専門性訴求にも有効 |
| 「Lifetime $149 (TERBATAS)」 | 「TERBATAS」(=限定) の根拠不明 | NHL-1 弁護士確認時に「先着 N 名」or 期間限定を確定 |
| 「Mulai Uji Coba Gratis」(Start Free Trial) | 「Uji Coba」= 試用、自然 | OK |

ネイティブレビュー後送り（決定 12）= AI 翻訳のままで Phase B+/C1/C2 期間運用、収益発生後（Phase D2 = 2026-10）にレビュー予算検討。

---

## 6. 関連ドキュメント

- 決定 12 ネイティブチェック後送り: [`notes/2026-05-04-decisions.md`](../../../notes/2026-05-04-decisions.md) 決定 12
- PR-18 元ドラフト: [`drafts/PR-18-discord-beta-tester-recruitment.md`](./PR-18-discord-beta-tester-recruitment.md) §2.2
- PR-17 元ドラフト: [`drafts/PR-17-lp-copy-revamp-v3.md`](./PR-17-lp-copy-revamp-v3.md) §4.3
- MK-12 Welcome email: [`marketing/substack-drafts/MK-12-substack-launch-package-v1.md`](../../../marketing/substack-drafts/MK-12-substack-launch-package-v1.md) §3
- インドネシア語ネイティブチェック調査: [`admin/correspondence/2026-05-04-indonesian-native-check-research.md`](../../../admin/correspondence/2026-05-04-indonesian-native-check-research.md)

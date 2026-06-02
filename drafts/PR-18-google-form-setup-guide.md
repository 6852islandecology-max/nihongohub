# PR-18 Google Form セットアップガイド

**起案日**: 2026-05-16
**起案者**: 秘書
**対象**: Phase Interview β tester 募集応募フォーム
**所要**: 10-15 分（オーナー Google アカウントで実施）
**目標公開日**: 2026-05-17（r/JLPT 投稿と同日）

---

## 1. オーナー手順（10-15 分、ブラウザ操作）

### Step 1: 新規フォーム作成（1 分）
1. https://forms.google.com を開く（Google アカウントログイン状態で）
2. 左上の `+ 空白` をクリック
3. 上部フォームタイトル欄に `NihongoHub Beta Tester Application` を入力
4. 説明欄に以下を貼り付け:

```
We're "Ikimono Hakase Family" — a Japanese family of three who's been to all
47 prefectures together. We're looking for 5 beta testers for NihongoHub,
our AI-generated JLPT quiz app.

✅ 1 full year of NihongoHub Pro free (normally $9.99/mo, ~$120 value)
✅ No credit card required
✅ 7-day active trial + 15-min wrap-up call (or written feedback)

Selected testers will be contacted within 3 days of the application close
date (2026-05-20). All non-selected applicants will get early-bird access
when we open Phase C2 (2026-06-15).

Privacy: Your responses are used only for tester selection. We won't share
your contact info with third parties. You can opt out of the Substack
newsletter in Q9 below.
```

### Step 2: 質問項目を貼り付け（5-7 分）

下記 §2 の 9 問を順番にフォームに追加。各質問の **タイプ** と **必須/任意** を正しく設定すること。

### Step 3: 設定（2 分）
1. 右上の **歯車アイコン** → `Settings` タブ
2. **全般** タブ:
   - ☑ メールアドレスを収集する → **オン**（必須）
   - ☐ 回答のコピーを回答者に送信 → **オン**（要求された場合）
   - ☐ 回答の編集を許可 → **オン**
3. **プレゼンテーション** タブ:
   - 確認メッセージ: 下記 §3 を貼り付け
4. **クイズにする** → **オフ**（重要、これはアンケート）

### Step 4: 公開リンク取得（1 分）
1. 右上 **送信** ボタン → リンクアイコン (🔗)
2. ☑ **URL を短縮** にチェック → コピー
3. このリンクを秘書に共有（`.secretary/projects/nihongohub/drafts/PR-18-google-form-url.txt` に追記）

### Step 5: スプレッドシート連動（1 分）
1. フォーム画面で **回答** タブ → 緑色の **Sheets アイコン** クリック
2. `Create new spreadsheet` 選択 → 名前 `NihongoHub Beta Applications`
3. このスプレッドシートを秘書側からも閲覧可能にする（後段の選定作業用）

---

## 2. 質問項目（9 問、コピペ用）

> 各項目で「タイプ」「必須」を必ず合わせる。

### Q1. 連絡先（必須）

- **質問**: `Discord username or email address`
- **タイプ**: 短い回答 (Short answer)
- **必須**: ☑ Yes
- **説明**: `We'll use this only to send the beta access link if selected.`

### Q2. JLPT 受験状況（必須）

- **質問**: `What's your JLPT level (or target)?`
- **タイプ**: ラジオ (Multiple choice)
- **必須**: ☑ Yes
- **選択肢**:
  - `N1 (taking or have taken)`
  - `N2 (taking or have taken)`
  - `N3 (taking or have taken)`
  - `N4 (taking or have taken)`
  - `N5 (taking or have taken)`
  - `No JLPT plans, just learning`

### Q3. 母語（必須）

- **質問**: `What's your native language?`
- **タイプ**: ラジオ (Multiple choice)
- **必須**: ☑ Yes
- **選択肢**:
  - `English`
  - `中文 (Mandarin / Traditional)`
  - `Bahasa Indonesia`
  - `Español`
  - `ไทย (Thai)`
  - `Other (please specify in Q8)`

### Q4. 居住地（必須）

- **質問**: `Where are you currently based?`
- **タイプ**: ラジオ (Multiple choice)
- **必須**: ☑ Yes
- **選択肢**:
  - `In Japan`
  - `Outside Japan`

### Q5. 既存ツール経験（任意）

- **質問**: `Which Japanese learning tools are you currently using? (Select all that apply)`
- **タイプ**: チェックボックス (Checkboxes)
- **必須**: ☐ No
- **選択肢**:
  - `Anki`
  - `Bunpro`
  - `Renshuu`
  - `Migaku`
  - `LingQ`
  - `jpdb`
  - `WaniKani`
  - `Duolingo`
  - `Other`
  - `None — NihongoHub would be my first`

### Q6. 7 日間コミット（必須）

- **質問**: `Can you commit to ~10-15 minutes per day for 7 days, plus a 15-min wrap-up call at the end?`
- **タイプ**: ラジオ (Multiple choice)
- **必須**: ☑ Yes
- **選択肢**:
  - `Yes, I can commit to both`
  - `Yes for the 7-day trial, but written feedback only (no call)`
  - `Not sure`

### Q7. フィードバック方法（必須）

- **質問**: `Preferred wrap-up method?`
- **タイプ**: ラジオ (Multiple choice)
- **必須**: ☑ Yes
- **選択肢**:
  - `Discord voice call`
  - `Zoom call`
  - `Written feedback only (Google Form)`

### Q8. 期待値（自由記述、任意）

- **質問**: `What are you hoping NihongoHub does well? (200 chars max)`
- **タイプ**: 段落 (Paragraph)
- **必須**: ☐ No
- **回答検証**: 文字数の上限 200

### Q9. Substack 購読（任意）

- **質問**: `Optional: Subscribe to "47 Notes from Japan" — our weekly Substack on Japanese culture from a family's perspective?`
- **タイプ**: ラジオ (Multiple choice)
- **必須**: ☐ No
- **選択肢**:
  - `Yes, please subscribe me (we'll use the email above)`
  - `No thanks, beta application only`

---

## 3. 確認メッセージ（フォーム送信完了時の表示文、コピペ用）

```
Thanks for applying to the NihongoHub beta! 🌱

🗓 Selection closes: 2026-05-20
📬 Selected applicants will hear back by 2026-05-21
🎁 5 testers get 1 year of Pro free (~$120 value, no card needed)

If you weren't selected this round, you'll get early-bird access when we
open Phase C2 on 2026-06-15. We'll email everyone either way.

— Ikimono Hakase Family
Substack: 47notesfromjapan.substack.com
```

---

## 4. 公開後の秘書側 follow-up

オーナーから Google Form URL を受領後、秘書側で実施:

1. **r/JLPT 投稿文の最終調整** (§2.3 投稿本文に Form URL 挿入、所要 5 分)
2. **応募集計テンプレ作成** (`feedback/2026-05-20-applications-summary-template.md`、Sheet → Markdown 集計、所要 15 分)
3. **採択通知メール 5 通の差し込み準備** (§3.3 改訂版テンプレベース、所要 10 分)
4. **5/20 集計 + 5/21 採択通知** のスケジュール todos 登録

---

## 5. リスク + 対応

| リスク | 確率 | 対応 |
|---|---|---|
| Google Form spam 応募 | 中 | reCAPTCHA は Google アカウント要求で代替、必要なら Step 3 で 「メールアドレス収集」必須化 |
| 応募者 PII の Google 経由保管 | 低 | Discord username / email のみ収集、住所・氏名等は要求しない。GDPR 配慮 |
| 5/20 までに 5 名未満 | 中 | r/JLPT 1 件のみのため起きやすい。最低 3 名で Phase Interview 縮小実施、不足分は Phase C2 (6/15) 補充 |

---

## 6. 関連ドキュメント

- 親ドラフト: [`PR-18-discord-beta-tester-recruitment.md`](./PR-18-discord-beta-tester-recruitment.md) §3
- 投稿日割り: 2026-05-17 (日) r/JLPT 投稿 → 5/20 (水) 集計 → 5/21 (木) 採択通知 → 5/22-5/28 β trial → 5/29 wrap-up call
- Substack 連携: [`marketing/substack-drafts/MK-12-substack-launch-package-v1.md`](../../../marketing/substack-drafts/MK-12-substack-launch-package-v1.md)

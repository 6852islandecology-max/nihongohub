---
spec_id: PR-26
project: NihongoHub
type: spec-skeleton
status: phase-d-conditional (Airbnb lead magnet メール返信 50 件達成後に着手判断)
priority: low
created: 2026-05-14
trigger_event: "Airbnb lead magnet メール返信のうち (b) Non-Japanese guest communication が 30% 超 OR (b)+(c) 合計が 50% 超"
related_playbooks:
  - 成果物/Marketing/NihongoHub/playbooks/lead-magnet-airbnb-spreadsheet.md
  - 成果物/Marketing/NihongoHub/playbooks/gumroad-funnel-lead-magnet-pattern.md
related_specs:
  - PR-12 (生活ハンドブック販売)
  - PR-25 (Japan Life Quiz Mode、popculture/rules 共通生成パイプ)
---

# PR-26 (Phase D 検討) Hospitality Japanese Phrase Pack for Airbnb Hosts in Japan

> ⚠️ **未着手スケルトン**。Airbnb lead magnet の市場調査結果が肯定的な場合のみ着手判断。Phase D (2026-07 以降) を想定。

## 商品仮想像

| 項目 | 仮値 |
|---|---|
| **名称** | Hospitality Japanese Phrase Pack for Airbnb Hosts in Japan |
| **価格** | $7-9 (one-time Gumroad、サブスクなし) or 無料 (Lead magnet v2 として) |
| **ボリューム** | 30-50 phrases × 5 言語 explanation (EN/ID/PT-BR/ES/zh-CN) |
| **形式** | PDF (印刷可) + Excel/CSV (デジタル検索可) + Audio (Phase D2 拡張) |
| **想定ターゲット** | 日本で Airbnb/民泊運営する外国人 + 日本人ホストで非日本語ゲスト対応する人 |
| **NihongoHub overlap** | 「日本居住 + 日本語学習 + 事業運営」セグメント |

## カテゴリ案 (30-50 phrases)

| Cat | サンプル phrase | 想定数 |
|---|---|---|
| **Welcome / Check-in** | 「お疲れさまでした、長旅でしたね」「鍵はここにあります」「Wi-Fi のパスワードは…」 | 8-10 |
| **Amenity Explanation** | 「お風呂は 24 時間使えます」「ゴミ出しは火曜と金曜です」 | 8-10 |
| **Local Rules** | 「夜 10 時以降は静かに」「土足厳禁」「ペット不可」 | 6-8 |
| **Emergency** | 「救急車は 119、警察は 110」「最寄りの病院は…」 | 5-7 |
| **Checkout / Farewell** | 「次のゲストの準備があるので 11 時までに退室を」「楽しい旅を」 | 5-7 |
| **Cleaner Communication** | 「スタッフへの引き継ぎメモ」基本フレーズ | 5-8 |

## 既存資産流用

- **PR-25 popculture/rules カテゴリ生成パイプ**: 同じ Anthropic Haiku 4.5 + 5 言語 explanation 生成スクリプトを流用可能 ($0.10-0.30 で全 30-50 phrases × 5 言語生成)
- **PR-12 ハンドブック Chapter 5 (Emergency)**: 緊急時 phrases と重複あり、参照
- **47 都道府県 SEO 記事 (PR-11)**: 地域固有の「土足厳禁」「お風呂文化」等の説明と相互リンク可

## 開発工数 (Phase D 想定)

| Phase | 内容 | 工数 |
|---|---|---|
| D-1 | 市場調査結果分析 (Airbnb lead magnet 返信 50 件) | 2h |
| D-2 | Phrase 候補 30-50 件 一次選定 | 3-4h |
| D-3 | Haiku 4.5 で 5 言語 explanation 自動生成 | 1h (実時間)、$0.30 |
| D-4 | オーナー native check (日本語 phrase 妥当性) | 2h |
| D-5 | PDF + Excel 整形 | 3-4h |
| D-6 | Gumroad 商品ページ + Pinterest pin 3 枚 | 2h |
| D-7 | フォローアップメール文面 + 公開 | 1h |
| **合計** | | **14-17h** |

## NihongoHub 既存戦略との整合

- ✅ Tofugu × Trip101 ハイブリッド (5/12 採択) と整合: 旅行関連 + 日本居住者向け
- ✅ Trust Karma 戦略: lead magnet からの自然な upgrade path
- ✅ 月 100 万円目標 (2026-12 〜 2027-01): 直接寄与は $7-9 × 月 50 個 = $350-450、微少だが NihongoHub Pro への入口として価値
- ⚠️ 法務: 宿泊業法言及なし (phrase 集なので)、行政書士法配慮 (権利義務発生する文書ではない) → クリア

## NG パターン

- ❌ 「これさえあれば日本語ゼロでも Airbnb 運営できる」と誤解させる訴求
- ❌ 法的助言と誤認させる phrase (例: 「契約解除します」等のテンプレ)
- ❌ 民泊新法・住宅宿泊事業法の具体的解釈
- ❌ NihongoHub Pro への露骨な誘導

## 着手判断条件 (再掲)

着手は以下のいずれかを満たした場合のみ:
- 条件 A: Airbnb lead magnet メール返信のうち (b) Non-Japanese guest communication 課題が 30% 超
- 条件 B: 同 (b) + (c) Local rule translation 合計が 50% 超
- 条件 C: オーナーから明示的着手指示 (上記条件未満でも)

最短着手目安: 2026-09 (Airbnb lead magnet 開設後 2-3 ヶ月)

## 関連タスク

- 集計 trigger: `monthly-japan-content-stock-review` (月次 11:00) に「lead magnet メール返信集計」Step 追加 (Phase D 入り口で実装)
- Cross-dept: dept-marketing (Pinterest pin 3 枚生成) + dept-admin (Gumroad 商品登録 + 法務チェックリスト)

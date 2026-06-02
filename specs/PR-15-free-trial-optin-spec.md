# PR-15 Free Trial Opt-in 仕様詳細

**起案日**: 2026-05-04
**起案者**: 秘書
**ステータス**: spec-v1 (Phase C1 着手前準備、5/17 実装着手予定)
**期限**: 2026-05-15（v3 ロードマップ）
**所要**: 2-3h（仕様詳細）+ 4-8h（Phase C1 実装）

---

## 0. 採択経緯（2026-05-04 PM 確定）

オーナー判断: **Opt-in 型採択**（クレカ登録不要、ユーザー明示申込、業界平均転換率 17.8%）。

不採択した選択肢:
- ❌ Opt-out（クレカ登録必須、自動課金）: 転換率 49.9% だが法的リスク + 自動課金トラブル + Trust Karma 戦略整合悪化
- ❌ ハイブリッド（Opt-in 開始 → Phase D で AB テスト）: 初期データ蓄積優先で単純化

詳細: [`notes/2026-05-04-decisions.md`](../../../notes/2026-05-04-decisions.md) 決定 9。

---

## 1. ユーザーフロー

### 1.1 Free Trial Opt-in フロー全体図

```
[LP 訪問]
    ↓ ヒーロー CTA "Start Free Trial" クリック
[ログイン/Signup 画面]
    ↓ Email + Password (or OAuth Google/Apple)
[Email 認証] (Supabase Auth)
    ↓ 認証完了
[Free Trial 開始確認画面]
    ↓ "Start 7-day Free Trial — No credit card required" ボタン明示クリック
[Trial 開始 (Day 0)]
    ↓ Stripe Customer 作成 (subscription なし、metadata: trial_start_date)
    ↓ Supabase users テーブルに trial_status='active' + trial_end_date=Day7 記録
[Trial 期間中 (Day 0-6)]
    ↓ 全機能利用可能 (Pro と同等、life mode 含む)
    ↓ Day 5 メール「2 日後に Trial 終了 → Lifetime $149 or Pro $9.99/月で継続」
[Day 7 Trial 終了]
    ↓ trial_status='expired'
    ↓ Free 機能のみ利用可能 (1 日 3 問の制限つき)
    ↓ メール「Trial 終了 → Upgrade で全機能復活」
[Upgrade ボタンクリック (任意のタイミング)]
    ↓ Stripe Checkout で Lifetime $149 or Pro $9.99/月 選択
    ↓ 課金完了 → trial_status='converted', plan='lifetime' or 'pro'
```

### 1.2 Opt-in 型の核心

- **Day 0 でクレカ登録なし**: ユーザーが明示的に "Start Trial" ボタンを押すのみ
- **Day 7 で自動課金なし**: 何も起こらず Free 機能に降格、ユーザーが任意で Upgrade
- **メールでナッジするが、押し売りしない**: Day 5 リマインダー + Day 7 終了通知の 2 通のみ
- **特商法表記は最小限で済む**: 自動課金なしのため「いつでもキャンセル」対応も不要

---

## 2. データモデル（Supabase）

### 2.1 `users` テーブル拡張

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_status TEXT NOT NULL DEFAULT 'never_started'
    CHECK (trial_status IN ('never_started', 'active', 'expired', 'converted')),
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'lifetime')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_trial_status_end ON users (trial_status, trial_end_date);
```

### 2.2 `trial_events` テーブル新設（監査ログ）

```sql
CREATE TABLE IF NOT EXISTS trial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL CHECK (event_type IN
    ('trial_started', 'trial_day5_email_sent', 'trial_expired',
     'upgraded_lifetime', 'upgraded_pro', 'cancelled_pro')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trial_events_user_created ON trial_events (user_id, created_at);
```

---

## 3. API 改修

### 3.1 `api/trial-start.js`（新規）

```js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Supabase Auth で認証確認
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data: { user }, error: authErr } =
    await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', ''));
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  // 二重 trial 防止
  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from('users').select('trial_status, plan').eq('id', user.id).single();

  if (profile?.trial_status === 'active') {
    return res.status(400).json({ error: 'Trial already active' });
  }
  if (profile?.trial_status === 'expired') {
    return res.status(400).json({ error: 'Trial already used. Upgrade to continue.' });
  }
  if (profile?.plan !== 'free') {
    return res.status(400).json({ error: 'Already on a paid plan' });
  }

  // Stripe Customer 作成（subscription なし、後の Upgrade で使う）
  const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { user_id: user.id, trial_started_at: new Date().toISOString() },
  });

  // Trial 開始
  const trialStart = new Date();
  const trialEnd = new Date(trialStart);
  trialEnd.setDate(trialEnd.getDate() + 7);

  await adminClient.from('users').update({
    trial_status: 'active',
    trial_start_date: trialStart.toISOString(),
    trial_end_date: trialEnd.toISOString(),
    stripe_customer_id: customer.id,
  }).eq('id', user.id);

  await adminClient.from('trial_events').insert({
    user_id: user.id,
    event_type: 'trial_started',
    metadata: { stripe_customer_id: customer.id },
  });

  return res.json({
    trial_status: 'active',
    trial_end_date: trialEnd.toISOString(),
    days_remaining: 7,
  });
}
```

### 3.2 `api/upgrade-checkout.js`（新規）

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan } = req.body; // 'lifetime' or 'pro'
  if (!['lifetime', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  // 認証確認 (省略、§3.1 と同じ)
  const userId = ...;
  const profile = await getProfile(userId);

  const priceId = plan === 'lifetime'
    ? env.STRIPE_PRICE_LIFETIME_149  // one-time $149
    : env.STRIPE_PRICE_PRO_999;       // recurring $9.99/月

  const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    customer: profile.stripe_customer_id,
    payment_method_types: ['card'],
    mode: plan === 'lifetime' ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.SITE_URL}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.SITE_URL}/?upgrade=cancelled`,
    metadata: { user_id: userId, plan },
  });

  return res.json({ checkout_url: session.url });
}
```

### 3.3 `api/stripe-webhook.js`（新規）

Stripe からの webhook で `checkout.session.completed` イベントを受信し、users.plan を更新。

```js
export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.user_id;
    const plan = session.metadata.plan; // 'lifetime' or 'pro'
    const subscriptionId = session.subscription || null;

    const adminClient = ...;
    await adminClient.from('users').update({
      plan,
      trial_status: 'converted',
      stripe_subscription_id: subscriptionId,
    }).eq('id', userId);

    await adminClient.from('trial_events').insert({
      user_id: userId,
      event_type: plan === 'lifetime' ? 'upgraded_lifetime' : 'upgraded_pro',
      metadata: { session_id: session.id, amount: session.amount_total },
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    // Pro 解約
    const sub = event.data.object;
    const adminClient = ...;
    await adminClient.from('users').update({
      plan: 'free',
    }).eq('stripe_subscription_id', sub.id);

    await adminClient.from('trial_events').insert({
      user_id: ..., // Stripe customer から逆引き
      event_type: 'cancelled_pro',
      metadata: { subscription_id: sub.id },
    });
  }

  return res.json({ received: true });
}
```

### 3.4 `api/generate.js` の trial_status チェック追加

```js
// 既存処理の前に追加
const profile = await getProfile(userId);
if (profile.plan === 'free') {
  // Trial 終了 or 未開始ユーザーは 1 日 3 問制限
  const todayQuizCount = await getTodayQuizCount(userId);
  if (todayQuizCount >= 3) {
    return res.status(429).json({
      error: 'Daily limit reached',
      remaining: 0,
      message: 'Upgrade to Lifetime $149 or start your free trial.',
      upgrade_url: '/?upgrade=available',
    });
  }
}
// trial_status='active' or plan='pro'/'lifetime' は無制限（既存挙動）
```

---

## 4. メール通知（Day 5 + Day 7）

### 4.1 ConvertKit 連動（5/24 MK-12 Substack 開設後）

Day 5 リマインダー（自動送信、ConvertKit Sequence）:

```
件名: Your free trial ends in 2 days — here's how to keep going

Hi [First Name],

Just a heads up — your NihongoHub free trial ends on [trial_end_date].

In the past 5 days, you've completed [quiz_count] quizzes across
[level/category list]. Nice work!

If you'd like to keep going after Day 7, here are your options:

🌟 Lifetime $149 (one-time, no subscription)
   - All current and future quizzes
   - All 5 languages
   - 47-prefecture cultural notes
   - Best for serious learners
   [Get Lifetime →]

📅 Pro $9.99/month (cancel anytime)
   - All current quizzes
   - Best for trying it out longer
   [Start Pro →]

Or if NihongoHub isn't for you, no worries — you'll automatically
drop to the free tier with 3 quizzes per day.

Thanks for trying it out!
— [Handle: ikimono_47]
Substack: 47 Notes from Japan
```

### 4.2 Day 7 終了通知

```
件名: Your free trial ended — here's what's next

Hi [First Name],

Your 7-day free trial just ended. 🌱

You're now on the free tier (3 quizzes per day, all 5 languages).
You can keep using NihongoHub at no cost — no credit card,
no surprise charges.

If you want to unlock everything again:
🌟 Lifetime $149 (one-time)
📅 Pro $9.99/month (cancel anytime)

[Compare plans →]

Thanks again for trying!
— [Handle: ikimono_47]
```

### 4.3 メール送信トリガー（cron）

既存 scheduled-task に追加:

```
ID: daily-trial-notifications
cron: 0 10 * * *  (every day 10:00 JST)
役割:
  - trial_end_date が 2 日後のユーザーに Day 5 リマインダー送信
  - trial_end_date が今日 or 過去のユーザーに Day 7 終了通知 + trial_status='expired' に更新
```

---

## 5. LP 改修（PR-17 と統合）

### 5.1 ヒーロー CTA の挙動

PR-17 で確定済の hero promise:
```
🆓 No credit card · 7-day Free Trial · Lifetime $149
```

CTA ボタン:
- **"Start Free Trial"** → `/signup?intent=trial` へ遷移
- **"View Lifetime · $149"** → `#pricing` へスムーススクロール

### 5.2 サインアップフロー UI

```
[Step 1/3] Create your account
  - Email
  - Password (or "Continue with Google/Apple")
  [Continue]

[Step 2/3] Verify your email
  - "Check your inbox for a verification link"
  - [Resend email]

[Step 3/3] Start your free trial
  - "7 days, all features, no credit card needed"
  - "After 7 days, you'll drop to free tier (3 quizzes/day) — no auto-charge"
  - [Start 7-day Free Trial]
```

### 5.3 特商法表記（最小限）

Opt-in 型は自動課金なしのため、特商法表記は **Lifetime 購入時 + Pro サブスク時のみ** 必要。Free Trial 自体には課金が発生しないので、表記の必須項目は限定的。

ただし「特定商取引法に基づく表記」リンクを footer に常設し、Lifetime/Pro の事業者情報・キャンセル方針を明記する（NHL-1 知人弁護士 5/15 + NHL-4 6/10 で監修）。

---

## 6. 受入基準

### 6.1 機能テスト

- [ ] `/api/trial-start` で trial 開始 → users.trial_status='active' + trial_end_date=Day7
- [ ] 二重 trial start で 400 error
- [ ] 既存有料ユーザーが trial start で 400 error
- [ ] Day 7 経過後、daily-trial-notifications で trial_status='expired' に自動更新
- [ ] Free 状態で `/api/generate` を 4 回叩くと 4 回目で 429
- [ ] `/api/upgrade-checkout` で Stripe Checkout URL 生成
- [ ] Stripe Webhook で checkout.session.completed → users.plan='lifetime' or 'pro'
- [ ] LP のサインアップフローが 3 step で完結

### 6.2 法務チェック（NHL-1 + NHL-4 完了後）

- [ ] **特定商取引法表記**: Lifetime 購入ページ + Pro サブスクページに必須項目表記
- [ ] **キャンセル方針**: Pro は「いつでも Stripe customer portal でキャンセル」明示
- [ ] **Lifetime 返金方針**: 購入後 7 日以内なら返金可（弁護士確認推奨）
- [ ] **GDPR / 個人情報保護法**: メール + Stripe customer ID は必要最小限の収集明示
- [ ] **景品表示法**: "Lifetime $149 限定" の限定根拠（先着 N 名）を明示
- [ ] **クレカ不要訴求の整合**: ヒーロー promise と Trial 開始画面で一貫表記

### 6.3 コスト・パフォーマンス

- [ ] Stripe API 呼出 / 月 ≤ 1,000 回（trial_start + checkout の合計）
- [ ] ConvertKit 無料枠 1,000 subscribers 以内（Phase C2 まで）
- [ ] Webhook latency < 500ms（Vercel Serverless 内で完結）

---

## 7. 環境変数追加（Phase C1 着手時）

```
STRIPE_SECRET_KEY=sk_live_...  # Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # Stripe Dashboard > Webhooks
STRIPE_PRICE_LIFETIME_149=price_... # Stripe Products に登録
STRIPE_PRICE_PRO_999=price_...      # Stripe Products に登録
SITE_URL=https://nihongohub.com  # ドメイン取得後 (5/27)
SUPABASE_ANON_KEY=...                # Supabase API > Project API Keys (anon)
CONVERTKIT_API_KEY=...               # ConvertKit (MK-12 連動)
CONVERTKIT_SEQUENCE_TRIAL_DAY5=...   # Day 5 Sequence ID
CONVERTKIT_SEQUENCE_TRIAL_DAY7=...   # Day 7 Sequence ID
```

Vercel Dashboard + ローカル `.env` 両方に設定。

---

## 8. AB テスト設計（Phase D 5/24 Phase Interview 完了後）

| 群 | Trial 設計 | KPI |
|---|---|---|
| A | Opt-in 7 日（本仕様） | Pro/Lifetime 転換率 / Trial 完走率 / 平均日次利用時間 |
| B | Opt-in 14 日 | 同上 |
| C | Opt-in 3 日 | 同上 |

仮説: 業界平均 7 日 が標準だが、JLPT 学習者特有の「週単位の学習サイクル」を考慮して 14 日も検討余地あり。Phase D 開始時に Phase Interview 5 名フィードバックを参照して決定。

---

## 9. Open Questions（v1 残り）

1. ✅ **Opt-in / Opt-out**: Opt-in 採択（5/4 オーナー判断）
2. ⏳ **Trial 期間**: 7 日想定だが Phase D AB テストで 3/7/14 日比較
3. ⏳ **Day 5 メール文面**: Phase Interview 5/24 のフィードバック反映後確定
4. ⏳ **Lifetime $149 限定根拠**: 先着 N 名 vs 期間限定 vs 通常価格化（NHL-4 弁護士監修要）
5. ⏳ **Free 1 日 3 問の妥当性**: Phase Interview で「Free でも続けたい」「即 Trial に行きたい」のバランス確認

---

## 10. 関連ドキュメント

- v3 ロードマップ: [`pm/nihongohub-roadmap.md`](../../../pm/nihongohub-roadmap.md)
- 5/4 決定 9（Opt-in 採択）: [`notes/2026-05-04-decisions.md`](../../../notes/2026-05-04-decisions.md)
- 戦略反転 5 改訂（Free Trial 型移行）: [`projects/nihongohub/strategic-review-2026-04-30.md`](../strategic-review-2026-04-30.md)
- LP コピー: [`drafts/PR-17-lp-copy-revamp-v3.md`](../drafts/PR-17-lp-copy-revamp-v3.md)
- 弁護士チェック: [`admin/NHL-1-lawyer-candidates.md`](../../../admin/NHL-1-lawyer-candidates.md)

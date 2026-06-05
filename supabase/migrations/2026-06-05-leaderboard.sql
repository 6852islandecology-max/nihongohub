-- 2026-06-05 leaderboard: anonymous country-level ranking for "My Ranking".
-- Run this in the Supabase SQL editor (service role). No PII stored — only an opaque
-- auth user id, a coarse country code (from Vercel's edge IP header), and a 0..1 score.
-- Ranking is scoped to (country, period) where period = 'YYYY-MM' (monthly reset built in).

create table if not exists leaderboard (
  user_id    uuid primary key,
  country    text not null default 'XX',
  score      numeric(5,3) not null default 0,   -- 0.000 .. 1.000 (JLPT readiness)
  level      text,                               -- estimated level label (N5..N1), display only
  period     text not null,                      -- 'YYYY-MM'
  updated_at timestamptz not null default now()
);

create index if not exists idx_leaderboard_country_period_score
  on leaderboard (country, period, score desc);

-- RLS: the table is only ever read/written by the service role (via /api/rank*),
-- never directly by the anon client, so enable RLS with no public policies.
alter table leaderboard enable row level security;

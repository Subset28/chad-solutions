-- CHAD SOLUTIONS DATABASE SETUP
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create battle_challenges table
create table if not exists battle_challenges (
  id uuid primary key,
  created_at timestamp default now(),
  expires_at timestamp default now() + interval '7 days',
  week_number integer default extract(week from now()),
  username text,
  psl_score decimal(3,1),
  tier text,
  percentile integer,
  phenotype text,
  canthal_tilt decimal(5,2),
  fwhr decimal(4,3),
  symmetry decimal(5,2),
  gonial_angle decimal(5,2),
  midface_ratio decimal(4,3)
);

-- Enable RLS for battle_challenges
alter table battle_challenges enable row level security;

-- Allow public reads
create policy "Public read battle_challenges" on battle_challenges
  for select using (true);

-- Allow public inserts
create policy "Public insert battle_challenges" on battle_challenges
  for insert with check (true);

-- 2. Create scans table for leaderboard
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  week_number integer default extract(week from now()),
  username text,
  psl_score decimal(3,1),
  tier text,
  percentile integer,
  phenotype text
);

-- Enable RLS for scans
alter table scans enable row level security;

-- Allow public reads
create policy "Public read scans" on scans for select using (true);

-- Allow public inserts
create policy "Public insert scans" on scans for insert with check (true);

-- Indexes for performance
create index if not exists idx_battle_challenges_expires_at on battle_challenges (expires_at);
create index if not exists idx_scans_week_number on scans (week_number);
create index if not exists idx_scans_psl_score on scans (psl_score desc);

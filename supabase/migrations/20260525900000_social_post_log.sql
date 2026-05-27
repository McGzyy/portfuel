-- Idempotency log for outbound X posts (cron + admin)

create table if not exists public.social_post_log (
  id uuid primary key default gen_random_uuid(),
  post_type text not null check (post_type in ('fueled', 'leaderboard')),
  ref_id text not null,
  tweet_id text,
  posted_at timestamptz not null default now(),
  unique (post_type, ref_id)
);

create index if not exists social_post_log_posted_at_idx
  on public.social_post_log (posted_at desc);

comment on table public.social_post_log is 'Prevents duplicate X posts for the same content ref (call id or weekly leaderboard key).';

alter table public.social_post_log enable row level security;

-- Track per-user AI draft usage for rate limits

create table if not exists public.ai_draft_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  mode text not null check (mode in ('default', 'deep')),
  symbol text not null,
  tweet_key text,
  created_at timestamptz not null default now()
);

create index if not exists ai_draft_requests_user_idx
  on public.ai_draft_requests (user_id, created_at desc);

create index if not exists ai_draft_requests_mode_idx
  on public.ai_draft_requests (mode, created_at desc);


-- AI thesis coach: monthly usage counters per user

create table if not exists public.user_ai_usage (
  user_id uuid not null references public.users (id) on delete cascade,
  period_month text not null check (period_month ~ '^\d{4}-\d{2}$'),
  reviews_used integer not null default 0 check (reviews_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_month)
);

create index if not exists user_ai_usage_user_idx on public.user_ai_usage (user_id, period_month desc);

comment on table public.user_ai_usage is 'Monthly AI thesis coach review count (Member vs Pro limits enforced in app).';

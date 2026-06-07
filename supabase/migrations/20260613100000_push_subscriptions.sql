-- Web Push subscriptions for watchlist PWA alerts

alter table public.users
  add column if not exists push_alerts_enabled boolean not null default false;

comment on column public.users.push_alerts_enabled is
  'Member opted in to browser push for watchlist alerts (requires an active push subscription).';

create table if not exists public.user_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists user_push_subscriptions_user_id_idx
  on public.user_push_subscriptions (user_id);

comment on table public.user_push_subscriptions is
  'Browser Web Push endpoints for watchlist alert delivery.';

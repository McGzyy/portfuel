-- In-app notification center (votes, comments, watchlist calls)

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (
    type in ('comment_on_call', 'vote_on_call', 'watchlist_call')
  ),
  title text not null,
  body text not null,
  href text not null,
  ref_call_id uuid references public.calls (id) on delete set null,
  actor_user_id uuid references public.users (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_user_unread_idx
  on public.user_notifications (user_id)
  where read_at is null;

comment on table public.user_notifications is 'In-app alerts: engagement on your calls and new calls on watchlist symbols.';

-- Call lifecycle milestone alerts (dedupe table + notification type)

create table if not exists public.call_milestones (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  key text not null,
  created_at timestamptz not null default now(),
  unique (call_id, user_id, key)
);

create index if not exists call_milestones_user_idx
  on public.call_milestones (user_id, created_at desc);

comment on table public.call_milestones is 'Dedupe for automated lifecycle notifications (e.g. +10%, +25%, target reached).';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_notifications'
  ) then
    alter table public.user_notifications
      drop constraint if exists user_notifications_type_check;

    alter table public.user_notifications
      add constraint user_notifications_type_check check (
        type in (
          'comment_on_call',
          'vote_on_call',
          'watchlist_call',
          'followed_member_call',
          'desk_portfolio_update',
          'call_milestone'
        )
      );
  end if;
end $$;

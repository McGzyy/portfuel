-- Member-to-member direct messages (1:1 threads)

create table if not exists public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dm_participants (
  thread_id uuid not null references public.dm_threads (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create index if not exists dm_participants_user_idx on public.dm_participants (user_id);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists dm_messages_thread_created_idx
  on public.dm_messages (thread_id, created_at desc);

comment on table public.dm_threads is '1:1 DM thread between two members (thread_key = sorted user ids).';
comment on table public.dm_messages is 'Direct messages; not investment advice.';

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
          'call_milestone',
          'direct_message'
        )
      );
  end if;
end $$;

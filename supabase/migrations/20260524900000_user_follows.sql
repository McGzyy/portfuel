-- Follow members: personalized feed + alerts when they publish

create table if not exists public.user_follows (
  follower_id uuid not null references public.users (id) on delete cascade,
  following_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint user_follows_no_self check (follower_id <> following_id)
);

create index user_follows_follower_idx on public.user_follows (follower_id, created_at desc);
create index user_follows_following_idx on public.user_follows (following_id);

comment on table public.user_follows is 'Member-to-member follows for feed filter and new-call notifications.';

-- Extend notification types (run after 20260524700000_user_notifications.sql)
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
          'followed_member_call'
        )
      );
  end if;
end $$;

-- Per-member saved feed filter presets (synced across devices)

create table if not exists public.user_feed_saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  filter text not null default 'all'
    check (filter in ('all', 'fueled', 'equity', 'crypto', 'following')),
  tab text not null default 'latest'
    check (tab in ('latest', 'performing', 'progress')),
  search_query text check (search_query is null or char_length(search_query) <= 120),
  new_since boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index user_feed_saved_views_user_idx
  on public.user_feed_saved_views (user_id, sort_order asc, created_at desc);

comment on table public.user_feed_saved_views is
  'Saved member feed views (filter, tab, search, new-since). Max 6 per user enforced in API.';

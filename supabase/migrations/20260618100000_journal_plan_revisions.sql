-- Private audit log when watchlist journal plan fields change (thesis, levels, etc.)

create table if not exists public.watchlist_journal_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  symbol text not null,
  field text not null check (char_length(field) between 1 and 64),
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists watchlist_journal_revisions_user_symbol_idx
  on public.watchlist_journal_revisions (user_id, symbol, created_at desc);

comment on table public.watchlist_journal_revisions is
  'Field-level history when a member edits their private watchlist journal plan.';

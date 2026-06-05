-- Watchlist journal: private thesis, plan levels, and timestamped entries

alter table public.user_watchlist
  add column if not exists thesis text,
  add column if not exists conviction smallint,
  add column if not exists entry_price numeric(14, 4),
  add column if not exists stop_price numeric(14, 4),
  add column if not exists target_price numeric(14, 4),
  add column if not exists entry_note text,
  add column if not exists journal_updated_at timestamptz;

alter table public.user_watchlist
  drop constraint if exists user_watchlist_conviction_check;

alter table public.user_watchlist
  add constraint user_watchlist_conviction_check
  check (conviction is null or (conviction >= 1 and conviction <= 10));

comment on column public.user_watchlist.thesis is 'Private: why the member is watching this symbol.';
comment on column public.user_watchlist.conviction is 'Private conviction score 1–10.';
comment on column public.user_watchlist.entry_note is 'Private text entry zone (e.g. under $40, retest 200 MA).';

create table if not exists public.watchlist_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  symbol text not null,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 4000),
  reply_to_id uuid references public.watchlist_journal_entries (id) on delete set null,
  conviction_after smallint,
  created_at timestamptz not null default now(),
  constraint watchlist_journal_entries_conviction_check
    check (conviction_after is null or (conviction_after >= 1 and conviction_after <= 10))
);

create index if not exists watchlist_journal_entries_user_symbol_idx
  on public.watchlist_journal_entries (user_id, symbol, created_at desc);

comment on table public.watchlist_journal_entries is 'Private timestamped journal updates per watchlist symbol.';

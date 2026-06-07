-- Saved journal snapshots when a symbol is removed from the watchlist (restored on re-add).

create table if not exists public.watchlist_journal_archives (
  user_id uuid not null references public.users (id) on delete cascade,
  symbol text not null,
  asset_class text not null default 'equity',
  baseline_price numeric(14, 4),
  price_alert_pct numeric(5, 2),
  journal jsonb not null default '{}',
  entries jsonb not null default '[]',
  revisions jsonb not null default '[]',
  archived_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

create index if not exists watchlist_journal_archives_user_idx
  on public.watchlist_journal_archives (user_id, archived_at desc);

comment on table public.watchlist_journal_archives is
  'Private journal backup when a member removes a symbol from their watchlist; restored when they add it again.';

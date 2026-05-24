-- Per-member ticker watchlist (dashboard sidebar)

create table if not exists public.user_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  symbol text not null check (char_length(symbol) between 1 and 12),
  asset_class text not null default 'equity' check (asset_class in ('equity', 'crypto')),
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index user_watchlist_user_id_idx on public.user_watchlist (user_id, created_at desc);

comment on table public.user_watchlist is 'Symbols a member tracks from the dashboard; links to /ticker/[symbol].';

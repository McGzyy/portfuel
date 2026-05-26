-- Fueled Model Portfolio: desk-maintained active theses with tracked performance

create table if not exists public.desk_portfolio (
  id uuid primary key default gen_random_uuid(),
  asset_class public.asset_class not null default 'equity',
  symbol text not null check (char_length(symbol) between 1 and 12),
  finnhub_symbol text,
  direction text not null check (direction in ('long', 'short')),
  conviction smallint not null default 3 check (conviction between 1 and 5),
  horizon_tag text,
  thesis text not null,
  entry_price numeric(14, 4),
  target_price numeric(14, 4),
  stop_price numeric(14, 4),
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists desk_portfolio_status_idx
  on public.desk_portfolio (status, opened_at desc);

create index if not exists desk_portfolio_symbol_idx
  on public.desk_portfolio (symbol, opened_at desc);

comment on table public.desk_portfolio is 'Desk model portfolio entries (equity + allowlisted crypto). Used to provide value before community liquidity.';


-- Paper-track discovery alerts / AI drafts without publishing to the Fueled desk.

create table if not exists public.desk_discovery_shadow_calls (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.desk_signal_candidates (id) on delete set null,
  symbol text not null check (char_length(symbol) between 1 and 12),
  asset_class text not null check (asset_class in ('equity', 'crypto')),
  direction text not null check (direction in ('long', 'short')),
  score integer not null default 0,
  signal_types text[] not null default '{}',
  draft jsonb,
  triggered_at timestamptz not null default now(),
  entry_price numeric(14, 4),
  target_price numeric(14, 4),
  stop_price numeric(14, 4),
  price_at_trigger numeric(14, 4),
  last_price numeric(14, 4),
  return_pct numeric(8, 4),
  peak_return_pct numeric(8, 4),
  target_progress numeric(6, 2),
  status text not null default 'open'
    check (status in ('open', 'target_hit', 'stop_hit', 'expired', 'superseded')),
  close_reason text,
  closed_at timestamptz,
  max_hold_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists desk_discovery_shadow_calls_status_idx
  on public.desk_discovery_shadow_calls (status, triggered_at desc);

create index if not exists desk_discovery_shadow_calls_symbol_idx
  on public.desk_discovery_shadow_calls (symbol, triggered_at desc);

create unique index if not exists desk_discovery_shadow_calls_open_candidate_idx
  on public.desk_discovery_shadow_calls (candidate_id)
  where status = 'open' and candidate_id is not null;

comment on table public.desk_discovery_shadow_calls is
  'Paper positions opened when discovery auto-drafts fire — tracks hypothetical desk performance for learning.';

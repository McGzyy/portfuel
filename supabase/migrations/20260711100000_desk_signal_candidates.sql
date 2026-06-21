-- Desk discovery radar: admin-reviewed signal candidates before Fueled publish

create table if not exists public.desk_signal_candidates (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  asset_class text not null check (asset_class in ('equity', 'crypto')),
  score integer not null default 0,
  signal_types text[] not null default '{}',
  reasons jsonb not null default '[]'::jsonb,
  headline text,
  status text not null default 'pending'
    check (status in ('pending', 'snoozed', 'rejected', 'approved')),
  snoozed_until timestamptz,
  scan_run_id uuid,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.desk_signal_candidates
  add constraint desk_signal_candidates_symbol_key unique (symbol);

create index if not exists desk_signal_candidates_status_score_idx
  on public.desk_signal_candidates (status, score desc, last_seen_at desc);

create table if not exists public.desk_discovery_scan_state (
  id text primary key default 'default',
  equity_rotation_offset integer not null default 0,
  last_scan_at timestamptz,
  last_scan_summary jsonb,
  updated_at timestamptz not null default now()
);

insert into public.desk_discovery_scan_state (id)
values ('default')
on conflict (id) do nothing;

comment on table public.desk_signal_candidates is
  'Market discovery signals awaiting admin review before Fueled desk publish.';
comment on table public.desk_discovery_scan_state is
  'Rotation cursor and last run metadata for desk discovery scans.';

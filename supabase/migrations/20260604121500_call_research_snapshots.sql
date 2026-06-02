-- Persist research sources used to create a Fueled call

create table if not exists public.call_research_snapshots (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  source text not null default 'x_ingest',
  tweet_url text,
  tweet_key text,
  symbol text,
  mode text not null check (mode in ('default', 'deep')),
  analysis jsonb not null,
  research_pack jsonb not null default '{}'::jsonb,
  cost jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (call_id)
);

create index if not exists call_research_snapshots_symbol_idx
  on public.call_research_snapshots (symbol, created_at desc);

comment on table public.call_research_snapshots is
  'Snapshot of research sources and AI outputs used to publish Fueled calls.';\n

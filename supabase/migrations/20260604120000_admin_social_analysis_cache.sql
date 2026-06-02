-- Cached X post → ticker analysis for admin ingest (avoid repeat AI spend)

create table if not exists public.admin_social_analysis_cache (
  id uuid primary key default gen_random_uuid(),
  tweet_key text not null,
  symbol text not null,
  mode text not null check (mode in ('default', 'deep')),
  analysis jsonb not null,
  research_pack jsonb not null default '{}'::jsonb,
  model_id text not null,
  prompt_chars integer not null default 0,
  output_chars integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now(),
  unique (tweet_key, symbol, mode)
);

create index if not exists admin_social_analysis_cache_tweet_idx
  on public.admin_social_analysis_cache (tweet_key, created_at desc);

create index if not exists admin_social_analysis_cache_created_idx
  on public.admin_social_analysis_cache (created_at desc);

comment on table public.admin_social_analysis_cache is
  'Admin X ingest: cached per-ticker analysis (default or deep mode).';

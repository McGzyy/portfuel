-- Cached one-line AI thesis summaries (Pro generates; all members can read cache)

create table if not exists public.call_thesis_summaries (
  call_id uuid primary key references public.calls (id) on delete cascade,
  summary_line text not null check (char_length(summary_line) between 10 and 280),
  created_at timestamptz not null default now()
);

comment on table public.call_thesis_summaries is 'One-line educational thesis summary per call; generated once and reused.';

alter table public.user_ai_usage
  add column if not exists summaries_used integer not null default 0;

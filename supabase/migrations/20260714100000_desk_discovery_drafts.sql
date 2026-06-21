-- Persist discovery AI drafts and structured publish prep

alter table public.desk_signal_candidates
  add column if not exists draft jsonb,
  add column if not exists draft_generated_at timestamptz;

comment on column public.desk_signal_candidates.draft is
  'Structured AI draft: direction, thesis, catalyst, risk, timeframe, level notes.';

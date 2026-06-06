-- AI research assistant usage for private journal (separate from call thesis coach)

alter table public.user_ai_usage
  add column if not exists journal_research_used integer not null default 0 check (journal_research_used >= 0);

comment on column public.user_ai_usage.journal_research_used is 'Monthly AI journal research reviews (Member vs Pro limits in app).';

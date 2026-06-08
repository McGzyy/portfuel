-- Optional homework list from AI research review (questions / gaps to verify)
alter table public.user_watchlist
  add column if not exists research_followups text;

comment on column public.user_watchlist.research_followups is
  'Private checklist: open research questions from AI review or manual notes — not part of published thesis.';

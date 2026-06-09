-- Pro help assistant: monthly question counter

alter table public.user_ai_usage
  add column if not exists help_assistant_used integer not null default 0 check (help_assistant_used >= 0);

comment on column public.user_ai_usage.help_assistant_used is
  'Monthly PortFuel help assistant questions (Pro-only limits enforced in app).';

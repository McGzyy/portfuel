-- Pro weekday morning brief email (Resend)

alter table public.users
  add column if not exists email_pro_brief_enabled boolean not null default true,
  add column if not exists email_pro_brief_last_sent_at timestamptz;

comment on column public.users.email_pro_brief_enabled is 'Weekday Pro morning brief — desk, following, watchlist, earnings.';
comment on column public.users.email_pro_brief_last_sent_at is 'Last Pro morning brief send (dedupe cron).';

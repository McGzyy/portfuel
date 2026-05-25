-- Email alerts (Resend): digest + instant watchlist/engagement

alter table public.users
  add column if not exists notify_email text,
  add column if not exists email_instant_enabled boolean not null default true,
  add column if not exists email_digest_enabled boolean not null default true,
  add column if not exists email_digest_last_sent_at timestamptz;

comment on column public.users.notify_email is 'Email for PortFuel alerts (optional; separate from Stripe).';
comment on column public.users.email_instant_enabled is 'Send email for high-signal in-app events (watchlist calls, comments).';
comment on column public.users.email_digest_enabled is 'Weekly workspace digest via Resend.';

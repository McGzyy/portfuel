-- Track when paid membership and current tier started (for settings billing overview)

alter table public.users
  add column if not exists subscription_started_at timestamptz,
  add column if not exists membership_tier_started_at timestamptz;

comment on column public.users.subscription_started_at is
  'First time subscription_status became active (Stripe or admin).';
comment on column public.users.membership_tier_started_at is
  'When the current membership_tier last changed (upgrade/downgrade).';

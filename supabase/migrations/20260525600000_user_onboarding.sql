-- Member onboarding completion (watchlist seed + workspace tour)

alter table public.users
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.users.onboarding_completed_at is
  'Set when member finishes post-checkout onboarding (display name if needed, watchlist, tour).';

-- Existing active members skip the new wizard
update public.users
set onboarding_completed_at = coalesce(onboarding_completed_at, now())
where subscription_status = 'active'
  and onboarding_completed_at is null;

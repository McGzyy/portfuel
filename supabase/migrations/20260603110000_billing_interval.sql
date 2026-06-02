-- Track whether the member bills monthly or annually (Stripe price interval)

create type public.billing_interval as enum ('monthly', 'annual');

alter table public.users
  add column if not exists billing_interval public.billing_interval not null default 'monthly';

comment on column public.users.billing_interval is
  'Stripe subscription cadence: monthly or annual price on the active subscription.';

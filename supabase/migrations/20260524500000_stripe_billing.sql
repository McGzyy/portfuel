-- Stripe billing fields and membership tier (Member vs Pro Intelligence)

create type public.membership_tier as enum ('member', 'pro');

alter table public.users
  add column if not exists membership_tier public.membership_tier,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create unique index if not exists users_stripe_customer_id_idx
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists users_stripe_subscription_id_idx
  on public.users (stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column public.users.membership_tier is 'Stripe plan: member ($79) or pro ($129).';
comment on column public.users.stripe_customer_id is 'Stripe Customer id (cus_...)';
comment on column public.users.stripe_subscription_id is 'Stripe Subscription id (sub_...)';

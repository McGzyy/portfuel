-- Member referral program: email invites, rewards ledger, credit balance.

alter table public.users
  add column if not exists referral_credit_balance_cents integer not null default 0;

create table if not exists public.referral_invites (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users (id) on delete cascade,
  email text not null,
  normalized_email text not null,
  status text not null default 'sent'
    check (status in ('sent', 'signed_up', 'converted', 'bounced')),
  referred_user_id uuid references public.users (id) on delete set null,
  user_referral_id uuid references public.user_referrals (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (referrer_id, normalized_email)
);

create index if not exists referral_invites_referrer_idx
  on public.referral_invites (referrer_id, created_at desc);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users (id) on delete cascade,
  user_referral_id uuid references public.user_referrals (id) on delete set null,
  referred_user_id uuid references public.users (id) on delete set null,
  role text not null check (role in ('referrer', 'referee')),
  amount_cents integer not null,
  reward_kind text not null
    check (reward_kind in ('referrer_stripe_credit', 'referee_checkout_discount')),
  status text not null default 'pending'
    check (status in ('pending', 'applied', 'skipped_cap', 'skipped_no_customer', 'skipped_disabled')),
  month_key text not null,
  stripe_balance_transaction_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists referral_rewards_referrer_month_idx
  on public.referral_rewards (referrer_id, month_key, created_at desc);

comment on column public.users.referral_credit_balance_cents is
  'Running total of referral credits granted (mirrors Stripe customer balance when applied).';

alter table public.referral_invites enable row level security;
alter table public.referral_rewards enable row level security;

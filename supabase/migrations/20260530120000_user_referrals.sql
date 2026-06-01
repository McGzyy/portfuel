-- Simple member referral tracking: share link → signup → paid conversion

alter table public.users
  add column if not exists referral_code text,
  add column if not exists referred_by_user_id uuid references public.users (id) on delete set null;

create unique index if not exists users_referral_code_idx
  on public.users (lower(referral_code))
  where referral_code is not null;

create index if not exists users_referred_by_idx
  on public.users (referred_by_user_id)
  where referred_by_user_id is not null;

create table if not exists public.user_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users (id) on delete cascade,
  referred_user_id uuid not null references public.users (id) on delete cascade,
  referral_code text not null,
  status text not null default 'signed_up'
    check (status in ('signed_up', 'converted')),
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_referrals_referred_unique unique (referred_user_id),
  constraint user_referrals_no_self check (referrer_id <> referred_user_id)
);

create index if not exists user_referrals_referrer_idx
  on public.user_referrals (referrer_id, created_at desc);

comment on table public.user_referrals is 'Referrer attribution when a new member signs up via /join?ref=CODE.';
comment on column public.users.referral_code is 'Shareable code (defaults to username) for /join?ref= links.';
comment on column public.users.referred_by_user_id is 'Member who referred this user, if any.';

-- Backfill codes for existing accounts
update public.users
set referral_code = lower(username)
where referral_code is null
  and username is not null
  and length(trim(username)) > 0;

-- Voucher system: checkout discounts, Pro trial upgrades, affiliate distribution

create type public.voucher_kind as enum ('checkout_discount', 'pro_trial');
create type public.voucher_discount_type as enum ('percent_off', 'amount_off');
create type public.voucher_audience as enum ('public', 'assigned', 'affiliate');
create type public.voucher_billing_interval as enum ('monthly', 'annual', 'any');
create type public.voucher_applicable_tier as enum ('member', 'pro', 'any');
create type public.voucher_redemption_status as enum ('pending', 'applied', 'expired', 'revoked');

alter table public.users
  add column if not exists pro_granted_until timestamptz;

comment on column public.users.pro_granted_until is
  'Temporary Pro intelligence access (voucher upgrade) without changing Stripe subscription tier.';

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null default '',
  description text,
  kind public.voucher_kind not null default 'checkout_discount',
  discount_type public.voucher_discount_type,
  discount_percent smallint check (discount_percent is null or (discount_percent > 0 and discount_percent <= 100)),
  discount_amount_cents integer check (discount_amount_cents is null or discount_amount_cents > 0),
  currency text not null default 'usd',
  applicable_tier public.voucher_applicable_tier not null default 'any',
  applicable_interval public.voucher_billing_interval not null default 'any',
  audience public.voucher_audience not null default 'public',
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  max_redemptions_per_user integer not null default 1 check (max_redemptions_per_user > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  pro_trial_days integer check (pro_trial_days is null or pro_trial_days > 0),
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  active boolean not null default true,
  created_by uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vouchers_code_normalized check (code = upper(trim(code)) and length(trim(code)) >= 3),
  constraint vouchers_checkout_discount check (
    kind <> 'checkout_discount'
    or (
      discount_type is not null
      and (
        (discount_type = 'percent_off' and discount_percent is not null)
        or (discount_type = 'amount_off' and discount_amount_cents is not null)
      )
    )
  ),
  constraint vouchers_pro_trial check (
    kind <> 'pro_trial' or (pro_trial_days is not null and discount_type is null)
  )
);

create unique index if not exists vouchers_code_idx on public.vouchers (code);
create index if not exists vouchers_active_expires_idx
  on public.vouchers (active, expires_at)
  where active = true;

create table if not exists public.voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  referrer_id uuid references public.users (id) on delete set null,
  status public.voucher_redemption_status not null default 'pending',
  stripe_checkout_session_id text,
  pro_access_until timestamptz,
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists voucher_redemptions_voucher_idx
  on public.voucher_redemptions (voucher_id, redeemed_at desc);
create index if not exists voucher_redemptions_user_idx
  on public.voucher_redemptions (user_id, voucher_id);

create table if not exists public.voucher_user_assignments (
  voucher_id uuid not null references public.vouchers (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.users (id) on delete set null,
  primary key (voucher_id, user_id)
);

create table if not exists public.voucher_affiliate_grants (
  voucher_id uuid not null references public.vouchers (id) on delete cascade,
  affiliate_user_id uuid not null references public.users (id) on delete cascade,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  created_at timestamptz not null default now(),
  primary key (voucher_id, affiliate_user_id)
);

comment on table public.vouchers is 'Promo codes: Stripe checkout discounts or time-limited Pro upgrades.';
comment on table public.voucher_affiliate_grants is 'Which members may share an affiliate-only voucher with referrals.';

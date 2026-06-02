-- Email verification, moderation, marketing opt-in, auth tokens, admin audit

alter table public.users
  add column if not exists email_verified_at timestamptz,
  add column if not exists stripe_checkout_email text,
  add column if not exists banned_at timestamptz,
  add column if not exists moderation_expires_at timestamptz,
  add column if not exists can_access_workspace boolean not null default true,
  add column if not exists can_publish_calls boolean not null default true,
  add column if not exists can_dm boolean not null default true,
  add column if not exists can_comment boolean not null default true,
  add column if not exists marketing_member_opt_in boolean not null default false,
  add column if not exists marketing_pro_opt_in boolean not null default false;

comment on column public.users.email_verified_at is 'When set, users.email is verified and unique.';
comment on column public.users.stripe_checkout_email is 'Email from Stripe checkout/customer for cross-check.';
comment on column public.users.banned_at is 'Permanent ban — login blocked.';
comment on column public.users.moderation_expires_at is 'When set, moderation flags auto-restore after this time.';

create unique index if not exists users_verified_email_unique_idx
  on public.users (lower(trim(email)))
  where email_verified_at is not null and email is not null;

create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists email_verification_tokens_user_idx
  on public.email_verification_tokens (user_id, created_at desc);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_idx
  on public.password_reset_tokens (user_id, created_at desc);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users (id) on delete set null,
  target_user_id uuid references public.users (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log (target_user_id, created_at desc);

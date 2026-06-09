-- Auth session tracking + sign-out-everywhere via session_version

alter table public.users
  add column if not exists session_version integer not null default 0 check (session_version >= 0);

comment on column public.users.session_version is
  'Incremented to invalidate all JWT sessions (sign out everywhere).';

create table if not exists public.user_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  client_label text not null default 'Unknown device',
  user_agent text,
  ip_hint text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists user_auth_sessions_user_active_idx
  on public.user_auth_sessions (user_id, last_seen_at desc)
  where revoked_at is null;

comment on table public.user_auth_sessions is
  'Browser login sessions for security settings (revoke + list).';

alter table public.user_auth_sessions enable row level security;

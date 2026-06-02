-- Track member activity for admin + profiles

alter table public.users
  add column if not exists last_active_at timestamptz;

comment on column public.users.last_active_at is 'Last time the user was active (server-side touch).';

create index if not exists users_last_active_idx
  on public.users (last_active_at desc);


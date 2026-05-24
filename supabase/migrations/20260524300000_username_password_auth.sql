-- Username + password auth; username is immutable after signup.

alter table public.users
  add column if not exists username text,
  add column if not exists password_hash text;

-- Backfill existing rows (admin → admin, members → pf_<pin>)
update public.users
set username = case
  when role = 'admin' then 'admin'
  else 'pf_' || pin
end
where username is null;

alter table public.users
  alter column username set not null;

create unique index if not exists users_username_lower_idx on public.users (lower(username));

alter table public.auth_attempts
  add column if not exists username text;

comment on column public.users.username is 'Unique login handle; set once at registration and never changed.';
comment on column public.users.password_hash is 'scrypt password hash (salt.hash hex)';

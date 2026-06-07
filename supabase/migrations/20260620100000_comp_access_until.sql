-- Optional end date for admin-comped members (null = indefinite access)

alter table public.users
  add column if not exists comp_access_until timestamptz;

comment on column public.users.comp_access_until is
  'When admin-comped access ends. Null means indefinite complimentary access.';

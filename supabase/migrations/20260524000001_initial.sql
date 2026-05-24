-- PortFuel.pro initial schema

create extension if not exists "pgcrypto";

create type public.call_direction as enum ('long', 'short');
create type public.subscription_status as enum ('pending', 'active', 'cancelled');
create type public.user_role as enum ('member', 'admin');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  pin char(5) not null unique check (pin ~ '^[0-9]{5}$'),
  display_name text,
  email text,
  totp_secret_enc text,
  totp_verified boolean not null default false,
  role public.user_role not null default 'member',
  subscription_status public.subscription_status not null default 'pending',
  trusted_at timestamptz,
  calls_count integer not null default 0,
  win_rate numeric(5, 2),
  avg_return_pct numeric(8, 4),
  rank_score numeric(10, 4) not null default 0,
  submission_quota_week integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_pin_idx on public.users (pin);
create index users_rank_score_idx on public.users (rank_score desc);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  symbol text not null check (char_length(symbol) between 1 and 12),
  direction public.call_direction not null,
  thesis text not null check (char_length(thesis) >= 10),
  entry_price numeric(14, 4),
  target_price numeric(14, 4),
  stop_price numeric(14, 4),
  timeframe_tag text,
  called_at timestamptz not null default now(),
  price_at_call numeric(14, 4),
  last_price numeric(14, 4),
  return_pct numeric(8, 4),
  target_progress numeric(6, 2),
  score_points numeric(10, 4) not null default 0,
  vote_score integer not null default 0,
  comment_count integer not null default 0,
  is_fueled boolean not null default false,
  source text not null default 'user' check (source in ('user', 'fueled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calls_symbol_idx on public.calls (symbol);
create index calls_called_at_idx on public.calls (called_at desc);
create index calls_return_pct_idx on public.calls (return_pct desc nulls last);
create index calls_user_id_idx on public.calls (user_id);

create table public.call_votes (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (call_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) >= 1),
  vote_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_call_id_idx on public.comments (call_id, created_at desc);

create table public.ticker_snapshots (
  symbol text primary key,
  company_name text,
  last_price numeric(14, 4),
  prev_close numeric(14, 4),
  updated_at timestamptz not null default now()
);

create table public.hype_scores (
  symbol text primary key,
  score numeric(8, 2) not null default 0,
  components jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.auth_attempts (
  id uuid primary key default gen_random_uuid(),
  pin char(5),
  ip_hash text not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index auth_attempts_lookup_idx on public.auth_attempts (pin, ip_hash, created_at desc);

-- Public teaser views
create or replace view public.teaser_latest_calls as
select
  c.id,
  c.symbol,
  c.direction,
  c.thesis,
  c.called_at,
  c.return_pct,
  c.target_progress,
  c.is_fueled,
  c.vote_score,
  c.comment_count,
  u.display_name,
  u.pin,
  u.trusted_at is not null as is_trusted
from public.calls c
join public.users u on u.id = c.user_id
where u.subscription_status = 'active'
order by c.called_at desc
limit 12;

create or replace view public.teaser_performing_calls as
select
  c.id,
  c.symbol,
  c.direction,
  c.thesis,
  c.called_at,
  c.return_pct,
  c.target_progress,
  c.is_fueled,
  c.vote_score,
  c.comment_count,
  u.display_name,
  u.pin,
  u.trusted_at is not null as is_trusted
from public.calls c
join public.users u on u.id = c.user_id
where u.subscription_status = 'active'
  and c.return_pct is not null
  and c.return_pct > 0
  and c.called_at >= now() - interval '30 days'
order by c.return_pct desc, c.called_at desc
limit 12;

create or replace view public.teaser_all_time_calls as
select
  c.id,
  c.symbol,
  c.direction,
  c.thesis,
  c.called_at,
  c.return_pct,
  c.target_progress,
  c.is_fueled,
  c.vote_score,
  c.comment_count,
  u.display_name,
  u.pin,
  u.trusted_at is not null as is_trusted
from public.calls c
join public.users u on u.id = c.user_id
where u.subscription_status = 'active'
  and c.return_pct is not null
  and c.called_at <= now() - interval '7 days'
order by c.return_pct desc nulls last
limit 6;

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

create trigger calls_updated_at before update on public.calls
  for each row execute function public.set_updated_at();

-- RLS: service role used from API; anon can read teasers via views if granted
alter table public.users enable row level security;
alter table public.calls enable row level security;
alter table public.call_votes enable row level security;
alter table public.comments enable row level security;
alter table public.ticker_snapshots enable row level security;
alter table public.hype_scores enable row level security;

grant select on public.teaser_latest_calls to anon, authenticated;
grant select on public.teaser_performing_calls to anon, authenticated;
grant select on public.teaser_all_time_calls to anon, authenticated;

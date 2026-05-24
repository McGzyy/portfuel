-- Asset class (equity vs crypto) + major-exchange crypto allowlist

create type public.asset_class as enum ('equity', 'crypto');

alter table public.calls
  add column if not exists asset_class public.asset_class not null default 'equity';

alter table public.ticker_snapshots
  add column if not exists asset_class public.asset_class not null default 'equity',
  add column if not exists finnhub_symbol text;

create index if not exists calls_asset_class_idx on public.calls (asset_class);

create table if not exists public.allowed_crypto_assets (
  symbol text primary key,
  finnhub_symbol text not null,
  display_name text,
  exchange text not null,
  updated_at timestamptz not null default now()
);

create index if not exists allowed_crypto_exchange_idx on public.allowed_crypto_assets (exchange);

-- Refresh teaser views with asset_class
drop view if exists public.teaser_latest_calls;
drop view if exists public.teaser_performing_calls;
drop view if exists public.teaser_all_time_calls;

create or replace view public.teaser_latest_calls as
select
  c.id,
  c.symbol,
  c.asset_class,
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
  c.asset_class,
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
  c.asset_class,
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

grant select on public.teaser_latest_calls to anon, authenticated;
grant select on public.teaser_performing_calls to anon, authenticated;
grant select on public.teaser_all_time_calls to anon, authenticated;

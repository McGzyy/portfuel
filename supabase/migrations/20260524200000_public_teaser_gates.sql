-- Public landing: only proven winners (no fresh/live feed for anonymous visitors).
-- Run in Supabase SQL Editor after prior migrations.

-- Tighten existing member-facing view (still used server-side for authenticated flows if needed)
drop view if exists public.teaser_latest_calls;

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
limit 50;

-- Public: 30-day winners only (min +5% return)
drop view if exists public.teaser_public_performing;
create or replace view public.teaser_public_performing as
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
  and c.return_pct >= 5
  and c.called_at >= now() - interval '30 days'
order by c.return_pct desc, c.called_at desc
limit 12;

-- Public: matured proven calls (min +10% return, at least 7 days old)
drop view if exists public.teaser_public_proven;
create or replace view public.teaser_public_proven as
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
  and c.return_pct >= 10
  and c.called_at <= now() - interval '7 days'
order by c.return_pct desc, c.called_at desc
limit 12;

-- Legacy views: align with public thresholds (optional consistency)
drop view if exists public.teaser_performing_calls;
create or replace view public.teaser_performing_calls as
select * from public.teaser_public_performing;

drop view if exists public.teaser_all_time_calls;
create or replace view public.teaser_all_time_calls as
select * from public.teaser_public_proven;

revoke select on public.teaser_latest_calls from anon;

grant select on public.teaser_public_performing to anon, authenticated;
grant select on public.teaser_public_proven to anon, authenticated;
grant select on public.teaser_performing_calls to anon, authenticated;
grant select on public.teaser_all_time_calls to anon, authenticated;
grant select on public.teaser_latest_calls to authenticated;

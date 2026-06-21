-- PortFuel: Discovery radar setup (paste once in PortFuel SQL Editor)
-- Safe to re-run. Skip initial.sql — your DB already has core schema.

-- 1) Tables
create table if not exists public.desk_signal_candidates (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  asset_class text not null check (asset_class in ('equity', 'crypto')),
  score integer not null default 0,
  signal_types text[] not null default '{}',
  reasons jsonb not null default '[]'::jsonb,
  headline text,
  status text not null default 'pending',
  snoozed_until timestamptz,
  scan_run_id uuid,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.desk_discovery_scan_state (
  id text primary key default 'default',
  equity_rotation_offset integer not null default 0,
  last_scan_at timestamptz,
  last_scan_summary jsonb,
  updated_at timestamptz not null default now()
);

insert into public.desk_discovery_scan_state (id)
values ('default')
on conflict (id) do nothing;

-- 2) Hardening columns
alter table public.desk_signal_candidates
  add column if not exists published_call_id uuid,
  add column if not exists admin_notified_at timestamptz;

-- 3) Status check (includes published)
alter table public.desk_signal_candidates
  drop constraint if exists desk_signal_candidates_status_check;

alter table public.desk_signal_candidates
  add constraint desk_signal_candidates_status_check check (
    status in ('pending', 'snoozed', 'rejected', 'approved', 'published')
  );

-- 4) Unique symbol (required for inbox saves)
alter table public.desk_signal_candidates
  drop constraint if exists desk_signal_candidates_symbol_key;

drop index if exists public.desk_signal_candidates_symbol_uidx;

alter table public.desk_signal_candidates
  add constraint desk_signal_candidates_symbol_key unique (symbol);

-- 5) Indexes
create index if not exists desk_signal_candidates_status_score_idx
  on public.desk_signal_candidates (status, score desc, last_seen_at desc);

create index if not exists desk_signal_candidates_pending_score_idx
  on public.desk_signal_candidates (score desc, last_seen_at desc)
  where status = 'pending';

-- 6) FK to calls (only if calls table exists)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'calls'
  ) and not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'desk_signal_candidates'
      and constraint_name = 'desk_signal_candidates_published_call_id_fkey'
  ) then
    alter table public.desk_signal_candidates
      add constraint desk_signal_candidates_published_call_id_fkey
      foreign key (published_call_id) references public.calls (id) on delete set null;
  end if;
end $$;

-- 7) Admin notification type (only if user_notifications exists)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_notifications'
  ) then
    alter table public.user_notifications
      drop constraint if exists user_notifications_type_check;

    alter table public.user_notifications
      add constraint user_notifications_type_check check (
        type in (
          'comment_on_call',
          'vote_on_call',
          'watchlist_call',
          'followed_member_call',
          'desk_portfolio_update',
          'call_milestone',
          'direct_message',
          'watchlist_price_move',
          'watchlist_earnings',
          'watchlist_plan_level',
          'admin_churn_feedback',
          'admin_support_ticket',
          'admin_desk_discovery',
          'support_ticket_reply',
          'support_ticket_opened',
          'support_ticket_idle_warning',
          'support_ticket_status',
          'billing_payment_failed',
          'new_follower'
        )
      );
  end if;
end $$;

-- 8) Mark discovery migrations as applied (optional — only on CLI-managed projects)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'supabase_migrations'
      and table_name = 'schema_migrations'
  ) then
    insert into supabase_migrations.schema_migrations (version, name)
    values
      ('20260711100000', 'desk_signal_candidates'),
      ('20260712100000', 'desk_discovery_hardening'),
      ('20260713100000', 'desk_discovery_symbol_unique'),
      ('20260713110000', 'desk_discovery_calls_fk')
    on conflict (version) do nothing;
  end if;
end $$;

-- Done. Verify:
select to_regclass('public.desk_signal_candidates') as discovery_table;

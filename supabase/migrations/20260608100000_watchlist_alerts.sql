-- Watchlist alerts: SMS fields, preferences, dedupe/state tables, notification types, AI usage

alter table public.users
  add column if not exists sms_phone_e164 text,
  add column if not exists sms_alerts_enabled boolean not null default false,
  add column if not exists watchlist_alert_prefs jsonb not null default jsonb_build_object(
    'price_move', true,
    'price_move_pct', 5,
    'earnings', true,
    'earnings_days_ahead', 3,
    'plan_levels', true,
    'community_calls', true,
    'ai_insights', true
  );

comment on column public.users.sms_phone_e164 is 'E.164 mobile for Pro SMS watchlist alerts (e.g. +15551234567).';
comment on column public.users.watchlist_alert_prefs is 'Per-user watchlist alert toggles and thresholds.';

create table if not exists public.watchlist_alert_sent (
  user_id uuid not null references public.users (id) on delete cascade,
  alert_kind text not null,
  ref_key text not null,
  symbol text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, alert_kind, ref_key)
);

create index if not exists watchlist_alert_sent_user_created_idx
  on public.watchlist_alert_sent (user_id, created_at desc);

comment on table public.watchlist_alert_sent is 'Dedupe log for watchlist price, earnings, and plan-level alerts.';

create table if not exists public.watchlist_price_band (
  user_id uuid not null references public.users (id) on delete cascade,
  symbol text not null,
  band text not null check (band in ('inside', 'outside_up', 'outside_down')),
  updated_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

comment on table public.watchlist_price_band is 'Hysteresis state for ±% move alerts (no backfill on first observation).';

create table if not exists public.watchlist_level_state (
  user_id uuid not null references public.users (id) on delete cascade,
  symbol text not null,
  level_kind text not null check (level_kind in ('entry', 'stop', 'target')),
  side text not null check (side in ('above', 'below')),
  updated_at timestamptz not null default now(),
  primary key (user_id, symbol, level_kind)
);

comment on table public.watchlist_level_state is 'Last known price side vs journal plan level for cross detection.';

alter table public.user_ai_usage
  add column if not exists journal_alerts_used integer not null default 0 check (journal_alerts_used >= 0);

comment on column public.user_ai_usage.journal_alerts_used is 'Monthly AI-enhanced watchlist alert copy (Member vs Pro limits in app).';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_notifications'
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
          'watchlist_plan_level'
        )
      );
  end if;
end $$;

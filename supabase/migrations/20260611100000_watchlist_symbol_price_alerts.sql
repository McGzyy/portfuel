-- Pro: per-symbol ±% price move threshold (null = use global watchlist_alert_prefs.price_move_pct)

alter table public.user_watchlist
  add column if not exists price_alert_pct smallint null;

alter table public.user_watchlist
  drop constraint if exists user_watchlist_price_alert_pct_check;

alter table public.user_watchlist
  add constraint user_watchlist_price_alert_pct_check
  check (price_alert_pct is null or (price_alert_pct >= 3 and price_alert_pct <= 20));

comment on column public.user_watchlist.price_alert_pct is
  'Optional per-symbol ±% move alert threshold (Pro). Null uses users.watchlist_alert_prefs.price_move_pct.';

-- Baseline price when symbol added (for % move alerts on watchlist)

alter table public.user_watchlist
  add column if not exists baseline_price numeric(14, 4);

comment on column public.user_watchlist.baseline_price is 'Quote at add time; used for change-since-add alerts.';

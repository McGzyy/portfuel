-- Pro: on-demand AI watchlist digest usage (monthly cap in app)

alter table public.user_ai_usage
  add column if not exists watchlist_digest_used integer not null default 0 check (watchlist_digest_used >= 0);

comment on column public.user_ai_usage.watchlist_digest_used is 'Monthly on-demand AI watchlist digest generations (Pro limits in app).';

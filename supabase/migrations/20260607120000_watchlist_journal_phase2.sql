-- Journal phase 2: catalysts, risks, tags, outcomes, bull/base/bear scenarios

alter table public.user_watchlist
  add column if not exists catalysts text[] not null default '{}',
  add column if not exists risk_factors text,
  add column if not exists personal_tags text[] not null default '{}',
  add column if not exists outcome text not null default 'watching',
  add column if not exists bull_case_price numeric(14, 4),
  add column if not exists base_case_price numeric(14, 4),
  add column if not exists bear_case_price numeric(14, 4);

alter table public.user_watchlist
  drop constraint if exists user_watchlist_outcome_check;

alter table public.user_watchlist
  add constraint user_watchlist_outcome_check
  check (
    outcome in (
      'watching',
      'developing',
      'invalidated',
      'closed_correct',
      'closed_incorrect',
      'closed_early'
    )
  );

comment on column public.user_watchlist.catalysts is 'Preset catalyst tags (earnings, product launch, etc.).';
comment on column public.user_watchlist.risk_factors is 'What could invalidate the thesis.';
comment on column public.user_watchlist.personal_tags is 'User tags: AI, swing trade, earnings play, etc.';
comment on column public.user_watchlist.outcome is 'Thesis outcome tracking for journal review.';

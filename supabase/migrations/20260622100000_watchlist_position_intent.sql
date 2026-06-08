-- Private trade posture per watchlist symbol (what you're doing — not broker holdings).

alter table public.user_watchlist
  add column if not exists position_intent text not null default 'researching';

alter table public.user_watchlist
  drop constraint if exists user_watchlist_position_intent_check;

alter table public.user_watchlist
  add constraint user_watchlist_position_intent_check
  check (
    position_intent in (
      'researching',
      'building',
      'active',
      'trimming',
      'exited',
      'passed'
    )
  );

comment on column public.user_watchlist.position_intent is
  'Private posture: researching, building, active, trimming, exited, or passed — separate from thesis outcome.';

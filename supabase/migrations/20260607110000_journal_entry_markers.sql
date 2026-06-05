-- Price snapshot when a journal entry is logged (chart marker)

alter table public.watchlist_journal_entries
  add column if not exists marker_price numeric(14, 4);

comment on column public.watchlist_journal_entries.marker_price is 'Last price when entry was saved; drawn on private journal chart.';

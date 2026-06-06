-- Journal phase 4: entry types, AI research snapshots, structured metadata

alter table public.watchlist_journal_entries
  add column if not exists entry_type text not null default 'note',
  add column if not exists metadata jsonb;

alter table public.watchlist_journal_entries
  drop constraint if exists watchlist_journal_entries_type_check;

alter table public.watchlist_journal_entries
  add constraint watchlist_journal_entries_type_check
  check (
    entry_type in (
      'note',
      'price_action',
      'earnings',
      'news',
      'thesis_update',
      'ai_research',
      'system'
    )
  );

create index if not exists watchlist_journal_entries_type_idx
  on public.watchlist_journal_entries (user_id, symbol, entry_type);

comment on column public.watchlist_journal_entries.entry_type is 'Category for filtering — ai_research stores AI review snapshots.';
comment on column public.watchlist_journal_entries.metadata is 'Structured payload (e.g. AI research fields).';

-- Journal entry types for building, trimming, and exit notes.

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
      'building',
      'trimming',
      'exit',
      'ai_research',
      'system'
    )
  );

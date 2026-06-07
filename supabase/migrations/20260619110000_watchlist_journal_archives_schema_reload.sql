-- Ensure PostgREST sees watchlist_journal_archives after migration #52.
notify pgrst, 'reload schema';

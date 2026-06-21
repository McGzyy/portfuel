-- PostgREST upsert requires a unique constraint (not only a unique index).

alter table public.desk_signal_candidates
  drop constraint if exists desk_signal_candidates_symbol_key;

drop index if exists public.desk_signal_candidates_symbol_uidx;

alter table public.desk_signal_candidates
  add constraint desk_signal_candidates_symbol_key unique (symbol);

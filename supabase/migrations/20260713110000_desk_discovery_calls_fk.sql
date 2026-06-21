-- Add published_call_id FK when core calls table exists (may be applied after discovery migrations).

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'calls'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'desk_signal_candidates'
      and column_name = 'published_call_id'
  ) and not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'desk_signal_candidates'
      and constraint_name = 'desk_signal_candidates_published_call_id_fkey'
  ) then
    alter table public.desk_signal_candidates
      add constraint desk_signal_candidates_published_call_id_fkey
      foreign key (published_call_id) references public.calls (id) on delete set null;
  end if;
end $$;

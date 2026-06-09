-- Peak return tracking + member call close (lock exit return for stats).
alter table public.calls
  add column if not exists peak_return_pct numeric(8, 4),
  add column if not exists closed_at timestamptz,
  add column if not exists exit_price numeric(14, 4);

update public.calls
set peak_return_pct = return_pct
where return_pct is not null
  and peak_return_pct is null;

create index if not exists calls_user_closed_idx
  on public.calls (user_id, closed_at desc nulls last);

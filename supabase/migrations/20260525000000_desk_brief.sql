-- Fueled desk: weekly note + pinned thesis (admin-edited)

create table if not exists public.desk_brief (
  id text primary key default 'default' check (id = 'default'),
  weekly_note text,
  pinned_call_id uuid references public.calls (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.desk_brief (id)
values ('default')
on conflict (id) do nothing;

comment on table public.desk_brief is 'Singleton row: PortFuel desk weekly note and optional pinned call.';

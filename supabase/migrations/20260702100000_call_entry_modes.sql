-- Live vs conditional entry; pending activation and expiry.

alter table public.calls
  add column if not exists entry_mode text not null default 'live'
    check (entry_mode in ('live', 'conditional')),
  add column if not exists call_state text not null default 'active'
    check (call_state in ('pending_entry', 'active', 'cancelled', 'expired')),
  add column if not exists trigger_entry_price numeric(14, 4),
  add column if not exists activated_at timestamptz,
  add column if not exists expires_at timestamptz;

create index if not exists calls_pending_entry_idx
  on public.calls (call_state, expires_at)
  where call_state = 'pending_entry';

comment on column public.calls.entry_mode is 'live = entry locked at publish mark; conditional = wait for trigger_entry_price.';
comment on column public.calls.call_state is 'pending_entry until trigger hit; cancelled/expired are terminal for never-activated calls.';

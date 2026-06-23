-- Auto-close member calls at stop/target; record exit reason.

alter table public.calls
  add column if not exists close_reason text
    check (close_reason is null or close_reason in ('manual', 'stop_hit', 'target_hit'));

alter table public.users
  add column if not exists auto_close_on_stop boolean not null default true,
  add column if not exists auto_close_on_target boolean not null default true;

comment on column public.calls.close_reason is 'How the call was closed: manual, stop_hit, or target_hit.';
comment on column public.users.auto_close_on_stop is 'Lock return at stop when price crosses (default on).';
comment on column public.users.auto_close_on_target is 'Lock return at target when price crosses (default on).';

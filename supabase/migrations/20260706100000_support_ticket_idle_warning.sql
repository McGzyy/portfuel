-- Auto-close warning tracking for idle member replies

alter table public.support_tickets
  add column if not exists member_idle_warned_at timestamptz;

comment on column public.support_tickets.member_idle_warned_at is
  'When staff-idle auto-close warning was sent (waiting_on_member)';

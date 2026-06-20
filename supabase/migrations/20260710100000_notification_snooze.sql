-- Per-notification snooze (hide from inbox until a timestamp)

alter table public.user_notifications
  add column if not exists snoozed_until timestamptz;

comment on column public.user_notifications.snoozed_until is
  'When set and in the future, hide this alert from the inbox until the snooze expires.';

create index if not exists user_notifications_user_snoozed_idx
  on public.user_notifications (user_id, snoozed_until)
  where snoozed_until is not null;

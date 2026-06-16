-- Discord thread linkage for official support tickets

alter table public.support_tickets
  add column if not exists discord_guild_id text,
  add column if not exists discord_thread_id text,
  add column if not exists discord_root_message_id text;

create unique index if not exists support_tickets_discord_thread_uidx
  on public.support_tickets (discord_thread_id)
  where discord_thread_id is not null;

comment on column public.support_tickets.discord_thread_id is 'Staff support thread in #member-support';
comment on column public.support_tickets.discord_root_message_id is 'Root embed message that spawned the thread';

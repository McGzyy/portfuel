-- Support tickets: private Discord channel per ticket (replaces thread model)

drop index if exists public.support_tickets_discord_thread_uidx;

alter table public.support_tickets
  rename column discord_thread_id to discord_channel_id;

create unique index if not exists support_tickets_discord_channel_uidx
  on public.support_tickets (discord_channel_id)
  where discord_channel_id is not null;

comment on column public.support_tickets.discord_channel_id is 'Private support channel for this ticket';
comment on column public.support_tickets.discord_root_message_id is 'Opening embed in the ticket channel';

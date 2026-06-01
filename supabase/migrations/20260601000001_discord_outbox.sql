-- Discord outbox: queue announcements for the bot service to post.

do $$
begin
  create type public.discord_outbox_status as enum ('pending', 'sent', 'failed');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.discord_outbox (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  channel_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.discord_outbox_status not null default 'pending',
  locked_at timestamptz,
  locked_by text,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discord_outbox_pending_idx
  on public.discord_outbox (status, created_at asc);
create index if not exists discord_outbox_channel_idx
  on public.discord_outbox (guild_id, channel_id, created_at desc);

create trigger discord_outbox_updated_at before update on public.discord_outbox
  for each row execute function public.set_updated_at();

alter table public.discord_outbox enable row level security;


-- Track human verification for link reminder DMs (Verified but not linked).

create table if not exists public.discord_human_verified (
  guild_id text not null,
  discord_user_id text not null,
  verified_at timestamptz not null default now(),
  link_reminder_sent_at timestamptz,
  primary key (guild_id, discord_user_id)
);

create index if not exists discord_human_verified_reminder_idx
  on public.discord_human_verified (guild_id, verified_at)
  where link_reminder_sent_at is null;

alter table public.discord_human_verified enable row level security;

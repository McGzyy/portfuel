-- Discord account linking + verification sessions

create table if not exists public.discord_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  guild_id text not null,
  discord_user_id text not null,
  linked_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guild_id, discord_user_id),
  unique (guild_id, user_id)
);

create index if not exists discord_accounts_user_id_idx on public.discord_accounts (user_id);
create index if not exists discord_accounts_discord_user_idx on public.discord_accounts (guild_id, discord_user_id);

create table if not exists public.discord_link_tokens (
  token uuid primary key default gen_random_uuid(),
  guild_id text not null,
  discord_user_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by_user_id uuid references public.users (id) on delete set null
);

create index if not exists discord_link_tokens_lookup_idx on public.discord_link_tokens (guild_id, discord_user_id, created_at desc);
create index if not exists discord_link_tokens_expires_idx on public.discord_link_tokens (expires_at);

create trigger discord_accounts_updated_at before update on public.discord_accounts
  for each row execute function public.set_updated_at();

alter table public.discord_accounts enable row level security;
alter table public.discord_link_tokens enable row level security;


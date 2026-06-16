-- Discord DM preview help for non–Pro / unlinked users (lifetime cap enforced in app)

create table if not exists public.discord_guest_help_usage (
  discord_user_id text primary key,
  questions_used integer not null default 0 check (questions_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger discord_guest_help_usage_updated_at before update on public.discord_guest_help_usage
  for each row execute function public.set_updated_at();

alter table public.discord_guest_help_usage enable row level security;

comment on table public.discord_guest_help_usage is
  'Lifetime preview help questions for Discord users without Pro Help access.';

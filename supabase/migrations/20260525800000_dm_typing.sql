-- Ephemeral typing state for 1:1 DMs (polled by clients; rows older than ~5s are ignored)

create table if not exists public.dm_typing (
  thread_id uuid not null references public.dm_threads (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  typing_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index if not exists dm_typing_thread_idx on public.dm_typing (thread_id);

comment on table public.dm_typing is 'Last typing heartbeat per participant; not a durable audit log.';

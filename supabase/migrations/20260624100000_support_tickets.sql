-- Member support tickets + threaded messages

create sequence if not exists public.support_ticket_number_seq start 1001;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number integer not null unique default nextval('public.support_ticket_number_seq'),
  user_id uuid not null references public.users (id) on delete cascade,
  category text not null check (
    category in ('billing', 'account', 'calls', 'technical', 'other')
  ),
  subject text not null check (char_length(trim(subject)) between 3 and 200),
  status text not null default 'open' check (
    status in ('open', 'waiting_on_member', 'waiting_on_support', 'resolved', 'closed')
  ),
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  resolved_at timestamptz,
  admin_notified_at timestamptz
);

create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id, last_message_at desc);

create index if not exists support_tickets_status_idx
  on public.support_tickets (status, last_message_at desc);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_user_id uuid references public.users (id) on delete set null,
  author_role text not null check (author_role in ('member', 'admin', 'system')),
  body text not null check (char_length(trim(body)) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at asc);

comment on table public.support_tickets is 'Member support requests handled by PortFuel staff.';
comment on table public.support_ticket_messages is 'Threaded messages on a support ticket.';

-- Notification types for ticket lifecycle
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_notifications'
  ) then
    alter table public.user_notifications
      drop constraint if exists user_notifications_type_check;

    alter table public.user_notifications
      add constraint user_notifications_type_check check (
        type in (
          'comment_on_call',
          'vote_on_call',
          'watchlist_call',
          'followed_member_call',
          'desk_portfolio_update',
          'call_milestone',
          'direct_message',
          'watchlist_price_move',
          'watchlist_earnings',
          'watchlist_plan_level',
          'admin_churn_feedback',
          'admin_support_ticket',
          'support_ticket_reply'
        )
      );
  end if;
end $$;

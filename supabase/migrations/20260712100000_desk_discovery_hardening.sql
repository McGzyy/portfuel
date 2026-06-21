-- Desk discovery hardening: publish tracking, admin notify dedupe, published status

alter table public.desk_signal_candidates
  add column if not exists published_call_id uuid,
  add column if not exists admin_notified_at timestamptz;

-- FK only when calls exists (fresh/partial DBs may not have core schema yet).
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'calls'
  ) and not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'desk_signal_candidates'
      and constraint_name = 'desk_signal_candidates_published_call_id_fkey'
  ) then
    alter table public.desk_signal_candidates
      add constraint desk_signal_candidates_published_call_id_fkey
      foreign key (published_call_id) references public.calls (id) on delete set null;
  end if;
end $$;

alter table public.desk_signal_candidates
  drop constraint if exists desk_signal_candidates_status_check;

alter table public.desk_signal_candidates
  add constraint desk_signal_candidates_status_check check (
    status in ('pending', 'snoozed', 'rejected', 'approved', 'published')
  );

create index if not exists desk_signal_candidates_pending_score_idx
  on public.desk_signal_candidates (score desc, last_seen_at desc)
  where status = 'pending';

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
          'admin_desk_discovery',
          'support_ticket_reply',
          'support_ticket_opened',
          'support_ticket_idle_warning',
          'support_ticket_status',
          'billing_payment_failed',
          'new_follower'
        )
      );
  end if;
end $$;

comment on column public.desk_signal_candidates.published_call_id is
  'Fueled call created from this discovery candidate after admin publish.';
comment on column public.desk_signal_candidates.admin_notified_at is
  'When admins were notified in-app about this high-score candidate.';

-- Engagement alert toggles + additional in-app notification types

alter table public.users
  add column if not exists engagement_alert_prefs jsonb not null default jsonb_build_object(
    'comments_on_my_calls', true,
    'votes_on_my_calls', true,
    'direct_messages', true,
    'followed_member_calls', true,
    'call_milestones', true,
    'desk_portfolio_updates', true,
    'new_followers', true
  );

comment on column public.users.engagement_alert_prefs is
  'Per-user toggles for social/call engagement alerts (in-app + optional email).';

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

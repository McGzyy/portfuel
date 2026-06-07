-- Subscription cancellation feedback (member → admin)

create table if not exists public.subscription_cancellation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  reason text not null check (
    reason in (
      'too_expensive',
      'not_using_enough',
      'missing_features',
      'found_alternative',
      'technical_issues',
      'temporary_break',
      'other'
    )
  ),
  comment text,
  membership_tier text check (membership_tier in ('member', 'pro')),
  billing_interval text check (billing_interval in ('monthly', 'annual')),
  subscription_status public.subscription_status not null,
  source text not null default 'pre_portal' check (
    source in ('pre_portal', 'post_portal', 'webhook')
  ),
  admin_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscription_cancellation_feedback_created_idx
  on public.subscription_cancellation_feedback (created_at desc);

create index if not exists subscription_cancellation_feedback_user_idx
  on public.subscription_cancellation_feedback (user_id, created_at desc);

comment on table public.subscription_cancellation_feedback is
  'Optional churn feedback when members cancel or intend to cancel via Stripe.';

-- Admin in-app notification type
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
          'admin_churn_feedback'
        )
      );
  end if;
end $$;

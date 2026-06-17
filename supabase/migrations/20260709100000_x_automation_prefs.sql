-- Admin-editable X automation toggles (overrides env when column is present).

alter table public.social_post_copy
  add column if not exists x_automation_prefs jsonb;

update public.social_post_copy
set x_automation_prefs = coalesce(
  x_automation_prefs,
  jsonb_build_object(
    'autopost_fueled_on_publish', false,
    'autopost_milestones', false,
    'cron_fueled_posts', true,
    'cron_leaderboard_posts', true,
    'cron_member_win_posts', false,
    'cron_weekly_digest_posts', false
  )
)
where id in ('default', 'variant_b');

comment on column public.social_post_copy.x_automation_prefs is
  'Admin toggles for X autopost and weekly cron post types. Requires X_API_ENABLED on the server.';

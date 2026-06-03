alter table public.social_post_log
  drop constraint if exists social_post_log_post_type_check;

alter table public.social_post_log
  add constraint social_post_log_post_type_check check (
    post_type in (
      'fueled',
      'leaderboard',
      'fueled_milestone',
      'member_win',
      'member_win_update',
      'weekly_digest'
    )
  );

alter table public.social_post_copy
  add column if not exists weekly_digest_template text;

update public.social_post_copy
set weekly_digest_template = 'PortFuel · Community performance this week
{{digest_lines}}
{{link}}
{{disclaimer}}'
where id = 'default' and weekly_digest_template is null;

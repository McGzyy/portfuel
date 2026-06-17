-- Editable Discord announcement lines (admin → Discord bot posts tab).

alter table public.social_post_copy
  add column if not exists discord_fueled_line text,
  add column if not exists discord_member_new_line text,
  add column if not exists discord_member_spotlight_line text,
  add column if not exists discord_target_hit_line text,
  add column if not exists discord_weekly_digest_line text,
  add column if not exists discord_milestone_line text;

update public.social_post_copy
set
  discord_fueled_line = coalesce(
    discord_fueled_line,
    '🔥 **Official desk call** · _Fueled thesis_'
  ),
  discord_member_new_line = coalesce(
    discord_member_new_line,
    '📣 **New member call** · _Timestamped on PortFuel_'
  ),
  discord_member_spotlight_line = coalesce(
    discord_member_spotlight_line,
    '⭐ **Member spotlight** · **{{symbol}}** on record'
  ),
  discord_target_hit_line = coalesce(
    discord_target_hit_line,
    '🎯 **Target reached** · **{{symbol}}**'
  ),
  discord_weekly_digest_line = coalesce(
    discord_weekly_digest_line,
    '📊 **Weekly digest** · PortFuel · Community performance this week'
  ),
  discord_milestone_line = coalesce(
    discord_milestone_line,
    '📈 **{{pct}} milestone** · **{{symbol}}**'
  )
where id in ('default', 'variant_b');

comment on column public.social_post_copy.discord_fueled_line is
  'Discord message line above Fueled desk call embeds.';
comment on column public.social_post_copy.discord_member_new_line is
  'Discord message line above new member call embeds.';
comment on column public.social_post_copy.discord_member_spotlight_line is
  'Discord spotlight line — supports {{symbol}}.';
comment on column public.social_post_copy.discord_target_hit_line is
  'Discord target-hit line — supports {{symbol}}.';
comment on column public.social_post_copy.discord_weekly_digest_line is
  'Discord weekly digest announcement line.';
comment on column public.social_post_copy.discord_milestone_line is
  'Discord milestone line — supports {{headline}}, {{symbol}}, {{pct}}.';

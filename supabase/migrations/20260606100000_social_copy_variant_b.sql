-- A/B copy: second template row + optional variant tag on post log.

insert into public.social_post_copy (
  id,
  milestone_lead_template,
  milestone_tail_template,
  fueled_template,
  leaderboard_template,
  member_win_template,
  member_win_update_template,
  weekly_digest_template,
  disclaimer
)
select
  'variant_b',
  milestone_lead_template,
  milestone_tail_template,
  fueled_template,
  leaderboard_template,
  'PortFuel · Member call on record
{{symbol}} {{direction}} · {{return_line}}
{{member_handle}}
See the full thesis on PortFuel.
{{link}}
{{disclaimer}}',
  member_win_update_template,
  weekly_digest_template,
  disclaimer
from public.social_post_copy
where id = 'default'
on conflict (id) do nothing;

alter table public.social_post_log
  add column if not exists copy_variant text;

comment on column public.social_post_log.copy_variant is
  'Template variant used for member_win / member_win_update (default | variant_b).';

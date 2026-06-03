-- Run once in Supabase SQL Editor after member_social_highlight migration.
-- Updates X copy + template to professional defaults (20% / 48h is code env, not stored here).

update public.social_post_copy
set
  member_win_template = 'PortFuel · Member call on record
{{symbol}} {{direction}} · {{return_line}}
{{member_handle}}
{{thesis_block}}{{link}}
{{disclaimer}}',
  updated_at = now()
where id = 'default';

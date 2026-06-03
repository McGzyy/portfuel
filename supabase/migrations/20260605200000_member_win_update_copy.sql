alter table public.social_post_copy
  add column if not exists member_win_update_template text;

update public.social_post_copy
set member_win_update_template = 'PortFuel · Update on record
{{symbol}} {{direction}} · {{headline}}
{{return_line}}
{{link}}
{{disclaimer}}'
where id = 'default' and member_win_update_template is null;

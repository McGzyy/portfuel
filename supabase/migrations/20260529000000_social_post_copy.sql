-- Editable X post copy templates (admin → Social / X Posts tab).
create table if not exists public.social_post_copy (
  id text primary key default 'default',
  milestone_lead_template text not null,
  milestone_tail_template text not null,
  fueled_template text not null,
  leaderboard_template text not null,
  disclaimer text not null default 'Not investment advice.',
  updated_at timestamptz not null default now()
);

insert into public.social_post_copy (
  id,
  milestone_lead_template,
  milestone_tail_template,
  fueled_template,
  leaderboard_template,
  disclaimer
)
values (
  'default',
  '{{headline}} · {{symbol}} {{direction}}
{{return_line}}',
  '{{link}}
{{disclaimer}}',
  'Fueled desk · {{symbol}} {{direction}}
{{thesis}}
{{link}}
{{disclaimer}}',
  'PortFuel rankings
{{leaderboard_lines}}
{{link}}
{{disclaimer}}',
  'Not investment advice.'
)
on conflict (id) do nothing;

comment on table public.social_post_copy is 'Singleton: editable X post copy templates for admin Social / X Posts tab.';

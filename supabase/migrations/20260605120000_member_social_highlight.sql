-- Member opt-in for X win spotlights + member_win post types.
-- Safe if earlier social migrations were never applied (creates log + copy tables).

-- ---------------------------------------------------------------------------
-- Users: spotlight opt-in
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists allow_social_highlight boolean not null default false,
  add column if not exists social_highlight_show_thesis boolean not null default true,
  add column if not exists social_highlight_show_username boolean not null default true,
  add column if not exists social_highlight_consented_at timestamptz;

comment on column public.users.allow_social_highlight is
  'Member allows PortFuel to feature qualifying winning calls on the brand X account.';

-- ---------------------------------------------------------------------------
-- social_post_log (from 20260525900000 + milestone/member types)
-- ---------------------------------------------------------------------------
create table if not exists public.social_post_log (
  id uuid primary key default gen_random_uuid(),
  post_type text not null,
  ref_id text not null,
  tweet_id text,
  posted_at timestamptz not null default now(),
  unique (post_type, ref_id)
);

alter table public.social_post_log
  add column if not exists parent_tweet_id text;

alter table public.social_post_log
  drop constraint if exists social_post_log_post_type_check;

alter table public.social_post_log
  add constraint social_post_log_post_type_check check (
    post_type in (
      'fueled',
      'leaderboard',
      'fueled_milestone',
      'member_win',
      'member_win_update'
    )
  );

create index if not exists social_post_log_posted_at_idx
  on public.social_post_log (posted_at desc);

comment on table public.social_post_log is
  'Prevents duplicate X posts for the same content ref (call id or weekly leaderboard key).';

comment on column public.social_post_log.parent_tweet_id is
  'Original tweet id when this row is a quote-tweet follow-up.';

alter table public.social_post_log enable row level security;

-- ---------------------------------------------------------------------------
-- social_post_copy (from 20260529000000 + member_win template)
-- ---------------------------------------------------------------------------
create table if not exists public.social_post_copy (
  id text primary key default 'default',
  milestone_lead_template text not null,
  milestone_tail_template text not null,
  fueled_template text not null,
  leaderboard_template text not null,
  disclaimer text not null default 'Not investment advice.',
  updated_at timestamptz not null default now()
);

alter table public.social_post_copy
  add column if not exists member_win_template text;

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

update public.social_post_copy
set member_win_template = 'PortFuel · Member call on record
{{symbol}} {{direction}} · {{return_line}}
{{member_handle}}
{{thesis_block}}{{link}}
{{disclaimer}}'
where id = 'default' and member_win_template is null;

comment on table public.social_post_copy is
  'Singleton: editable X post copy templates for admin Social / X Posts tab.';

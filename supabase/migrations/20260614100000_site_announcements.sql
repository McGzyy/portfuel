-- Admin-composed workspace announcements (banner in member dashboard)

create table if not exists public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'success')),
  audience text not null default 'all' check (audience in ('all', 'member', 'pro')),
  link_url text,
  link_label text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_announcements_active_window_idx
  on public.site_announcements (starts_at desc)
  where is_active = true;

create table if not exists public.user_announcement_dismissals (
  user_id uuid not null references public.users (id) on delete cascade,
  announcement_id uuid not null references public.site_announcements (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

comment on table public.site_announcements is 'Admin broadcast banners shown in the member workspace.';
comment on table public.user_announcement_dismissals is 'Per-user dismiss state for site announcements.';

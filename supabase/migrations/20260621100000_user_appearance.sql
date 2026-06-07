-- User appearance preferences (theme + home-screen icon)

alter table public.users
  add column if not exists theme_mode text not null default 'light'
    check (theme_mode in ('light', 'dark')),
  add column if not exists icon_theme text not null default 'auto'
    check (icon_theme in ('auto', 'dark', 'red', 'light'));

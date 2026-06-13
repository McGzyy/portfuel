-- Public profile fields: avatar + bio

alter table public.users
  add column if not exists bio text;

alter table public.users
  add column if not exists avatar_url text;

alter table public.users
  drop constraint if exists users_bio_length_check;

alter table public.users
  add constraint users_bio_length_check
  check (bio is null or char_length(bio) <= 280);

comment on column public.users.bio is
  'Optional public member bio (max 280 chars).';

comment on column public.users.avatar_url is
  'Public HTTPS URL for member profile photo (Supabase Storage).';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-avatars',
  'member-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

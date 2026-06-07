-- Persist workspace map / guide dismissal per user (not localStorage)

alter table public.users
  add column if not exists workspace_guide_seen_at timestamptz;

comment on column public.users.workspace_guide_seen_at is
  'When the member dismissed the workspace map intro modal.';

-- Existing members should not see the guide again on next login
update public.users
set workspace_guide_seen_at = coalesce(workspace_guide_seen_at, now())
where onboarding_completed_at is not null;

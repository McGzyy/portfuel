-- Support ticket file attachments (private Supabase Storage bucket)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

create table if not exists public.support_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  message_id uuid references public.support_ticket_messages (id) on delete set null,
  uploaded_by uuid not null references public.users (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  content_type text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 5242880),
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_attachments_ticket_idx
  on public.support_ticket_attachments (ticket_id, created_at asc);

create index if not exists support_ticket_attachments_message_idx
  on public.support_ticket_attachments (message_id);

comment on table public.support_ticket_attachments is
  'Screenshot/PDF attachments on support tickets (private storage).';

alter table public.support_ticket_attachments enable row level security;

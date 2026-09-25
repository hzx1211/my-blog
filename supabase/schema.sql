-- Run this once in Supabase Dashboard > SQL Editor.
-- Content is accessed only by the server using the service-role key.
create table if not exists public.blog_content (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.blog_content enable row level security;
revoke all on table public.blog_content from public, anon, authenticated;
grant select, insert, update on table public.blog_content to service_role;
drop policy if exists "server_access_only" on public.blog_content;
create policy "server_access_only" on public.blog_content
  for all to service_role
  using (true)
  with check (true);

-- Public reads are needed for the blog's images/audio/video. Uploads are made
-- with short-lived signed URLs created by the authenticated server endpoint.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-media',
  'blog-media',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/aac', 'audio/m4a', 'audio/mp3', 'audio/mp4', 'audio/mpeg',
    'audio/ogg', 'audio/wav', 'audio/wave', 'audio/x-m4a', 'audio/x-wav'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

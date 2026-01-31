-- 1. Fix Comment Counting (RPC)
create or replace function increment_post_comments(post_uuid uuid)
returns void as $$
begin
  update public.posts
  set comments_count = comments_count + 1
  where id = post_uuid;
end;
$$ language plpgsql security definer;

-- 2. Fix Delete Permissions for Posts
-- First, drop existing policy to ensure clean slate (ignore error if not exists)
drop policy if exists "Users can delete their own posts" on public.posts;

-- Create Delete Policy
create policy "Users can delete their own posts"
on public.posts
for delete
using (auth.uid() = user_id);

-- 3. Ensure Reports Table Exists
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) not null,
  post_id uuid references public.posts(id),
  reason text not null,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS on Reports
alter table public.reports enable row level security;

-- 5. Fix Report Permissions
drop policy if exists "Users can insert reports" on public.reports;
create policy "Users can insert reports" on public.reports
  for insert with check (auth.uid() = reporter_id);

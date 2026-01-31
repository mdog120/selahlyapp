-- Ensure Reports table exists and has policies
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) not null,
  post_id uuid references public.posts(id),
  reason text not null,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Reports
alter table public.reports enable row level security;

create policy "Users can insert reports" on public.reports
  for insert with check (auth.uid() = reporter_id);
  
-- Only admins usually view reports, but for now we won't add view policies for normal users

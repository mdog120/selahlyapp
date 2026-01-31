-- Create Vibes Table
create table if not exists public.vibes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  
  title text not null,
  url text not null,
  category text not null, -- 'Music', 'Podcast', 'Video', 'Influencer', 'Other'
  description text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.vibes enable row level security;

-- Policies
create policy "Anyone can view vibes" on public.vibes
  for select using (true);

create policy "Users can insert vibes" on public.vibes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own vibes" on public.vibes
  for delete using (auth.uid() = user_id);

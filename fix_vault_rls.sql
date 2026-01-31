-- Create threads table if not exists
create table if not exists public.threads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  category text not null,
  message_count int default 0,
  view_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.threads enable row level security;

-- Policies
create policy "Everyone can view threads"
  on public.threads for select
  using ( true );

create policy "Authenticated users can create threads"
  on public.threads for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own threads"
  on public.threads for update
  using ( auth.uid() = user_id );

-- Create messages table for the vault replies (if not exists)
create table if not exists public.vault_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vault_messages enable row level security;

create policy "Everyone can view vault messages"
  on public.vault_messages for select
  using ( true );

create policy "Authenticated users can post messages"
  on public.vault_messages for insert
  with check ( auth.uid() = user_id );

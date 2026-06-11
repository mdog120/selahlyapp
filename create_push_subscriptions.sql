-- SQL Migration: Create Push Subscriptions Table

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can insert own subscription" on public.push_subscriptions;
drop policy if exists "Users can view own subscriptions" on public.push_subscriptions;
drop policy if exists "Users can delete own subscriptions" on public.push_subscriptions;

-- Add RLS Policies
create policy "Users can insert own subscription" 
  on public.push_subscriptions for insert 
  with check (auth.uid() = user_id);

create policy "Users can view own subscriptions" 
  on public.push_subscriptions for select 
  using (auth.uid() = user_id);

create policy "Users can delete own subscriptions" 
  on public.push_subscriptions for delete 
  using (auth.uid() = user_id);

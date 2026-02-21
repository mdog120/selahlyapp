-- Add collected_flowers to profiles to store the user's permanent flower collection
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS collected_flowers JSONB DEFAULT '{}'::jsonb;

-- Create table for pending flower gifts
create table if not exists public.flower_gifts (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  flower_type text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.flower_gifts enable row level security;

drop policy if exists "Users can view gifts sent to them or by them" on public.flower_gifts;
create policy "Users can view gifts sent to them or by them" on public.flower_gifts 
for select using (auth.uid() = sender_id OR auth.uid() = receiver_id);

drop policy if exists "Users can insert gifts they send" on public.flower_gifts;
create policy "Users can insert gifts they send" on public.flower_gifts 
for insert with check (auth.uid() = sender_id);

drop policy if exists "Receivers can update gift status" on public.flower_gifts;
create policy "Receivers can update gift status" on public.flower_gifts 
for update using (auth.uid() = receiver_id);

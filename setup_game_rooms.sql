-- ============================================
-- Game Rooms — Multiplayer Game Room System
-- ============================================

-- 1. Create the game_rooms table
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id) on delete cascade not null,
  game_type text not null,
  status text not null default 'waiting',
  members jsonb not null default '[]'::jsonb,
  max_players int not null default 5,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.game_rooms enable row level security;

-- 3. RLS Policies
-- Anyone authenticated can view rooms
create policy "Anyone can view game rooms"
  on public.game_rooms for select
  to authenticated
  using (true);

-- Only the host can create a room (host_id must match auth.uid)
create policy "Auth users can create rooms"
  on public.game_rooms for insert
  to authenticated
  with check (auth.uid() = host_id);

-- Host can update their room
create policy "Host can update room"
  on public.game_rooms for update
  to authenticated
  using (auth.uid() = host_id);

-- Members can update to leave (remove themselves from members array)
create policy "Members can update to leave"
  on public.game_rooms for update
  to authenticated
  using (members::text like '%' || auth.uid()::text || '%');

-- Any authenticated user can join a waiting room
create policy "Anyone can join a waiting room"
  on public.game_rooms for update
  to authenticated
  using (status = 'waiting');

-- Host can delete their room
create policy "Host can delete room"
  on public.game_rooms for delete
  to authenticated
  using (auth.uid() = host_id);

-- 4. Enable Realtime
alter publication supabase_realtime add table public.game_rooms;

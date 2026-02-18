-- Add inventory and points to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 50, -- Start with 50 points
ADD COLUMN IF NOT EXISTS seeds JSONB DEFAULT '{"daisy": 2, "rose": 0, "lily": 0, "sunflower": 0, "tulip": 0}'::jsonb;

-- Ensure garden_plants table exists (re-run safe)
create table if not exists public.garden_plants (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  flower_type text not null,
  status text not null default 'planted', -- Changed default to 'planted' (seed stage)
  planted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  position_index integer not null CHECK (position_index >= 0 AND position_index <= 8),
  UNIQUE(user_id, position_index)
);

-- RLS (if not already enabled)
alter table public.garden_plants enable row level security;

-- Policies (drop first to avoid errors if re-running)
drop policy if exists "Users can view own plants" on public.garden_plants;
create policy "Users can view own plants" on public.garden_plants for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own plants" on public.garden_plants;
create policy "Users can insert own plants" on public.garden_plants for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own plants" on public.garden_plants;
create policy "Users can update own plants" on public.garden_plants for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own plants" on public.garden_plants;
create policy "Users can delete own plants" on public.garden_plants for delete using (auth.uid() = user_id);

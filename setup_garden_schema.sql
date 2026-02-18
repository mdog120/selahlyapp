-- Create table for garden plants
create table if not exists public.garden_plants (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  flower_type text not null, -- 'daisy', 'rose', 'lily', 'sunflower', 'tulip'
  status text not null default 'growing', -- 'growing', 'ready', 'bloomed'
  planted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  position_index integer not null CHECK (position_index >= 0 AND position_index <= 8),
  
  -- Constraint to ensure only one plant per spot per user (unless we handle history differently)
  -- For now, let's assume we delete or archive harvested plants to make room, or this table represents CURRENT garden state.
  UNIQUE(user_id, position_index)
);

-- RLS
alter table public.garden_plants enable row level security;

create policy "Users can view own plants" on public.garden_plants
  for select using (auth.uid() = user_id);

create policy "Users can insert own plants" on public.garden_plants
  for insert with check (auth.uid() = user_id);

create policy "Users can update own plants" on public.garden_plants
  for update using (auth.uid() = user_id);

create policy "Users can delete own plants" on public.garden_plants
  for delete using (auth.uid() = user_id);

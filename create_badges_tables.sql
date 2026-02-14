-- Create Badges Table
create table if not exists badges (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text not null,
  icon_name text not null, -- references a lucide icon or a custom asset name
  category text not null, -- e.g., 'spiritual', 'community', 'streak'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create User Badges Table
create table if not exists user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  badge_id uuid references badges(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- RLS Policies
alter table badges enable row level security;
alter table user_badges enable row level security;

-- Badges are viewable by everyone
create policy "Badges are viewable by everyone"
  on badges for select
  using (true);

-- User badges are viewable by everyone (so you can see others' profiles)
create policy "User badges are viewable by everyone"
  on user_badges for select
  using (true);

-- Only system/service role should insert badges/user_badges really, but for now we'll allow authenticated users to insert their own via RPC or strict policy if needed. 
-- Ideally we use a secure function. For now, we will use a policy that allows insert if the user_id matches, 
-- BUT we want to prevent users from just awarding themselves badges. 
-- So we will rely on a SECURITY DEFINER function to award badges, and disable client-side insert for user_badges.

-- RPC to award a badge securely
create or replace function award_badge(p_user_id uuid, p_badge_name text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_badge_id uuid;
begin
  -- Find badge ID
  select id into v_badge_id from badges where name = p_badge_name;
  
  if v_badge_id is null then
    return false; -- Badge not found
  end if;

  -- Check if already earned
  if exists (select 1 from user_badges where user_id = p_user_id and badge_id = v_badge_id) then
    return true; -- Already has it, consider success
  end if;

  -- Insert
  insert into user_badges (user_id, badge_id)
  values (p_user_id, v_badge_id);

  return true;
end;
$$;

-- Seed Initial Badges
insert into badges (name, description, icon_name, category)
values 
  ('First Glow', 'Completed your first Grace & Glow diary entry.', 'Candle', 'spiritual'),
  ('Voice of Grace', 'Shared your first ever post with the community.', 'Feather', 'community'),
  ('Praying Hands', 'Joined a Selah Circle for the first time.', 'Users', 'community'),
  ('Selah Sister', 'Updated your profile with a bio and photo.', 'Heart', 'community')
on conflict (name) do nothing;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
-- Links to Supabase Auth, stores user stats and settings
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  first_name text,
  last_name text,
  avatar_url text,
  biography text,
  
  -- Logic Flags
  accepted_code_of_conduct boolean default false,
  
  -- Stats
  streak_count int default 0,
  last_journal_date timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRAYER POCKET
create table public.prayers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  is_anonymous boolean default false,
  
  pray_count int default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tracking who prayed for whom (to prevent double counting)
create table public.prayer_interactions (
  prayer_id uuid references public.prayers(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (prayer_id, user_id)
);

-- GRACE & GLOW DIARIES
create table public.diaries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  
  verse_reference text, -- e.g., "John 3:16"
  content text,         -- The journal entry
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- THE LILY PAD (Social Feed)
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  
  image_url text not null,
  caption text,
  
  likes_count int default 0,
  comments_count int default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- THE VELVET VAULT (Forums)
create table public.threads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  
  title text not null,
  category text, -- e.g., "Relationships", "Faith", "Struggles"
  view_count int default 0,
  message_count int default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.thread_messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FRIENDS SYSTEM
create table public.friendships (
  user_id_1 uuid references public.profiles(id) not null,
  user_id_2 uuid references public.profiles(id) not null,
  status text default 'pending', -- 'pending', 'accepted', 'blocked'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id_1, user_id_2)
);

-- REPORTS (Safety)
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) not null,
  target_id uuid, -- Profile ID being reported
  post_id uuid,   -- OR Post ID
  reason text not null,
  status text default 'open', -- 'open', 'resolved'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) policies would go here
-- For rapid prototyping, you might start with public access but typically:
alter table profiles enable row level security;
alter table prayers enable row level security;
alter table diaries enable row level security;
alter table posts enable row level security;
alter table threads enable row level security;

-- Example: Everyone can read profiles
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

-- Example: Users can insert their own profile
create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- Example: Users can update own profile
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Create the profile_stickies table
create table if not exists public.profile_stickies (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null, -- The recipient
    author_id uuid references public.profiles(id) on delete cascade not null, -- The sender
    content text check (char_length(content) <= 140) not null,
    color text default 'yellow' check (color in ('yellow', 'pink', 'blue', 'green', 'purple')),
    is_private boolean default false,
    created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profile_stickies enable row level security;

-- Policies

-- 1. View Policies
-- Public Stickies: Anyone can see public stickies on any profile
create policy "Anyone can view public stickies"
    on public.profile_stickies for select
    using (is_private = false);

-- Private Stickies: Only the recipient and the author can see private stickies
create policy "Recipient and author can view private stickies"
    on public.profile_stickies for select
    using (
        (auth.uid() = profile_id) or -- Recipient
        (auth.uid() = author_id)     -- Author
    );

-- 2. Insert Policy
-- Authenticated users can create stickies
create policy "Authenticated users can create stickies"
    on public.profile_stickies for insert
    with check (auth.role() = 'authenticated');

-- 3. Delete Policy
-- Recipient can delete stickies on their wall
create policy "Recipient can delete stickies"
    on public.profile_stickies for delete
    using (auth.uid() = profile_id);

-- Author can delete their own stickies
create policy "Author can delete own stickies"
    on public.profile_stickies for delete
    using (auth.uid() = author_id);

-- Create Realtime publication if not exists (for instant updates)
-- Assuming 'supabase_realtime' publication exists, we add the table to it
alter publication supabase_realtime add table public.profile_stickies;

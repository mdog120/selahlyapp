-- Create the profile_stickies table (Safe if exists)
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

-- Policies (Drop first to allow re-running script)

-- 1. View Policies
drop policy if exists "Anyone can view public stickies" on public.profile_stickies;
create policy "Anyone can view public stickies"
    on public.profile_stickies for select
    using (is_private = false);

drop policy if exists "Recipient and author can view private stickies" on public.profile_stickies;
create policy "Recipient and author can view private stickies"
    on public.profile_stickies for select
    using (
        (auth.uid() = profile_id) or -- Recipient
        (auth.uid() = author_id)     -- Author
    );

-- 2. Insert Policy
drop policy if exists "Authenticated users can create stickies" on public.profile_stickies;
create policy "Authenticated users can create stickies"
    on public.profile_stickies for insert
    with check (auth.role() = 'authenticated');

-- 3. Delete Policy
drop policy if exists "Recipient can delete stickies" on public.profile_stickies;
create policy "Recipient can delete stickies"
    on public.profile_stickies for delete
    using (auth.uid() = profile_id);

drop policy if exists "Author can delete own stickies" on public.profile_stickies;
create policy "Author can delete own stickies"
    on public.profile_stickies for delete
    using (auth.uid() = author_id);

-- Create Realtime publication if not exists
-- Use a DO block to avoid error if table already in publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'profile_stickies') then
    alter publication supabase_realtime add table public.profile_stickies;
  end if;
end
$$;

-- Grant Permissions (Critical for access)
grant select, insert, delete on table public.profile_stickies to authenticated;
grant select on table public.profile_stickies to anon;
grant select, insert, delete on table public.profile_stickies to service_role;

-- Fix Infinite Recursion by using a Security Definer function
create extension if not exists "pgcrypto";

-- 1. Create helper function to get user's groups securely (Bypasses RLS recursion)
create or replace function get_my_group_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id from group_members where user_id = auth.uid();
$$;

-- 2. Create Tables (Idempotent - ensures they exist before we drop policies on them)
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  admin_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  image_url text
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

create table if not exists group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_by jsonb default '[]'::jsonb,
  reactions jsonb default '{}'::jsonb
);

-- 3. Enable RLS
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_messages enable row level security;

-- 4. Drop potentially recursive policies (Clean slate)
drop policy if exists "Groups are visible to members" on groups;
drop policy if exists "Users can create groups" on groups;
drop policy if exists "Admins can update group" on groups;
drop policy if exists "Admins can delete group" on groups;

drop policy if exists "Members are visible to group members" on group_members;
drop policy if exists "Admins can add members" on group_members;
drop policy if exists "Admins remove or User leaves" on group_members;

drop policy if exists "Messages visible to group members" on group_messages;
drop policy if exists "Members can insert messages" on group_messages;
drop policy if exists "Members can update messages" on group_messages;


-- 5. Create Robust Policies

-- GROUPS
create policy "Groups are visible to members"
  on groups for select
  using (
    id in (select get_my_group_ids())
    or admin_id = auth.uid()
  );

create policy "Users can create groups"
  on groups for insert
  with check (auth.uid() = admin_id);

create policy "Admins can update group"
  on groups for update
  using (auth.uid() = admin_id);
  
create policy "Admins can delete group"
  on groups for delete
  using (auth.uid() = admin_id);

-- MEMBERS
create policy "Members are visible to group members"
  on group_members for select
  using (
    group_id in (select get_my_group_ids())
    or exists (select 1 from groups where id = group_members.group_id and admin_id = auth.uid())
  );

create policy "Admins can add members"
  on group_members for insert
  with check (
    exists (
        select 1 from groups
        where id = group_members.group_id
        and admin_id = auth.uid()
    )
  );

create policy "Admins remove or User leaves"
  on group_members for delete
  using (
    exists (
        select 1 from groups
        where id = group_members.group_id
        and admin_id = auth.uid()
    )
    OR
    auth.uid() = user_id
  );

-- MESSAGES
create policy "Messages visible to group members"
  on group_messages for select
  using (
    group_id in (select get_my_group_ids())
  );

create policy "Members can insert messages"
  on group_messages for insert
  with check (
    group_id in (select get_my_group_ids())
  );
    
create policy "Members can update messages"
  on group_messages for update
  using (
    group_id in (select get_my_group_ids())
  );

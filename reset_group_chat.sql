-- RESET GROUP CHAT TABLES (FIXED ORDER)
-- This script deletes all group data and recreates the tables with correct Foreign Keys.
-- Run this to fix "Relation does not exist" or "Foreign Key" errors.

-- 1. Drop existing tables (Start fresh)
drop table if exists group_messages cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;

-- 2. Create Tables (Must exist BEFORE function definition)
create extension if not exists "pgcrypto";

create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  admin_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  image_url text
);

create table group_members (
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

create table group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_by jsonb default '[]'::jsonb,
  reactions jsonb default '{}'::jsonb
);

-- 3. Create helper function (Now safe because tables exist)
create or replace function get_my_group_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id from group_members where user_id = auth.uid();
$$;

-- 4. Enable RLS
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_messages enable row level security;

-- 5. Create Policies

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

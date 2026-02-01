-- Create Groups Table
create extension if not exists "pgcrypto";

create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  admin_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  image_url text -- Optional group avatar
);

-- Create Group Members Table
create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

-- Create Group Messages Table
create table if not exists group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_by jsonb default '[]'::jsonb, -- Array of user_ids who read it
  reactions jsonb default '{}'::jsonb -- Similar to DMs
);

-- Enable RLS
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_messages enable row level security;

-- Policies

-- GROUPS: Visible if you are a member
create policy "Groups are visible to members"
  on groups for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
    )
  );

-- GROUPS: Insert allowed by authenticated users (Admin is set on creation)
create policy "Users can create groups"
  on groups for insert
  with check (auth.uid() = admin_id);

-- GROUPS: Admin can update
create policy "Admins can update group"
  on groups for update
  using (auth.uid() = admin_id);

-- MEMBERS: Visible to other members of the same group
create policy "Members are visible to group members"
  on group_members for select
  using (
    exists (
      select 1 from group_members as gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
  );

-- MEMBERS: Insert allowed by Admin or Self (if invited? simplifying to Admin adds for now, or during creation)
-- Actually, we need to allow the creator to add themselves during creation.
-- And allow Admin to add others.
create policy "Admins can add members"
  on group_members for insert
  with check (
    exists (
        select 1 from groups
        where groups.id = group_members.group_id
        and groups.admin_id = auth.uid()
    ) 
    OR 
    (auth.uid() = user_id) -- Allow adding self (useful for initial creation transaction)
  );

-- MEMBERS: Admin can remove members, or member can remove themselves (leave)
create policy "Admins remove or User leaves"
  on group_members for delete
  using (
    exists (
        select 1 from groups
        where groups.id = group_members.group_id
        and groups.admin_id = auth.uid()
    )
    OR
    auth.uid() = user_id
  );

-- MESSAGES: Visible to members
create policy "Messages visible to group members"
  on group_messages for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = group_messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

-- MESSAGES: Insert allowed by members
create policy "Members can insert messages"
  on group_messages for insert
  with check (
    exists (
      select 1 from group_members
      where group_members.group_id = group_messages.group_id
      and group_members.user_id = auth.uid()
    )
  );
    
-- MESSAGES: Update (for reactions/read receipts) allowed by members
create policy "Members can update messages"
  on group_messages for update
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = group_messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

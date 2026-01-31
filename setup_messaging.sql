-- Create Direct Messages Table
create table if not exists public.direct_messages (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    receiver_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    created_at timestamptz default now() not null,
    read_at timestamptz
);

-- Enable RLS
alter table public.direct_messages enable row level security;

-- Policies

-- 0. Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own messages" on public.direct_messages;
drop policy if exists "Users can send messages" on public.direct_messages;

-- 1. Users can view messages sent BY them or TO them.
create policy "Users can view their own messages"
on public.direct_messages for select
using (
    auth.uid() = sender_id or auth.uid() = receiver_id
);

-- 2. Users can insert messages if they are the sender.
create policy "Users can send messages"
on public.direct_messages for insert
with check (
    auth.uid() = sender_id
);

-- 3. Users can update messages (e.g. mark as read) if they are the receiver.
create policy "Users can update received messages"
on public.direct_messages for update
using (
    auth.uid() = receiver_id
);

-- Indexes for performance
create index if not exists idx_messages_sender on public.direct_messages(sender_id);
create index if not exists idx_messages_receiver on public.direct_messages(receiver_id);
create index if not exists idx_messages_created_at on public.direct_messages(created_at desc);

-- Grant permissions
grant select, insert, update on public.direct_messages to authenticated;
grant select, insert, update on public.direct_messages to service_role;

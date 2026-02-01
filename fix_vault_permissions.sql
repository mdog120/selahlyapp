-- Enable RLS on threads if not already on
alter table public.threads enable row level security;

-- 1. DROP EXISTING POLICIES (to avoid errors)
drop policy if exists "Threads are viewable by everyone" on public.threads;
drop policy if exists "Authenticated users can create threads" on public.threads;
drop policy if exists "Users can delete own threads" on public.threads;

-- 2. RE-CREATE POLICIES (including the missing DELETE one!)

-- Allow everyone to VIEW threads
create policy "Threads are viewable by everyone" 
on public.threads for select 
using (true);

-- Allow authenticated users to CREATE threads
create policy "Authenticated users can create threads" 
on public.threads for insert 
with check (auth.uid() = user_id);

-- Allow users to DELETE their own threads
create policy "Users can delete own threads" 
on public.threads for delete 
using (auth.uid() = user_id);


-- MESSAGE PERMISSIONS (Safety check)
alter table public.thread_messages enable row level security;

drop policy if exists "Messages are viewable by everyone" on public.thread_messages;
drop policy if exists "Authenticated users can post messages" on public.thread_messages;
drop policy if exists "Users can delete own messages" on public.thread_messages;

create policy "Messages are viewable by everyone" 
on public.thread_messages for select 
using (true);

create policy "Authenticated users can post messages" 
on public.thread_messages for insert 
with check (auth.uid() = user_id);

create policy "Users can delete own messages" 
on public.thread_messages for delete 
using (auth.uid() = user_id);

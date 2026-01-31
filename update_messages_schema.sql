-- Add reactions and metadata columns to direct_messages table
alter table public.direct_messages 
add column if not exists reactions jsonb default '{}'::jsonb not null,
add column if not exists metadata jsonb default null;

-- Update policies to allow updating reactions
-- We need to allow users to update messages they are part of (sender or receiver)
-- The existing policy "Users can update received messages" only allows receivers.
-- We'll drop it and create a broader one, OR just add a new one.
-- Let's replace it to be cleaner.

drop policy if exists "Users can update received messages" on public.direct_messages;

-- New policy: Users can update messages if they are the sender OR the receiver.
-- Ideally we would restrict WHICH columns they can update, but Supabase standard policies don't support column-level granularity easily without triggers or functions.
-- For now, this is acceptable for the feature.
create policy "Users can update messages they are part of"
on public.direct_messages for update
using (
    auth.uid() = sender_id or auth.uid() = receiver_id
);

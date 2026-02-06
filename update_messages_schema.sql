-- 1. Add is_edited column
alter table public.direct_messages 
add column if not exists is_edited boolean default false;

-- 2. Update Policies (Enable Edit/Delete for Senders)

-- Update: Allow sender to update content (Edit) OR receiver to update read_at (Read Receipt)
drop policy if exists "Users can update direct messages" on public.direct_messages;
create policy "Users can update direct messages"
on public.direct_messages for update
using (
    auth.uid() = sender_id or auth.uid() = receiver_id
)
with check (
   -- Sender can update content and is_edited
   (auth.uid() = sender_id)
   OR 
   -- Receiver can usually only update read status (enforced by app logic, but RLS can be looser here for simplicity or stricter if needed)
   (auth.uid() = receiver_id)
);

-- Delete: Allow sender to delete their own messages
drop policy if exists "Users can delete their own messages" on public.direct_messages;
create policy "Users can delete their own messages"
on public.direct_messages for delete
using (
    auth.uid() = sender_id
);

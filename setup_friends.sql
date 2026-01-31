-- Enable RLS
alter table public.friendships enable row level security;

-- Policy: View Friendships
-- Users can see friendships they are part of
create policy "Users can view their own friendships"
on public.friendships for select
using (
  auth.uid() = user_id_1 or auth.uid() = user_id_2
);

-- Policy: Send Friend Request (Insert)
-- Any authenticated user can send a request (as user_id_1), user_id_2 is the target
-- user_id_1 must be the auth user
create policy "Users can send friend requests"
on public.friendships for insert
with check (
  auth.uid() = user_id_1
);

-- Policy: Update Friendship (Accept/Block)
-- Users can update if they are involved in the friendship
create policy "Users can update their friendships"
on public.friendships for update
using (
  auth.uid() = user_id_1 or auth.uid() = user_id_2
);

-- Policy: Cancel/Remove Friend (Delete)
create policy "Users can delete their friendships"
on public.friendships for delete
using (
  auth.uid() = user_id_1 or auth.uid() = user_id_2
);

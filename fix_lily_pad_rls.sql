-- Enable RLS for Lily Pad Tables
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.friendships enable row level security;

-- POLICIES

-- Posts: Everyone can view, Authenticated users can insert
create policy "Public posts are viewable by everyone" on public.posts
  for select using (true);

create policy "Authenticated users can insert posts" on public.posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own posts" on public.posts
  for update using (auth.uid() = user_id);

-- Likes: Everyone can view, Authenticated users can insert/delete
create policy "Likes are viewable by everyone" on public.post_likes
  for select using (true);

create policy "Authenticated users can like posts" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can unlike posts" on public.post_likes
  for delete using (auth.uid() = user_id);

-- Comments: Everyone can view, Authenticated users can insert
create policy "Comments are viewable by everyone" on public.post_comments
  for select using (true);

create policy "Authenticated users can comment" on public.post_comments
  for insert with check (auth.uid() = user_id);

-- Friendships: Users can view their own friendships
create policy "Users can view their own friendships" on public.friendships
  for select using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "Users can request friendship" on public.friendships
  for insert with check (auth.uid() = user_id_1);

create policy "Users can update friendship status" on public.friendships
  for update using (auth.uid() = user_id_2); -- Only recipient can accept

-- HELPER FUNCTIONS

-- Function to safely increment likes
create or replace function increment_post_likes(post_uuid uuid)
returns void as $$
begin
  update public.posts
  set likes_count = likes_count + 1
  where id = post_uuid;
end;
$$ language plpgsql security definer;

-- Function to safely decrement likes
create or replace function decrement_post_likes(post_uuid uuid)
returns void as $$
begin
  update public.posts
  set likes_count = likes_count - 1
  where id = post_uuid;
end;
$$ language plpgsql security definer;

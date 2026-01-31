-- 1. Create Notifications Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null, -- Who receives the notification
  actor_id uuid references public.profiles(id),         -- Who triggered it (e.g. liker)
  type text not null, -- 'like', 'comment', 'reply', 'pray'
  resource_id uuid,   -- ID of post/thread/prayer
  resource_type text, -- 'post', 'thread', 'prayer'
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.notifications enable row level security;
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

-- 2. Triggers to Auto-Create Notifications

-- Trigger for Post Likes
create or replace function handle_new_post_like()
returns trigger as $$
begin
  -- Don't notify self-likes
  if new.user_id != (select user_id from public.posts where id = new.post_id) then
    insert into public.notifications (user_id, actor_id, type, resource_id, resource_type)
    values (
      (select user_id from public.posts where id = new.post_id),
      new.user_id,
      'like',
      new.post_id,
      'post'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_like on public.post_likes;
create trigger on_post_like
  after insert on public.post_likes
  for each row execute procedure handle_new_post_like();


-- Trigger for Post Comments
create or replace function handle_new_post_comment()
returns trigger as $$
begin
  if new.user_id != (select user_id from public.posts where id = new.post_id) then
    insert into public.notifications (user_id, actor_id, type, resource_id, resource_type)
    values (
      (select user_id from public.posts where id = new.post_id),
      new.user_id,
      'comment',
      new.post_id,
      'post'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_comment on public.post_comments;
create trigger on_post_comment
  after insert on public.post_comments
  for each row execute procedure handle_new_post_comment();
  

-- Trigger for Thread Replies (Velvet Vault)
create or replace function handle_new_thread_reply()
returns trigger as $$
begin
  if new.user_id != (select user_id from public.threads where id = new.thread_id) then
    insert into public.notifications (user_id, actor_id, type, resource_id, resource_type)
    values (
      (select user_id from public.threads where id = new.thread_id),
      new.user_id,
      'reply',
      new.thread_id,
      'thread'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_thread_reply on public.thread_messages;
create trigger on_thread_reply
  after insert on public.thread_messages
  for each row execute procedure handle_new_thread_reply();

-- Trigger for Prayers (When someone prays for you)
-- Note: 'prayer_interactions' stores (prayer_id, user_id of pray-er)
create or replace function handle_new_prayer_interaction()
returns trigger as $$
begin
   -- Author of the prayer request
   if new.user_id != (select user_id from public.prayers where id = new.prayer_id) then
      insert into public.notifications (user_id, actor_id, type, resource_id, resource_type)
      values (
        (select user_id from public.prayers where id = new.prayer_id),
        new.user_id,
        'pray',
        new.prayer_id,
        'prayer'
      );
   end if;
   return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_prayer_interaction on public.prayer_interactions;
create trigger on_prayer_interaction
  after insert on public.prayer_interactions
  for each row execute procedure handle_new_prayer_interaction();

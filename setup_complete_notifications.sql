-- 1. NOTIFICATION FOR NEW MESSAGES
create or replace function handle_new_message_notification() 
returns trigger as $$
begin
  -- Notify receiver when they get a new message
  insert into public.notifications (user_id, actor_id, type, resource_id, resource_type, created_at)
  values (
    new.receiver_id,
    new.sender_id,
    'message',
    new.id,
    'message',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_message_notification on public.direct_messages;
create trigger on_new_message_notification
  after insert on public.direct_messages
  for each row execute procedure handle_new_message_notification();


-- 2. NOTIFICATION FOR PRAYERS (someone prayed for you)
create or replace function handle_prayer_interaction_notification() 
returns trigger as $$
declare
  prayer_owner_id uuid;
begin
  -- Get the owner of the prayer
  select user_id into prayer_owner_id from public.prayers where id = new.prayer_id;

  -- Don't notify if you pray for yourself
  if prayer_owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, resource_id, resource_type, created_at)
    values (
      prayer_owner_id,
      new.user_id,
      'prayer',
      new.prayer_id,
      'prayer',
      now()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_prayer_interaction on public.prayer_interactions;
create trigger on_new_prayer_interaction
  after insert on public.prayer_interactions
  for each row execute procedure handle_prayer_interaction_notification();


-- 3. NOTIFICATION FOR NEW POSTS (Notify ALL friends)
create or replace function handle_new_post_notification() 
returns trigger as $$
begin
  -- Insert a notification for every friend of the poster
  insert into public.notifications (user_id, actor_id, type, resource_id, resource_type, created_at)
  select 
    case 
      when user_id_1 = new.user_id then user_id_2 
      else user_id_1 
    end as user_id,
    new.user_id as actor_id,
    'post' as type,
    new.id as resource_id,
    'post' as resource_type,
    now() as created_at
  from public.friendships
  where (user_id_1 = new.user_id or user_id_2 = new.user_id)
  and status = 'accepted';
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_post_notification on public.posts;
create trigger on_new_post_notification
  after insert on public.posts
  for each row execute procedure handle_new_post_notification();

-- Trigger for Friend Requests
create or replace function handle_new_friend_request() 
returns trigger as $$
begin
  -- Notify user_id_2 (receiver) when user_id_1 (sender) makes a request
  if new.status = 'pending' then
    insert into public.notifications (user_id, actor_id, type, resource_id, resource_type)
    values (
      new.user_id_2, -- Receiver
      new.user_id_1, -- Sender
      'friend_request',
      new.user_id_1, -- Resource ID is the sender's profile ID for linking
      'profile'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_friend_request on public.friendships;

-- Create trigger
create trigger on_friend_request
  after insert on public.friendships
  for each row execute procedure handle_new_friend_request();

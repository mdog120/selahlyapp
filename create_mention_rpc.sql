-- Securely create a notification for a mention
-- Only inserts if the mentioned user exists and is not the sender
create or replace function notify_mention(target_username text, resource_id uuid, resource_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  -- Find user by username
  select id into target_id from profiles where username = target_username;
  
  -- If user exists and is not me (sender)
  if target_id is not null and target_id != auth.uid() then
    -- Check if notification already exists to avoid duplicates (optional but good)
    if not exists (
      select 1 from notifications 
      where user_id = target_id 
      and resource_id = notify_mention.resource_id 
      and type = 'mention'
    ) then
      insert into notifications (user_id, actor_id, type, resource_id, resource_type)
      values (target_id, auth.uid(), 'mention', resource_id, resource_type);
    end if;
  end if;
end;
$$;

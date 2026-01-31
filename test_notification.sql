-- Run this to send yourself a test notification immediately
-- This is useful if you are testing alone and can't use a second account

do $$
declare
  my_id uuid;
begin
  -- Get the current user's ID (or just the most recent user created)
  select id into my_id from auth.users order by created_at desc limit 1;

  if my_id is not null then
    insert into public.notifications (
      user_id, 
      actor_id, 
      type, 
      resource_id, 
      read, 
      created_at
    ) values (
      my_id, -- Recipient (You)
      my_id, -- Actor (Also You, for this test)
      'like', 
      null, -- No specific post needed for this test
      false, 
      now()
    );
  end if;
end $$;

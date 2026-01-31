-- Function to update streak when a user journals
create or replace function update_journal_streak(user_uuid uuid)
returns void as $$
declare
  last_date timestamp with time zone;
  current_streak int;
begin
  -- Get current stats
  select last_journal_date, streak_count 
  into last_date, current_streak
  from public.profiles 
  where id = user_uuid;

  -- Logic:
  -- If last_date is NULL -> First time ever. Streak = 1.
  -- If last_date was TODAY -> Already journaled. Do nothing.
  -- If last_date was YESTERDAY -> Continue streak. Streak + 1.
  -- If last_date was OLDER -> Broke streak. Reset to 1.
  
  if last_date is null then
    update public.profiles 
    set streak_count = 1, last_journal_date = now() 
    where id = user_uuid;
    
  elsif last_date::date = (now()::date - interval '1 day') then
    update public.profiles 
    set streak_count = current_streak + 1, last_journal_date = now() 
    where id = user_uuid;
    
  elsif last_date::date < (now()::date - interval '1 day') then
    update public.profiles 
    set streak_count = 1, last_journal_date = now() 
    where id = user_uuid;
    
  else
    -- Already likely journaled today, just update timestamp
    update public.profiles 
    set last_journal_date = now() 
    where id = user_uuid;
  end if;
  
end;
$$ language plpgsql security definer;

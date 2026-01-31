-- 1. Ensure biography exists (it likely does, but good to be safe)
alter table public.profiles 
add column if not exists biography text;

-- 2. Fix Streak Function (Re-run this!)
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

  -- Default streak to 0 if null
  if current_streak is null then
    current_streak := 0;
  end if;

  -- Logic:
  if last_date is null then
    -- First time ever
    update public.profiles 
    set streak_count = 1, last_journal_date = now() 
    where id = user_uuid;
    
  elsif last_date::date = (now()::date - interval '1 day') then
    -- Journaled yesterday -> Increment
    update public.profiles 
    set streak_count = current_streak + 1, last_journal_date = now() 
    where id = user_uuid;
    
  elsif last_date::date < (now()::date - interval '1 day') then
    -- Missed a day -> Reset to 1
    update public.profiles 
    set streak_count = 1, last_journal_date = now() 
    where id = user_uuid;
    
  else
    -- Already journaled today (or future?) -> Just update time, don't increment
    update public.profiles 
    set last_journal_date = now() 
    where id = user_uuid;
  end if;
  
end;
$$ language plpgsql security definer;

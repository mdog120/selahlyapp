-- FORCE TEST STREAK
-- This script backdates your last journal entry to "yesterday" so you can test the streak increment.

update public.profiles
set 
  last_journal_date = now() - interval '25 hours', -- Set to strictly yesterday
  streak_count = 1 -- Reset to 1 so you can see it go to 2
where id = auth.uid();

-- NOTE: After running this, go to "Grace & Glow" and journal. Your streak should jump to 2!

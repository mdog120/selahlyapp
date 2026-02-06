-- Forcefully fix the relationship between notes and profiles

-- 1. Drop the constraint if it exists (to ensure we can recreate it cleanly)
alter table public.notes
drop constraint if exists notes_user_id_fkey_profiles;

-- 2. Drop the constraint to auth.users if needed? 
-- No, we can have multiple FKs. But let's verify profiles exists.

-- 3. Add the Foreign Key explicitly
-- This ensures 'notes.user_id' points to 'profiles.id'
alter table public.notes
add constraint notes_user_id_fkey_profiles
foreign key (user_id)
references public.profiles(id)
on delete cascade;

-- 4. Verify RLS is not blocking (already done, but just safely ensuring)
alter table public.notes enable row level security;

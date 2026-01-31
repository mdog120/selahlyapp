-- Fix the profiles table to allow deleting the user
-- We drop the old strict constraint and add one that "Cascades" (auto-deletes)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- PROACTIVE FIX:
-- To prevent other "violated foreign key" errors from posts/messages/etc.,
-- we really should ensure they all cascade too. 
-- However, as a quick fix for the error you saw, we'll start with profiles.
-- The database likely has other constraints (like posts referencing profiles).
-- If you see another error after running this, we will fix that table too.

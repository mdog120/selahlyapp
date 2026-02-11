-- Add is_friends_public column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_friends_public BOOLEAN DEFAULT true;

-- Drop existing select policy
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;

-- Create new select policy
-- Users can view a friendship if:
-- 1. They are part of it (auth.uid in user_id_1, user_id_2)
-- 2. OR user_id_1 has a public friend list
-- 3. OR user_id_2 has a public friend list
CREATE POLICY "Users can view public friendships"
ON public.friendships FOR SELECT
USING (
  auth.uid() = user_id_1 
  OR auth.uid() = user_id_2
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_id_1 AND p.is_friends_public = true
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_id_2 AND p.is_friends_public = true
  )
);

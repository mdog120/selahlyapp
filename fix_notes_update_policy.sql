-- Fix Notes Update Policy

-- 1. Enable RLS (just in case)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing update policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;

-- 3. Create the UPDATE policy
CREATE POLICY "Users can update their own notes"
ON public.notes FOR UPDATE
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- 4. Ensure song columns exist (idempotent)
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS song_title text,
ADD COLUMN IF NOT EXISTS song_artist text,
ADD COLUMN IF NOT EXISTS song_link text;

-- 5. Force update the expires_at default if needed (optional but good for consistency)
ALTER TABLE public.notes 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '24 hours');

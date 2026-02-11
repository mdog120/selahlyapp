-- Add new bio fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS school text,
ADD COLUMN IF NOT EXISTS church text,
ADD COLUMN IF NOT EXISTS sport text,
ADD COLUMN IF NOT EXISTS hobby text,
ADD COLUMN IF NOT EXISTS fav_verse text;

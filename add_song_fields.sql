-- Add song fields to PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS song_title text,
ADD COLUMN IF NOT EXISTS song_artist text,
ADD COLUMN IF NOT EXISTS song_link text;

-- Add song fields to POSTS
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS song_title text,
ADD COLUMN IF NOT EXISTS song_artist text,
ADD COLUMN IF NOT EXISTS song_link text;

-- Add song fields to NOTES
-- (Assuming table exists as 'notes', if not this might fail or we need to find the real name)
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS song_title text,
ADD COLUMN IF NOT EXISTS song_artist text,
ADD COLUMN IF NOT EXISTS song_link text;

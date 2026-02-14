-- Add song preview and artwork columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS song_preview_url text,
ADD COLUMN IF NOT EXISTS song_album_art text;

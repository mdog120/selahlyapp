-- Add song_cassette_color column for custom cassette tape designs
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS song_cassette_color text DEFAULT 'rose';

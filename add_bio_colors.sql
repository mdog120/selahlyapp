-- Add color columns for bio fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS school_color text DEFAULT 'rose',
ADD COLUMN IF NOT EXISTS church_color text DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS sport_color text DEFAULT 'orange',
ADD COLUMN IF NOT EXISTS hobby_color text DEFAULT 'green',
ADD COLUMN IF NOT EXISTS fav_verse_color text DEFAULT 'purple';

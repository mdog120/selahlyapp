-- Complete setup for Bio Fields and Colors
-- Run this script to ensure all columns exist!

-- 1. Add Text Fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS school text,
ADD COLUMN IF NOT EXISTS church text,
ADD COLUMN IF NOT EXISTS sport text,
ADD COLUMN IF NOT EXISTS hobby text,
ADD COLUMN IF NOT EXISTS fav_verse text;

-- 2. Add Color Fields (defaulting to pastel presets)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS school_color text DEFAULT 'rose',
ADD COLUMN IF NOT EXISTS church_color text DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS sport_color text DEFAULT 'orange',
ADD COLUMN IF NOT EXISTS hobby_color text DEFAULT 'green',
ADD COLUMN IF NOT EXISTS fav_verse_color text DEFAULT 'purple';

-- Add cafe_high_score and cafe_avatar to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cafe_high_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cafe_avatar JSONB DEFAULT '{}'::jsonb;

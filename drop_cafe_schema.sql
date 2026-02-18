-- Remove cafe columns from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS cafe_high_score,
DROP COLUMN IF EXISTS cafe_avatar;

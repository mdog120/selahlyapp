-- Add location column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;

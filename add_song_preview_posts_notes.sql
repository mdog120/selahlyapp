-- Add song preview and album art to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS song_preview_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS song_album_art TEXT DEFAULT NULL;

-- Add song preview and album art to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS song_preview_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS song_album_art TEXT DEFAULT NULL;

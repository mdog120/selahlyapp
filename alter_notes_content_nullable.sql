-- Make content nullable in notes table to allow music-only notes
ALTER TABLE notes ALTER COLUMN content DROP NOT NULL;

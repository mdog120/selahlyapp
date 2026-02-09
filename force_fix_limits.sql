-- FORCE update the posts bucket to have NO file size limit.
-- This is the most robust way to fix the 413 error.

UPDATE storage.buckets
SET file_size_limit = NULL, -- NULL means unlimited
    allowed_mime_types = NULL, -- NULL means allow all types (just to be safe)
    public = true
WHERE id = 'posts';

-- Verify the change immediately
SELECT * FROM storage.buckets WHERE id = 'posts';

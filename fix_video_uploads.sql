-- Comprehensive fix for video uploads in 'posts' bucket

-- 1. Ensure the 'posts' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'posts', 
    'posts', 
    true, 
    1073741824, -- 1GB Limit
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 1073741824,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];

-- 2. Enable RLS on storage.objects if not already enabled (it usually is)
-- REMOVED: potentially causes permission errors and is enabled by default.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts and ensure clean state
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload posts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own posts" ON storage.objects;

-- 4. Recreate policies with correct permissions

-- Allow public read access to all objects in 'posts' bucket
CREATE POLICY "Public can view posts"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'posts' );

-- Allow authenticated users to upload to 'posts' bucket
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'posts' );

-- Allow users to update their own objects (e.g. metadata)
CREATE POLICY "Users can update own posts"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'posts' AND owner = auth.uid() );

-- Allow users to delete their own objects
CREATE POLICY "Users can delete own posts"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'posts' AND owner = auth.uid() );

-- 5. Verify configuration
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'posts';

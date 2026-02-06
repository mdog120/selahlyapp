-- Update the 'posts' bucket to support videos and larger files
-- Increased limit to 250MB to support high-quality phone videos
update storage.buckets
set public = true,
    file_size_limit = 262144000, -- 250MB
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
where id = 'posts';

-- Ensure policies allow uploads (if not already set correctly)
-- Policy for authenticated users to upload posts
drop policy if exists "Authenticated users can upload posts" on storage.objects;
create policy "Authenticated users can upload posts"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'posts' );

-- Policy for everyone to view posts
drop policy if exists "Public can view posts" on storage.objects;
create policy "Public can view posts"
on storage.objects for select
to public
using ( bucket_id = 'posts' );

-- Policy for users to update their own posts
drop policy if exists "Users can update own posts" on storage.objects;
create policy "Users can update own posts"
on storage.objects for update
to authenticated
using ( bucket_id = 'posts' and owner = auth.uid() );

-- Policy for users to delete their own posts
drop policy if exists "Users can delete own posts" on storage.objects;
create policy "Users can delete own posts"
on storage.objects for delete
to authenticated
using ( bucket_id = 'posts' and owner = auth.uid() );

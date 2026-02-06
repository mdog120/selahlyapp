-- Update the 'posts' bucket to support videos and larger files
-- Increased limit to 1GB to support high-quality 4K videos
update storage.buckets
set public = true,
    file_size_limit = 1073741824, -- 1GB (Safe for 4K 60fps clips)
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
where id = 'posts';

-- Ensure policies allow uploads (if not already set correctly)
drop policy if exists "Authenticated users can upload posts" on storage.objects;
create policy "Authenticated users can upload posts"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'posts' );

drop policy if exists "Public can view posts" on storage.objects;
create policy "Public can view posts"
on storage.objects for select
to public
using ( bucket_id = 'posts' );

drop policy if exists "Users can update own posts" on storage.objects;
create policy "Users can update own posts"
on storage.objects for update
to authenticated
using ( bucket_id = 'posts' and owner = auth.uid() );

drop policy if exists "Users can delete own posts" on storage.objects;
create policy "Users can delete own posts"
on storage.objects for delete
to authenticated
using ( bucket_id = 'posts' and owner = auth.uid() );

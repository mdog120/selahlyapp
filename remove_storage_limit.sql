-- Remove the file size limit entirely (set to NULL)
update storage.buckets
set file_size_limit = null, 
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
where id = 'posts';

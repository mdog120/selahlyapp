-- 1. Add new columns for Carousel and Video support
alter table public.posts 
add column if not exists media_urls text[] default null,
add column if not exists type text default 'image'; -- 'image', 'carousel', 'video'

-- 2. Migrate existing data (if any)
-- Move image_url to media_urls[1] if media_urls is empty
update public.posts 
set media_urls = array[image_url], type = 'image'
where media_urls is null and image_url is not null;

-- 3. Make image_url nullable (since we might use media_urls exclusively in future, 
-- but for backward compatibility we might keep populating it with the first image)
alter table public.posts alter column image_url drop not null;

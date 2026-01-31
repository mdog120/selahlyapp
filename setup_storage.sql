-- Create storage bucket for posts
insert into storage.buckets (id, name, public) 
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- Allow public access to view images
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'posts' );

-- Allow authenticated users to upload images
create policy "Authenticated Upload" 
on storage.objects for insert 
with check ( bucket_id = 'posts' and auth.role() = 'authenticated' );

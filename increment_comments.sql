-- Function to safely increment comments
create or replace function increment_post_comments(post_uuid uuid)
returns void as $$
begin
  update public.posts
  set comments_count = comments_count + 1
  where id = post_uuid;
end;
$$ language plpgsql security definer;

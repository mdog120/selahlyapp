-- Make image_url optional in posts table
alter table public.posts alter column image_url drop not null;

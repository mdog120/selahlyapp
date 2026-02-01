-- Force grant permissions on profile_stickies
-- Run this if you are seeing "stick it" success but no notes appear.

-- Grant access to authenticated users (logged in)
grant select, insert, delete on table public.profile_stickies to authenticated;

-- Grant access to anonymous users (public profiles)
grant select on table public.profile_stickies to anon;

-- Grant access to service role (backend)
grant select, insert, delete on table public.profile_stickies to service_role;

-- Ensure sequence permissions if any (though using uuid here)
-- grant usage, select on all sequences in schema public to authenticated;

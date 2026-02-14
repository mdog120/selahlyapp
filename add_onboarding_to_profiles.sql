-- Add Onboarding Flag to Profiles
alter table public.profiles
add column if not exists has_seen_tutorial boolean default false;

-- Create policy to allow users to update their own tutorial flag
-- (Assuming standard profile update policies exist, but ensuring specific column access if needed)
-- Actually, usually profile RLS allows update of own row. We'll rely on that.

-- Fun: Add a new badge for completing the tutorial? Maybe later.

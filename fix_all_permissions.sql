-- 1. PROFILES: Enable RLS and allow access
alter table public.profiles enable row level security;

-- Allow everyone (even anon, for now) to read profiles to ensure joins work
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);

-- Allow users to update their own profile
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- 2. PRAYERS: Ensure RLS is on and policies exist
alter table public.prayers enable row level security;

-- Drop existing policies to avoid conflicts (optional, but safer)
drop policy if exists "Allow read access for all authenticated users" on public.prayers;
drop policy if exists "Allow insert access for authenticated users" on public.prayers;

create policy "Allow read access for all authenticated users"
on public.prayers for select
to authenticated
using (true);

create policy "Allow insert access for authenticated users"
on public.prayers for insert
to authenticated
with check (auth.uid() = user_id);

-- 3. INTERACTIONS: Ensure RLS is on
alter table public.prayer_interactions enable row level security;

drop policy if exists "Allow insert on interactions" on public.prayer_interactions;
drop policy if exists "Allow read interactions" on public.prayer_interactions;

create policy "Allow insert on interactions"
on public.prayer_interactions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Allow read interactions"
on public.prayer_interactions for select
to authenticated
using (true);

-- 4. Re-create the function just in case
create or replace function increment_prayer_count(row_id uuid)
returns void as $$
begin
  update public.prayers
  set pray_count = pray_count + 1
  where id = row_id;
end;
$$ language plpgsql;

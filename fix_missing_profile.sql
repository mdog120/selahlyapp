-- 1. Create a function that runs when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, username)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    split_part(new.email, '@', 1) -- default username from email
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger (if it doesn't already exist)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. BACKFILL: Insert profiles for existing users who are missing them
insert into public.profiles (id, first_name, last_name, username)
select 
  id, 
  raw_user_meta_data->>'first_name', 
  raw_user_meta_data->>'last_name',
  split_part(email, '@', 1)
from auth.users
where id not in (select id from public.profiles);

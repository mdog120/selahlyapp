-- Function to allow a user to delete their own account
-- SECURITY DEFINER allows it to run with elevated privileges to access auth.users
create or replace function delete_own_account()
returns void as $$
begin
  -- Delete the user from auth.users
  -- This will cascade to public.profiles and other tables if foreign keys are set up with ON DELETE CASCADE
  delete from auth.users
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function delete_own_account() to authenticated;

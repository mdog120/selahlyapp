-- Function to atomically increment prayer count
-- Added SECURITY DEFINER to bypass RLS since users can't usually update others' rows
create or replace function increment_prayer_count(row_id uuid)
returns void as $$
begin
  update public.prayers
  set pray_count = pray_count + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

-- Ensure execute permission
grant execute on function increment_prayer_count(uuid) to authenticated;
grant execute on function increment_prayer_count(uuid) to service_role;

-- Also, let's make sure the count is actually accurate by recounting from interactions
-- This fixes any drift that might have happened
create or replace function recount_prayers()
returns void as $$
begin
  update public.prayers p
  set pray_count = (
    select count(*)
    from public.prayer_interactions pi
    where pi.prayer_id = p.id
  );
end;
$$ language plpgsql security definer;

-- Run the recount
select recount_prayers();

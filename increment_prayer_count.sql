-- Function to atomically increment prayer count
create or replace function increment_prayer_count(row_id uuid)
returns void as $$
begin
  update public.prayers
  set pray_count = pray_count + 1
  where id = row_id;
end;
$$ language plpgsql;

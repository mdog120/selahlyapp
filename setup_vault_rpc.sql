-- RPC for incrementing thread message count
create or replace function increment_thread_messages(thread_uuid uuid)
returns void as $$
begin
  update public.threads
  set message_count = message_count + 1
  where id = thread_uuid;
end;
$$ language plpgsql security definer;

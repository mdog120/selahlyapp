-- Enable Realtime for direct_messages table
-- This is often required for the client updates to work

begin;
  -- Check if table is already in publication, if not add it
  -- (The syntax below is a robust way to ensure it's added)
  alter publication supabase_realtime add table public.direct_messages;
commit;

-- Verify it worked (optional, just for output)
select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'direct_messages';

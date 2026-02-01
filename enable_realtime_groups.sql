-- ENABLE REALTIME FOR CHAT TABLES
-- Run this if messages are not appearing immediately for other users.

-- Add tables to the explicit realtime publication
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table group_messages;
-- We usually don't need real-time for members unless showing a list update live, but good to have
alter publication supabase_realtime add table group_members;

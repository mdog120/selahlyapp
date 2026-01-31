-- Comprehensive fix for account deletion "Foreign Key Violation" errors.
-- This script changes ALL user-related foreign keys to "ON DELETE CASCADE".
-- This means when a user is deleted, all their posts, messages, likes, etc. are automatically deleted too.

-- 1. PROFILES (Already fixed, but including for completeness)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. PRAYER POCKET
ALTER TABLE public.prayers DROP CONSTRAINT IF EXISTS prayers_user_id_fkey;
ALTER TABLE public.prayers ADD CONSTRAINT prayers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.prayer_interactions DROP CONSTRAINT IF EXISTS prayer_interactions_user_id_fkey;
ALTER TABLE public.prayer_interactions ADD CONSTRAINT prayer_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. DIARIES (Grace & Glow)
ALTER TABLE public.diaries DROP CONSTRAINT IF EXISTS diaries_user_id_fkey;
ALTER TABLE public.diaries ADD CONSTRAINT diaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. POSTS (The Lily Pad)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE public.posts ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;
ALTER TABLE public.post_comments ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. THREADS (Velvet Vault)
ALTER TABLE public.threads DROP CONSTRAINT IF EXISTS threads_user_id_fkey;
ALTER TABLE public.threads ADD CONSTRAINT threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.thread_messages DROP CONSTRAINT IF EXISTS thread_messages_user_id_fkey;
ALTER TABLE public.thread_messages ADD CONSTRAINT thread_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. FRIENDSHIPS
-- Friendships are tricky because they have TWO user references. Both need to cascade.
ALTER TABLE public.friendships DROP CONSTRAINT IF EXISTS friendships_user_id_1_fkey;
ALTER TABLE public.friendships ADD CONSTRAINT friendships_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.friendships DROP CONSTRAINT IF EXISTS friendships_user_id_2_fkey;
ALTER TABLE public.friendships ADD CONSTRAINT friendships_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. MESSAGES (Direct Messages / inbox)
-- (Assuming standard valid naming from other files I saw like setup_messaging.sql)
-- If this table doesn't exist or is named differently, these lines might error, but usually safe to try if we use IF EXISTS logic on the table, 
-- but standard SQL doesn't support IF EXISTS on ALTER TABLE ADD CONSTRAINT easily.
-- Based on 'setup_messaging.sql' in the file list, there is likely a 'messages' table.
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
    ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 8. NOTIFICATIONS
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    -- Some notifications might reference an actor (sender)
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 9. REPORTS
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE public.reports ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

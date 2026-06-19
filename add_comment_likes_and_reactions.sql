-- 1. Add likes column to post_comments table
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS likes JSONB DEFAULT '{}'::jsonb;

-- 2. Create policy to allow authenticated users to update comments (specifically for comment likes)
DROP POLICY IF EXISTS "Authenticated users can update comments" ON public.post_comments;
CREATE POLICY "Authenticated users can update comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- 3. Create policy to allow authenticated users to insert notifications (specifically for reactions and comment likes)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = actor_id);

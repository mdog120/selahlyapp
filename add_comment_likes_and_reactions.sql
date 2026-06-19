-- 1. Add likes column to post_comments table
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS likes JSONB DEFAULT '{}'::jsonb;

-- 2. Create policy to allow authenticated users to update comments (specifically for comment likes)
DROP POLICY IF EXISTS "Authenticated users can update comments" ON public.post_comments;
CREATE POLICY "Authenticated users can update comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Enable RLS on post_comments if not already enabled
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON post_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Post authors can delete comments on their posts
CREATE POLICY "Post authors can delete comments on their posts"
ON post_comments
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM posts WHERE id = post_comments.post_id
  )
);

-- Ensure users can insert comments (if not already covered)
CREATE POLICY "Users can insert comments"
ON post_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure public can view comments
CREATE POLICY "Public can view comments"
ON post_comments
FOR SELECT
USING (true);

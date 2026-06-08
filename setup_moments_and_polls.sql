-- 1. Ensure columns exist on public.moments for song support
ALTER TABLE public.moments ADD COLUMN IF NOT EXISTS song_title text DEFAULT NULL;
ALTER TABLE public.moments ADD COLUMN IF NOT EXISTS song_artist text DEFAULT NULL;
ALTER TABLE public.moments ADD COLUMN IF NOT EXISTS song_album_art text DEFAULT NULL;
ALTER TABLE public.moments ADD COLUMN IF NOT EXISTS song_preview_url text DEFAULT NULL;
ALTER TABLE public.moments ADD COLUMN IF NOT EXISTS song_link text DEFAULT NULL;

-- 2. Create moment_likes table
CREATE TABLE IF NOT EXISTS public.moment_likes (
  moment_id uuid REFERENCES public.moments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (moment_id, user_id)
);

-- Enable RLS for moment_likes
ALTER TABLE public.moment_likes ENABLE ROW LEVEL SECURITY;

-- Policies for moment_likes
DROP POLICY IF EXISTS "Moment likes are viewable by everyone" ON public.moment_likes;
CREATE POLICY "Moment likes are viewable by everyone" ON public.moment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like moments" ON public.moment_likes;
CREATE POLICY "Users can like moments" ON public.moment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike moments" ON public.moment_likes;
CREATE POLICY "Users can unlike moments" ON public.moment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Create moment_comments table
CREATE TABLE IF NOT EXISTS public.moment_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  moment_id uuid REFERENCES public.moments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for moment_comments
ALTER TABLE public.moment_comments ENABLE ROW LEVEL SECURITY;

-- Policies for moment_comments
DROP POLICY IF EXISTS "Moment comments are viewable by everyone" ON public.moment_comments;
CREATE POLICY "Moment comments are viewable by everyone" ON public.moment_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can comment on moments" ON public.moment_comments;
CREATE POLICY "Users can comment on moments" ON public.moment_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments on moments" ON public.moment_comments;
CREATE POLICY "Users can delete their own comments on moments" ON public.moment_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 4. Clean up and verify polls, options, and votes tables
CREATE TABLE IF NOT EXISTS public.polls (
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE PRIMARY KEY,
  question text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  option_text text NOT NULL,
  votes_count integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- Ensure RLS is enabled
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate poll policies with standard role checks
DROP POLICY IF EXISTS "Polls are viewable by everyone" ON public.polls;
CREATE POLICY "Polls are viewable by everyone" ON public.polls FOR SELECT USING (true);

DROP POLICY IF EXISTS "Polls can be created by authenticated users" ON public.polls;
CREATE POLICY "Polls can be created by authenticated users" ON public.polls FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Poll options are viewable by everyone" ON public.poll_options;
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Poll options can be created by authenticated users" ON public.poll_options;
CREATE POLICY "Poll options can be created by authenticated users" ON public.poll_options FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Poll votes are viewable by everyone" ON public.poll_votes;
CREATE POLICY "Poll votes are viewable by everyone" ON public.poll_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote in polls" ON public.poll_votes;
CREATE POLICY "Users can vote in polls" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Recreate the cast_poll_vote RPC with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_post_id uuid,
  p_user_id uuid,
  p_option_id uuid
) RETURNS void AS $$
BEGIN
  -- Insert the vote (will fail if user already voted due to PK constraint)
  INSERT INTO public.poll_votes (post_id, user_id, option_id)
  VALUES (p_post_id, p_user_id, p_option_id);

  -- Increment the votes count for the option
  UPDATE public.poll_options
  SET votes_count = votes_count + 1
  WHERE id = p_option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

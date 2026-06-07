-- 1. Modify the posts table: make image_url nullable and add song fields
ALTER TABLE public.posts ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'standard';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS song_title text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS song_artist text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS song_artwork text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS song_preview_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS song_link text;

-- 2. Create the moments table for stories (expires after 24h)
CREATE TABLE IF NOT EXISTS public.moments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url text,
  caption text,
  background_color text DEFAULT 'bg-warm-paper',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for moments
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

-- Policies for moments
CREATE POLICY "Moments are viewable by everyone" ON public.moments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own moments" ON public.moments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own moments" ON public.moments
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Create the polls table
CREATE TABLE IF NOT EXISTS public.polls (
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE PRIMARY KEY,
  question text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS public.poll_options (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  option_text text NOT NULL,
  votes_count integer DEFAULT 0 NOT NULL
);

-- Create poll votes table to track user votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- Enable RLS for polls
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for polls & options
CREATE POLICY "Polls are viewable by everyone" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Polls can be created by authenticated users" ON public.polls FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Poll options can be created by authenticated users" ON public.poll_options FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for poll votes
CREATE POLICY "Poll votes are viewable by everyone" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote in polls" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create an RPC to cast a vote atomically
CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_post_id uuid,
  p_user_id uuid,
  p_option_id uuid
) RETURNS void AS $$
BEGIN
  -- Insert the vote (will fail if user already voted due to PK)
  INSERT INTO public.poll_votes (post_id, user_id, option_id)
  VALUES (p_post_id, p_user_id, p_option_id);

  -- Increment the votes count for the option
  UPDATE public.poll_options
  SET votes_count = votes_count + 1
  WHERE id = p_option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

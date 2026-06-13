-- Create moment_views table to track viewed stories
CREATE TABLE IF NOT EXISTS public.moment_views (
  moment_id uuid REFERENCES public.moments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (moment_id, user_id)
);

-- Enable RLS for moment_views
ALTER TABLE public.moment_views ENABLE ROW LEVEL SECURITY;

-- Policies for moment_views
DROP POLICY IF EXISTS "Moment views are viewable by everyone" ON public.moment_views;
CREATE POLICY "Moment views are viewable by everyone" ON public.moment_views
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can record moment views" ON public.moment_views;
CREATE POLICY "Users can record moment views" ON public.moment_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

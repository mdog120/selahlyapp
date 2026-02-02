-- Enable RLS on diaries table (idempotent)
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

-- 1. VIEW POLICY: Users can see their own diaries
DROP POLICY IF EXISTS "Users can view own diaries" ON public.diaries;
CREATE POLICY "Users can view own diaries" ON public.diaries
  FOR SELECT USING (auth.uid() = user_id);

-- 2. INSERT POLICY: Users can create their own diaries
DROP POLICY IF EXISTS "Users can insert own diaries" ON public.diaries;
CREATE POLICY "Users can insert own diaries" ON public.diaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. DELETE POLICY: Users can delete their own diaries
DROP POLICY IF EXISTS "Users can delete own diaries" ON public.diaries;
CREATE POLICY "Users can delete own diaries" ON public.diaries
  FOR DELETE USING (auth.uid() = user_id);

-- Check if you have existing entries (for debugging)
SELECT count(*) as my_entries_count FROM public.diaries;

-- Create policy to allow users to update their own moments (for highlights)
DROP POLICY IF EXISTS "Users can update their own moments" ON public.moments;
CREATE POLICY "Users can update their own moments" ON public.moments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

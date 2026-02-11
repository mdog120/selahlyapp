-- Create Bible Highlights Table

CREATE TABLE IF NOT EXISTS public.bible_highlights (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    book text NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    text text NOT NULL, -- The specific text highlighted
    color text DEFAULT 'yellow', -- rose, sage, etc.
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view highlights (or restrict to friends/public profiles later if needed)
-- For the "Community" feel, we'll allow public view for MVP, or we can reuse friend logic.
-- Let's stick to "Friends Only" logic to match the rest of the app's privacy direction?
-- Actually, the user asked for "Community Highlights", implying a broader or friend-based scope.
-- Let's make it viewable by everyone for now to ensure the widget works easily, adding detailed friend filter in query is better.
CREATE POLICY "Highlights are viewable by everyone"
    ON public.bible_highlights FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own highlights"
    ON public.bible_highlights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
    ON public.bible_highlights FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster querying by book/chapter or user
CREATE INDEX IF NOT EXISTS idx_bible_highlights_user ON public.bible_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_highlights_location ON public.bible_highlights(book, chapter);

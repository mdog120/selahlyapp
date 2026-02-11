-- Create Bible Notes Table for Private Study
CREATE TABLE IF NOT EXISTS public.bible_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book text NOT NULL,
    chapter integer NOT NULL,
    verse integer, -- Optional, can be null if note is for whole chapter
    selected_text text, -- Optional, the text being referenced
    comment text NOT NULL, -- The user's note
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;

-- Strict Private Policy: Only owner can do anything
CREATE POLICY "Users can view their own notes"
    ON public.bible_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
    ON public.bible_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON public.bible_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON public.bible_notes FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bible_notes_user ON public.bible_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_notes_location ON public.bible_notes(book, chapter);

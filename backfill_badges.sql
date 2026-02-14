-- SQL Migration: Add New Badges and Backfill Existing Users

-- 1. Add New Badges to the `badges` table
INSERT INTO badges (name, description, icon_name, category)
VALUES
  ('Prayer Warrior', 'Shared a prayer request with the community.', 'Prayer Warrior', 'community'),
  ('Encourager', 'Left a comment or replied to a sister.', 'Encourager', 'community'),
  ('Sunshine', 'Shared a moment of light and positivity.', 'Sunshine', 'community'),
  ('Bloom', 'Growing in grace and faith.', 'Bloom', 'spiritual'),
  ('Peace', 'Peacemaker in the community.', 'Peace', 'community'),
  ('Rooted', 'Deeply rooted in the Word.', 'Rooted', 'spiritual'),
  ('Star', 'Shining bright for all to see.', 'Star', 'community')
ON CONFLICT (name) DO NOTHING;

-- 2. Backfill Logic (Using PL/pgSQL block for complex logic)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM profiles LOOP
        -- A. First Glow (Diary Entry)
        -- Check if user has entries in diaries
        IF EXISTS (SELECT 1 FROM diaries WHERE user_id = r.id) THEN
            PERFORM award_badge(r.id, 'First Glow');
        END IF;

        -- B. Voice of Grace (First Post)
        -- Check if user has entries in posts
        IF EXISTS (SELECT 1 FROM posts WHERE user_id = r.id) THEN
            PERFORM award_badge(r.id, 'Voice of Grace');
        END IF;

        -- C. Selah Sister (Bio & Photo)
        -- Check if profile has bio and avatar
        IF EXISTS (SELECT 1 FROM profiles WHERE id = r.id AND biography IS NOT NULL AND avatar_url IS NOT NULL) THEN
            PERFORM award_badge(r.id, 'Selah Sister');
        END IF;

        -- D. Prayer Warrior (Prayer Request)
        -- Check if user has entries in prayer_requests (table name assumption based on context, verify before running)
        -- Adapting to check known schema or skip if uncertain. 
        -- If prayer_requests table exists:
        BEGIN
            IF EXISTS (SELECT 1 FROM prayer_requests WHERE user_id = r.id) THEN
                PERFORM award_badge(r.id, 'Prayer Warrior');
            END IF;
        EXCEPTION WHEN undefined_table THEN
            -- Table might not exist, skip
            NULL;
        END;

        -- E. Encourager (Comment)
        -- Check if user has entries in posts_comments
        -- Assuming table name is posts_comments or similar
        BEGIN
             IF EXISTS (SELECT 1 FROM posts_comments WHERE user_id = r.id) THEN
                PERFORM award_badge(r.id, 'Encourager');
            END IF;
        EXCEPTION WHEN undefined_table THEN
            -- Table might not exist, try another name or skip
            NULL;
        END;
        
    END LOOP;
END $$;

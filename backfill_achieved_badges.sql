-- Backfill Badges for users who have already achieved criteria
-- This script runs once to catch up existing users

DO $$
DECLARE
    r RECORD;
    post_count INT;
    has_star_post BOOLEAN;
BEGIN
    -- 1. Sunshine Badge (3 or more posts)
    FOR r IN SELECT id FROM profiles LOOP
        SELECT COUNT(*) INTO post_count FROM posts WHERE user_id = r.id;
        
        IF post_count >= 3 THEN
             PERFORM award_badge(r.id, 'Sunshine');
        END IF;
    END LOOP;

    -- 2. Bloom Badge (3-day streak)
    -- We leverage the streak_count column in profiles
    FOR r IN SELECT id, streak_count FROM profiles WHERE streak_count >= 3 LOOP
        PERFORM award_badge(r.id, 'Bloom');
    END LOOP;

    -- 3. Star Badge (Post with 10+ likes)
    -- We check if user has ANY post with >= 10 likes
    FOR r IN SELECT DISTINCT p.user_id FROM posts p
             JOIN post_likes pl ON p.id = pl.post_id
             GROUP BY p.id, p.user_id
             HAVING COUNT(pl.user_id) >= 10
    LOOP
        PERFORM award_badge(r.user_id, 'Star');
    END LOOP;

    -- 4. Prayer Warrior (Shared a prayer request)
    -- Assuming prayers table exists
    BEGIN
        FOR r IN SELECT DISTINCT user_id FROM prayers LOOP
            PERFORM award_badge(r.user_id, 'Prayer Warrior');
        END LOOP;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Skip if table doesn't exist
    END;

    -- 5. Selah Circle (Joined a group)
    -- Assuming group_members table exists
    BEGIN
        FOR r IN SELECT DISTINCT user_id FROM group_members LOOP
            PERFORM award_badge(r.user_id, 'Selah Circle');
        END LOOP;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- 6. Peace (Reply to prayer request)
    -- We'll try to check prayer_interactions if it tracks replies/comments
    -- Or just generic comments for now if specific table unknown
    -- Placeholder logic:
    -- FOR r IN SELECT DISTINCT user_id FROM prayer_comments...


END $$;

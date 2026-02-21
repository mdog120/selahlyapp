-- Temporary script to backfill the 'Selah Sister' badge for any user that already has a bio and avatar_url
DO $$
DECLARE
    r RECORD;
    v_badge_id uuid;
BEGIN
    -- Get the badge ID
    SELECT id INTO v_badge_id FROM badges WHERE name = 'Selah Sister';

    IF v_badge_id IS NOT NULL THEN
        -- Loop through profiles that meet the criteria
        FOR r IN 
            SELECT id FROM profiles 
            WHERE biography IS NOT NULL AND biography != '' 
              AND avatar_url IS NOT NULL AND avatar_url != ''
        LOOP
            -- Insert the badge if they don't already have it
            IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = r.id AND badge_id = v_badge_id) THEN
                INSERT INTO user_badges (user_id, badge_id) VALUES (r.id, v_badge_id);
            END IF;
        END LOOP;
    END IF;
END $$;

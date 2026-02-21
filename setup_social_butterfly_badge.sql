-- Add Social Butterfly Badge
INSERT INTO badges (name, description, icon_name, category)
VALUES ('Social Butterfly', 'Make 5 friends in the community.', 'Users', 'community')
ON CONFLICT (name) DO NOTHING;

-- RPC to check and award the badge
CREATE OR REPLACE FUNCTION check_and_award_friends_badge(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_friend_count int;
BEGIN
    SELECT count(*) INTO v_friend_count
    FROM friendships
    WHERE (user_id_1 = p_user_id OR user_id_2 = p_user_id)
      AND status = 'accepted';

    IF v_friend_count >= 5 THEN
        RETURN award_badge(p_user_id, 'Social Butterfly');
    END IF;

    RETURN false;
END;
$$;

-- Retroactive Backfill for existing users who already have 5+ friends
DO $$
DECLARE
    r RECORD;
    v_friend_count int;
BEGIN
    FOR r IN SELECT id FROM profiles LOOP
        SELECT count(*) INTO v_friend_count
        FROM friendships
        WHERE (user_id_1 = r.id OR user_id_2 = r.id)
          AND status = 'accepted';

        IF v_friend_count >= 5 THEN
            PERFORM award_badge(r.id, 'Social Butterfly');
        END IF;
    END LOOP;
END;
$$;

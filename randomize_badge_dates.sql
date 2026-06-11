-- Align badge earned_at dates with the actual date they performed the action.

-- 1. First Glow: Earliest diary entry date
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (SELECT MIN(created_at) FROM public.diaries d WHERE d.user_id = ub.user_id),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'First Glow');

-- 2. Voice of Grace: Earliest post date
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (SELECT MIN(created_at) FROM public.posts p WHERE p.user_id = ub.user_id),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'Voice of Grace');

-- 3. Selah Sister: Profile creation date
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (SELECT created_at FROM public.profiles p WHERE p.id = ub.user_id),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'Selah Sister');

-- 4. Prayer Warrior: Earliest prayer request date
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (SELECT MIN(created_at) FROM public.prayers pr WHERE pr.user_id = ub.user_id),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'Prayer Warrior');

-- 5. Encourager: Earliest comment date
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (SELECT MIN(created_at) FROM public.post_comments pc WHERE pc.user_id = ub.user_id),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'Encourager');

-- 6. Sunshine: 3rd post date (since Sunshine requires 3 posts)
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (
    SELECT created_at 
    FROM (
      SELECT created_at, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
      FROM public.posts p 
      WHERE p.user_id = ub.user_id
    ) t 
    WHERE t.rn = 3
  ),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'Sunshine');

-- 7. Bloom: 3rd diary entry date (since Bloom requires 3 days/entries)
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (
    SELECT created_at 
    FROM (
      SELECT created_at, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
      FROM public.diaries d 
      WHERE d.user_id = ub.user_id
    ) t 
    WHERE t.rn = 3
  ),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'Bloom');

-- 8. Peace: Earliest prayer reply/interaction date
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (SELECT MIN(created_at) FROM public.prayer_interactions pi WHERE pi.user_id = ub.user_id),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'Peace');

-- 9. Selah Circle: Earliest group membership date
UPDATE public.user_badges ub
SET earned_at = COALESCE(
  (SELECT MIN(joined_at) FROM public.group_members gm WHERE gm.user_id = ub.user_id),
  ub.earned_at
)
WHERE ub.badge_id = (SELECT id FROM public.badges WHERE name = 'Selah Circle');

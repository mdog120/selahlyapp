-- Redefine award_badge to return false if the user already has the badge.
-- This ensures the client knows it is NOT a new achievement and avoids duplicate triggers.
create or replace function award_badge(p_user_id uuid, p_badge_name text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_badge_id uuid;
begin
  -- Find badge ID
  select id into v_badge_id from badges where name = p_badge_name;
  
  if v_badge_id is null then
    return false; -- Badge not found
  end if;

  -- Check if already earned
  if exists (select 1 from user_badges where user_id = p_user_id and badge_id = v_badge_id) then
    return false; -- Already has it, NOT newly awarded
  end if;

  -- Insert
  insert into user_badges (user_id, badge_id)
  values (p_user_id, v_badge_id);

  return true; -- Newly awarded!
end;
$$;

-- READ RECEIPT FUNCTION (ROBUST)
-- Safely appends the current user's ID to the 'read_by' list for all messages in a group.
-- Uses COALESCE to handle potential NULL values.

create or replace function mark_group_messages_read(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return;
  end if;

  update group_messages
  set read_by = (
    case 
      -- If array is null, start a new one
      when read_by is null then jsonb_build_array(v_user_id)
      -- If already in the list, leave it alone
      when read_by @> to_jsonb(v_user_id) then read_by
      -- Otherwise append safely
      else read_by || to_jsonb(v_user_id)
    end
  )
  where group_id = p_group_id;
end;
$$;

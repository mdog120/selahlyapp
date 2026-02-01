-- READ RECEIPT FUNCTION
-- Safely appends the current user's ID to the 'read_by' list for all messages in a group.

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
      -- If already in the list, leave it alone (though logic below filters them anyway)
      when read_by @> to_jsonb(v_user_id) then read_by
      -- Otherwise append
      else read_by || to_jsonb(v_user_id)
    end
  )
  where group_id = p_group_id
  and not (read_by @> to_jsonb(v_user_id)); -- Only update unread ones
end;
$$;

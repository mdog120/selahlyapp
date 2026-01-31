-- Ensure RLS is enabled
alter table public.notifications enable row level security;

-- Drop existing policy if any to avoid conflict/duplication
drop policy if exists "Users can view their own notifications" on public.notifications;

-- Create the View Policy
create policy "Users can view their own notifications"
on public.notifications for select
using ( auth.uid() = user_id );

-- Verify Triggers exist (re-runing creation is safe if using 'create or replace')
-- This ensures the triggers are actually active
-- (The logic below is a subset of setup_notifications.sql just to enforce the critical parts)

-- 1. Likes Trigger
create or replace function public.handle_new_like() 
returns trigger as $$
begin
  if new.user_id != (select user_id from public.posts where id = new.post_id) then
    insert into public.notifications (user_id, actor_id, type, resource_id, created_at)
    values (
      (select user_id from public.posts where id = new.post_id),
      new.user_id,
      'like',
      new.post_id,
      now()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger for likes if missing
drop trigger if exists on_new_like on public.post_likes;
create trigger on_new_like
  after insert on public.post_likes
  for each row execute procedure public.handle_new_like();

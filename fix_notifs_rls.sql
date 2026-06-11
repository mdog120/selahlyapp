-- Allow users to update their own notifications (e.g., mark as read)
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Also allow delete just in case they want to clear them later
create policy "Users can delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

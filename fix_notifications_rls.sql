-- Provide UPDATE policy for notifications so users can mark them as read
create policy "Users can update own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id);

-- Also provide DELETE policy so users can delete their own notifications if they wish to
create policy "Users can delete own notifications"
  on public.notifications
  for delete
  using (auth.uid() = user_id);

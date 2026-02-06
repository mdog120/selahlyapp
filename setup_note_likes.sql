-- 1. Create table
create table if not exists public.note_likes (
  note_id uuid references public.notes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (note_id, user_id)
);

-- 2. Enable RLS
alter table public.note_likes enable row level security;

-- 3. RLS Policies

-- A. Insert: Users can like notes (insert their own ID)
drop policy if exists "Users can like notes" on public.note_likes;
create policy "Users can like notes"
  on public.note_likes
  for insert
  with check (auth.uid() = user_id);

-- B. Delete: Users can unlike notes (delete their own ID)
drop policy if exists "Users can unlike notes" on public.note_likes;
create policy "Users can unlike notes"
  on public.note_likes
  for delete
  using (auth.uid() = user_id);

-- C. Select: Privacy Rules
-- Rule 1: You can see your own likes (so the UI knows if you liked it)
drop policy if exists "Users can see their own likes" on public.note_likes;
create policy "Users can see their own likes"
  on public.note_likes
  for select
  using (auth.uid() = user_id);

-- Rule 2: Note Owners can see ALL likes on THEIR notes
drop policy if exists "Note owners can see who liked their note" on public.note_likes;
create policy "Note owners can see who liked their note"
  on public.note_likes
  for select
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_likes.note_id
      and notes.user_id = auth.uid()
    )
  );

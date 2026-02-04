-- Create notes table
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  style text default 'classic', -- For future styling extensions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '24 hours') not null
);

-- RLS
alter table public.notes enable row level security;

create policy "Notes are viewable by everyone"
  on public.notes for select
  using ( true );

create policy "Users can create their own notes"
  on public.notes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own notes"
  on public.notes for delete
  using ( auth.uid() = user_id );

-- Create a view or function if we need to easily filter expired notes, 
-- but client-side filtering (expires_at > now) is also fine for MVP.

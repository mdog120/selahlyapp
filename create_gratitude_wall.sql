-- Create gratitude_notes table
create table if not exists public.gratitude_notes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    content text check (char_length(content) <= 200) not null,
    color text default 'pink' check (color in ('pink', 'blue', 'green', 'yellow', 'purple')),
    created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.gratitude_notes enable row level security;

-- Drop existing policies if any to prevent errors
drop policy if exists "Anyone can view gratitude notes" on public.gratitude_notes;
drop policy if exists "Authenticated users can create gratitude notes" on public.gratitude_notes;
drop policy if exists "Authors can delete own gratitude notes" on public.gratitude_notes;

-- Create policies
create policy "Anyone can view gratitude notes"
    on public.gratitude_notes for select
    using (true);

create policy "Authenticated users can create gratitude notes"
    on public.gratitude_notes for insert
    with check (auth.role() = 'authenticated');

create policy "Authors can delete own gratitude notes"
    on public.gratitude_notes for delete
    using (auth.uid() = user_id);

-- Enable Realtime publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'gratitude_notes') then
    alter publication supabase_realtime add table public.gratitude_notes;
  end if;
end
$$;

-- Grant Permissions
grant select, insert, delete on table public.gratitude_notes to authenticated;
grant select on table public.gratitude_notes to anon;
grant select, insert, delete on table public.gratitude_notes to service_role;

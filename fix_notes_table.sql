-- Safely update Notes table

-- 1. Ensure Table Exists (this part was likely fine, but good to keep)
create table if not exists public.notes (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    content text not null,
    style text default 'default',
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    primary key (id)
);

-- 2. Drop existing policies to avoid conflicts and ensure correct logic
drop policy if exists "Anyone can view active notes" on public.notes;
drop policy if exists "Users can create their own notes" on public.notes;
drop policy if exists "Users can delete their own notes" on public.notes;

-- 3. Re-enable RLS
alter table public.notes enable row level security;

-- 4. Re-create Policies
create policy "Anyone can view active notes"
    on public.notes for select
    using ( expires_at > now() );

create policy "Users can create their own notes"
    on public.notes for insert
    with check ( auth.uid() = user_id );

create policy "Users can delete their own notes"
    on public.notes for delete
    using ( auth.uid() = user_id );

-- 5. Helper to check if FK exists (or just try adding it, ignoring error if exists is harder in pure SQL without PL/pgSQL)
-- We'll use a do block for the constraint to be safe
do $$
begin
    if not exists (select 1 from key_column_usage where constraint_name = 'notes_user_id_fkey_profiles') then
        alter table public.notes
        add constraint notes_user_id_fkey_profiles
        foreign key (user_id)
        references public.profiles(id)
        on delete cascade;
    end if;
exception when others then
    -- Ignore if it fails (e.g. if profiles table structure is unexpected), but log it
    raise notice 'Constraint creation failed or skipped: %', SQLERRM;
end $$;

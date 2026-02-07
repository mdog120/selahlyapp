-- Create Scrapbook Table
create table if not exists public.scrapbook_entries (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  styles jsonb default '{}'::jsonb, -- store rotation, filter settings, etc.
  created_at timestamptz default now(),
  primary key (id)
);

-- Enable RLS
alter table public.scrapbook_entries enable row level security;

-- Policies for Table
create policy "Public profiles are viewable by everyone."
  on public.scrapbook_entries for select
  using ( true );

create policy "Users can insert their own scrapbook entries."
  on public.scrapbook_entries for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own scrapbook entries."
  on public.scrapbook_entries for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own scrapbook entries."
  on public.scrapbook_entries for delete
  using ( auth.uid() = user_id );

-- Storage Bucket setup (if not exists)
insert into storage.buckets (id, name, public)
values ('scrapbook', 'scrapbook', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Scrapbook images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'scrapbook' );

create policy "Users can upload scrapbook images."
  on storage.objects for insert
  with check ( bucket_id = 'scrapbook' AND auth.uid() = owner );

create policy "Users can update their own scrapbook images."
  on storage.objects for update
  using ( bucket_id = 'scrapbook' AND auth.uid() = owner );

create policy "Users can delete their own scrapbook images."
  on storage.objects for delete
  using ( bucket_id = 'scrapbook' AND auth.uid() = owner );

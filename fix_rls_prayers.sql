-- Enable RLS logic for Prayers
-- Allow anyone to read prayers
create policy "Allow read access for all authenticated users"
on public.prayers
for select
to authenticated
using (true);

-- Allow authenticated users to create prayers
create policy "Allow insert access for authenticated users"
on public.prayers
for insert
to authenticated
with check (true);

-- Allow authenticated users to add interactions (prayer counts)
create policy "Allow insert on interactions"
on public.prayer_interactions
for insert
to authenticated
with check (true);

-- Allow reading interactions
create policy "Allow read interactions"
on public.prayer_interactions
for select
to authenticated
using (true);

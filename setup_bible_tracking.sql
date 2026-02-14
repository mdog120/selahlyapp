-- Create a table to track daily bible reading activity
create table if not exists public.bible_reads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  read_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one entry per user per day
  unique(user_id, read_date)
);

-- Enable RLS
alter table public.bible_reads enable row level security;

-- Policies
create policy "Users can view their own bible reads"
  on public.bible_reads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bible reads"
  on public.bible_reads for insert
  with check (auth.uid() = user_id);

-- Function to record a bible read
create or replace function record_bible_read()
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
  reads_count int;
begin
  current_user_id := auth.uid();
  if current_user_id is null then return; end if;

  -- Insert read for today if not exists
  begin
    insert into public.bible_reads (user_id, read_date)
    values (current_user_id, current_date)
    on conflict (user_id, read_date) do nothing;
  exception when others then
    -- Ignore errors (race conditions, etc)
    null;
  end;

  -- Check for Rooted Badge (Read 5 Days)
  select count(distinct read_date) into reads_count
  from public.bible_reads
  where user_id = current_user_id;

  if reads_count >= 5 then
    perform award_badge(current_user_id, 'Rooted');
  end if;
end;
$$;

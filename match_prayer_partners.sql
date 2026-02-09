-- Function to find prayer partners with SMART matching
-- Logic:
-- 1. Remove common "stop words" (prayer, god, help, etc) to focus on unique topics.
-- 2. Use OR logic for remaining keywords.
-- 3. Rank by relevance.

create or replace function match_prayer_partners()
returns table (
    partner_id uuid,
    first_name text,
    last_name text,
    avatar_url text,
    prayer_content text,
    similarity_score float
) 
language plpgsql
security definer
as $$
declare
    my_latest_prayer text;
    cleaned_prayer text;
    my_id uuid;
    query_text tsquery;
begin
    -- Get current user ID
    my_id := auth.uid();
    
    -- Get my latest prayer content
    select content into my_latest_prayer
    from public.prayers
    where user_id = my_id
    order by created_at desc
    limit 1;
    
    -- If no prayer found, return empty
    if my_latest_prayer is null then
        return;
    end if;

    -- Clean the text: remove common words regarding prayer/faith to find the TOPIC
    cleaned_prayer := lower(my_latest_prayer);
    -- Replace common filler words with spaces
    cleaned_prayer := regexp_replace(cleaned_prayer, '\y(prayer|pray|praying|prayed|god|lord|jesus|christ|father|please|help|need|want|feeling|feel)\y', ' ', 'g');
    
    -- Convert remaining keywords to OR-ed tsquery
    -- If the cleaned string is empty (e.g. they only typed "prayer please"), fall back to original but it will match broadly
    if trim(cleaned_prayer) = '' then
        cleaned_prayer := my_latest_prayer;
    end if;

    select replace(plainto_tsquery('english', cleaned_prayer)::text, '&', '|')::tsquery 
    into query_text;

    if query_text is null then
         return;
    end if;

    return query
    select 
        p.user_id as partner_id,
        prof.first_name,
        prof.last_name,
        prof.avatar_url,
        p.content as prayer_content,
        ts_rank(to_tsvector('english', p.content), query_text)::float as similarity_score
    from public.prayers p
    join public.profiles prof on p.user_id = prof.id
    where 
        p.user_id != my_id 
        and p.created_at > now() - interval '30 days'
        and p.is_anonymous = false
        and to_tsvector('english', p.content) @@ query_text
    order by similarity_score desc
    limit 3;
end;
$$;

-- Function to find prayer partners with LOOSER matching (OR logic)
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

    -- Convert prayer to keywords OR-ed together
    -- plainto_tsquery creates 'word' & 'word'. We replace & with | to find ANY match.
    select replace(plainto_tsquery('english', my_latest_prayer)::text, '&', '|')::tsquery 
    into query_text;

    -- If query is empty (e.g. only stop words), just return recent prayers? 
    -- Or fallback to websearch.
    if query_text is null then
         -- Fallback: just simple text match or recent
         return query
         select 
            p.user_id as partner_id,
            prof.first_name,
            prof.last_name,
            prof.avatar_url,
            p.content as prayer_content,
            0.1::float as similarity_score
        from public.prayers p
        join public.profiles prof on p.user_id = prof.id
        where 
            p.user_id != my_id 
            and p.created_at > now() - interval '30 days'
            and p.is_anonymous = false
        order by p.created_at desc
        limit 3;
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
        p.user_id != my_id -- Not myself
        and p.created_at > now() - interval '30 days' -- Recent prayers
        and p.is_anonymous = false -- Only non-anonymous
        and to_tsvector('english', p.content) @@ query_text -- Match ANY keyword
    order by similarity_score desc
    limit 3;
end;
$$;

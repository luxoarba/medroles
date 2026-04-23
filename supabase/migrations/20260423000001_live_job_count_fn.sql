create or replace function public.live_job_count()
returns integer
language sql
stable
as $$
  select count(*)::integer from (
    select distinct on (lower(trim(title)), trust_id, closes_at) id
    from job_listings
    where closes_at >= current_date
    order by lower(trim(title)), trust_id, closes_at,
      case when source = 'NHS Jobs' then 0 else 1 end
  ) deduped;
$$;

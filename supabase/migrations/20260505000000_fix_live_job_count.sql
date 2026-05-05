-- Fix live_job_count to match the jobs page dedup logic exactly:
-- distinct by (title, trust_id) only, includes null closes_at jobs,
-- prefers NHS Jobs over Trac, then prefers jobs with a date over TBC.
create or replace function public.live_job_count()
returns integer
language sql
stable
as $$
  select count(*)::integer from (
    select distinct on (lower(trim(title)), trust_id)
      id
    from job_listings
    where closes_at >= current_date or closes_at is null
    order by lower(trim(title)), trust_id,
      case when source = 'NHS Jobs' then 0 else 1 end,
      case when closes_at is not null then 0 else 1 end
  ) deduped;
$$;

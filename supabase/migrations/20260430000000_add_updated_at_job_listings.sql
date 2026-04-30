alter table job_listings
  add column if not exists updated_at timestamptz default now();

-- Backfill existing rows with created_at so the column is non-null
update job_listings set updated_at = created_at where updated_at is null;

-- Trigger: keep updated_at current on every UPDATE
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists job_listings_updated_at on job_listings;
create trigger job_listings_updated_at
  before update on job_listings
  for each row execute function set_updated_at();

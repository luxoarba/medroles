ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS requirements text[],
  ADD COLUMN IF NOT EXISTS benefits text[];

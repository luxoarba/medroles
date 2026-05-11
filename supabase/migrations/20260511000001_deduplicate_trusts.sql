-- Merge duplicate trust rows that share the same case-insensitive name.
-- For each duplicate group, keep the row with the most job listings (or
-- the oldest row on a tie). All foreign-key references are re-pointed
-- to the surviving row before the duplicates are deleted.

DO $$
DECLARE
  dup RECORD;
  keep_id uuid;
BEGIN
  FOR dup IN
    SELECT lower(trim(name)) AS norm_name
    FROM trusts
    GROUP BY lower(trim(name))
    HAVING count(*) > 1
  LOOP
    -- Pick the keeper: most job listings, then oldest id as tiebreak
    SELECT t.id INTO keep_id
    FROM trusts t
    LEFT JOIN (
      SELECT trust_id, count(*) AS cnt FROM job_listings GROUP BY trust_id
    ) jl ON jl.trust_id = t.id
    WHERE lower(trim(t.name)) = dup.norm_name
    ORDER BY coalesce(jl.cnt, 0) DESC, t.id
    LIMIT 1;

    -- Re-point job_listings
    UPDATE job_listings
    SET trust_id = keep_id
    WHERE trust_id IN (
      SELECT id FROM trusts
      WHERE lower(trim(name)) = dup.norm_name AND id <> keep_id
    );

    -- Re-point trust_reviews
    UPDATE trust_reviews
    SET trust_id = keep_id
    WHERE trust_id IN (
      SELECT id FROM trusts
      WHERE lower(trim(name)) = dup.norm_name AND id <> keep_id
    );

    -- Re-point interview_insights
    UPDATE interview_insights
    SET trust_id = keep_id
    WHERE trust_id IN (
      SELECT id FROM trusts
      WHERE lower(trim(name)) = dup.norm_name AND id <> keep_id
    );

    -- Delete duplicates
    DELETE FROM trusts
    WHERE lower(trim(name)) = dup.norm_name AND id <> keep_id;
  END LOOP;
END $$;

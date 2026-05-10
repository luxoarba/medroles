-- Add is_nhs flag to trusts table to filter out GP practices, private providers, etc.
-- Only real NHS trusts (and equivalents) should appear on the trusts page.

ALTER TABLE trusts ADD COLUMN IF NOT EXISTS is_nhs boolean DEFAULT false;

-- Pattern-based: covers the vast majority of NHS trusts
UPDATE trusts SET is_nhs = true WHERE
  name ILIKE '%NHS%'
  OR name ILIKE '%Foundation Trust%'
  OR name ILIKE '%Health Board%'
  OR name ILIKE '%Teaching Hospitals%'
  OR name ILIKE '%University Hospitals%'
  OR name ILIKE '%University Hospital%';

-- Manual inclusions: known NHS organisations whose names don't match the patterns above
UPDATE trusts SET is_nhs = true WHERE name IN (
  'Royal Cornwall Hospitals Trust',
  'Northampton General Hospital',
  'Central London Community Health Trust',
  'Leeds Teaching Hospitals'
);

ALTER TABLE trusts
  ADD COLUMN IF NOT EXISTS cqc_provider_id   text,
  ADD COLUMN IF NOT EXISTS cqc_overall        text,
  ADD COLUMN IF NOT EXISTS cqc_safe           text,
  ADD COLUMN IF NOT EXISTS cqc_effective      text,
  ADD COLUMN IF NOT EXISTS cqc_caring         text,
  ADD COLUMN IF NOT EXISTS cqc_responsive     text,
  ADD COLUMN IF NOT EXISTS cqc_well_led       text,
  ADD COLUMN IF NOT EXISTS cqc_report_date    date;

CREATE UNIQUE INDEX IF NOT EXISTS trusts_cqc_provider_id_idx ON trusts (cqc_provider_id)
  WHERE cqc_provider_id IS NOT NULL;

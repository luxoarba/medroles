# Job Detail Pages — MedRoles

**Date:** 2026-04-09

## Overview

Replace the mock-data job detail page with real Supabase data. Add `description`, `requirements`, and `benefits` fields to the `job_listings` table and populate them during scrape runs. Render the full detail page from live data, with a graceful fallback for jobs whose detail hasn't been fetched yet.

## Data Flow

1. Scrape run fetches the job list from NHS Jobs / Trac
2. For each found job where `description IS NULL` in the DB, the scraper fetches the source detail page and extracts `description`, `requirements[]`, `benefits[]`
3. All fields are included in the existing upsert (keyed on `external_url`)
4. User navigates to `/jobs/[id]`
5. Server component queries Supabase for the job by UUID, joins `trusts`
6. Page renders real description/requirements/benefits; shows "View on [source]" fallback if description is null

## DB Schema Change

Add three nullable columns to `job_listings`:

```sql
ALTER TABLE job_listings
  ADD COLUMN description text,
  ADD COLUMN requirements text[],
  ADD COLUMN benefits text[];
```

No default values — null means "not yet fetched". Both scrapers treat null as a signal to fetch the detail page on the next run.

## Scraper Changes

### scrape-trac (`supabase/functions/scrape-trac/index.ts`)

Already fetches detail pages in batches of 5 to extract `closes_at`. Extend this pass:

- Extract `description`: the main job description prose (single text block)
- Extract `requirements`: bullet points from the "Requirements" / "Person specification" section as `string[]`
- Extract `benefits`: bullet points from the "Benefits" / "What we offer" section as `string[]`
- Include all three in the upsert row
- Only fetch detail page when `description IS NULL` (already the behaviour for `closes_at`)

### scrape-jobs (`supabase/functions/scrape-jobs/index.ts`)

Does not currently fetch detail pages. Add:

1. After building the list of jobs to upsert, query which `external_url`s already have `description IS NOT NULL` in the DB
2. For jobs with null description, fetch detail pages in batches of 5 (same pattern as scrape-trac)
3. Parse NHS Jobs detail page HTML to extract `description`, `requirements[]`, `benefits[]`
4. Include in upsert row; jobs with existing description pass through unchanged

**Batching:** max 5 concurrent detail page requests to avoid hammering the source.

## HTML Extraction

Exact selectors to be confirmed during implementation by fetching a live page. Expected structure:

**NHS Jobs (`findajob.dwp.gov.uk` or `jobs.nhs.uk`):**
- Description: main prose block in the job detail section
- Requirements: list items under "Requirements" or "Essential criteria"
- Benefits: list items under "Benefits" or "What we offer"

**Trac (`healthjobsuk.com`):**
- Already fetching detail pages; selectors to be discovered on a live page
- Requirements: often in a `<ul>` under "Requirements" or "Person specification" heading
- Benefits: `<ul>` under "Benefits" or "What we can offer"

If a section cannot be found, store `null` for that field — do not fabricate content.

## Type Changes

Extend `DBJobListing` in `app/lib/supabase.ts`:

```ts
description: string | null;
requirements: string[] | null;
benefits: string[] | null;
```

## Detail Page (`app/jobs/[id]/page.tsx`)

Replace `getJob(id)` mock with a real Supabase fetch:

```ts
const { data: job } = await supabase
  .from("job_listings")
  .select(`id, title, specialty, grade, contract_type, region,
           salary_min, salary_max, on_call, training_post,
           closes_at, source, external_url,
           description, requirements, benefits,
           trusts (name, avg_rating, review_count, type)`)
  .eq("id", id)
  .single();

if (!job) notFound();
```

**Rendering:**
- "About the role" section: render `job.description` as a `<p>`; if null, show a short note + "View full details on [source]" link to `external_url`
- "Requirements" section: render `job.requirements` as a `<ul>`; omit section entirely if null
- "Benefits" section: render `job.benefits` as a `<ul>`; omit section entirely if null
- Apply button: use real `job.external_url`; target `_blank` with `rel="noopener noreferrer"`
- Trust rating card: use real `trusts.avg_rating` and `trusts.review_count`; omit card if trust has no rating
- Trust category breakdown (Rota quality, etc.): **remove** — these are fabricated offsets from the mock; no real per-category data exists
- Interview intel card: **remove** — entirely fabricated mock content
- Salary: use `formatSalary(job.salary_min, job.salary_max)` from `lib/supabase.ts`
- On-call: show "Yes" / "No" / omit if `job.on_call` is null (no frequency string in DB)
- Closing date: use `job.closes_at`; compute days remaining

## Error Handling

- Scraper detail-page fetch failure: log the error, continue with other jobs, leave `description` null (will retry next run)
- Detail page returns unexpected HTML (section not found): store `null` for that field
- Job not found in DB: `notFound()` → Next.js 404

## Out of Scope

- Trust category ratings (Rota quality, etc.) — no data source
- Interview intel — no data source
- LTFT-friendly flag — not in DB schema
- On-call frequency string — DB only has boolean `on_call`

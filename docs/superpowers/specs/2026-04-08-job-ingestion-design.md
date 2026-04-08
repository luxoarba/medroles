# Job Ingestion Pipeline — Design Spec

**Date:** 2026-04-08
**Status:** Approved

---

## Overview

Replace the 5 manually seeded jobs with a live, auto-refreshing feed of NHS medical jobs scraped from NHS Jobs (jobs.nhs.uk). Jobs are stored in the existing `job_listings` Supabase table, updated every 6 hours via pg_cron, and triggerable on demand via a Refresh button on the jobs page.

Starting scope: "Medical and Dental" category on NHS Jobs. Designed for later expansion to additional categories (Nursing, AHP) and additional sources (Trac Jobs) without rearchitecting.

---

## Architecture

```
NHS Jobs public search API (Medical & Dental)
        ↓  (fetched by)
Supabase Edge Function `scrape-jobs`
        ↓  (upserts into)
job_listings table (Supabase Postgres)
        ↑  (triggered by)
  pg_cron every 6 hours  OR  POST /api/scrape (on demand)
                                    ↑
                          RefreshButton on /jobs page
```

The Edge Function owns all scraping logic. pg_cron keeps jobs current automatically. The Next.js API route is a thin authenticated proxy so the browser can trigger a manual refresh without exposing the service role key.

---

## Database Changes

### 1. Unique constraint on `job_listings.external_url`

```sql
ALTER TABLE job_listings
  ADD CONSTRAINT job_listings_external_url_unique UNIQUE (external_url);
```

Enables safe upsert: re-running the scraper updates existing rows rather than inserting duplicates.

### 2. `category` column on `job_listings`

```sql
ALTER TABLE job_listings
  ADD COLUMN category text;
```

Stores the source site's own categorisation (e.g. `"Medical and Dental"`). Nullable — existing rows and manually seeded jobs leave it null. Used by future scrapers to partition their cleanup queries.

### 3. Trust auto-creation

When a scraped job names a trust not in the `trusts` table, the scraper inserts a minimal record:

```sql
INSERT INTO trusts (name) VALUES ($1)
ON CONFLICT (name) DO NOTHING
RETURNING id;
```

The `trusts` table must have a unique constraint on `name` for this to work:

```sql
ALTER TABLE trusts ADD CONSTRAINT trusts_name_unique UNIQUE (name);
```

`avg_rating` and `review_count` are left null until trust reviews are submitted (future feature).

---

## Files

| Action | Path | Responsibility |
|--------|------|----------------|
| DB migration | Supabase SQL editor | Add unique constraints + category column |
| Create | `supabase/functions/scrape-jobs/index.ts` | Deno Edge Function — fetch, map, upsert |
| DB migration | Supabase SQL editor | pg_cron schedule for `scrape-jobs` |
| Create | `app/api/scrape/route.ts` | Next.js API route — authenticated proxy to Edge Function |
| Create | `app/components/refresh-button.tsx` | Client component — calls /api/scrape, shows status |
| Modify | `app/jobs/page.tsx` | Add RefreshButton to page header |

---

## Supabase Edge Function: `scrape-jobs`

**Runtime:** Deno (Supabase Edge Functions)
**Timeout:** 150 seconds (free tier)
**Invocation:** HTTP POST, authenticated with `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

### Behaviour

1. Fetch all pages of NHS Jobs "Medical and Dental" search results (paginated, ~20/page)
2. For each job: look up or create the trust by name, then upsert the job row
3. After upsert: delete rows where `closes_at < now() AND category = 'Medical and Dental'` (expired jobs from this source only — never touches manually seeded jobs with null category)
4. Return `{ inserted, updated, deleted, errors }` counts as JSON

### NHS Jobs API

The NHS Jobs public search returns JSON from:

```
GET https://www.jobs.nhs.uk/api/v1/search_jobs
  ?keyword=
  &category=medical-and-dental
  &page=1
  &pageSize=20
  &orderBy=closingDate
```

The exact endpoint and parameter names must be confirmed during implementation by inspecting the NHS Jobs website network requests (browser DevTools → Network → XHR/Fetch while searching). If the API shape has changed, the field mapping below must be updated accordingly.

### Field Mapping: NHS Jobs → job_listings

| NHS Jobs field | job_listings column | Notes |
|----------------|--------------------|----|
| `title` / `jobTitle` | `title` | Direct |
| `organisationName` | via trust lookup | Look up or create `trusts` row, store `trust_id` |
| `locationName` / `region` | `region` | Map to NHS region string |
| `salary.minimum` | `salary_min` | Integer pence or pounds — normalise to pounds |
| `salary.maximum` | `salary_max` | Same |
| `closingDate` | `closes_at` | ISO date string |
| `datePosted` / `publishedDate` | `posted_at` | ISO date string |
| `jobUrl` / `applyUrl` | `external_url` | Full URL to original posting |
| `contractType` | `contract_type` | Map to existing values: Permanent, Fixed Term, Locum, Part-time |
| `"Medical and Dental"` | `category` | Hardcoded per scraper |
| `"NHS Jobs"` | `source` | Hardcoded |
| null | `grade` | Inferred from title (see below) |
| null | `specialty` | Inferred from title/category (see below) |
| null | `pay_band` | Left null (NHS Jobs doesn't expose band reliably) |
| null | `on_call` | Left null — not available from NHS Jobs search results |
| null | `training_post` | Left null — not available from NHS Jobs search results |

### Grade Inference

NHS Jobs does not tag grade explicitly. Infer from job title using keyword matching (case-insensitive):

| Keywords in title | Grade |
|-------------------|-------|
| FY1, Foundation Year 1 | FY1 |
| FY2, Foundation Year 2 | FY2 |
| CT1, Core Trainee 1 | CT1 |
| CT2, Core Trainee 2 | CT2 |
| ST3, Registrar ST3 | ST3 |
| ST4 | ST4 |
| ST5 | ST5 |
| ST6 | ST6 |
| SAS, Associate Specialist, Staff Grade | SAS |
| Consultant | Consultant |
| (no match) | null |

### Specialty Inference

Infer from job title using keyword matching against the existing `SPECIALTIES` list in `app/lib/jobs.ts`. No match → null.

---

## Next.js API Route: `app/api/scrape/route.ts`

```
POST /api/scrape
```

- Reads `SUPABASE_FUNCTION_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment variables (never exposed to the client)
- Calls the `scrape-jobs` Edge Function with the service role key as a bearer token
- Returns the Edge Function's JSON response to the client
- No authentication required on this route for now (rate limiting is the Edge Function's timeout — a full scrape takes ~30–60s, making abuse impractical)

Environment variables required (server-side only, no `NEXT_PUBLIC_` prefix):
- `SUPABASE_URL` (already exists as `NEXT_PUBLIC_SUPABASE_URL` — reuse or alias)
- `SUPABASE_SERVICE_ROLE_KEY` (new — never commit, add to `.env.local` and Vercel env vars)

---

## UI: RefreshButton

**File:** `app/components/refresh-button.tsx`
**Type:** `'use client'` component

States:
- **Idle:** "Refresh jobs" with a refresh icon
- **Loading:** Spinning icon + "Refreshing…", button disabled
- **Success:** Checkmark + "Updated" for 2 seconds, then reset to idle
- **Error:** "Failed — try again" for 3 seconds, then reset to idle

On success: calls `router.refresh()` to reload the server component and show updated job count.

Placed in `app/jobs/page.tsx` header, next to the sort dropdown. Since `JobsPage` is a server component, `RefreshButton` is imported as a client island.

---

## pg_cron Schedule

Run in the Supabase SQL editor after deploying the Edge Function:

```sql
SELECT cron.schedule(
  'scrape-nhs-jobs',
  '0 */6 * * *',  -- every 6 hours
  $$
    SELECT net.http_post(
      url := '<SUPABASE_FUNCTIONS_URL>/scrape-jobs',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}',
      body := '{}'
    );
  $$
);
```

The `SUPABASE_FUNCTIONS_URL` and `SERVICE_ROLE_KEY` values must be filled in from the Supabase project dashboard before running this SQL.

---

## Data Flow

```
pg_cron fires (every 6h) OR user clicks Refresh
  → POST /api/scrape (Next.js route)
      → POST <supabase-url>/functions/v1/scrape-jobs  (with service role key)
          → fetch NHS Jobs API page 1..N
          → for each job:
              → upsert trust (name unique constraint)
              → upsert job_listing (external_url unique constraint)
          → DELETE expired jobs (closes_at < now, category = 'Medical and Dental')
          → return { inserted, updated, deleted, errors }
      → return JSON to client
  → router.refresh() reloads /jobs page
```

---

## Error Handling

- If NHS Jobs API is unreachable: Edge Function returns `{ error: "fetch failed" }`, API route forwards it, RefreshButton shows "Failed — try again". Existing jobs remain in DB untouched.
- If a single job upsert fails: log the error, continue processing remaining jobs, include count in `errors` field.
- If pg_cron fires while a previous run is still in progress: the second invocation runs independently (Supabase Edge Functions are stateless). Upsert semantics prevent corruption.

---

## Constraints

- No new npm packages in the Next.js app
- Edge Function uses only Deno standard library + Supabase client (already available in Edge Function runtime)
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in client-side code or be prefixed with `NEXT_PUBLIC_`
- Scraper is polite: 200ms delay between paginated requests to avoid hammering NHS Jobs
- Manually seeded jobs (category = null) are never deleted by the scraper

---

## Out of Scope

- Trac Jobs scraper (same pipeline, separate fetch function — add in a future task)
- Individual NHS trust website scrapers
- Full-text search across job descriptions
- Deduplication across sources (same job on NHS Jobs and Trac)
- Scrape result notifications (email/Slack on completion)
- Admin UI for managing scraper runs

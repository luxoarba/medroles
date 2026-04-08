# Filtering Design — MedRoles Jobs Page

**Date:** 2026-04-08

## Overview

Wire up the static filter sidebar on the jobs page so users can select multiple filter values across Specialty, Grade, Contract type, and Source, then click "Apply filters" to reload the page with filtered results.

## Data Flow

1. User ticks checkboxes in the sidebar (local React state, no network request yet)
2. User clicks "Apply filters"
3. Client pushes updated URL: `?sort=closes_at&specialty=Cardiology&grade=ST3&grade=Consultant`
4. Next.js re-renders the server page with new `searchParams`
5. `fetchJobs` reads filter params and applies `.in()` filters to the Supabase query
6. Filtered job cards render; count in header updates

## Components

### New: `app/components/filter-sidebar.tsx` (client component)

- Marked `"use client"`
- Reads current URL search params via `useSearchParams()` to initialise local state on first render (so the sidebar reflects active filters on page load / back-navigation)
- Local state: `pending: Record<string, string[]>` — a map of filter key → selected values
- Renders one `FilterSection` per category, passing `checked` state and `onChange` handler
- **"Apply filters"**: constructs new `URLSearchParams`, preserves existing `sort` param, appends all pending selections, calls `router.push()`
- **"Clear all"**: resets `pending` to `{}`, pushes URL with only `?sort=` param preserved

### Modified: `app/components/sort-select.tsx` / existing `FilterSection`

`FilterSection` stays as a presentational component but gains `checkedValues` and `onToggle` props so it can be controlled from `FilterSidebar`.

### Modified: `app/jobs/page.tsx`

- `fetchJobs` gains a `filters` argument: `{ specialty: string[], grade: string[], contract: string[], source: string[] }`
- Each non-empty array is applied as `.in('column', values)` on the Supabase query
- `searchParams` parsing extracts multi-value params (handles both `string` and `string[]` from Next.js)
- Static `<aside>` contents replaced with `<FilterSidebar initialFilters={parsedFilters} />`

### Modified: `app/lib/jobs.ts`

- `SOURCES` updated from `["NHS Jobs", "Trust Website", "BMJ Careers"]` to `["NHS Jobs", "Trac Jobs"]` to match actual scraped data

## URL Schema

Multi-value filters use repeated params:
```
/jobs?sort=closes_at&specialty=Cardiology&specialty=Radiology&grade=Consultant
```

Next.js `searchParams` returns these as `string | string[] | undefined`. A helper `toArray(val)` normalises to `string[]`.

## Filters Implemented

| Filter | URL key | DB column | Table |
|---|---|---|---|
| Specialty | `specialty` | `specialty` | `job_listings` |
| Grade | `grade` | `grade` | `job_listings` |
| Contract type | `contract` | `contract_type` | `job_listings` |
| Source | `source` | `source` | `job_listings` |

**Trust type** is intentionally excluded — it lives on the joined `trusts` table and requires a more complex query pattern. Deferred to a future iteration.

## Out of Scope

- Mobile filter drawer (sidebar is already `hidden lg:block`)
- Trust type filter
- Free-text search (input exists in UI but is not wired up)
- Filter counts (e.g. "Cardiology (12)")

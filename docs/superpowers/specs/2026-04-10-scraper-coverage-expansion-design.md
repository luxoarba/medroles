# Scraper Coverage Expansion — Phase 1

**Date:** 2026-04-10  
**Scope:** Expand doctor job coverage from ~300 to ~3,000–5,000 listings

---

## Problem

The existing NHS Jobs scraper fetches HTML search results capped at 50 pages × 20 jobs = 1,000 jobs, requires separate detail-page fetches for descriptions, and currently yields only ~300 filtered doctor roles. Trac Jobs is capped at 30 pages (1,500 raw jobs) out of ~115 available. NHS Scotland is not covered at all.

---

## Out of Scope (Phase 2)

- NHS Scotland (`apply.jobs.scot.nhs.uk`) — requires a headless browser (Jobtrain ATS, JS-rendered). Separate design needed.
- BMJ Careers — ~645 jobs, no API, likely high overlap with NHS Jobs. Low marginal value.

---

## Change 1: Rewrite `scrape-jobs` to use NHS Jobs XML API

### What changes

Replace all HTML fetch + parse logic with the public XML API:

```
GET https://www.jobs.nhs.uk/api/v1/search_xml?keyword=<kw>&page=<n>
```

### Keyword strategy

Run these 12 keywords as independent parallel chains:

```
consultant, registrar, resident doctor, foundation doctor,
clinical fellow, core trainee, specialty trainee, trust grade,
associate specialist, specialty doctor, GP registrar, SHO
```

Each keyword:
1. Fetch page 1 → read `<totalPages>` from XML
2. Fetch all remaining pages concurrently in batches of 10
3. Collect all `<vacancyDetails>` entries

All 12 keyword chains run concurrently. Results deduplicated by `<id>` before any further processing.

### XML fields mapped to DB columns

| XML field | DB column | Notes |
|---|---|---|
| `url` | `external_url` | Direct URL, e.g. `https://beta.jobs.nhs.uk/candidate/jobadvert/C9222-26-0185` |
| `id` | dedup key only | Used to deduplicate before upsert |
| `title` | `title` | |
| `employer` | `trusts.name` | via `resolveTrusts()` |
| `description` | `description` | **Built-in — no detail fetch needed** |
| `type` | `contract_type` | map via `mapContractType()` |
| `salary` | `salary_min`, `salary_max` | parse via `parseSalary()` |
| `closeDate` | `closes_at` | Already ISO `YYYY-MM-DD` — use directly |
| `postDate` | `posted_at` | ISO datetime with microseconds — slice to `YYYY-MM-DD` |
| `locations` | `region` | Format: `"City, Postcode"` — take the city portion |

`grade` and `specialty` are inferred from `title` via existing `inferGrade()` / `inferSpecialty()`.

### Safety ceiling

Total pages is read from `<totalPages>` in the XML response and followed exactly. A hard cap of `500` is kept as a safety guard against malformed responses. This means the scraper automatically adapts to however many pages exist on any given run.

### What stays the same

- `isDoctorRole()` filter (applied after dedup to remove non-doctor keyword hits like "pharmacy registrar")
- `inferGrade()`, `inferSpecialty()`, `parseSalary()`, `mapContractType()`
- `resolveTrusts()` DB helper
- Supabase bulk upsert on `onConflict: external_url`
- Delete expired listings (closeDate in the past)

### What is removed

- All HTML parsing functions (`parseJobCards`, `parseTotalPages`, `extractText`, etc.)
- Detail-page fetching (`fetchNhsDetail`, `parseNhsJobsDetail`, etc.) — descriptions come from the XML directly
- The `MAX_PAGES` constant

### Expected outcome

~3,000–5,000 doctor job listings vs current ~300.

---

## Change 2: Remove Trac Jobs page cap

### What changes

- Remove the `MAX_PAGES = 30` constant
- Update `parseTotalPages()` to remove the `Math.min(..., MAX_PAGES)` caps — it reads the true total from the HTML instead
- Keep a safety ceiling of `500` pages
- The existing `if (cards.length === 0) break` early-exit handles graceful termination

### What stays the same

Everything else — detail-page fetching, parsing, upsert logic, deduplication.

### Expected outcome

Covers all ~115 pages (5,750 raw listings) instead of 30 pages (1,500). Modest increase in unique doctor roles caught.

---

## Edge cases

- **Keyword overlap**: Multiple keywords may return the same vacancy. Deduplication by `id` before upsert handles this.
- **XML date format**: Confirmed ISO. `closeDate` is `YYYY-MM-DD`; `postDate` is an ISO datetime string — slice `[0..9]` to get the date portion.
- **Supabase Edge Function timeout**: Default 150s. With 12 parallel keyword chains and batched page fetching, this should comfortably fit. If it becomes an issue, keyword chains can be split across two invocations.
- **Trac Jobs early exit**: If `parseTotalPages` underestimates (no total count in HTML), the scraper falls back to `MAX_PAGES` (500) but the `cards.length === 0` break prevents over-fetching.

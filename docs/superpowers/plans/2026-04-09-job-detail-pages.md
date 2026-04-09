# Job Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate `description`, `requirements`, and `benefits` from live scrape runs and render a real job detail page from Supabase instead of mock data.

**Architecture:** Add three nullable columns to `job_listings`. Extend `scrape-trac` (which already fetches detail pages) to extract description/requirements/benefits from each detail pass. Extend `scrape-jobs` to fetch detail pages for jobs where `description IS NULL`. Wire `jobs/[id]/page.tsx` to fetch from Supabase and render real data, removing all mock dependencies.

**Tech Stack:** Supabase (Postgres + Edge Functions running on Deno), Next.js 16 App Router, TypeScript, regex-based HTML parsing (no DOM library — matches existing scraper pattern).

---

### Task 1: Add DB columns via Supabase dashboard

**Files:**
- No file — run SQL directly in Supabase dashboard SQL editor

- [ ] **Step 1: Open the Supabase dashboard SQL editor**

Navigate to your Supabase project → SQL Editor → New query.

- [ ] **Step 2: Run the migration**

```sql
ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS requirements text[],
  ADD COLUMN IF NOT EXISTS benefits text[];
```

- [ ] **Step 3: Verify columns exist**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'job_listings'
  AND column_name IN ('description', 'requirements', 'benefits');
```

Expected output: 3 rows — `description` (text), `requirements` (ARRAY), `benefits` (ARRAY).

---

### Task 2: Extend scrape-trac to extract description/requirements/benefits

**Files:**
- Modify: `supabase/functions/scrape-trac/index.ts`

`scrape-trac` already fetches detail pages for every doctor job (for `closes_at`, grade, salary). This task extends that pass to also extract the three new fields. No extra HTTP requests are needed.

- [ ] **Step 1: Discover the Trac detail page HTML structure**

Run this in a terminal to inspect a live Trac detail page (pick any URL from the `job_listings` table where `source = 'Trac Jobs'`):

```bash
curl -s -A "Mozilla/5.0 (compatible; test)" \
  "https://www.healthjobsuk.com/job/UK/London/London/NHS_Test/Medical_and_Dental/Example-v12345" \
  | grep -i -E "(job.?desc|about.?role|person.?spec|requirements|benefits|what.?we.?offer|<h[23])" \
  | head -40
```

Replace the URL with a real one from `SELECT external_url FROM job_listings WHERE source = 'Trac Jobs' LIMIT 1;`.

Look for: headings (`<h2>`, `<h3>`) that label the description, requirements, and benefits sections, and note how their content is structured (plain `<p>`, `<ul><li>`, or a `<div>`).

- [ ] **Step 2: Update the `DetailData` interface**

In `supabase/functions/scrape-trac/index.ts`, extend the `DetailData` interface (currently at line 23):

```typescript
interface DetailData {
  closingDate: string | null;
  contractType: string | null;
  grade: string | null;
  location: string | null;
  salaryText: string | null;
  trustName: string | null;
  description: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
}
```

- [ ] **Step 3: Add a helper to extract a bullet list under a heading**

Add this function immediately after the `extractDt` function (after line ~106):

```typescript
// Extract <li> text items from the first <ul> appearing after a heading matching `label`
function extractListUnderHeading(html: string, label: string): string[] | null {
  const re = new RegExp(
    `${label}[\\s\\S]*?<\\/h[2-6]>([\\s\\S]*?)<ul[^>]*>([\\s\\S]*?)<\\/ul>`,
    "i",
  );
  const m = html.match(re);
  if (!m) {
    // Fallback: heading directly before <ul> without intervening content
    const re2 = new RegExp(
      `${label}[\\s\\S]{0,300}<ul[^>]*>([\\s\\S]*?)<\\/ul>`,
      "i",
    );
    const m2 = html.match(re2);
    if (!m2) return null;
    return extractLiItems(m2[1]);
  }
  return extractLiItems(m[2]);
}

function extractLiItems(ulInner: string): string[] | null {
  const items = [...ulInner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) =>
      m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&#\d+;/g, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
  return items.length > 0 ? items : null;
}
```

- [ ] **Step 4: Update `parseDetailPage` to extract the new fields**

Replace the `parseDetailPage` function body:

```typescript
function parseDetailPage(html: string): DetailData {
  const closingRaw = extractDt(html, "Closing");
  const contractRaw = extractDt(html, "Contract");
  const gradeRaw = extractDt(html, "Grade");
  const townRaw = extractDt(html, "Town");
  const salaryRaw = extractDt(html, "Salary");
  const employerRaw = extractDt(html, "Employer");

  // Extract description: prose block after a "Job Description" or "About the Role" heading
  const descMatch = html.match(
    /(?:job description|about the role|job overview|summary)[^<]*<\/h[2-6]>\s*([\s\S]*?)(?=<h[2-6]|<\/section|<\/article|<div\s+class="job-detail)/i,
  );
  const description = descMatch
    ? descMatch[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&#\d+;/g, "")
        .replace(/\s+/g, " ")
        .trim() || null
    : null;

  const requirements = extractListUnderHeading(
    html,
    "(?:person specification|requirements|essential criteria)",
  );
  const benefits = extractListUnderHeading(
    html,
    "(?:benefits|what we offer|what we can offer)",
  );

  return {
    closingDate: parseTracDate(closingRaw),
    contractType: mapContractType(contractRaw),
    grade: normaliseGrade(gradeRaw),
    location: townRaw,
    salaryText: salaryRaw,
    trustName: employerRaw,
    description,
    requirements,
    benefits,
  };
}
```

- [ ] **Step 5: Include new fields in the upsert row**

In the `rows` builder (currently around line 361), add the three new fields:

```typescript
const rows = doctorJobs.map((job, i) => {
  const detail = details[i];
  const trustName = detail?.trustName ?? job.trustName;
  const salaryText = detail?.salaryText ?? job.salaryText;
  const { min, max } = parseSalary(salaryText);
  return {
    title: job.title,
    trust_id: trustMap.get(trustName) ?? null,
    region: detail?.location ?? job.location,
    grade: detail?.grade ?? inferGrade(job.title),
    specialty: inferSpecialty(job.title),
    contract_type: detail?.contractType ?? null,
    salary_min: min,
    salary_max: max,
    closes_at: detail?.closingDate ?? null,
    posted_at: null,
    external_url: job.externalUrl,
    source: "Trac Jobs",
    category: "Medical and Dental",
    pay_band: null,
    on_call: null,
    training_post: null,
    is_active: true,
    cesr_support: false,
    description: detail?.description ?? null,
    requirements: detail?.requirements ?? null,
    benefits: detail?.benefits ?? null,
  };
});
```

- [ ] **Step 6: Deploy scrape-trac**

```bash
cd /c/Users/zohei/medroles
supabase functions deploy scrape-trac
```

Expected output: `Deployed Functions scrape-trac`

- [ ] **Step 7: Trigger a test scrape and verify description is populated**

```bash
curl -s -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" | jq '.trac'
```

Or POST to `/api/scrape` in the browser. Then in the Supabase SQL editor:

```sql
SELECT title, LEFT(description, 80), requirements[1], benefits[1]
FROM job_listings
WHERE source = 'Trac Jobs'
  AND description IS NOT NULL
LIMIT 5;
```

Expected: rows with non-null description text and at least some requirements/benefits populated.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/scrape-trac/index.ts
git commit -m "feat: extract description/requirements/benefits in scrape-trac"
```

---

### Task 3: Add detail page fetching to scrape-jobs

**Files:**
- Modify: `supabase/functions/scrape-jobs/index.ts`

`scrape-jobs` currently doesn't fetch detail pages. Add detail fetching only for jobs where `description IS NULL` to avoid redundant requests on re-runs.

- [ ] **Step 1: Discover the NHS Jobs detail page HTML structure**

Run this with a real NHS Jobs URL from the DB:

```bash
curl -s -A "Mozilla/5.0 (compatible; test)" \
  "https://www.jobs.nhs.uk/candidate/jobadvert/C9433-25-0001" \
  | grep -i -E "(data-test|<h[23]|job.?overview|about.?role|person.?spec|requirements|benefits)" \
  | head -50
```

Replace the vacancy ID with one from `SELECT external_url FROM job_listings WHERE source = 'NHS Jobs' LIMIT 1;`.

Look for `data-test` attribute values on the heading/section elements. NHS Jobs pages typically use `data-test` attributes (matching the list page scraper pattern). Note the `data-test` values for the description section and any requirements/benefits sections.

- [ ] **Step 2: Add the `NhsJobDetail` interface and `DETAIL_CONCURRENCY` constant**

Add after the `ParsedJob` interface (after line 23):

```typescript
interface NhsJobDetail {
  description: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
}

const DETAIL_CONCURRENCY = 5;
```

- [ ] **Step 3: Add `parseNhsJobsDetail` and `fetchNhsDetail` functions**

Add these after the `parseTotalPages` function (after line ~95):

```typescript
function extractSection(html: string, heading: string): string | null {
  // Match a heading then capture the following content block until the next heading
  const re = new RegExp(
    `${heading}[^<]*<\\/h[2-6]>([\\s\\S]*?)(?=<h[2-6]|<\\/section|<\\/article|$)`,
    "i",
  );
  const m = html.match(re);
  return m
    ? m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&#\d+;/g, "")
        .replace(/\s+/g, " ")
        .trim() || null
    : null;
}

function extractListItems(html: string, heading: string): string[] | null {
  const re = new RegExp(
    `${heading}[\\s\\S]{0,400}<ul[^>]*>([\\s\\S]*?)<\\/ul>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return null;
  const items = [...m[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((li) =>
      li[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&#\d+;/g, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function parseNhsJobsDetail(html: string): NhsJobDetail {
  // NHS Jobs detail pages use "Detailed job description" or "Job overview" headings.
  // Try both common heading texts; the first match wins.
  const description =
    extractSection(html, "Detailed job description and main responsibilities") ??
    extractSection(html, "Job overview") ??
    extractSection(html, "About the role");

  // Requirements come from "Person specification" — typically the "Essential criteria" list
  const requirements =
    extractListItems(html, "Essential criteria") ??
    extractListItems(html, "Person specification");

  const benefits =
    extractListItems(html, "(?:benefits|what we offer|employee benefits)");

  return { description, requirements, benefits };
}

async function fetchNhsDetail(url: string): Promise<NhsJobDetail | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MedRoles/1.0; +https://medroles.co.uk)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return parseNhsJobsDetail(html);
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Add `batchMap` helper (same pattern as scrape-trac)**

Add after `fetchNhsDetail`:

```typescript
async function batchMap<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}
```

- [ ] **Step 5: Query which URLs already have description populated**

In the `Deno.serve` handler, after `const doctorJobs = unique.filter(...)` (around line 305), add:

```typescript
// Find which URLs already have description populated — skip those detail fetches
const allUrls = doctorJobs.map((j) => j.externalUrl);
const { data: populated } = await supabase
  .from("job_listings")
  .select("external_url")
  .in("external_url", allUrls)
  .not("description", "is", null);

const populatedSet = new Set((populated ?? []).map((r) => r.external_url));
const needsDetail = doctorJobs.filter((j) => !populatedSet.has(j.externalUrl));

// Fetch detail pages only for jobs with null description
const detailMap = new Map<string, NhsJobDetail>();
if (needsDetail.length > 0) {
  const fetched = await batchMap(
    needsDetail,
    DETAIL_CONCURRENCY,
    (job) => fetchNhsDetail(job.externalUrl),
  );
  needsDetail.forEach((job, i) => {
    if (fetched[i]) detailMap.set(job.externalUrl, fetched[i]!);
  });
}
```

- [ ] **Step 6: Include new fields in the upsert row**

Update the `rows` builder (around line 312) to include description/requirements/benefits from the detail map:

```typescript
const rows = doctorJobs.map((job) => {
  const { min, max } = parseSalary(job.salaryText);
  const detail = detailMap.get(job.externalUrl) ?? null;
  return {
    title: job.title,
    trust_id: trustMap.get(job.trustName) ?? null,
    region: job.location,
    grade: inferGrade(job.title),
    specialty: inferSpecialty(job.title),
    contract_type: mapContractType(job.contractTypeText),
    salary_min: min,
    salary_max: max,
    closes_at: parseDate(job.closingDateText),
    posted_at: parseDate(job.postedDateText),
    external_url: job.externalUrl,
    source: "NHS Jobs",
    category: "Medical and Dental",
    pay_band: null,
    on_call: null,
    training_post: null,
    is_active: true,
    cesr_support: false,
    description: detail?.description ?? null,
    requirements: detail?.requirements ?? null,
    benefits: detail?.benefits ?? null,
  };
});
```

- [ ] **Step 7: Deploy scrape-jobs**

```bash
cd /c/Users/zohei/medroles
supabase functions deploy scrape-jobs
```

Expected output: `Deployed Functions scrape-jobs`

- [ ] **Step 8: Trigger a test scrape and verify**

POST to `/api/scrape`, then in Supabase SQL editor:

```sql
SELECT title, LEFT(description, 80), requirements[1]
FROM job_listings
WHERE source = 'NHS Jobs'
  AND description IS NOT NULL
LIMIT 5;
```

Expected: rows with non-null description. If `description` is still null after the scrape, the heading regex in `parseNhsJobsDetail` needs adjusting — fetch a real detail page URL and inspect the `<h2>`/`<h3>` text to correct the heading strings in `extractSection`.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/scrape-jobs/index.ts
git commit -m "feat: fetch detail pages in scrape-jobs to populate description/requirements/benefits"
```

---

### Task 4: Update `DBJobListing` type

**Files:**
- Modify: `app/lib/supabase.ts`

- [ ] **Step 1: Add three new nullable fields to `DBJobListing`**

In `app/lib/supabase.ts`, extend the `DBJobListing` type (after `external_url`):

```typescript
export type DBJobListing = {
  id: string;
  title: string;
  specialty: string | null;
  grade: string | null;
  contract_type: string | null;
  region: string | null;
  pay_band: string | null;
  salary_min: number | null;
  salary_max: number | null;
  on_call: boolean | null;
  training_post: boolean | null;
  closes_at: string | null;
  posted_at: string | null;
  source: string | null;
  external_url: string | null;
  description: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
  trusts:
    | { name: string; avg_rating: number | null; review_count: number | null; type: string | null }
    | { name: string; avg_rating: number | null; review_count: number | null; type: string | null }[]
    | null;
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/zohei/medroles/app
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing unrelated errors).

- [ ] **Step 3: Commit**

```bash
git add app/lib/supabase.ts
git commit -m "feat: add description/requirements/benefits to DBJobListing type"
```

---

### Task 5: Rewire the job detail page

**Files:**
- Modify: `app/jobs/[id]/page.tsx`

Replace the mock `getJob()` data source with a real Supabase fetch. Remove fabricated sections (trust category breakdown, interview intel). Render real data with null-safe handling.

- [ ] **Step 1: Replace the entire file content**

```typescript
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../components/navbar";
import BookmarkButton from "../../components/bookmark-button";
import { supabase, formatSalary, type DBJobListing } from "../../lib/supabase";

function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const sz = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          viewBox="0 0 20 20"
          fill={s <= Math.round(rating) ? "#059669" : "none"}
          stroke={s <= Math.round(rating) ? "#059669" : "#d1d5db"}
          className={sz}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

const GRADE_COLOURS: Record<string, string> = {
  FY1: "bg-sky-50 text-sky-700 ring-sky-200",
  FY2: "bg-sky-50 text-sky-700 ring-sky-200",
  CT1: "bg-violet-50 text-violet-700 ring-violet-200",
  CT2: "bg-violet-50 text-violet-700 ring-violet-200",
  ST3: "bg-orange-50 text-orange-700 ring-orange-200",
  ST4: "bg-orange-50 text-orange-700 ring-orange-200",
  ST5: "bg-orange-50 text-orange-700 ring-orange-200",
  ST6: "bg-orange-50 text-orange-700 ring-orange-200",
  SAS: "bg-teal-50 text-teal-700 ring-teal-200",
  Consultant: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function resolveTrust(raw: DBJobListing["trusts"]) {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: jobRaw } = await supabase
    .from("job_listings")
    .select(`
      id,
      title,
      specialty,
      grade,
      contract_type,
      region,
      salary_min,
      salary_max,
      on_call,
      training_post,
      closes_at,
      source,
      external_url,
      description,
      requirements,
      benefits,
      trusts (
        name,
        avg_rating,
        review_count,
        type
      )
    `)
    .eq("id", id)
    .single();

  if (!jobRaw) notFound();
  const job = jobRaw as unknown as DBJobListing;

  const trust = resolveTrust(job.trusts);
  const salary = formatSalary(job.salary_min, job.salary_max);
  const grade = job.grade ?? "";
  const contractLabel = job.contract_type
    ? job.contract_type.charAt(0).toUpperCase() + job.contract_type.slice(1)
    : null;

  const today = new Date();
  const closing = job.closes_at
    ? new Date(job.closes_at).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const daysLeft = job.closes_at
    ? Math.round(
        (new Date(job.closes_at).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <nav className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/jobs" className="hover:text-gray-600 transition-colors">
            Jobs
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-gray-700">{job.title}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <article className="min-w-0 flex-1">
            {/* Job header */}
            <div className="mb-6 rounded-2xl bg-white p-8 ring-1 ring-gray-200">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {grade && (
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${
                          GRADE_COLOURS[grade] ??
                          "bg-gray-50 text-gray-600 ring-gray-200"
                        }`}
                      >
                        {grade}
                      </span>
                    )}
                    {job.specialty && (
                      <span className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
                        {job.specialty}
                      </span>
                    )}
                    {contractLabel && (
                      <span className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
                        {contractLabel}
                      </span>
                    )}
                    {job.training_post && (
                      <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                        Training post
                      </span>
                    )}
                  </div>
                  <h1 className="mb-1 text-2xl font-bold text-gray-900">
                    {job.title}
                  </h1>
                  <p className="text-base text-gray-500">
                    {trust?.name ?? "NHS Trust"}
                  </p>
                  {job.region && (
                    <p className="mt-1 text-sm text-gray-400">{job.region}</p>
                  )}
                </div>
                <BookmarkButton jobId={job.id} />
              </div>

              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-5 sm:grid-cols-4">
                {salary && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      Salary
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {salary}
                    </p>
                  </div>
                )}
                {job.on_call !== null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      On-call
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {job.on_call ? "Yes" : "No"}
                    </p>
                  </div>
                )}
                {trust?.type && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      Trust type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {trust.type}
                    </p>
                  </div>
                )}
                {job.source && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      Source
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {job.source}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 rounded-2xl bg-white p-8 ring-1 ring-gray-200">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                About the role
              </h2>
              {job.description ? (
                <p className="leading-7 text-gray-600">{job.description}</p>
              ) : (
                <p className="text-sm text-gray-400">
                  Full description not yet available.{" "}
                  {job.external_url && (
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 underline hover:text-emerald-700"
                    >
                      View on {job.source ?? "source site"}
                    </a>
                  )}
                </p>
              )}
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="mb-6 rounded-2xl bg-white p-8 ring-1 ring-gray-200">
                <h2 className="mb-4 text-base font-semibold text-gray-900">
                  Requirements
                </h2>
                <ul className="space-y-3">
                  {job.requirements.map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-gray-600"
                    >
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <svg
                          className="h-3 w-3 text-emerald-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="rounded-2xl bg-white p-8 ring-1 ring-gray-200">
                <h2 className="mb-4 text-base font-semibold text-gray-900">
                  Benefits
                </h2>
                <ul className="space-y-3">
                  {job.benefits.map((ben, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-gray-600"
                    >
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="h-3 w-3 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                      </span>
                      {ben}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 xl:w-80">
            <div className="sticky top-20 space-y-5">
              {/* Apply card */}
              <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
                {closing !== null && daysLeft !== null && (
                  <div
                    className={`mb-4 rounded-xl px-4 py-3 text-center text-sm font-medium ${
                      daysLeft <= 7
                        ? "bg-red-50 text-red-700"
                        : daysLeft <= 14
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {daysLeft > 0 ? (
                      <>
                        <span className="font-bold">{daysLeft} days</span> until
                        closing
                      </>
                    ) : (
                      "This role has closed"
                    )}
                    <div className="mt-0.5 text-xs opacity-75">{closing}</div>
                  </div>
                )}

                {job.external_url ? (
                  <a
                    href={job.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    Apply on {job.source ?? "source site"}
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </a>
                ) : (
                  <p className="text-center text-sm text-gray-400">
                    Application link unavailable
                  </p>
                )}

                {job.source && (
                  <p className="mt-3 text-center text-xs text-gray-400">
                    You will be redirected to {job.source}
                  </p>
                )}
              </div>

              {/* Trust rating card */}
              {trust?.avg_rating !== null &&
                trust?.avg_rating !== undefined && (
                  <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
                    <h3 className="mb-4 text-sm font-semibold text-gray-900">
                      Trust rating
                    </h3>
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gray-900">
                        {trust.avg_rating.toFixed(1)}
                      </p>
                      <StarRating rating={trust.avg_rating} size="md" />
                      {trust.review_count !== null && (
                        <p className="mt-1 text-xs text-gray-400">
                          {trust.review_count} doctor reviews
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/zohei/medroles/app
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Start dev server and manually verify**

```bash
npm run dev
```

Navigate to `/jobs` → click any job card. Expected:
- Breadcrumb shows correct job title
- Grade/specialty/contract tags render from real DB data
- Trust name and region display correctly
- Key details grid shows salary (or is omitted if null), on-call, trust type, source
- "About the role" section: if description null, shows "Full description not yet available" with link to source; if populated, shows the text
- Requirements and Benefits sections only appear if populated
- Apply button links to real `external_url`
- Trust rating card: appears only if `avg_rating` is set

Navigate to `/jobs/nonexistent-id`. Expected: Next.js 404 page.

- [ ] **Step 4: Commit**

```bash
git add app/jobs/[id]/page.tsx
git commit -m "feat: wire job detail page to Supabase, remove mock data"
```

---

### Task 6: Final verification and cleanup

**Files:**
- No new files

- [ ] **Step 1: Confirm `getJob` and `JOBS` are no longer imported anywhere**

```bash
grep -r "getJob\|from.*lib/jobs" /c/Users/zohei/medroles/app --include="*.ts" --include="*.tsx"
```

Expected output: only `lib/jobs.ts` itself and `filter-sidebar.tsx` / `jobs/page.tsx` (which import `SPECIALTIES`, `GRADES`, `CONTRACT_TYPES`, `SOURCES` — these are still needed for the filter sidebar). No file should import `getJob` or `JOBS`.

- [ ] **Step 2: Run a full build**

```bash
cd /c/Users/zohei/medroles/app
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors. Warnings about missing env vars in build are acceptable.

- [ ] **Step 3: Update memory — mark job detail pages as complete**

In `C:\Users\zohei\.claude\projects\C--Users-zohei-medroles\memory\next-steps.md`, update the priority list: remove "Job detail pages" from #2, promote "Trust profiles" to #2.

In `C:\Users\zohei\.claude\projects\C--Users-zohei-medroles\memory\what-built.md`, add a "Job detail pages" section describing what was built.

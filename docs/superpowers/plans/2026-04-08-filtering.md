# Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the jobs page sidebar so users can select Specialty, Grade, Contract type, and Source filters, then click "Apply filters" to reload the page with filtered results.

**Architecture:** Filters are stored in URL search params (repeated keys, e.g. `?grade=ST3&grade=Consultant`). A new client component `FilterSidebar` manages local pending state, pushes the URL on apply. The server page reads params and applies `.in()` filters to the Supabase query.

**Tech Stack:** Next.js 16 App Router, `useSearchParams` / `useRouter` (next/navigation), Supabase JS client, Tailwind CSS v4

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `app/lib/jobs.ts` | Update `SOURCES` to match real scraped data |
| Create | `app/components/filter-sidebar.tsx` | Client component — pending filter state, apply/clear, renders `FilterSection` |
| Modify | `app/jobs/page.tsx` | `fetchJobs` gains `filters` arg; `searchParams` parsing expanded; static aside replaced with `<FilterSidebar>` |

---

### Task 1: Update SOURCES in lib/jobs.ts

**Files:**
- Modify: `app/lib/jobs.ts:378`

- [ ] **Step 1: Update the SOURCES export**

In `app/lib/jobs.ts`, replace line 378:

```ts
// Before
export const SOURCES = ["NHS Jobs", "Trust Website", "BMJ Careers"];

// After
export const SOURCES = ["NHS Jobs", "Trac Jobs"];
```

- [ ] **Step 2: Commit**

```bash
git add app/lib/jobs.ts
git commit -m "chore: update SOURCES to match real scraped data"
```

---

### Task 2: Create FilterSidebar client component

**Files:**
- Create: `app/components/filter-sidebar.tsx`

- [ ] **Step 1: Create the file**

Create `app/components/filter-sidebar.tsx` with the full content below:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SPECIALTIES, GRADES, CONTRACT_TYPES, SOURCES } from "../lib/jobs";

function toArray(vals: string[]): string[] {
  return vals;
}

function FilterSection({
  title,
  items,
  checkedValues,
  onToggle,
}: {
  title: string;
  items: string[];
  checkedValues: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const checked = checkedValues.includes(item);
          return (
            <li key={item}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border bg-white transition-colors ${
                    checked ? "border-emerald-500 bg-emerald-50" : "border-gray-300"
                  }`}
                >
                  {checked && (
                    <svg className="h-2.5 w-2.5 text-emerald-600" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => onToggle(item)}
                />
                {item}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pending, setPending] = useState<Record<string, string[]>>(() => ({
    specialty: searchParams.getAll("specialty"),
    grade: searchParams.getAll("grade"),
    contract: searchParams.getAll("contract"),
    source: searchParams.getAll("source"),
  }));

  function toggle(key: string, value: string) {
    setPending((prev) => {
      const current = prev[key] ?? [];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  }

  function apply() {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    for (const [key, values] of Object.entries(pending)) {
      for (const v of values) params.append(key, v);
    }
    router.push(`/jobs?${params.toString()}`);
  }

  function clearAll() {
    setPending({ specialty: [], grade: [], contract: [], source: [] });
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`/jobs?${params.toString()}`);
  }

  const hasActive = Object.values(pending).some((v) => v.length > 0);

  return (
    <div className="sticky top-20 space-y-7 rounded-2xl bg-white p-5 ring-1 ring-gray-200">
      <FilterSection
        title="Specialty"
        items={SPECIALTIES}
        checkedValues={pending.specialty}
        onToggle={(v) => toggle("specialty", v)}
      />
      <div className="h-px bg-gray-100" />
      <FilterSection
        title="Grade"
        items={GRADES}
        checkedValues={pending.grade}
        onToggle={(v) => toggle("grade", v)}
      />
      <div className="h-px bg-gray-100" />
      <FilterSection
        title="Contract"
        items={CONTRACT_TYPES}
        checkedValues={pending.contract}
        onToggle={(v) => toggle("contract", v)}
      />
      <div className="h-px bg-gray-100" />
      <FilterSection
        title="Source"
        items={SOURCES}
        checkedValues={pending.source}
        onToggle={(v) => toggle("source", v)}
      />
      <button
        onClick={apply}
        className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
      >
        Apply filters
      </button>
      {hasActive && (
        <button
          onClick={clearAll}
          className="w-full rounded-lg py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/filter-sidebar.tsx
git commit -m "feat: add FilterSidebar client component"
```

---

### Task 3: Update fetchJobs to accept and apply filters

**Files:**
- Modify: `app/jobs/page.tsx:193-234`

- [ ] **Step 1: Add a toArray helper and update fetchJobs signature**

At the top of `app/jobs/page.tsx`, after the imports, add a `toArray` helper. Then replace the `fetchJobs` function (lines 193–235) with the version below:

```ts
function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

async function fetchJobs(
  sort: string,
  filters: {
    specialty: string[];
    grade: string[];
    contract: string[];
    source: string[];
  },
): Promise<DBJobListing[]> {
  let query = supabase
    .from("job_listings")
    .select(`
      id,
      title,
      specialty,
      grade,
      contract_type,
      region,
      pay_band,
      salary_min,
      salary_max,
      on_call,
      training_post,
      closes_at,
      posted_at,
      source,
      external_url,
      trusts (
        name,
        avg_rating,
        review_count,
        type
      )
    `);

  if (filters.specialty.length > 0) query = query.in("specialty", filters.specialty);
  if (filters.grade.length > 0) query = query.in("grade", filters.grade);
  if (filters.contract.length > 0) query = query.in("contract_type", filters.contract);
  if (filters.source.length > 0) query = query.in("source", filters.source);

  if (sort === "posted_at") {
    query = query.order("posted_at", { ascending: false });
  } else if (sort === "salary") {
    query = query.order("salary_max", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("closes_at", { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as DBJobListing[];
}
```

- [ ] **Step 2: Commit**

```bash
git add app/jobs/page.tsx
git commit -m "feat: add filter params to fetchJobs"
```

---

### Task 4: Wire up JobsPage to parse filters and render FilterSidebar

**Files:**
- Modify: `app/jobs/page.tsx:237-328`

- [ ] **Step 1: Add FilterSidebar import**

At the top of `app/jobs/page.tsx`, add:

```ts
import { Suspense } from "react";
import FilterSidebar from "../components/filter-sidebar";
```

(Note: `Suspense` is already imported — keep the existing import, just add `FilterSidebar`.)

- [ ] **Step 2: Update JobsPage to parse filters and pass them to fetchJobs**

Replace the `JobsPage` component (starting at the `export default async function JobsPage` line) with:

```tsx
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sortValue = toArray(params.sort)[0] ?? "closes_at";
  const filters = {
    specialty: toArray(params.specialty),
    grade: toArray(params.grade),
    contract: toArray(params.contract),
    source: toArray(params.source),
  };

  const jobs = await fetchJobs(sortValue, filters);

  const activeFilterCount = Object.values(filters).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NHS Jobs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-emerald-600">{jobs.length}</span>{" "}
              live {jobs.length === 1 ? "role" : "roles"}
              {activeFilterCount > 0 && (
                <span className="ml-1 text-gray-400">
                  · {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton />
            <label className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-600 ring-1 ring-gray-200">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search roles…"
                className="w-48 bg-transparent outline-none placeholder-gray-400"
              />
            </label>
            <Suspense fallback={<div className="rounded-xl bg-white px-4 py-2.5 text-sm text-gray-300 ring-1 ring-gray-200">Sort…</div>}>
              <SortSelect />
            </Suspense>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <Suspense fallback={<div className="sticky top-20 h-96 rounded-2xl bg-white ring-1 ring-gray-200" />}>
              <FilterSidebar />
            </Suspense>
          </aside>

          {/* Job cards */}
          <main className="min-w-0 flex-1">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <h3 className="mb-1 text-base font-semibold text-gray-700">No roles found</h3>
                <p className="text-sm text-gray-400">
                  {activeFilterCount > 0
                    ? "No jobs match your current filters."
                    : "The job_listings table appears to be empty."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Remove the old static FilterSection from jobs/page.tsx**

Delete the `FilterSection` function (lines 173–191 in the original file — the one that renders static checkboxes with no interactivity). It is now defined inside `filter-sidebar.tsx`.

- [ ] **Step 4: Verify the build compiles**

```bash
cd /c/Users/zohei/medroles && npm run build 2>&1 | tail -20
```

Expected: build completes with no errors. TypeScript errors or missing imports will show here.

- [ ] **Step 5: Commit**

```bash
git add app/jobs/page.tsx
git commit -m "feat: wire up filter sidebar to jobs page"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Start dev server**

```bash
cd /c/Users/zohei/medroles && npm run dev
```

- [ ] **Step 2: Verify filter checkboxes work**

Open `http://localhost:3000/jobs`. On a wide screen, the left sidebar should show Specialty, Grade, Contract, Source sections with interactive checkboxes. Tick a few values and confirm they highlight green.

- [ ] **Step 3: Verify Apply filters updates URL and filters results**

Tick "Consultant" under Grade and "NHS Jobs" under Source. Click "Apply filters". The URL should become something like `/jobs?grade=Consultant&source=NHS+Jobs`. The job count in the header should reflect the filtered set. "1 filter active" or "2 filters active" should appear next to the count.

- [ ] **Step 4: Verify Clear all resets state**

With filters active, click "Clear all". URL should return to `/jobs` (or `/jobs?sort=closes_at`). All jobs should reappear. "Clear all" button should disappear (it only shows when `hasActive` is true).

- [ ] **Step 5: Verify sidebar reflects URL on direct load**

Navigate directly to `/jobs?grade=FY1&grade=FY2`. The sidebar should initialise with FY1 and FY2 ticked under Grade.

- [ ] **Step 6: Verify sort is preserved across filter apply**

Change sort to "Most recent". Then tick a filter and apply. URL should contain both `sort=posted_at` and the filter params.

- [ ] **Step 7: Verify empty state message**

Select a filter combination that returns zero results (e.g. specialty=Dermatology and source=Trac Jobs if no such jobs exist). The empty state should say "No jobs match your current filters." instead of the generic DB message.

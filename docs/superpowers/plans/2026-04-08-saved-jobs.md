# Saved Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist job bookmarks to Supabase so users can save jobs from any page and view them on their account page.

**Architecture:** A `saved_jobs` Supabase table with RLS scoped per user. A new `lib/savedJobs.ts` module owns all DB operations. `BookmarkButton` hydrates its state on mount via `isJobSaved()` and writes optimistically. The account page calls `getSavedJobs()` to replace the empty-state placeholder.

**Tech Stack:** Next.js 16.2.2 (App Router), React 19, `@supabase/supabase-js` v2, TypeScript strict, Tailwind CSS v4

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| DB migration | Supabase dashboard SQL editor | Create `saved_jobs` table + RLS |
| Create | `lib/savedJobs.ts` | saveJob, unsaveJob, isJobSaved, getSavedJobs |
| Modify | `app/components/bookmark-button.tsx` | DB-backed toggle with auth redirect |
| Modify | `app/account/page.tsx` | Load and render saved job cards |

---

### Task 1: Create the `saved_jobs` table in Supabase

**Files:**
- No code files — this is a Supabase dashboard step

- [ ] **Step 1: Open the Supabase SQL editor**

Go to your Supabase project dashboard → SQL Editor → New query.

- [ ] **Step 2: Run the migration**

Paste and run the following SQL:

```sql
CREATE TABLE saved_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved jobs"
  ON saved_jobs FOR ALL
  USING (auth.uid() = user_id);
```

- [ ] **Step 3: Verify the table exists**

In the Supabase Table Editor, confirm `saved_jobs` appears with columns: `id`, `user_id`, `job_id`, `created_at`. Confirm RLS is enabled (the shield icon is active).

---

### Task 2: Create `lib/savedJobs.ts`

**Files:**
- Create: `lib/savedJobs.ts`

All Supabase `saved_jobs` operations live here. Follows the same pattern as `lib/auth.ts` — imports `supabase` from `@/app/lib/supabase`, re-exports the `DBJobListing` shape.

- [ ] **Step 1: Create the file**

```typescript
// lib/savedJobs.ts
import { supabase } from "@/app/lib/supabase";
import type { DBJobListing } from "@/app/lib/supabase";

export async function saveJob(jobId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };
  return supabase.from("saved_jobs").insert({ job_id: jobId, user_id: user.id });
}

export async function unsaveJob(jobId: string) {
  return supabase.from("saved_jobs").delete().eq("job_id", jobId);
}

export async function isJobSaved(jobId: string): Promise<boolean> {
  const { data } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();
  return !!data;
}

export async function getSavedJobs(): Promise<DBJobListing[]> {
  const { data: savedRows } = await supabase
    .from("saved_jobs")
    .select("job_id");

  const jobIds = (savedRows ?? []).map((r: { job_id: string }) => r.job_id);
  if (jobIds.length === 0) return [];

  const { data } = await supabase
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
    `)
    .in("id", jobIds);

  return (data ?? []) as unknown as DBJobListing[];
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/savedJobs.ts
git commit -m "feat: add lib/savedJobs.ts with saveJob, unsaveJob, isJobSaved, getSavedJobs"
```

---

### Task 3: Update `app/components/bookmark-button.tsx`

**Files:**
- Modify: `app/components/bookmark-button.tsx`

Replace the local-only toggle with a DB-backed one. On mount: check `isJobSaved`. On click: if not logged in, redirect to `/auth`; otherwise optimistic toggle + DB write with rollback on error.

- [ ] **Step 1: Replace the entire file contents**

```tsx
// app/components/bookmark-button.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/savedJobs";

export default function BookmarkButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isJobSaved(jobId).then((result) => {
      if (!cancelled) setSaved(result);
    });
    return () => { cancelled = true; };
  }, [jobId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const user = await getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    const prev = saved;
    setSaved(!prev); // optimistic
    const { error } = prev ? await unsaveJob(jobId) : await saveJob(jobId);
    if (error) setSaved(prev); // rollback on failure
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? "Remove bookmark" : "Save job"}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
        saved
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-gray-200 bg-white text-gray-400 hover:border-emerald-200 hover:text-emerald-600"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.75}
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/bookmark-button.tsx
git commit -m "feat: wire BookmarkButton to Supabase saved_jobs with optimistic toggle"
```

---

### Task 4: Update `app/account/page.tsx`

**Files:**
- Modify: `app/account/page.tsx`

Add `savedJobs` state. After `getUser()` resolves with a valid user, call `getSavedJobs()`. Render compact job cards when jobs exist, or keep the existing empty state UI when none.

- [ ] **Step 1: Replace the entire file contents**

```tsx
// app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Navbar from "../components/navbar";
import { getUser, signOut } from "@/lib/auth";
import { getSavedJobs } from "@/lib/savedJobs";
import type { DBJobListing } from "@/app/lib/supabase";
import { formatSalary } from "@/app/lib/supabase";

function resolveTrust(raw: DBJobListing["trusts"]) {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function SavedJobCard({ job }: { job: DBJobListing }) {
  const trust = resolveTrust(job.trusts);
  const salary = formatSalary(job.salary_min, job.salary_max);
  const closing = job.closes_at
    ? new Date(job.closes_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-5 py-4 ring-1 ring-gray-100 hover:ring-emerald-200 hover:bg-white transition-all"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
          {job.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {trust?.name ?? "NHS Trust"}
          {salary ? ` · ${salary}` : ""}
        </p>
      </div>
      {closing && (
        <span className="flex-shrink-0 text-xs text-gray-400">
          Closes {closing}
        </span>
      )}
    </Link>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [savedJobs, setSavedJobs] = useState<DBJobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUser().then(async (u) => {
      if (cancelled) return;
      if (!u) {
        setLoading(false);
        router.push("/auth");
        return;
      }
      const jobs = await getSavedJobs();
      if (cancelled) return;
      setUser(u);
      setSavedJobs(jobs);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [router]);

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // sign-out failed; redirect anyway to clear local state
    }
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Profile section */}
        <div className="mb-8 rounded-2xl bg-white p-8 ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My account</h1>
              <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-lg font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-6">
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Saved jobs */}
        <div className="rounded-2xl bg-white p-8 ring-1 ring-gray-200">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Saved jobs</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {savedJobs.length > 0
                  ? `${savedJobs.length} saved ${savedJobs.length === 1 ? "role" : "roles"}`
                  : "Jobs you\u2019ve bookmarked will appear here."}
              </p>
            </div>
            {savedJobs.length > 0 && (
              <Link
                href="/jobs"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Browse more →
              </Link>
            )}
          </div>

          {savedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-12 text-center ring-1 ring-gray-100">
              <svg
                className="mb-3 h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.25}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-400">No saved jobs yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Bookmark roles from the{" "}
                <Link href="/jobs" className="text-emerald-600 hover:underline">
                  jobs board
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedJobs.map((job) => (
                <SavedJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/account/page.tsx
git commit -m "feat: display saved jobs on account page"
```

---

### Task 5: Smoke test

No automated test framework is set up. Verify manually with the dev server already running on `http://localhost:3000`.

- [ ] **Step 1: Bookmark while logged out**

1. Sign out (or open incognito)
2. Go to `/jobs`, click any bookmark button
3. Expected: redirect to `/auth`

- [ ] **Step 2: Bookmark while logged in**

1. Sign in at `/auth`
2. Go to `/jobs`, click a bookmark button on any job card
3. Expected: button turns emerald (filled) immediately (optimistic)
4. Refresh the page — button should still be filled (persisted to DB)

- [ ] **Step 3: Check account page**

1. Go to `/account`
2. Expected: saved job appears in the list with title, trust, closing date
3. Click the job card — expected: navigates to `/jobs/[id]`

- [ ] **Step 4: Unsave a job**

1. On `/jobs`, click the filled bookmark button
2. Expected: button reverts to unfilled immediately
3. Go to `/account` — expected: job is gone from the list

- [ ] **Step 5: Check job detail page**

1. Go to `/jobs/[any-id]`
2. Click bookmark in the header
3. Verify same behaviour as above

- [ ] **Step 6: Push to GitHub**

```bash
git push origin master
```

---

## Self-Review Against Spec

| Spec requirement | Covered by |
|-----------------|-----------|
| `saved_jobs` table with RLS | Task 1 |
| `saveJob(jobId)` | Task 2 |
| `unsaveJob(jobId)` | Task 2 |
| `isJobSaved(jobId)` | Task 2 |
| `getSavedJobs()` returns `DBJobListing[]` | Task 2 |
| BookmarkButton hydrates state on mount | Task 3 (useEffect + isJobSaved) |
| Click when not logged in → redirect `/auth` | Task 3 (getUser check) |
| Optimistic toggle with rollback on error | Task 3 |
| Account page shows saved jobs or empty state | Task 4 |
| Saved job card: title, trust, closing date, link | Task 4 (SavedJobCard) |
| No new packages | All tasks |
| Follows `lib/auth.ts` encapsulation pattern | Task 2 (lib/savedJobs.ts) |

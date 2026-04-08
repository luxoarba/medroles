# Saved Jobs Implementation — Design Spec

**Date:** 2026-04-08  
**Status:** Approved

---

## Overview

Persist job bookmarks to Supabase, tied to the authenticated user. The existing `BookmarkButton` UI is already in place on both the jobs list and job detail pages — this feature wires it up to the database and populates the account page saved jobs section.

---

## Database

### Table: `saved_jobs`

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

- `job_id` references `job_listings.id` (text, not a FK so deleted jobs don't cascade-delete saves)
- Unique constraint on `(user_id, job_id)` prevents duplicates
- RLS ensures users can only read/write their own rows

---

## Files

### New: `lib/savedJobs.ts`

Four functions. All require an authenticated Supabase session — callers are responsible for gating on auth state.

```ts
saveJob(jobId: string)    → Promise<{ error }>
unsaveJob(jobId: string)  → Promise<{ error }>
isJobSaved(jobId: string) → Promise<boolean>
getSavedJobs()            → Promise<DBJobListing[]>
```

`getSavedJobs` joins `saved_jobs` with `job_listings` via a Supabase select query and returns the full job listing shape (reusing `DBJobListing` from `app/lib/supabase.ts`).

---

### Modified: `app/components/bookmark-button.tsx`

- Add `initialSaved?: boolean` prop (default `false`) for SSR-compatible hydration hint (unused for now but forwards-compatible)
- On mount: call `isJobSaved(jobId)` — set button state, set `checkingRef` to false
- On click (not logged in): `router.push('/auth')`
- On click (logged in): optimistic toggle immediately, then call `saveJob`/`unsaveJob`; rollback on error
- Needs `getUser` from `@/lib/auth` to detect login state

---

### Modified: `app/account/page.tsx`

- Import `getSavedJobs` from `@/lib/savedJobs`
- Add `savedJobs` state alongside existing `user` state
- After `getUser()` resolves with a user, call `getSavedJobs()`
- Replace the empty-state section with:
  - If `savedJobs.length === 0`: existing empty state UI
  - If `savedJobs.length > 0`: list of compact job cards (title, trust name, closing date, link to `/jobs/[id]`)

---

## Data Flow

```
BookmarkButton mounts
  → isJobSaved(jobId) → sets filled/unfilled state

User clicks bookmark (logged out)
  → router.push('/auth')

User clicks bookmark (logged in, not saved)
  → optimistic: setSaved(true)
  → saveJob(jobId)
  → on error: setSaved(false) + show nothing (silent — no toast yet)

User clicks bookmark (logged in, saved)
  → optimistic: setSaved(false)
  → unsaveJob(jobId)
  → on error: setSaved(true)

Account page mounts
  → getUser() → if null, redirect to /auth
  → getSavedJobs() → renders job cards or empty state
```

---

## Constraints

- No new packages
- `lib/savedJobs.ts` at root (consistent with `lib/auth.ts`)
- `getSavedJobs` reuses `DBJobListing` type — no new types needed
- Silent error on bookmark toggle (no toast infrastructure yet)
- No loading spinner on bookmark button toggle (optimistic is instant)

---

## Out of Scope

- Toast notifications on save/unsave
- Saved jobs count badge on navbar
- Sorting/filtering saved jobs
- Offline/localStorage fallback

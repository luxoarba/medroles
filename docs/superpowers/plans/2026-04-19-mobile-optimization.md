# Mobile Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the jobs list and job detail pages usable on mobile phones via a hamburger nav drawer, two-row jobs toolbar, and a sticky apply bar.

**Architecture:** Three self-contained UI changes — a new `MobileNavDrawer` client component slotted into the existing server `Navbar`, a JSX restructure of the jobs page toolbar using responsive Tailwind classes, and a sticky bar added directly to the job detail page. No new routes, no API changes.

**Tech Stack:** Next.js 16.2.2 App Router, Tailwind CSS v4, TypeScript

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Create | `app/components/mobile-nav-drawer.tsx` | New client component: hamburger button + slide-in drawer |
| Modify | `app/components/navbar.tsx` | Import and render `MobileNavDrawer` |
| Modify | `app/jobs/page.tsx` | Restructure toolbar into two rows on mobile |
| Modify | `app/jobs/[id]/page.tsx` | Add sticky apply bar, add bottom padding to content |

---

## Task 1: MobileNavDrawer component

**Files:**
- Create: `app/components/mobile-nav-drawer.tsx`

- [ ] **Step 1: Create the component**

Create `app/components/mobile-nav-drawer.tsx` with the following content:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { href: "/jobs", label: "Browse Jobs" },
    { href: "/trusts", label: "Trusts" },
    { href: "/reviews", label: "Reviews" },
    { href: "/interview-intel", label: "Interview Intel" },
  ];

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors sm:hidden"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer panel */}
          <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-gray-900">
                  Med<span className="text-emerald-600">Roles</span>
                </span>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === href || pathname.startsWith(href + "/")
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Auth link at bottom */}
            <div className="border-t border-gray-100 px-3 py-4">
              <Link
                href="/auth"
                className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign in / My account
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/zohei/medroles && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing ones unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add app/components/mobile-nav-drawer.tsx
git commit -m "feat: add MobileNavDrawer client component"
```

---

## Task 2: Wire MobileNavDrawer into Navbar

**Files:**
- Modify: `app/components/navbar.tsx`

- [ ] **Step 1: Add the import and render the component**

The current navbar ends with `<NavbarAuth />` inside a `<div className="flex items-center gap-2">`. Add `MobileNavDrawer` after `NavbarAuth`:

```tsx
import Link from "next/link";
import NavbarAuth from "./navbar-auth";
import MobileNavDrawer from "./mobile-nav-drawer";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 shadow-sm group-hover:bg-emerald-700 transition-colors">
            <span className="h-3 w-3 rounded-full bg-white/90" />
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-300 opacity-60" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-gray-900">
            Med<span className="text-emerald-600">Roles</span>
          </span>
        </Link>

        {/* Nav links — desktop only */}
        <div className="hidden items-center gap-1 sm:flex">
          <Link href="/jobs" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Browse Jobs
          </Link>
          <Link href="/trusts" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Trusts
          </Link>
          <Link href="/reviews" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Reviews
          </Link>
          <Link href="/interview-intel" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Interview Intel
          </Link>
        </div>

        {/* Right side: auth + mobile hamburger */}
        <div className="flex items-center gap-2">
          <NavbarAuth />
          <MobileNavDrawer />
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/zohei/medroles && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Visual check**

```bash
cd /c/Users/zohei/medroles && npm run dev 2>&1 &
```

Open `http://localhost:3000` and resize browser to < 640px width. Confirm:
- Hamburger `☰` button visible top-right
- Desktop nav links hidden
- Tapping hamburger opens drawer from right
- All 4 nav links visible in drawer
- Tapping backdrop or ✕ closes drawer
- Tapping a link closes drawer and navigates

- [ ] **Step 4: Commit**

```bash
git add app/components/navbar.tsx
git commit -m "feat: wire MobileNavDrawer into Navbar"
```

---

## Task 3: Jobs page — two-row mobile toolbar

**Files:**
- Modify: `app/jobs/page.tsx` (lines ~326–354, the page header div)

- [ ] **Step 1: Restructure the page header JSX**

Find the section starting with `{/* Page header */}` and replace it entirely:

```tsx
{/* Page header */}
<div className="mb-8">
  {/* Row 1: title + mobile controls / desktop all-controls */}
  <div className="flex items-start justify-between gap-3 sm:items-center">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">NHS Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">
        Showing{" "}
        <span className="font-semibold text-emerald-600">{jobs.length}</span>{" "}
        live {jobs.length === 1 ? "role" : "roles"}
        {(activeFilterCount > 0 || searchValue) && (
          <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {activeFilterCount + (searchValue ? 1 : 0)} filter{activeFilterCount + (searchValue ? 1 : 0) !== 1 ? "s" : ""} active
          </span>
        )}
      </p>
    </div>

    {/* Mobile: Filters + Sort only */}
    <div className="flex items-center gap-2 sm:hidden">
      <Suspense fallback={null}>
        <MobileFilterDrawer />
      </Suspense>
      <Suspense fallback={<div className="rounded-xl bg-white px-4 py-2.5 text-sm text-gray-300 ring-1 ring-gray-200">Sort…</div>}>
        <SortSelect />
      </Suspense>
    </div>

    {/* Desktop: all controls in one row */}
    <div className="hidden items-center gap-2 sm:flex">
      <Suspense fallback={null}>
        <MobileFilterDrawer />
      </Suspense>
      <RefreshButton />
      <Suspense fallback={<div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-300 ring-1 ring-gray-200 w-52" />}>
        <SearchInput />
      </Suspense>
      <Suspense fallback={<div className="rounded-xl bg-white px-4 py-2.5 text-sm text-gray-300 ring-1 ring-gray-200">Sort…</div>}>
        <SortSelect />
      </Suspense>
    </div>
  </div>

  {/* Row 2: full-width search — mobile only */}
  <div className="mt-3 sm:hidden">
    <Suspense fallback={<div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-300 ring-1 ring-gray-200 w-full" />}>
      <SearchInput />
    </Suspense>
  </div>
</div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/zohei/medroles && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Visual check**

Open `http://localhost:3000/jobs` at < 640px width. Confirm:
- Row 1: title/count left, Filters + Sort right
- Row 2: full-width search input below
- Refresh button not visible on mobile
- At ≥ 640px: single row with all four controls (Filters, Refresh, Search, Sort)

- [ ] **Step 4: Commit**

```bash
git add app/jobs/page.tsx
git commit -m "feat: two-row mobile toolbar on jobs list page"
```

---

## Task 4: Job detail — sticky apply bar

**Files:**
- Modify: `app/jobs/[id]/page.tsx`

- [ ] **Step 1: Add bottom padding to main content wrapper on mobile**

Find the outermost content div (around line 140 after the navbar, something like `<div className="mx-auto max-w-7xl px-6 py-8">`). Add `pb-24 lg:pb-0` so the sticky bar doesn't obscure the last content:

```tsx
<div className="mx-auto max-w-7xl px-6 py-8 pb-24 lg:pb-0">
```

- [ ] **Step 2: Add the sticky apply bar**

Directly before the closing `</div>` of the outermost page wrapper (the `min-h-screen bg-gray-50` div), add:

```tsx
{/* Sticky apply bar — mobile only */}
{job.external_url && (
  <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-lg lg:hidden"
    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
  >
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{job.title}</p>
        {trust?.name && (
          <p className="truncate text-xs text-gray-500">{trust.name}</p>
        )}
      </div>
      <a
        href={job.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
      >
        Apply
      </a>
    </div>
  </div>
)}
```

- [ ] **Step 3: Hide the sidebar apply card on mobile**

Find the sidebar apply card div (the one containing the "Apply on {job.source}" button). It's inside `<aside className="w-full lg:w-72 xl:w-80">`. The aside already stacks on mobile but the apply button is visible. Add `hidden lg:block` to just the apply card div:

```tsx
{/* Apply card — hidden on mobile (sticky bar used instead) */}
<div className="hidden lg:block rounded-2xl bg-white p-6 ring-1 ring-gray-200">
```

Leave the trust rating and interview intel cards visible on mobile as they are useful context.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /c/Users/zohei/medroles && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Visual check**

Open `http://localhost:3000/jobs` → tap any job → view at < 1024px width. Confirm:
- Sticky white bar visible at bottom with job title, trust name, and Apply button
- Bar stays fixed while scrolling through job description
- At ≥ 1024px (lg): sticky bar hidden, sidebar apply card visible as normal
- No content hidden behind the bar at bottom of page

- [ ] **Step 6: Commit**

```bash
git add app/jobs/\[id\]/page.tsx
git commit -m "feat: sticky apply bar on job detail page for mobile"
```

---

## Task 5: Deploy

- [ ] **Step 1: Deploy to production**

```bash
cd /c/Users/zohei/medroles && npx vercel --prod --yes 2>&1 | tail -8
```

Expected: `● Ready` state, aliased to `https://www.medroles.co.uk`.

- [ ] **Step 2: Smoke test on a real phone**

On an actual mobile device, visit `https://www.medroles.co.uk` and verify:
- Hamburger visible in navbar, opens drawer with all nav links
- `/jobs`: two-row toolbar, search full-width on its own row
- `/jobs/[any-id]`: sticky apply bar pinned to bottom, doesn't cover content

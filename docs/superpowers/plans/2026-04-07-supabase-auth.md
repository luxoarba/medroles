# Supabase Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password authentication to MedRoles using the existing Supabase client, with a sign-up/log-in page, auth-aware navbar, and account page.

**Architecture:** Client-side auth only via `@supabase/supabase-js` v2. A thin `lib/auth.ts` module wraps `supabase.auth.*` functions. The navbar stays a server component but gains a `NavbarAuth` client sub-component that subscribes to `onAuthStateChange`. Auth and account pages are `'use client'` components.

**Tech Stack:** Next.js 16.2.2 (App Router), React 19, `@supabase/supabase-js` v2, Tailwind CSS v4, TypeScript

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/auth.ts` | Thin wrappers: `signUp`, `signIn`, `signOut`, `getUser` |
| Create | `app/auth/page.tsx` | Sign-up / log-in form page |
| Modify | `app/components/navbar.tsx` | Add `NavbarAuth` client component for auth state |
| Create | `app/account/page.tsx` | Account page: email, saved-jobs empty state, sign-out |

---

### Task 1: Create `lib/auth.ts`

**Files:**
- Create: `lib/auth.ts`

This module is the only place in the codebase that calls `supabase.auth.*`. All other files import from here.

- [ ] **Step 1: Create the file**

```typescript
// lib/auth.ts
import { supabase } from "@/app/lib/supabase";

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
cd /c/Users/zohei/medroles && npx tsc --noEmit
```

Expected: no errors related to `lib/auth.ts`. (Ignore any pre-existing errors in other files.)

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add lib/auth.ts with signUp, signIn, signOut, getUser"
```

---

### Task 2: Create `app/auth/page.tsx`

**Files:**
- Create: `app/auth/page.tsx`

A `'use client'` page with a controlled form. Toggles between sign-up and log-in mode via local state. Calls `signIn`/`signUp` on submit, redirects to `/jobs` on success, shows error inline on failure.

- [ ] **Step 1: Create the file**

```tsx
// app/auth/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } =
      mode === "signup"
        ? await signUp(email, password)
        : await signIn(email, password);

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/jobs");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 shadow-sm">
              <span className="h-3 w-3 rounded-full bg-white/90" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-gray-900">
              Med<span className="text-emerald-600">Roles</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "login"
              ? "Sign in to your MedRoles account"
              : "Join thousands of NHS doctors"}
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nhs.net"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Use your NHS email for verified reviews
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-5 text-center text-sm text-gray-500">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError(null); }}
                  className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
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

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/auth/page.tsx
git commit -m "feat: add auth page with sign-up/log-in form"
```

---

### Task 3: Update `app/components/navbar.tsx`

**Files:**
- Modify: `app/components/navbar.tsx`

Add a `NavbarAuth` client component at the top of the file (before the `Navbar` server component). `NavbarAuth` reads session state on mount and subscribes to `onAuthStateChange`. Replace the existing static "Sign in" link and "Post a role" button area with `<NavbarAuth />`.

- [ ] **Step 1: Add the `NavbarAuth` client component and update the file**

Replace the entire contents of `app/components/navbar.tsx` with:

```tsx
// app/components/navbar.tsx
"use client" is only for NavbarAuth — Navbar itself stays importable as a server component.
// We use a module-level "use client" only on NavbarAuth via a separate inline component.
// In Next.js App Router, a file with "use client" at the top makes ALL exports client components.
// To keep Navbar as a server component, we split NavbarAuth into its own file.
```

**Important:** Because `'use client'` at the top of a file marks ALL exports as client components, `NavbarAuth` must live in its own file. Split as follows:

- [ ] **Step 1 (revised): Create `app/components/navbar-auth.tsx`**

```tsx
// app/components/navbar-auth.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";
import { signOut } from "@/lib/auth";

export default function NavbarAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  if (loading) {
    // Render same width as sign-in link to avoid layout shift
    return <span className="hidden sm:block w-16 h-5" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[160px] truncate text-sm text-gray-500 sm:block">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors sm:block px-3 py-2"
    >
      Sign in
    </Link>
  );
}
```

- [ ] **Step 2: Update `app/components/navbar.tsx` to use `NavbarAuth`**

Replace the entire contents of `app/components/navbar.tsx` with:

```tsx
// app/components/navbar.tsx
import Link from "next/link";
import NavbarAuth from "./navbar-auth";

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

        {/* Nav links */}
        <div className="hidden items-center gap-1 sm:flex">
          <Link
            href="/jobs"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Browse Jobs
          </Link>
          <Link
            href="#"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Trusts
          </Link>
          <Link
            href="#"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Reviews
          </Link>
          <Link
            href="#"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Interview Intel
          </Link>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <NavbarAuth />
          <Link
            href="#"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Post a role
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/navbar-auth.tsx app/components/navbar.tsx
git commit -m "feat: add NavbarAuth client component with sign-in/out state"
```

---

### Task 4: Create `app/account/page.tsx`

**Files:**
- Create: `app/account/page.tsx`

A `'use client'` page. On mount, calls `getUser()`. If no user, redirects to `/auth`. Shows user email, a saved-jobs empty state, and a sign-out button.

- [ ] **Step 1: Create the file**

```tsx
// app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Navbar from "../components/navbar";
import { getUser, signOut } from "@/lib/auth";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then((u) => {
      if (!u) {
        router.push("/auth");
        return;
      }
      setUser(u);
      setLoading(false);
    });
  }, [router]);

  async function handleSignOut() {
    await signOut();
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
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            Saved jobs
          </h2>
          <p className="mb-8 text-sm text-gray-500">
            Jobs you&apos;ve bookmarked will appear here.
          </p>
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
              <a href="/jobs" className="text-emerald-600 hover:underline">
                jobs board
              </a>
            </p>
          </div>
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

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/account/page.tsx
git commit -m "feat: add account page with profile, saved jobs empty state, sign-out"
```

---

### Task 5: Smoke test in the browser

No automated test framework is set up. Verify manually with `next dev`.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Sign-up flow**

1. Navigate to `http://localhost:3000/auth`
2. Toggle to "Sign up" mode
3. Enter an email and password (6+ characters)
4. Submit — expect redirect to `/jobs`
5. Confirm navbar shows the email address and a "Sign out" button

- [ ] **Step 3: Sign-out from navbar**

1. Click "Sign out" in the navbar
2. Confirm navbar reverts to "Sign in" link

- [ ] **Step 4: Sign-in flow**

1. Navigate to `/auth`
2. Use the same email/password
3. Submit — expect redirect to `/jobs`
4. Confirm navbar shows email

- [ ] **Step 5: Account page**

1. While signed in, navigate to `http://localhost:3000/account`
2. Confirm email is displayed
3. Confirm "Saved jobs" empty state is visible
4. Click "Sign out" — expect redirect to `/`
5. Navigate back to `/account` while signed out — expect redirect to `/auth`

- [ ] **Step 6: Error state**

1. Navigate to `/auth` (login mode)
2. Enter wrong password
3. Submit — expect inline error message below the form

- [ ] **Step 7: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: address smoke test findings"
```

---

## Self-Review Against Spec

| Spec requirement | Covered by |
|-----------------|-----------|
| `app/auth/page.tsx` with email + password fields | Task 2 |
| Toggle between sign-up and log-in mode | Task 2 (mode state) |
| NHS email note | Task 2 (below email input) |
| Emerald green submit button | Task 2 (bg-emerald-600) |
| Redirect to /jobs on success | Task 2 (router.push) |
| Navbar: "Sign in" when logged out | Task 3 (NavbarAuth) |
| Navbar: email + Sign out when logged in | Task 3 (NavbarAuth) |
| `lib/auth.ts` with signUp, signIn, signOut, getUser | Task 1 |
| `app/account/page.tsx` with email | Task 4 |
| Saved jobs empty state | Task 4 |
| Account sign-out button | Task 4 |
| Use existing Supabase client | All tasks import from `@/app/lib/supabase` |

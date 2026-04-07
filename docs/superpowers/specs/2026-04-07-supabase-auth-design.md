# Supabase Auth for MedRoles — Design Spec

**Date:** 2026-04-07  
**Status:** Approved

---

## Overview

Add user authentication to MedRoles using the existing `@supabase/supabase-js` v2 client. No new packages required. Auth is client-side only — sessions are stored in localStorage by Supabase and reflected in the UI via `onAuthStateChange`.

---

## Files

### New: `lib/auth.ts`

Thin wrappers around `supabase.auth.*`. Imports the existing client from `app/lib/supabase.ts`.

```ts
signUp(email, password)  → Promise<{ error }>
signIn(email, password)  → Promise<{ error }>
signOut()                → Promise<void>
getUser()                → Promise<User | null>
```

All four functions re-export the Supabase response shape where relevant. No business logic here — just a stable internal API so call sites don't import `supabase` directly for auth.

---

### New: `app/auth/page.tsx`

`'use client'` page.

- Local `useState` toggles between `'login'` and `'signup'` mode
- Controlled inputs for email and password
- On submit: calls `signIn` or `signUp` from `lib/auth.ts`
- On success: `router.push('/jobs')`
- On error: shows inline error message below the form
- Note below email field: _"Use your NHS email for verified reviews"_
- Submit button: emerald-600 background, full width, matches site design system
- Toggle link: _"Don't have an account? Sign up"_ / _"Already have an account? Sign in"_

---

### Modified: `app/components/navbar.tsx`

A new `NavbarAuth` client component is extracted within the same file. The outer `Navbar` function remains a server component.

`NavbarAuth` behaviour:
- On mount: calls `supabase.auth.getSession()` to hydrate initial state
- Subscribes to `supabase.auth.onAuthStateChange` to stay in sync across tabs/navigations
- Cleans up the subscription on unmount
- **Logged out:** renders the existing "Sign in" `<Link href="/auth">` 
- **Logged in:** renders user email (truncated) and a "Sign out" button that calls `signOut()` then calls `router.refresh()` to re-render server components

---

### New: `app/account/page.tsx`

`'use client'` page.

- On mount: calls `getUser()` from `lib/auth.ts`
- If no user (not logged in): redirects to `/auth`
- Shows: user email in a profile section
- Shows: "Saved jobs" section with empty state (_"No saved jobs yet"_)
- Shows: "Sign out" button — calls `signOut()` then `router.push('/')`

---

## Data Flow

```
User submits auth form
  → signIn / signUp called
  → Supabase stores session in localStorage
  → router.push('/jobs')
  → onAuthStateChange fires in NavbarAuth
  → NavbarAuth re-renders with user email + Sign out button
```

```
User clicks Sign out (navbar or account page)
  → signOut() clears Supabase session
  → onAuthStateChange fires → NavbarAuth shows Sign in
  → router.push('/') or router.refresh()
```

---

## Constraints

- No new npm packages
- Use existing client from `app/lib/supabase.ts`
- `lib/auth.ts` at project root (resolves as `@/lib/auth.ts` via tsconfig)
- Do not add email confirmation logic — Supabase handles that on its end
- No middleware or route protection in scope

---

## Out of Scope

- Saved jobs persistence (DB schema changes)
- Email confirmation flow
- Password reset
- Route-level auth guards / middleware
- Social login

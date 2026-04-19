# Mobile Optimization — Design Spec
**Date**: 2026-04-19  
**Priority pages**: Jobs list (highest), Job detail

---

## Overview

Three focused changes to make MedRoles usable on mobile. All changes are mobile-only — desktop layout is untouched.

---

## 1. Hamburger Nav (`components/navbar.tsx`)

**Problem**: Nav links are `hidden sm:flex`, so on mobile only the logo is visible. No way to navigate to Trusts, Reviews, Interview Intel, or sign in.

**Solution**: Add a hamburger button (`☰`) on the right side of the navbar, visible only below `sm`. Tapping it opens a slide-in drawer from the right.

**Behaviour**:
- Button: `sm:hidden`, positioned on the right of the navbar alongside the existing `NavbarAuth`
- Drawer: fixed overlay, slides in from the right, covers ~75% of screen width
- Backdrop: semi-transparent dark overlay; tapping it closes the drawer
- Drawer contents: MedRoles logo, then nav links as large tap targets (min 44px height): Browse Jobs, Trusts, Reviews, Interview Intel, Sign in / My jobs / Sign out
- Closing: tap backdrop, tap a link, or tap `✕` button in drawer header
- Body scroll locked while drawer is open

**Files**: `app/components/navbar.tsx` (convert to client component), new `app/components/mobile-nav-drawer.tsx`

---

## 2. Jobs List Toolbar — Two Rows (`jobs/page.tsx`)

**Problem**: Filters + Refresh + Search + Sort in one flex row is severely cramped on mobile (~375px).

**Solution**: On mobile, split into two rows. On `sm+`, keep single row as-is.

**Mobile layout**:
- Row 1 (within the existing page header flex): Filters button (left) + Sort dropdown (right). Refresh button hidden (`hidden sm:flex` or similar — it's an admin/debug tool not needed by end users).
- Row 2: Full-width `SearchInput` spanning the entire content width, below the title+count and above the job cards.

**Desktop layout**: Unchanged — single row with all controls.

**Files**: `app/jobs/page.tsx` (restructure toolbar JSX with responsive classes)

---

## 3. Sticky Apply Bar (`jobs/[id]/page.tsx`)

**Problem**: The apply button lives in the right sidebar which stacks below the full job description on mobile, burying it.

**Solution**: A fixed bar pinned to `bottom-0` on mobile containing the job title, trust name, and Apply button. Hidden on `lg+` where the sidebar card takes over.

**Behaviour**:
- Fixed: `fixed bottom-0 left-0 right-0 z-40 lg:hidden`
- Safe area: `pb-safe` or `padding-bottom: env(safe-area-inset-bottom)` for iPhone home bar
- Contents (left to right): job title (truncated, ~60% width) + trust name below it in small grey text · Apply button (emerald, links to `job.external_url`)
- Background: white with top border and subtle shadow
- Existing sidebar apply card: hidden on mobile (`hidden lg:block` on the aside, or just the apply card itself)
- Body needs bottom padding on mobile so last content isn't hidden behind the bar: `pb-24 lg:pb-0` on the main content area

**Files**: `app/jobs/[id]/page.tsx`

---

## Out of scope

- Bottom tab bar (rejected in favour of hamburger)
- Redesigning job cards
- Mobile filter drawer (already exists and works)
- Home page changes

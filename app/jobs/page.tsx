import type { Metadata } from "next";
import Link from "next/link";
import AlertSignup from "../components/alert-signup";
import { Suspense } from "react";
import Navbar from "../components/navbar";
import BookmarkButton from "../components/bookmark-button";

import AutoScrape from "../components/auto-scrape";
import SortSelect from "../components/sort-select";
import SearchInput from "../components/search-input";
import MobileFilterDrawer from "../components/mobile-filter-drawer";
import { supabase, formatSalary, type DBJobListing } from "../lib/supabase";
import { DEANERY_REGIONS } from "../lib/jobs";
import FilterSidebar from "../components/filter-sidebar";

export const metadata: Metadata = {
  title: "NHS Doctor Jobs",
  description: "Browse NHS consultant, registrar, clinical fellow and GP jobs across the UK. Filter by specialty, grade, region and trust.",
  openGraph: {
    title: "NHS Doctor Jobs — MedRoles",
    description: "Browse NHS consultant, registrar, clinical fellow and GP jobs across the UK.",
    url: "https://www.medroles.co.uk/jobs",
  },
};

const PAGE_SIZE = 50;

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

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          viewBox="0 0 20 20"
          fill={s <= Math.round(rating) ? "#059669" : "none"}
          stroke={s <= Math.round(rating) ? "#059669" : "#d1d5db"}
          className="h-3.5 w-3.5"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-medium text-gray-500">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function daysUntil(dateStr: string) {
  // Compare date strings only — avoids UTC-midnight vs local-time drift
  const todayMs = new Date(new Date().toISOString().slice(0, 10)).getTime();
  const closingMs = new Date(dateStr).getTime();
  return Math.round((closingMs - todayMs) / (1000 * 60 * 60 * 24));
}

function resolveTrust(raw: DBJobListing["trusts"]) {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function JobCard({ job }: { job: DBJobListing }) {
  const trust = resolveTrust(job.trusts);
  const rating = trust?.avg_rating ?? null;
  const salary = formatSalary(job.salary_min, job.salary_max);
  const days = job.closes_at ? daysUntil(job.closes_at) : null;
  const closing = job.closes_at
    ? new Date(job.closes_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const grade = job.grade ?? "";
  // Capitalise contract_type values that come lowercase from DB (e.g. "permanent")
  const contractLabel = job.contract_type
    ? job.contract_type.charAt(0).toUpperCase() + job.contract_type.slice(1)
    : null;

  return (
    <div className="group relative min-w-0 rounded-xl bg-white p-4 ring-1 ring-gray-200 hover:ring-emerald-300 hover:shadow-md transition-all duration-150 sm:rounded-2xl sm:p-6">
      <Link href={`/jobs/${job.id}`} className="absolute inset-0 rounded-2xl" aria-label={job.title} />
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-3 sm:mb-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
            {job.title}
          </h2>
          {job.trust_id ? (
            <Link
              href={`/trusts/${job.trust_id}`}
              className="relative z-10 mt-0.5 block truncate text-sm text-gray-500 hover:text-emerald-600 hover:underline"
            >
              {trust?.name ?? "NHS Trust"}
            </Link>
          ) : (
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {trust?.name ?? "NHS Trust"}
            </p>
          )}
        </div>
        <div className="relative z-10">
          <BookmarkButton jobId={job.id} />
        </div>
      </div>

      {/* Tags */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {grade && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${
              GRADE_COLOURS[grade] ?? "bg-gray-50 text-gray-600 ring-gray-200"
            }`}
          >
            {grade}
          </span>
        )}
        {job.specialty && (
          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
            {job.specialty}
          </span>
        )}
        {contractLabel && (
          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
            {contractLabel}
          </span>
        )}
        {job.training_post && (
          <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
            Training post
          </span>
        )}
        {job.on_call && (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
            On-call
          </span>
        )}
      </div>

      {/* Meta — region always shown; salary + rating hidden on mobile */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
        {job.region && (
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {job.region}
          </span>
        )}
        {salary && (
          <span className="hidden items-center gap-1 sm:flex">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
            </svg>
            {salary}
          </span>
        )}
        {rating !== null && <span className="hidden sm:block"><StarRating rating={rating} /></span>}
      </div>

      {/* Footer */}
      {(closing !== null || days === null) && (
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 sm:mt-4 sm:pt-4">
          <span
            className={`text-xs font-medium ${
              days !== null && days <= 7
                ? "text-red-600"
                : days !== null && days <= 14
                  ? "text-amber-600"
                  : "text-gray-400"
            }`}
          >
            {days !== null && days <= 7 ? "⚠ " : ""}
            {days === null ? "Closing date TBC" : days === 0 ? "Closes today" : `Closes ${closing}`}
            {days !== null && days > 0 ? ` · ${days}d left` : days !== null && days < 0 ? " · Closed" : ""}
          </span>
          {job.source && (
            <span className="hidden text-xs text-gray-400 sm:block">{job.source}</span>
          )}
        </div>
      )}
    </div>
  );
}

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function relativeTime(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function fetchLastUpdated(): Promise<string | null> {
  const { data } = await supabase
    .from("job_listings")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  return data?.updated_at ?? null;
}

async function fetchJobs(
  sort: string,
  filters: {
    specialty: string[];
    grade: string[];
    deanery: string[];
    search: string;
  },
  page: number,
): Promise<{ jobs: DBJobListing[]; total: number }> {
  let query = supabase
    .from("job_listings")
    .select(`
      id,
      trust_id,
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
        type,
        cqc_overall
      )
    `)
    // Only show jobs that close today or later
    .or(`closes_at.gte.${new Date().toISOString().slice(0, 10)},closes_at.is.null`);

  if (filters.specialty.length > 0) query = query.in("specialty", filters.specialty);
  if (filters.grade.length > 0) query = query.in("grade", filters.grade);
  if (filters.deanery.length > 0) {
    const cities = filters.deanery.flatMap((d) => DEANERY_REGIONS[d] ?? []);
    if (cities.length > 0) {
      query = query.or(cities.map((c) => `region.ilike.%${c}%`).join(","));
    }
  }

  if (filters.search) {
    // Find trust IDs whose name matches, then OR against title
    const { data: matchingTrusts } = await supabase
      .from("trusts")
      .select("id")
      .ilike("name", `%${filters.search}%`);
    const trustIds = (matchingTrusts ?? []).map((t: { id: string }) => t.id);
    if (trustIds.length > 0) {
      query = query.or(
        `title.ilike.%${filters.search}%,trust_id.in.(${trustIds.join(",")})`,
      );
    } else {
      query = query.ilike("title", `%${filters.search}%`);
    }
  }

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

  const raw = (data ?? []) as unknown as DBJobListing[];

  // Deduplicate: NHS Jobs and Trac sometimes list the same vacancy.
  // Key on title + trust only — closes_at differs between sources for the same job.
  // Prefer: NHS Jobs > has closes_at > Trac unenriched.
  const seen = new Map<string, DBJobListing>();
  for (const job of raw) {
    const key = `${job.title.toLowerCase().trim()}|${job.trust_id ?? ""}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, job);
    } else {
      const existingIsNHS = existing.source === "NHS Jobs";
      const jobIsNHS = job.source === "NHS Jobs";
      if (!existingIsNHS && jobIsNHS) {
        seen.set(key, job);
      } else if (existingIsNHS === jobIsNHS && !existing.closes_at && job.closes_at) {
        seen.set(key, job);
      }
    }
  }

  const all = Array.from(seen.values());
  const total = all.length;
  const start = (page - 1) * PAGE_SIZE;
  return { jobs: all.slice(start, start + PAGE_SIZE), total };
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const range: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      range.push(i);
    }
  }

  const result: (number | "...")[] = [];
  let prev: number | null = null;
  for (const p of range) {
    if (prev !== null) {
      if (p - prev === 2) result.push(prev + 1);
      else if (p - prev > 2) result.push("...");
    }
    result.push(p);
    prev = p;
  }
  return result;
}

function PaginationControls({
  currentPage,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  prevHref,
  nextHref,
  mkPageHref,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  prevHref: string | null;
  nextHref: string | null;
  mkPageHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500">
        Showing{" "}
        <span className="font-semibold text-gray-800">{rangeStart}–{rangeEnd}</span>{" "}
        of{" "}
        <span className="font-semibold text-gray-800">{total}</span> roles
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1">
        {prevHref ? (
          <Link
            href={prevHref}
            className="flex h-10 items-center gap-1 rounded-full bg-white px-3 text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-400 hover:text-emerald-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <span className="flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-gray-300 cursor-default select-none">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Prev</span>
          </span>
        )}

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`dots-${i}`}
              className="flex h-10 w-8 items-center justify-center text-sm text-gray-400 select-none"
            >
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white select-none"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={mkPageHref(p)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-400 hover:text-emerald-700 transition-colors"
            >
              {p}
            </Link>
          ),
        )}

        {nextHref ? (
          <Link
            href={nextHref}
            className="flex h-10 items-center gap-1 rounded-full bg-white px-3 text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-400 hover:text-emerald-700 transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <span className="flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-gray-300 cursor-default select-none">
            <span className="hidden sm:inline">Next</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { sort = "posted_at", specialty, grade, deanery, search, page: pageParam } = await searchParams;
  const sortValue = Array.isArray(sort) ? sort[0] : sort;
  const searchValue = Array.isArray(search) ? (search[0] ?? "") : (search ?? "");
  const page = Math.max(1, Number(Array.isArray(pageParam) ? (pageParam[0] ?? "1") : (pageParam ?? "1")) || 1);
  const filters = {
    specialty: toArray(specialty),
    grade: toArray(grade),
    deanery: toArray(deanery),
    search: searchValue,
  };
  const activeFilterCount =
    filters.specialty.length + filters.grade.length + filters.deanery.length;

  const [{ jobs, total }, lastUpdatedAt] = await Promise.all([
    fetchJobs(sortValue, filters, page),
    fetchLastUpdated(),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function mkPageHref(p: number): string {
    const sp = new URLSearchParams();
    if (sortValue !== "posted_at") sp.set("sort", sortValue);
    filters.specialty.forEach((s) => sp.append("specialty", s));
    filters.grade.forEach((g) => sp.append("grade", g));
    filters.deanery.forEach((d) => sp.append("deanery", d));
    if (searchValue) sp.set("search", searchValue);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/jobs?${s}` : "/jobs";
  }

  const prevHref = page > 1 ? mkPageHref(page - 1) : null;
  const nextHref = page < totalPages ? mkPageHref(page + 1) : null;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AutoScrape />
      <Navbar />

      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6 sm:py-8">
        {/* Page header */}
        <div className="mb-8">
          {/* Row 1: title + mobile controls / desktop all-controls */}
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NHS Jobs</h1>
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-semibold text-emerald-600">{total}</span>{" "}
                live {total === 1 ? "role" : "roles"}
                {totalPages > 1 && (
                  <span className="text-gray-400">
                    {" · "}
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} shown
                  </span>
                )}
                {(activeFilterCount > 0 || searchValue) && (
                  <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {activeFilterCount + (searchValue ? 1 : 0)} filter{activeFilterCount + (searchValue ? 1 : 0) !== 1 ? "s" : ""} active
                  </span>
                )}
              </p>
            </div>

            {/* Mobile: Filters + Sort (icon only) */}
            <div className="flex flex-shrink-0 items-center gap-2 sm:hidden">
              <Suspense fallback={null}>
                <MobileFilterDrawer />
              </Suspense>
              <Suspense fallback={null}>
                <SortSelect />
              </Suspense>
            </div>

            {/* Desktop: all controls in one row */}
            <div className="hidden items-center gap-2 sm:flex">
              <Suspense fallback={null}>
                <MobileFilterDrawer />
              </Suspense>
              {lastUpdatedAt && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Updated {relativeTime(lastUpdatedAt)}
                </span>
              )}
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
            <Suspense fallback={<div className="flex w-full items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-300 ring-1 ring-gray-200" />}>
              <SearchInput />
            </Suspense>
          </div>

          {/* Row 3: freshness indicator — mobile only */}
          {lastUpdatedAt && (
            <div className="mt-2 flex items-center gap-1.5 sm:hidden">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">Updated {relativeTime(lastUpdatedAt)}</span>
            </div>
          )}
        </div>

        <div className="lg:flex lg:gap-6">
          {/* Sidebar */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-20 flex max-h-[calc(100vh-5.5rem)] flex-col gap-4 overflow-y-auto pb-4">
              <Suspense fallback={<div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200 h-96 animate-pulse" />}>
                <FilterSidebar className="rounded-2xl bg-white ring-1 ring-gray-200 flex flex-col" />
              </Suspense>
              <Suspense fallback={null}>
                <AlertSignup />
              </Suspense>
            </div>
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
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  total={total}
                  rangeStart={(page - 1) * PAGE_SIZE + 1}
                  rangeEnd={Math.min(page * PAGE_SIZE, total)}
                  prevHref={prevHref}
                  nextHref={nextHref}
                  mkPageHref={mkPageHref}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

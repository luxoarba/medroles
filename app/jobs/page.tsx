import Link from "next/link";
import Navbar from "../components/navbar";
import BookmarkButton from "../components/bookmark-button";
import {
  JOBS,
  SPECIALTIES,
  GRADES,
  CONTRACT_TYPES,
  TRUST_TYPES,
  SOURCES,
  type Job,
} from "../lib/jobs";

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
  const today = new Date("2026-04-07");
  const closing = new Date(dateStr);
  return Math.round((closing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function JobCard({ job }: { job: Job }) {
  const days = daysUntil(job.closingDate);
  const closing = new Date(job.closingDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group relative block rounded-2xl bg-white p-6 ring-1 ring-gray-200 hover:ring-emerald-300 hover:shadow-md transition-all duration-150"
    >
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
            {job.title}
          </h2>
          <p className="mt-0.5 truncate text-sm text-gray-500">{job.trust}</p>
        </div>
        <BookmarkButton jobId={job.id} />
      </div>

      {/* Tags */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${GRADE_COLOURS[job.grade] ?? "bg-gray-50 text-gray-600 ring-gray-200"}`}
        >
          {job.grade}
        </span>
        <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
          {job.specialty}
        </span>
        <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
          {job.contractType}
        </span>
        {job.ltftFriendly && (
          <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
            LTFT ✓
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {job.region}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
          </svg>
          {job.salaryRange}
        </span>
        <StarRating rating={job.trustRating} />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className={`text-xs font-medium ${days <= 7 ? "text-red-600" : days <= 14 ? "text-amber-600" : "text-gray-400"}`}>
          {days <= 7 ? "⚠ " : ""}Closes {closing}
          {days >= 0 ? ` · ${days}d left` : " · Closed"}
        </span>
        <span className="text-xs text-gray-400">{job.source}</span>
      </div>
    </Link>
  );
}

function FilterSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-gray-300 bg-white">
                <span className="hidden h-2 w-2 rounded-sm bg-emerald-600" />
              </span>
              {item}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await searchParams; // consumed to satisfy Next.js 16 signature
  const jobs = JOBS;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NHS Jobs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Showing {jobs.length} of{" "}
              <span className="font-semibold text-emerald-600">6,982</span> live
              roles
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <select className="rounded-xl bg-white px-4 py-2.5 text-sm text-gray-600 ring-1 ring-gray-200 outline-none">
              <option>Sort: Most recent</option>
              <option>Closing soonest</option>
              <option>Highest rated trust</option>
              <option>Salary: High to low</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-20 space-y-7 rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <FilterSection title="Specialty" items={SPECIALTIES} />
              <div className="h-px bg-gray-100" />
              <FilterSection title="Grade" items={GRADES} />
              <div className="h-px bg-gray-100" />
              <FilterSection title="Contract" items={CONTRACT_TYPES} />
              <div className="h-px bg-gray-100" />
              <FilterSection title="Trust type" items={TRUST_TYPES} />
              <div className="h-px bg-gray-100" />
              <FilterSection title="Source" items={SOURCES} />

              <button className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                Apply filters
              </button>
              <button className="w-full rounded-lg py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                Clear all
              </button>
            </div>
          </aside>

          {/* Job cards grid */}
          <main className="min-w-0 flex-1">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Pagination placeholder */}
            <div className="mt-10 flex items-center justify-center gap-1">
              {[1, 2, 3, "…", 24].map((p, i) => (
                <button
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === 1
                      ? "bg-emerald-600 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

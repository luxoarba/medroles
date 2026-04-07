import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../components/navbar";
import BookmarkButton from "../../components/bookmark-button";
import { getJob } from "../../lib/jobs";

function StarRating({
  rating,
  count,
  size = "md",
}: {
  rating: number;
  count?: number;
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
      {count !== undefined && (
        <span className="ml-1 text-sm text-gray-500">
          {rating.toFixed(1)} · {count} reviews
        </span>
      )}
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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = getJob(id);

  if (!job) notFound();

  const closing = new Date(job.closingDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const today = new Date("2026-04-07");
  const closingDate = new Date(job.closingDate);
  const daysLeft = Math.round(
    (closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

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
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${GRADE_COLOURS[job.grade] ?? "bg-gray-50 text-gray-600 ring-gray-200"}`}
                    >
                      {job.grade}
                    </span>
                    <span className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
                      {job.specialty}
                    </span>
                    <span className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
                      {job.contractType}
                    </span>
                    {job.ltftFriendly && (
                      <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                        LTFT friendly
                      </span>
                    )}
                  </div>
                  <h1 className="mb-1 text-2xl font-bold text-gray-900">
                    {job.title}
                  </h1>
                  <p className="text-base text-gray-500">{job.trust}</p>
                  <p className="mt-1 text-sm text-gray-400">{job.region}</p>
                </div>
                <BookmarkButton jobId={job.id} />
              </div>

              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-5 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Salary
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {job.salaryRange}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    On-call
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {job.onCallFrequency}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Trust type
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {job.trustType}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Source
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {job.source}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 rounded-2xl bg-white p-8 ring-1 ring-gray-200">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                About the role
              </h2>
              <p className="leading-7 text-gray-600">{job.description}</p>
            </div>

            {/* Requirements */}
            <div className="mb-6 rounded-2xl bg-white p-8 ring-1 ring-gray-200">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Requirements
              </h2>
              <ul className="space-y-3">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div className="rounded-2xl bg-white p-8 ring-1 ring-gray-200">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Benefits
              </h2>
              <ul className="space-y-3">
                {job.benefits.map((ben, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </span>
                    {ben}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 xl:w-80">
            <div className="sticky top-20 space-y-5">
              {/* Apply card */}
              <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
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
                      <span className="font-bold">{daysLeft} days</span> until closing
                    </>
                  ) : (
                    "This role has closed"
                  )}
                  <div className="mt-0.5 text-xs opacity-75">{closing}</div>
                </div>

                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Apply on {job.source}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>

                <p className="mt-3 text-center text-xs text-gray-400">
                  You will be redirected to {job.source}
                </p>
              </div>

              {/* Trust rating card */}
              <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  Trust rating
                </h3>

                {/* Overall */}
                <div className="mb-5 text-center">
                  <p className="text-5xl font-bold text-gray-900">
                    {job.trustRating.toFixed(1)}
                  </p>
                  <StarRating rating={job.trustRating} size="md" />
                  <p className="mt-1 text-xs text-gray-400">
                    {job.trustReviewCount} doctor reviews
                  </p>
                </div>

                {/* Category breakdown */}
                {[
                  { label: "Rota quality", score: Math.min(5, job.trustRating + 0.2) },
                  { label: "Consultant support", score: Math.min(5, job.trustRating - 0.1) },
                  { label: "Work-life balance", score: Math.max(1, job.trustRating - 0.4) },
                  { label: "Teaching & training", score: Math.min(5, job.trustRating + 0.3) },
                ].map(({ label, score }) => (
                  <div key={label} className="mb-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-700">
                        {score.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

                <Link
                  href="#"
                  className="mt-4 block text-center text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Read all {job.trustReviewCount} reviews →
                </Link>
              </div>

              {/* Interview intel card */}
              <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                  Interview intel
                </h3>
                <p className="mb-4 text-xs text-gray-500">
                  Shared by doctors who interviewed here
                </p>
                <div className="space-y-2">
                  {["Portfolio-based station", "Clinical scenario", "Management question"].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600"
                      >
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                        {item}
                      </div>
                    )
                  )}
                </div>
                <Link
                  href="#"
                  className="mt-4 block text-center text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  See full interview guide →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

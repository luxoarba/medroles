import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase, formatSalary } from "../../lib/supabase";

const GRADE_COLOURS: Record<string, string> = {
  FY1: "bg-sky-50 text-sky-700 ring-sky-200",
  FY2: "bg-sky-50 text-sky-700 ring-sky-200",
  CT1: "bg-violet-50 text-violet-700 ring-violet-200",
  CT2: "bg-violet-50 text-violet-700 ring-violet-200",
  ST3: "bg-orange-50 text-orange-700 ring-orange-200",
  ST4: "bg-orange-50 text-orange-700 ring-orange-200",
  ST5: "bg-orange-50 text-orange-700 ring-orange-200",
  ST6: "bg-orange-50 text-orange-700 ring-orange-200",
  "Junior Clinical Fellow": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Senior Clinical Fellow": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  SAS: "bg-teal-50 text-teal-700 ring-teal-200",
  Consultant: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const TYPE_LABELS: Record<string, string> = {
  acute: "Acute Trust",
  mental_health: "Mental Health Trust",
  community: "Community Trust",
  ambulance: "Ambulance Trust",
  primary_care: "Primary Care",
  specialist: "Specialist Trust",
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
          className="h-4 w-4"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1.5 text-sm font-medium text-gray-600">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function daysUntil(dateStr: string) {
  return Math.round(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export default async function TrustPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: trust }, { data: jobs }] = await Promise.all([
    supabase
      .from("trusts")
      .select("id, name, type, avg_rating, review_count")
      .eq("id", id)
      .single(),
    supabase
      .from("job_listings")
      .select(
        "id, title, grade, specialty, region, salary_min, salary_max, closes_at, source, external_url",
      )
      .eq("trust_id", id)
      .order("closes_at", { ascending: true }),
  ]);

  if (!trust) notFound();

  const typeLabel = trust.type ? (TYPE_LABELS[trust.type] ?? trust.type) : null;
  const activeJobs = jobs ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Back link */}
        <Link
          href="/trusts"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All trusts
        </Link>

        {/* Trust header */}
        <div className="rounded-2xl bg-white p-7 ring-1 ring-gray-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{trust.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {typeLabel && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    {typeLabel}
                  </span>
                )}
                {trust.avg_rating !== null && (
                  <StarRating rating={trust.avg_rating} />
                )}
                {trust.review_count !== null && trust.review_count > 0 && (
                  <span className="text-sm text-gray-400">
                    {trust.review_count} review{trust.review_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 px-5 py-3 text-center ring-1 ring-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">{activeJobs.length}</p>
              <p className="text-xs font-medium text-emerald-600">open role{activeJobs.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Job listings */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Current vacancies</h2>

          {activeJobs.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-gray-200">
              <p className="text-gray-400">No open roles at this trust right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => {
                const salary = formatSalary(job.salary_min, job.salary_max);
                const closing = job.closes_at
                  ? new Date(job.closes_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null;
                const days = job.closes_at ? daysUntil(job.closes_at) : null;

                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="group flex items-start justify-between gap-4 rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-emerald-300 hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {job.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {job.grade && (
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${
                              GRADE_COLOURS[job.grade] ?? "bg-gray-50 text-gray-600 ring-gray-200"
                            }`}
                          >
                            {job.grade}
                          </span>
                        )}
                        {job.specialty && (
                          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                            {job.specialty}
                          </span>
                        )}
                        {job.region && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            {job.region}
                          </span>
                        )}
                        {salary && (
                          <span className="text-xs text-gray-400">{salary}</span>
                        )}
                      </div>
                    </div>
                    {closing !== null && days !== null && (
                      <span
                        className={`flex-shrink-0 text-xs font-medium ${
                          days <= 7 ? "text-red-600" : days <= 14 ? "text-amber-600" : "text-gray-400"
                        }`}
                      >
                        {days <= 0 ? "Closed" : `${days}d left`}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

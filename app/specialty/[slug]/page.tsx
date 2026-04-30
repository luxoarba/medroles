import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "../../components/navbar";
import { supabase, formatSalary } from "../../lib/supabase";
import { SPECIALTY_SLUGS } from "../../sitemap";

export const revalidate = 1800;

export async function generateStaticParams() {
  return Object.keys(SPECIALTY_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const specialty = SPECIALTY_SLUGS[slug];
  if (!specialty) return { title: "Not found" };

  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("job_listings")
    .select("*", { count: "exact", head: true })
    .eq("specialty", specialty)
    .or(`closes_at.gte.${today},closes_at.is.null`);

  const title = `NHS ${specialty} Jobs — MedRoles`;
  const description = `Browse ${count ?? "NHS"} ${specialty} doctor jobs across UK NHS trusts. Filter by grade, region, and salary.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.medroles.co.uk/specialty/${slug}`,
      type: "website",
    },
    twitter: { title, description },
  };
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

export default async function SpecialtyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const specialty = SPECIALTY_SLUGS[slug];
  if (!specialty) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const { data: jobs, count } = await supabase
    .from("job_listings")
    .select(
      "id, title, grade, contract_type, region, salary_min, salary_max, closes_at, trusts(name)",
      { count: "exact" },
    )
    .eq("specialty", specialty)
    .or(`closes_at.gte.${today},closes_at.is.null`)
    .order("closes_at", { ascending: true, nullsFirst: false })
    .limit(30);

  const filterUrl = `/jobs?specialty=${encodeURIComponent(specialty)}`;

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
          <span className="font-medium text-gray-700">{specialty}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            NHS {specialty} Jobs
          </h1>
          <p className="mt-2 text-gray-500">
            {count ?? 0} live {specialty.toLowerCase()} roles across UK NHS trusts
          </p>
        </div>

        {/* Job list */}
        {jobs && jobs.length > 0 ? (
          <>
            <div className="mb-8 space-y-3">
              {jobs.map((job) => {
                const trust = Array.isArray(job.trusts)
                  ? job.trusts[0]
                  : job.trusts;
                const daysLeft = job.closes_at
                  ? Math.round(
                      (new Date(job.closes_at).getTime() -
                        new Date(today).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-xl bg-white p-5 ring-1 ring-gray-200 transition-all hover:shadow-sm hover:ring-emerald-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {job.grade && (
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-semibold ring-1 ${GRADE_COLOURS[job.grade] ?? "bg-gray-50 text-gray-600 ring-gray-200"}`}
                            >
                              {job.grade}
                            </span>
                          )}
                          {job.contract_type && (
                            <span className="rounded bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200">
                              {job.contract_type}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold leading-snug text-gray-900">
                          {job.title}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {(trust as { name: string } | null)?.name}
                          {job.region ? ` · ${job.region}` : ""}
                        </p>
                        {(job.salary_min || job.salary_max) && (
                          <p className="mt-1 text-sm font-medium text-gray-700">
                            {formatSalary(job.salary_min, job.salary_max)}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {daysLeft !== null ? (
                          <span
                            className={`text-xs font-medium ${
                              daysLeft <= 7
                                ? "text-red-600"
                                : daysLeft <= 14
                                  ? "text-amber-600"
                                  : "text-gray-400"
                            }`}
                          >
                            {daysLeft === 0 ? "Closes today" : `${daysLeft}d left`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Date TBC</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {count !== null && count > 30 && (
              <div className="text-center">
                <Link
                  href={filterUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  See all {count} {specialty} jobs
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-gray-200">
            <p className="text-gray-500">
              No {specialty.toLowerCase()} roles listed right now.
            </p>
            <Link
              href="/jobs"
              className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Browse all NHS jobs →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

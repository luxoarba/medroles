import type { Metadata } from "next";
import Navbar from "../components/navbar";
import InterviewForm from "./interview-form";
import { supabase } from "../lib/supabase";

export const metadata: Metadata = {
  title: "Interview Intel",
  description: "Real NHS interview experiences shared by doctors. Know what questions to expect, the format and difficulty before you apply.",
  openGraph: {
    title: "NHS Interview Intel — MedRoles",
    description: "Real NHS interview experiences shared by doctors. Know what to expect before you apply.",
    url: "https://www.medroles.co.uk/interview-intel",
  },
};

const DIFFICULTY_LABELS: Record<number, { label: string; colour: string }> = {
  1: { label: "Very easy", colour: "text-emerald-600" },
  2: { label: "Easy", colour: "text-emerald-500" },
  3: { label: "Moderate", colour: "text-amber-600" },
  4: { label: "Hard", colour: "text-orange-600" },
  5: { label: "Very hard", colour: "text-red-600" },
};

export default async function InterviewIntelPage({
  searchParams,
}: {
  searchParams: Promise<{ trust_id?: string }>;
}) {
  const { trust_id } = await searchParams;

  const [{ data: trusts }, { data: insights }, trustName] = await Promise.all([
    supabase.from("trusts").select("id, name").eq("is_nhs", true).order("name", { ascending: true }).limit(500),
    (trust_id
      ? supabase
          .from("interview_insights")
          .select("id, trust_id, specialty, grade, format, questions_asked, difficulty, got_offer, created_at, trusts(name)")
          .eq("trust_id", trust_id)
          .order("created_at", { ascending: false })
          .limit(50)
      : supabase
          .from("interview_insights")
          .select("id, trust_id, specialty, grade, format, questions_asked, difficulty, got_offer, created_at, trusts(name)")
          .order("created_at", { ascending: false })
          .limit(50)
    ),
    trust_id
      ? supabase.from("trusts").select("name").eq("id", trust_id).single().then(({ data }) => data?.name ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:items-start">

          {/* Sidebar — form (top on mobile, right column on desktop) */}
          <aside className="mb-8 lg:mb-0 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
              <h2 className="mb-1 text-base font-semibold text-gray-900">Share your experience</h2>
              <p className="mb-5 text-xs text-gray-500">Anonymous — no account needed.</p>
              <InterviewForm trusts={trusts ?? []} defaultTrustId={trust_id} />
            </div>
          </aside>

          {/* Main — header + insights list */}
          <main className="lg:col-start-1 lg:row-start-1">
            <div className="mb-8">
              {trustName && (
                <p className="mb-1 text-sm text-gray-500">
                  <a href="/interview-intel" className="hover:underline">Interview Intel</a>
                  {" "}›{" "}{trustName}
                </p>
              )}
              <h1 className="text-2xl font-bold text-gray-900">Interview Intel</h1>
              <p className="mt-2 text-sm text-gray-500">
                {trustName
                  ? `Real interview experiences at ${trustName}.`
                  : "Real interview experiences shared by doctors. Know what to expect before you apply."}
              </p>
            </div>

            {(insights?.length ?? 0) > 0 && (
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Recent experiences
                <span className="ml-2 text-sm font-normal text-gray-400">({insights!.length})</span>
              </h2>
            )}

            {(insights?.length ?? 0) === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-gray-200">
                <p className="text-sm font-medium text-gray-500">No interview reports yet</p>
                <p className="mt-1 text-xs text-gray-400">Be the first to share your experience using the form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights!.map((ins) => {
                  const insTrustName = Array.isArray(ins.trusts)
                    ? ins.trusts[0]?.name
                    : (ins.trusts as { name: string } | null)?.name;
                  const date = new Date(ins.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  });
                  const diff = ins.difficulty ? DIFFICULTY_LABELS[ins.difficulty] : null;

                  return (
                    <div key={ins.id} className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{insTrustName ?? "NHS Trust"}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {ins.grade && (
                              <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">
                                {ins.grade}
                              </span>
                            )}
                            {ins.specialty && (
                              <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">
                                {ins.specialty}
                              </span>
                            )}
                            {ins.format && (
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 ring-1 ring-blue-200">
                                {ins.format}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-400">{date}</span>
                          {ins.got_offer !== null && (
                            <span className={`text-xs font-medium ${ins.got_offer ? "text-emerald-600" : "text-gray-400"}`}>
                              {ins.got_offer ? "✓ Got offer" : "No offer"}
                            </span>
                          )}
                        </div>
                      </div>

                      {diff && (
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Difficulty:</span>
                          <span className={`text-xs font-medium ${diff.colour}`}>{diff.label}</span>
                        </div>
                      )}

                      {ins.questions_asked && (
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Questions asked</p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{ins.questions_asked}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

import Navbar from "../components/navbar";
import InterviewForm from "./interview-form";
import { supabase } from "../lib/supabase";

const DIFFICULTY_LABELS: Record<number, { label: string; colour: string }> = {
  1: { label: "Very easy", colour: "text-emerald-600" },
  2: { label: "Easy", colour: "text-emerald-500" },
  3: { label: "Moderate", colour: "text-amber-600" },
  4: { label: "Hard", colour: "text-orange-600" },
  5: { label: "Very hard", colour: "text-red-600" },
};

export default async function InterviewIntelPage() {
  const [{ data: trusts }, { data: insights }] = await Promise.all([
    supabase
      .from("trusts")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("interview_insights")
      .select("id, trust_id, specialty, grade, format, questions_asked, difficulty, got_offer, created_at, trusts(name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Interview Intel</h1>
          <p className="mt-2 text-sm text-gray-500">
            Real interview experiences shared by doctors. Know what to expect before you apply.
          </p>
        </div>

        {/* Submission form */}
        <div className="mb-10 rounded-2xl bg-white p-7 ring-1 ring-gray-200">
          <h2 className="mb-5 text-base font-semibold text-gray-900">Share your interview experience</h2>
          <InterviewForm trusts={trusts ?? []} />
        </div>

        {/* Insights list */}
        <div>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Recent experiences
            {(insights?.length ?? 0) > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({insights!.length})
              </span>
            )}
          </h2>

          {(insights?.length ?? 0) === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-gray-200">
              <p className="text-sm font-medium text-gray-400">No interview reports yet</p>
              <p className="mt-1 text-xs text-gray-400">Be the first to help your colleagues prepare.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights!.map((ins) => {
                const trustName = Array.isArray(ins.trusts)
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
                        <p className="font-medium text-gray-900">{trustName ?? "NHS Trust"}</p>
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
        </div>
      </div>
    </div>
  );
}

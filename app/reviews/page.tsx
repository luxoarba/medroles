import type { Metadata } from "next";
import Navbar from "../components/navbar";
import ReviewFormToggle from "./review-form-toggle";
import { supabase } from "../lib/supabase";

export const metadata: Metadata = {
  title: "Trust Reviews",
  description: "Anonymous reviews from doctors about working conditions, training quality, rota and culture at NHS trusts across the UK.",
  openGraph: {
    title: "NHS Trust Reviews — MedRoles",
    description: "Anonymous reviews from doctors about working conditions, training quality and culture at NHS trusts.",
    url: "https://www.medroles.co.uk/reviews",
  },
};

function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < Math.round(rating) ? "#059669" : "none"}
          stroke={i < Math.round(rating) ? "#059669" : "#d1d5db"}
          className="h-3.5 w-3.5"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ trust_id?: string }>;
}) {
  const { trust_id } = await searchParams;

  const [{ data: trusts }, { data: reviews }, trustName] = await Promise.all([
    supabase.from("trusts").select("id, name").order("name", { ascending: true }),
    (trust_id
      ? supabase
          .from("trust_reviews")
          .select("id, trust_id, grade, specialty, rota_rating, training_rating, culture_rating, overall_rating, review_text, created_at, trusts(name)")
          .eq("trust_id", trust_id)
          .order("created_at", { ascending: false })
          .limit(50)
      : supabase
          .from("trust_reviews")
          .select("id, trust_id, grade, specialty, rota_rating, training_rating, culture_rating, overall_rating, review_text, created_at, trusts(name)")
          .order("created_at", { ascending: false })
          .limit(50)
    ),
    trust_id
      ? supabase.from("trusts").select("name").eq("id", trust_id).single().then(({ data }) => data?.name ?? null)
      : Promise.resolve(null),
  ]);

  const reviewCount = reviews?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          {trustName && (
            <p className="mb-1 text-sm text-gray-500">
              <a href="/reviews" className="hover:underline">Reviews</a>
              {" "}›{" "}{trustName}
            </p>
          )}
          <h1 className="text-2xl font-bold text-gray-900">Trust Reviews</h1>
          <p className="mt-2 text-sm text-gray-500">
            {trustName
              ? `Anonymous reviews from doctors who worked at ${trustName}.`
              : "Anonymous reviews from doctors about working conditions, training quality, and culture."}
          </p>
        </div>

        {/* Reviews list */}
        <div className="mb-6">
          {reviewCount > 0 && (
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Reviews
              <span className="ml-2 text-sm font-normal text-gray-400">({reviewCount})</span>
            </h2>
          )}

          {reviewCount === 0 ? (
            <div className="mb-6 rounded-2xl bg-white p-10 text-center ring-1 ring-gray-200">
              <p className="text-sm font-medium text-gray-500">No reviews yet</p>
              <p className="mt-1 text-xs text-gray-400">Be the first to share your experience.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {reviews!.map((r) => {
                const rTrustName = Array.isArray(r.trusts)
                  ? r.trusts[0]?.name
                  : (r.trusts as { name: string } | null)?.name;
                const date = new Date(r.created_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                });
                return (
                  <div key={r.id} className="rounded-xl bg-white p-5 ring-1 ring-gray-200">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{rTrustName ?? "NHS Trust"}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {r.grade && (
                            <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">
                              {r.grade}
                            </span>
                          )}
                          {r.specialty && (
                            <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200">
                              {r.specialty}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{date}</span>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: "Overall", val: r.overall_rating },
                        { label: "Training", val: r.training_rating },
                        { label: "Rota", val: r.rota_rating },
                        { label: "Culture", val: r.culture_rating },
                      ].map(({ label, val }) => (
                        <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
                          {val != null ? (
                            <StarDisplay rating={val} />
                          ) : (
                            <p className="text-xs text-gray-300">—</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {r.review_text && (
                      <p className="text-sm text-gray-600 leading-relaxed">{r.review_text}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leave a review CTA */}
        <ReviewFormToggle trusts={trusts ?? []} defaultTrustId={trust_id} />
      </div>
    </div>
  );
}

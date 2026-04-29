import Navbar from "../components/navbar";
import TrustSearch from "../components/trust-search";
import { supabase } from "../lib/supabase";

export default async function TrustsPage() {
  const { data: trusts } = await supabase
    .from("trusts")
    .select("id, name, type, avg_rating, review_count, job_listings(count)")
    .order("name");

  const rows = (trusts ?? []).map((t) => {
    const countRaw = t.job_listings as unknown as { count: number }[] | null;
    const jobCount = Array.isArray(countRaw) ? (countRaw[0]?.count ?? 0) : 0;
    return { id: t.id, name: t.name, type: t.type, avg_rating: t.avg_rating, review_count: t.review_count, jobCount };
  });

  // Sort: trusts with open jobs first, then alphabetically
  rows.sort((a, b) => {
    if (b.jobCount !== a.jobCount) return b.jobCount - a.jobCount;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">NHS Trusts</h1>
          <p className="mt-1 text-sm text-gray-500">
            {rows.length} trusts · browse open roles and ratings
          </p>
        </div>
        <TrustSearch trusts={rows} />
      </div>
    </div>
  );
}

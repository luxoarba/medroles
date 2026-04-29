"use client";

import { useState } from "react";
import Link from "next/link";

type Trust = {
  id: string;
  name: string;
  type: string | null;
  avg_rating: number | null;
  review_count: number | null;
  jobCount: number;
};

const TYPE_LABELS: Record<string, string> = {
  acute: "Acute",
  mental_health: "Mental Health",
  community: "Community",
  ambulance: "Ambulance",
  primary_care: "Primary Care",
  specialist: "Specialist",
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
      <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function TrustSearch({ trusts }: { trusts: Trust[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? trusts.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : trusts;

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search trusts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        {query && (
          <p className="mt-2 text-xs text-gray-400">
            {filtered.length} {filtered.length === 1 ? "trust" : "trusts"} found
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((trust) => (
          <Link
            key={trust.id}
            href={`/trusts/${trust.id}`}
            className="group flex flex-col justify-between rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-emerald-300 hover:shadow-sm transition-all"
          >
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
                {trust.name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {trust.type && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                    {TYPE_LABELS[trust.type] ?? trust.type}
                  </span>
                )}
                {trust.avg_rating !== null && (
                  <StarRating rating={trust.avg_rating} />
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-400">
                {trust.review_count
                  ? `${trust.review_count} review${trust.review_count !== 1 ? "s" : ""}`
                  : "No reviews yet"}
              </span>
              {trust.jobCount > 0 ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {trust.jobCount} open role{trust.jobCount !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-xs text-gray-300">No open roles</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-gray-400">
          No trusts found for &quot;{query}&quot;
        </p>
      )}
    </>
  );
}

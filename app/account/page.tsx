// app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Navbar from "../components/navbar";
import { getUser, signOut } from "@/lib/auth";
import { getSavedJobs } from "@/lib/savedJobs";
import type { DBJobListing } from "@/app/lib/supabase";
import { formatSalary } from "@/app/lib/supabase";

function resolveTrust(raw: DBJobListing["trusts"]) {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function SavedJobCard({ job }: { job: DBJobListing }) {
  const trust = resolveTrust(job.trusts);
  const salary = formatSalary(job.salary_min, job.salary_max);
  const closing = job.closes_at
    ? new Date(job.closes_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-5 py-4 ring-1 ring-gray-100 hover:ring-emerald-200 hover:bg-white transition-all"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
          {job.title ?? "Untitled role"}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {trust?.name ?? "NHS Trust"}
          {salary ? ` · ${salary}` : ""}
        </p>
      </div>
      {closing && (
        <span className="flex-shrink-0 text-xs text-gray-400">
          Closes {closing}
        </span>
      )}
    </Link>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [savedJobs, setSavedJobs] = useState<DBJobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUser().then(async (u) => {
      if (cancelled) return;
      if (!u) {
        setLoading(false);
        router.push("/auth");
        return;
      }
      const jobs = await getSavedJobs();
      if (cancelled) return;
      setUser(u);
      setSavedJobs(jobs);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [router]);

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // sign-out failed; redirect anyway to clear local state
    }
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Profile section */}
        <div className="mb-8 rounded-2xl bg-white p-8 ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My account</h1>
              <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-lg font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-6">
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Saved jobs */}
        <div className="rounded-2xl bg-white p-8 ring-1 ring-gray-200">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Saved jobs</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {savedJobs.length > 0
                  ? `${savedJobs.length} saved ${savedJobs.length === 1 ? "role" : "roles"}`
                  : "Jobs you've bookmarked will appear here."}
              </p>
            </div>
            {savedJobs.length > 0 && (
              <Link
                href="/jobs"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Browse more →
              </Link>
            )}
          </div>

          {savedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-12 text-center ring-1 ring-gray-100">
              <svg
                className="mb-3 h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.25}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-400">No saved jobs yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Bookmark roles from the{" "}
                <Link href="/jobs" className="text-emerald-600 hover:underline">
                  jobs board
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedJobs.map((job) => (
                <SavedJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

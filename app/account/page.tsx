"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Navbar from "../components/navbar";
import { getUser, signOut } from "@/lib/auth";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then((u) => {
      if (!u) {
        router.push("/auth");
        return;
      }
      setUser(u);
      setLoading(false);
    });
  }, [router]);

  async function handleSignOut() {
    await signOut();
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
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            Saved jobs
          </h2>
          <p className="mb-8 text-sm text-gray-500">
            Jobs you&apos;ve bookmarked will appear here.
          </p>
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
              <a href="/jobs" className="text-emerald-600 hover:underline">
                jobs board
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

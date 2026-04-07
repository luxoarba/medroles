"use client";

import { useEffect } from "react";
import Navbar from "../components/navbar";

export default function JobsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[JobsPage]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200">
          <svg
            className="h-7 w-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Failed to load job listings
        </h2>
        <p className="mb-6 max-w-sm text-sm text-gray-500">
          We couldn&apos;t connect to the database. Check your network
          connection or try again in a moment.
        </p>
        {error.digest && (
          <p className="mb-6 rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={unstable_retry}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Try again
        </button>
      </div>
    </div>
  );
}

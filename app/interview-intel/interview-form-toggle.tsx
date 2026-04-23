"use client";

import { useState } from "react";
import InterviewForm from "./interview-form";

export default function InterviewFormToggle({
  trusts,
  defaultTrustId,
}: {
  trusts: { id: string; name: string }[];
  defaultTrustId?: string;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="rounded-2xl bg-white p-7 ring-1 ring-gray-200">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Share your interview experience</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
        <InterviewForm trusts={trusts} defaultTrustId={defaultTrustId} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full rounded-2xl bg-white p-6 ring-1 ring-gray-200 hover:ring-emerald-300 hover:shadow-sm transition-all text-left group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
            Have you interviewed here?
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Share your experience anonymously — it helps other doctors prepare.
          </p>
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </span>
      </div>
    </button>
  );
}

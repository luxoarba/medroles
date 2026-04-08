"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/savedJobs";

export default function BookmarkButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isJobSaved(jobId).then((result) => {
      if (!cancelled) setSaved(result);
    });
    return () => { cancelled = true; };
  }, [jobId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const user = await getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    const prev = saved;
    setSaved(!prev); // optimistic
    const { error } = prev ? await unsaveJob(jobId) : await saveJob(jobId);
    if (error) setSaved(prev); // rollback on failure
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? "Remove bookmark" : "Save job"}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
        saved
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-gray-200 bg-white text-gray-400 hover:border-emerald-200 hover:text-emerald-600"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.75}
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </button>
  );
}

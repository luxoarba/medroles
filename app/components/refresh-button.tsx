"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

export default function RefreshButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    if (status === "loading") return;
    setStatus("loading");

    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (!res.ok) throw new Error(`${res.status}`);
      setStatus("success");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const labels: Record<Status, string> = {
    idle: "Refresh jobs",
    loading: "Refreshing…",
    success: "Updated",
    error: "Failed — try again",
  };

  const colours: Record<Status, string> = {
    idle: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    loading: "text-gray-400 cursor-not-allowed",
    success: "text-emerald-600",
    error: "text-red-600",
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 ring-gray-200 bg-white transition-colors ${colours[status]}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        className={`h-4 w-4 flex-shrink-0 ${status === "loading" ? "animate-spin" : ""}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
      {labels[status]}
    </button>
  );
}

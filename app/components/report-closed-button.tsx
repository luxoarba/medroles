"use client";

import { useState } from "react";

export default function ReportClosedButton({ jobId }: { jobId: string }) {
  const [state, setState] = useState<"idle" | "confirming" | "loading" | "done">("idle");

  async function confirm() {
    setState("loading");
    try {
      const res = await fetch(`/api/jobs/${jobId}/close`, { method: "POST" });
      if (res.ok) {
        setState("done");
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return <p className="text-center text-xs text-gray-400">Thanks — this role has been marked as filled.</p>;
  }

  if (state === "confirming" || state === "loading") {
    return (
      <div className="text-center">
        <p className="mb-2 text-xs text-gray-500">Mark this role as filled? It will be removed from listings.</p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={state === "loading"}
            onClick={confirm}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {state === "loading" ? "Saving…" : "Yes, it's filled"}
          </button>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setState("confirming")}
      className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      This role has been filled?
    </button>
  );
}

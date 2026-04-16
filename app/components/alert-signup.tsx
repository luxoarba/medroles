"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SPECIALTIES, GRADES, DEANERIES } from "../lib/jobs";

export default function AlertSignup() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState(searchParams.get("specialty") ?? "");
  const [grade, setGrade] = useState(searchParams.get("grade") ?? "");
  const [region, setRegion] = useState(searchParams.get("region") ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, specialty: specialty || null, grade: grade || null, region: region || null }),
    });

    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
        <div className="flex flex-col items-center py-2 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900">Alert set</p>
          <p className="mt-1 text-xs text-gray-500">We'll email you when new matching jobs are posted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Get job alerts</h3>
        <p className="mt-0.5 text-xs text-gray-500">Email me when new matching jobs are posted.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Any specialty</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Any grade</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Any region</option>
          {DEANERIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {status === "error" && (
          <p className="text-xs text-red-600">Something went wrong — please try again.</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {status === "loading" ? "Saving…" : "Notify me"}
        </button>
      </form>
    </div>
  );
}

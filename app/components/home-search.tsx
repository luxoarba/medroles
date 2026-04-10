"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SPECIALTIES, DEANERIES } from "../lib/jobs";

export default function HomeSearch() {
  const router = useRouter();
  const [specialty, setSpecialty] = useState("");
  const [deanery, setDeanery] = useState("");

  function search() {
    const params = new URLSearchParams();
    if (specialty) params.append("specialty", specialty);
    if (deanery) params.append("deanery", deanery);
    router.push(`/jobs${params.size > 0 ? `?${params}` : ""}`);
  }

  return (
    <div className="rounded-2xl bg-white p-2 shadow-xl ring-1 ring-gray-200/80">
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Specialty */}
        <label className="relative flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5 ring-1 ring-transparent focus-within:ring-emerald-300 transition-all">
          <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-700 outline-none appearance-none cursor-pointer"
          >
            <option value="">Specialty — any</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <svg className="h-4 w-4 flex-shrink-0 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </label>

        {/* Location */}
        <label className="relative flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5 ring-1 ring-transparent focus-within:ring-emerald-300 transition-all">
          <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <select
            value={deanery}
            onChange={(e) => setDeanery(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-700 outline-none appearance-none cursor-pointer"
          >
            <option value="">Location — any</option>
            {DEANERIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <svg className="h-4 w-4 flex-shrink-0 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </label>

        <button
          onClick={search}
          className="rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors whitespace-nowrap"
        >
          Search roles
        </button>
      </div>
    </div>
  );
}

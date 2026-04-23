"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SPECIALTIES, GRADES, DEANERIES } from "../lib/jobs";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle(val: string) {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val],
    );
  }

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-sm text-gray-700">
          {label}
          {selected.length > 0 && (
            <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="max-h-44 overflow-y-auto border-t border-gray-100 px-2 py-1.5">
          {options.map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 accent-emerald-600"
              />
              <span className="text-xs text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AlertSignup() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [specialties, setSpecialties] = useState<string[]>(
    searchParams.get("specialty") ? [searchParams.get("specialty")!] : [],
  );
  const [grades, setGrades] = useState<string[]>(
    searchParams.get("grade") ? [searchParams.get("grade")!] : [],
  );
  const [regions, setRegions] = useState<string[]>(
    searchParams.get("region") ? [searchParams.get("region")!] : [],
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        specialty: specialties.length ? specialties : null,
        grade: grades.length ? grades : null,
        region: regions.length ? regions : null,
      }),
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
          <p className="mt-3 text-xs text-gray-400">
            If you use an NHS email, check your junk folder and mark the email as{" "}
            <span className="font-medium text-gray-500">not junk</span>, or add{" "}
            <span className="font-medium text-gray-500">alerts@medroles.co.uk</span> to your safe senders.
          </p>
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

        <MultiSelect
          label="Specialties"
          options={SPECIALTIES}
          selected={specialties}
          onChange={setSpecialties}
        />

        <MultiSelect
          label="Grades"
          options={GRADES}
          selected={grades}
          onChange={setGrades}
        />

        <MultiSelect
          label="Regions"
          options={DEANERIES}
          selected={regions}
          onChange={setRegions}
        />

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

        <p className="text-center text-[11px] text-gray-400">
          Using an NHS email? Add{" "}
          <span className="font-medium text-gray-500">alerts@medroles.co.uk</span> to your safe senders to ensure delivery.
        </p>
      </form>
    </div>
  );
}

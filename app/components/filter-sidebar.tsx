"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SPECIALTIES, GRADES, DEANERIES } from "../lib/jobs";

function FilterSection({
  title,
  items,
  checkedValues,
  onToggle,
  initiallyExpanded = true,
}: {
  title: string;
  items: string[];
  checkedValues: string[];
  onToggle: (value: string) => void;
  initiallyExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const activeCount = checkedValues.length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mb-2.5 flex w-full items-center justify-between"
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {title}
        </span>
        <span className="flex items-center gap-1.5">
          {activeCount > 0 && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              {activeCount}
            </span>
          )}
          <svg
            className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {expanded && (
        <ul className="space-y-0.5">
          {items.map((item) => {
            const checked = checkedValues.includes(item);
            return (
              <li key={item}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <span
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                      checked ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => onToggle(item)}
                  />
                  {item}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function FilterSidebar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Record<string, string[]>>(() => ({
    specialty: searchParams.getAll("specialty"),
    grade: searchParams.getAll("grade"),
    deanery: searchParams.getAll("deanery"),
  }));

  useEffect(() => {
    setFilters({
      specialty: searchParams.getAll("specialty"),
      grade: searchParams.getAll("grade"),
      deanery: searchParams.getAll("deanery"),
    });
  }, [searchParams]);

  function toggle(key: string, value: string) {
    setFilters((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = { ...prev, [key]: next };

      // Apply immediately
      const params = new URLSearchParams();
      const sort = searchParams.get("sort");
      if (sort) params.set("sort", sort);
      for (const [k, vals] of Object.entries(updated)) {
        for (const v of vals) params.append(k, v);
      }
      router.push(`/jobs?${params.toString()}`);

      return updated;
    });
  }

  function clearAll() {
    setFilters({ specialty: [], grade: [], deanery: [] });
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`/jobs?${params.toString()}`);
  }

  const hasActive = Object.values(filters).some((v) => v.length > 0);
  const totalActive = Object.values(filters).reduce((n, v) => n + v.length, 0);

  return (
    <div className={className ?? "sticky top-20 flex max-h-[calc(100vh-5.5rem)] flex-col rounded-2xl bg-white ring-1 ring-gray-200"}>
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
        <span className="text-sm font-semibold text-gray-900">
          Filters
          {totalActive > 0 && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {totalActive}
            </span>
          )}
        </span>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <FilterSection
          title="Specialty"
          items={SPECIALTIES}
          checkedValues={filters.specialty}
          onToggle={(v) => toggle("specialty", v)}
        />
        <div className="h-px bg-gray-100" />
        <FilterSection
          title="Grade"
          items={GRADES}
          checkedValues={filters.grade}
          onToggle={(v) => toggle("grade", v)}
          initiallyExpanded={false}
        />
        <div className="h-px bg-gray-100" />
        <FilterSection
          title="Location"
          items={DEANERIES}
          checkedValues={filters.deanery}
          onToggle={(v) => toggle("deanery", v)}
          initiallyExpanded={false}
        />
      </div>
    </div>
  );
}

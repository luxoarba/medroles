"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SPECIALTIES, GRADES, CONTRACT_TYPES, SOURCES } from "../lib/jobs";

function FilterSection({
  title,
  items,
  checkedValues,
  onToggle,
}: {
  title: string;
  items: string[];
  checkedValues: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const checked = checkedValues.includes(item);
          return (
            <li key={item}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border bg-white transition-colors ${
                    checked ? "border-emerald-500 bg-emerald-50" : "border-gray-300"
                  }`}
                >
                  {checked && (
                    <svg className="h-2.5 w-2.5 text-emerald-600" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    </div>
  );
}

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pending, setPending] = useState<Record<string, string[]>>(() => ({
    specialty: searchParams.getAll("specialty"),
    grade: searchParams.getAll("grade"),
    contract: searchParams.getAll("contract"),
    source: searchParams.getAll("source"),
  }));

  function toggle(key: string, value: string) {
    setPending((prev) => {
      const current = prev[key] ?? [];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  }

  function apply() {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    for (const [key, values] of Object.entries(pending)) {
      for (const v of values) params.append(key, v);
    }
    router.push(`/jobs?${params.toString()}`);
  }

  function clearAll() {
    setPending({ specialty: [], grade: [], contract: [], source: [] });
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`/jobs?${params.toString()}`);
  }

  const hasActive = Object.values(pending).some((v) => v.length > 0);

  return (
    <div className="sticky top-20 space-y-7 rounded-2xl bg-white p-5 ring-1 ring-gray-200">
      <FilterSection
        title="Specialty"
        items={SPECIALTIES}
        checkedValues={pending.specialty}
        onToggle={(v) => toggle("specialty", v)}
      />
      <div className="h-px bg-gray-100" />
      <FilterSection
        title="Grade"
        items={GRADES}
        checkedValues={pending.grade}
        onToggle={(v) => toggle("grade", v)}
      />
      <div className="h-px bg-gray-100" />
      <FilterSection
        title="Contract"
        items={CONTRACT_TYPES}
        checkedValues={pending.contract}
        onToggle={(v) => toggle("contract", v)}
      />
      <div className="h-px bg-gray-100" />
      <FilterSection
        title="Source"
        items={SOURCES}
        checkedValues={pending.source}
        onToggle={(v) => toggle("source", v)}
      />
      <button
        onClick={apply}
        className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
      >
        Apply filters
      </button>
      {hasActive && (
        <button
          onClick={clearAll}
          className="w-full rounded-lg py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

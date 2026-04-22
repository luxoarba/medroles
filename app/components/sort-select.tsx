"use client";
import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { label: "Closing soon", value: "closes_at" },
  { label: "Newest", value: "posted_at" },
  { label: "Salary", value: "salary" },
];

export default function SortSelect({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "closes_at";

  const currentLabel = OPTIONS.find((o) => o.value === current)?.label ?? "Sort";
  const nextOption = OPTIONS[(OPTIONS.findIndex((o) => o.value === current) + 1) % OPTIONS.length];

  function cycleSort() {
    const p = new URLSearchParams(params.toString());
    p.set("sort", nextOption.value);
    router.push(`?${p.toString()}`);
  }

  // On mobile: a tap-to-cycle button with fixed width
  // On desktop (when className is not passed): native select
  if (!className) {
    return (
      <select
        className="rounded-xl bg-white px-3 py-2.5 text-sm text-gray-600 ring-1 ring-gray-200 outline-none"
        value={current}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString());
          p.set("sort", e.target.value);
          router.push(`?${p.toString()}`);
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={cycleSort}
      className={`flex items-center gap-1 rounded-xl bg-white px-3 py-2.5 text-sm text-gray-600 ring-1 ring-gray-200 whitespace-nowrap${className ? ` ${className}` : ""}`}
    >
      <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M9 17h6" />
      </svg>
      <span className="truncate">{currentLabel}</span>
    </button>
  );
}

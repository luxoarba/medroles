"use client";
import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { label: "Sort: Closing soonest", value: "closes_at" },
  { label: "Most recent", value: "posted_at" },
  { label: "Salary: High to low", value: "salary" },
];

export default function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "closes_at";

  return (
    <select
      className="rounded-xl bg-white px-4 py-2.5 text-sm text-gray-600 ring-1 ring-gray-200 outline-none"
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

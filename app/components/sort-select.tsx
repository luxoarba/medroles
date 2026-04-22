"use client";
import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { label: "Closing soon", value: "closes_at" },
  { label: "Newest", value: "posted_at" },
  { label: "Salary", value: "salary" },
];

export default function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "closes_at";

  return (
    <select
      className="max-w-[120px] rounded-xl bg-white px-3 py-2.5 text-sm text-gray-600 ring-1 ring-gray-200 outline-none"
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

"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const OPTIONS = [
  { label: "Closing soon", value: "closes_at" },
  { label: "Newest", value: "posted_at" },
];

export default function SortSelect({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "closes_at";
  const [isPending, startTransition] = useTransition();

  return (
    <select
      className={`rounded-xl bg-white px-3 py-2.5 text-sm text-gray-600 ring-1 ring-gray-200 outline-none transition-opacity ${isPending ? "opacity-50 cursor-wait" : ""} ${className ?? ""}`}
      value={current}
      disabled={isPending}
      onChange={(e) => {
        const p = new URLSearchParams(params.toString());
        p.set("sort", e.target.value);
        p.delete("page");
        startTransition(() => {
          router.push(`?${p.toString()}`);
        });
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

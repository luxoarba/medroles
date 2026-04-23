"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep input in sync if URL changes externally (e.g. clear-all)
  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) {
        params.set("search", next.trim());
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`/jobs?${params.toString()}`);
    }, 300);
  }

  return (
    <label className="flex w-full items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-600 ring-1 ring-gray-200 focus-within:ring-emerald-400 transition-shadow">
      <svg
        className="h-4 w-4 flex-shrink-0 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search roles…"
        className="min-w-0 flex-1 bg-transparent outline-none placeholder-gray-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            const params = new URLSearchParams(searchParams.toString());
            params.delete("search");
            params.delete("page");
            router.push(`/jobs?${params.toString()}`);
          }}
          className="text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Clear search"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </label>
  );
}

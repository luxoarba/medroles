"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { SPECIALTIES, DEANERIES } from "../lib/jobs";

function MultiSelectField({
  icon,
  placeholder,
  options,
  selected,
  onToggle,
}: {
  icon: React.ReactNode;
  placeholder: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const label =
    selected.length === 0
      ? null
      : selected.length === 1
        ? selected[0]
        : `${selected[0]} +${selected.length - 1}`;

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5 text-left ring-1 transition-all ${
          open ? "ring-emerald-300" : "ring-transparent"
        }`}
      >
        <span className="flex-shrink-0 text-gray-400">{icon}</span>
        <span className={`flex-1 truncate text-sm ${label ? "text-gray-700" : "text-gray-400"}`}>
          {label ?? placeholder}
        </span>
        {selected.length > 0 && (
          <span className="flex-shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            {selected.length}
          </span>
        )}
        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-gray-200">
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                    checked ? "border-emerald-500 bg-emerald-50" : "border-gray-300 bg-white"
                  }`}
                >
                  {checked && (
                    <svg className="h-2.5 w-2.5 text-emerald-600" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HomeSearch({
  initialSpecialties = [],
}: {
  initialSpecialties?: string[];
}) {
  const router = useRouter();
  const [specialties, setSpecialties] = useState<string[]>(initialSpecialties);
  const [deaneries, setDeaneries] = useState<string[]>([]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function search() {
    const params = new URLSearchParams();
    for (const s of specialties) params.append("specialty", s);
    for (const d of deaneries) params.append("deanery", d);
    router.push(`/jobs${params.size > 0 ? `?${params}` : ""}`);
  }

  return (
    <div className="rounded-2xl bg-white p-2 shadow-xl ring-1 ring-gray-200/80">
      <div className="flex flex-col gap-2 sm:flex-row">
        <MultiSelectField
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          }
          placeholder="Specialty — any"
          options={SPECIALTIES}
          selected={specialties}
          onToggle={(v) => toggle(specialties, setSpecialties, v)}
        />
        <MultiSelectField
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
          placeholder="Location — any"
          options={DEANERIES}
          selected={deaneries}
          onToggle={(v) => toggle(deaneries, setDeaneries, v)}
        />
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

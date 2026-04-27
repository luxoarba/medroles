"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import FilterSidebar from "./filter-sidebar";

export default function MobileFilterDrawer() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const activeCount =
    searchParams.getAll("specialty").length +
    searchParams.getAll("grade").length +
    searchParams.getAll("deanery").length;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger button — only shown below lg */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300 transition-all lg:hidden"
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            {activeCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Bottom sheet */}
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl">
            {/* Handle bar + header */}
            <div className="flex flex-shrink-0 flex-col items-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
              <div className="mt-3 flex w-full items-center justify-between px-5">
                <span className="text-sm font-semibold text-gray-900">Filters</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>

            {/* FilterSidebar fills the sheet — override its sticky card styling */}
            <FilterSidebar className="flex flex-1 flex-col overflow-hidden" />
          </div>
        </div>
      )}
    </>
  );
}

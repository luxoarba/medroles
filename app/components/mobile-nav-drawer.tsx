"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { href: "/jobs", label: "Browse Jobs" },
    { href: "/trusts", label: "Trusts" },
    { href: "/reviews", label: "Reviews" },
    { href: "/interview-intel", label: "Interview Intel" },
  ];

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors sm:hidden"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer panel */}
          <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-gray-900">
                  Med<span className="text-emerald-600">Roles</span>
                </span>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === href || pathname.startsWith(href + "/")
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Auth link at bottom */}
            <div className="border-t border-gray-100 px-3 py-4">
              <Link
                href="/auth"
                className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign in / My account
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/jobs", label: "Browse Jobs" },
  { href: "/trusts", label: "Trusts" },
  { href: "/reviews", label: "Reviews" },
  { href: "/interview-intel", label: "Interview Intel" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-1 sm:flex">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
